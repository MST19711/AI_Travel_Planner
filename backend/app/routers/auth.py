import base64
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import secrets
import srp

from ..database import get_db
from .. import models, schemas
from ..auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from ..srp_auth import srp_session_manager, generate_session_token
from app.utils.srp_dataType import (
    bigint_to_base64,
    base64_to_bigint,
    generate_secure_salt,
)
from ..srp_auth import hash_password_for_storage, verify_password_hash
from ..middleware import get_current_active_user

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["认证"])


# 用户注册（使用SRP认证）
@router.post("/register", response_model=schemas.SRPRegisterResponse)
async def register(
    register_data: schemas.SRPRegisterRequest, db: Session = Depends(get_db)
):
    """用户注册"""
    # 检查用户名是否已存在
    existing_user = (
        db.query(models.User)
        .filter(models.User.username == register_data.username)
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在"
        )

    # 检查邮箱是否已存在
    existing_email = (
        db.query(models.User).filter(models.User.email == register_data.email).first()
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="邮箱已被注册"
        )

    # 计算下一个userID（当前用户数量 + 1）
    user_count = db.query(models.User).count()
    next_user_id = user_count + 1

    # 创建新用户
    db_user = models.User(
        userID=next_user_id,
        username=register_data.username,
        email=register_data.email,
        srp_salt=register_data.srp_salt,
        srp_verifier=register_data.srp_verifier,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return schemas.SRPRegisterResponse(username=db_user.username, email=db_user.email)


@router.post("/SRPAuthInit", response_model=schemas.SRPChallengeResponse)
async def challenge(
    challenge_data: schemas.SRPChallengeRequest, db: Session = Depends(get_db)
):
    """认证挑战 - 客户端发送A，服务器返回salt和B"""
    logger.info(f"SRPAuthInit: 收到认证初始化请求，用户名: {challenge_data.username}")

    # 查找用户
    user = (
        db.query(models.User)
        .filter(models.User.username == challenge_data.username)
        .first()
    )

    if not user:
        logger.warning(f"SRPAuthInit: 用户不存在 - {challenge_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在"
        )

    logger.info(
        f"SRPAuthInit: 找到用户 - {challenge_data.username}, userID: {user.userID}"
    )

    # 验证客户端公钥A是否提供
    if not challenge_data.A:
        logger.error("SRPAuthInit: 缺少客户端公钥A")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="缺少客户端公钥A"
        )

    try:
        # 解码存储的salt和verifier
        salt = base64.b64decode(user.srp_salt)
        verifier = base64.b64decode(user.srp_verifier)
        logger.debug(
            f"SRPAuthInit: 解码salt长度: {len(salt)}, verifier长度: {len(verifier)}"
        )

        # 从客户端获取A值
        A = base64.b64decode(challenge_data.A)
        logger.debug(f"SRPAuthInit: 解码A长度: {len(A)}")

        # 创建SRP会话（使用新的API）
        session_id = srp_session_manager.create_session(
            challenge_data.username, salt, verifier, A
        )
        logger.info(f"SRPAuthInit: 创建会话成功，session_id: {session_id}")

        # 从会话中获取验证器
        session = srp_session_manager.get_session(session_id)
        if not session:
            logger.error(f"SRPAuthInit: 无法获取会话 - {session_id}")
            raise HTTPException(status_code=400, detail="Failed to create session")

        svr: srp.Verifier = session['verifier']

        # 获取挑战(salt和B) - 按照官方示例
        s, B = svr.get_challenge()
        logger.debug(
            f"SRPAuthInit: 生成挑战 - salt长度: {len(s) if s else 0}, B长度: {len(B) if B else 0}"
        )

        if s is None or B is None:
            logger.error("SRPAuthInit: 生成挑战失败")
            srp_session_manager.remove_session(session_id)
            raise HTTPException(status_code=400, detail="Failed to generate challenge")

        response = schemas.SRPChallengeResponse(
            username=challenge_data.username,
            salt=base64.b64encode(s).decode('utf-8'),
            B=base64.b64encode(B).decode('utf-8'),
            session_id=session_id,
        )

        logger.info(f"SRPAuthInit: 认证初始化成功，返回session_id: {session_id}")
        return response

    except Exception as e:
        logger.error(f"SRPAuthInit: 认证初始化异常 - {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


@router.post("/SRPAuthProof", response_model=schemas.SRPAuthenticateResponse)
async def authenticate(
    auth_data: schemas.SRPAuthenticateRequest, db: Session = Depends(get_db)
):
    """认证验证 - 客户端发送M1，服务器返回M2和token"""
    logger.info(
        f"SRPAuthProof: 收到认证验证请求，用户名: {auth_data.username}, session_id: {auth_data.session_id}"
    )

    # 查找用户
    user = (
        db.query(models.User).filter(models.User.username == auth_data.username).first()
    )

    if not user:
        logger.warning(f"SRPAuthProof: 用户不存在 - {auth_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在"
        )

    # 检查会话ID
    session = srp_session_manager.get_session(auth_data.session_id)
    if not auth_data.session_id or not session:
        logger.error(f"SRPAuthProof: 无效的会话ID - {auth_data.session_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的会话ID"
        )

    logger.info(f"SRPAuthProof: 找到会话，用户名: {session['username']}")

    svr: srp.Verifier = session['verifier']

    try:
        # 获取客户端发送的M1
        M1 = base64.b64decode(auth_data.M1)
        logger.debug(f"SRPAuthProof: 解码M1长度: {len(M1)}")
        logger.debug(f"SRPAuthProof: M1前16字节: {M1[:16].hex()}...")

        # 验证客户端证明并获取服务器证明HAMK - 按照官方示例
        logger.info("SRPAuthProof: 开始验证客户端证明...")
        HAMK = svr.verify_session(M1)

        if HAMK is None:
            logger.error("SRPAuthProof: 客户端证明验证失败 - HAMK为None")
            logger.error(
                "SRPAuthProof: 可能的原因: SRP参数不匹配、密码错误、会话状态异常"
            )
            srp_session_manager.remove_session(auth_data.session_id)
            raise HTTPException(
                status_code=401,
                detail="Authentication failed - client proof verification failed",
            )

        logger.info("SRPAuthProof: 客户端证明验证成功")
        logger.debug(f"SRPAuthProof: HAMK长度: {len(HAMK)}")

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        logger.info(f"SRPAuthProof: 生成访问令牌成功，用户名: {user.username}")

        srp_session_manager.remove_session(auth_data.session_id)
        logger.info(f"SRPAuthProof: 清理会话 - {auth_data.session_id}")

        response = schemas.SRPAuthenticateResponse(
            username=user.username,
            M2=base64.b64encode(HAMK).decode('utf-8'),
            access_token=access_token,
            success=True,
        )

        logger.info(f"SRPAuthProof: 认证验证成功，返回访问令牌")
        return response

    except ValueError as e:
        logger.error(f"SRPAuthProof: 数值计算异常 - {str(e)}", exc_info=True)
        logger.error(f"SRPAuthProof: 可能的原因: 参数格式错误、大整数计算错误")
        srp_session_manager.remove_session(auth_data.session_id)
        raise HTTPException(
            status_code=401, detail=f"Value error in authentication: {str(e)}"
        )
    except Exception as e:
        logger.error(f"SRPAuthProof: 认证验证异常 - {str(e)}", exc_info=True)
        logger.error(f"SRPAuthProof: 异常类型: {e.__class__.__name__}")
        logger.error(f"SRPAuthProof: 异常详情: {str(e)}")
        srp_session_manager.remove_session(auth_data.session_id)
        raise HTTPException(status_code=401, detail=f"Verification failed: {str(e)}")


# 不安全密码传输注册
@router.post("/insecure/register", response_model=schemas.SRPRegisterResponse)
async def insecure_register(
    register_data: schemas.InsecureRegisterRequest, db: Session = Depends(get_db)
):
    """不安全密码传输注册"""
    # 检查用户名是否已存在
    existing_user = (
        db.query(models.User)
        .filter(models.User.username == register_data.username)
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在"
        )

    # 检查邮箱是否已存在
    existing_email = (
        db.query(models.User).filter(models.User.email == register_data.email).first()
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="邮箱已被注册"
        )

    # 计算下一个userID（当前用户数量 + 1）
    user_count = db.query(models.User).count()
    next_user_id = user_count + 1

    # 生成密码hash
    password_hash = hash_password_for_storage(register_data.password)

    # 创建新用户（使用不安全密码传输）
    db_user = models.User(
        userID=next_user_id,
        username=register_data.username,
        email=register_data.email,
        srp_salt="",  # 空值，因为不使用SRP
        srp_verifier="",  # 空值，因为不使用SRP
        insecure_password_hash=password_hash,
        is_insecure_auth=True,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return schemas.SRPRegisterResponse(username=db_user.username, email=db_user.email)


# 不安全密码传输登录
@router.post("/insecure/login", response_model=schemas.InsecureLoginResponse)
async def insecure_login(
    login_data: schemas.InsecureLoginRequest, db: Session = Depends(get_db)
):
    """不安全密码传输登录"""
    # 查找用户
    user = (
        db.query(models.User)
        .filter(models.User.username == login_data.username)
        .first()
    )

    if not user:
        logger.warning(f"不安全登录: 用户不存在 - {login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误"
        )

    # 检查用户是否使用不安全密码传输
    if not user.is_insecure_auth or not user.insecure_password_hash:
        logger.warning(f"不安全登录: 用户未启用不安全密码传输 - {login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误"
        )

    # 验证密码
    if not verify_password_hash(login_data.password, user.insecure_password_hash):
        logger.warning(f"不安全登录: 密码验证失败 - {login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误"
        )

    # 生成访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    logger.info(f"不安全登录: 登录成功 - {user.username}")

    return schemas.InsecureLoginResponse(
        username=user.username,
        access_token=access_token,
        is_insecure_auth=True,
    )


# Token验证端点
@router.get("/verify")
async def verify_token_endpoint(
    current_user: models.User = Depends(get_current_active_user),
):
    """验证JWT令牌有效性"""
    logger.info(f"Token验证: 用户 {current_user.username} 的令牌有效")
    return {"valid": True, "username": current_user.username}


# 用户注销（会话注销）
@router.post("/logout")
async def logout(
    current_user: models.User = Depends(get_current_active_user),
):
    """用户注销（会话注销）"""
    # 对于JWT令牌，由于是无状态的，注销主要是客户端行为
    # 这里可以记录注销日志或进行其他清理操作
    logger.info(f"用户注销: {current_user.username}")

    return {"message": "注销成功"}
