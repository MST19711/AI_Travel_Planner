import base64
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
    # 查找用户
    user = (
        db.query(models.User)
        .filter(models.User.username == challenge_data.username)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在"
        )

    # 验证客户端公钥A是否提供
    if not challenge_data.A:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="缺少客户端公钥A"
        )

    try:
        # 解码存储的salt和verifier
        salt = base64.b64decode(user.srp_salt)
        verifier = base64.b64decode(user.srp_verifier)

        # 从客户端获取A值
        A = base64.b64decode(challenge_data.A)

        # 创建SRP会话（使用新的API）
        session_id = srp_session_manager.create_session(
            challenge_data.username, salt, verifier, A
        )

        # 从会话中获取验证器
        session = srp_session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=400, detail="Failed to create session")

        svr: srp.Verifier = session['verifier']

        # 获取挑战(salt和B) - 按照官方示例
        s, B = svr.get_challenge()

        if s is None or B is None:
            srp_session_manager.remove_session(session_id)
            raise HTTPException(status_code=400, detail="Failed to generate challenge")

        return schemas.SRPChallengeResponse(
            username=challenge_data.username,
            salt=base64.b64encode(s).decode('utf-8'),
            B=base64.b64encode(B).decode('utf-8'),
            session_id=session_id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


@router.post("/SRPAuthProof", response_model=schemas.SRPAuthenticateResponse)
async def authenticate(
    auth_data: schemas.SRPAuthenticateRequest, db: Session = Depends(get_db)
):
    """认证验证 - 客户端发送M1，服务器返回M2和token"""
    # 查找用户
    user = (
        db.query(models.User).filter(models.User.username == auth_data.username).first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在"
        )

    # 检查会话ID
    session = srp_session_manager.get_session(auth_data.session_id)
    if not auth_data.session_id or not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的会话ID"
        )

    svr: srp.Verifier = session['verifier']

    try:
        # 获取客户端发送的M1
        M1 = base64.b64decode(auth_data.M1)

        # 验证客户端证明并获取服务器证明HAMK - 按照官方示例
        HAMK = svr.verify_session(M1)
        if HAMK is None:
            srp_session_manager.remove_session(auth_data.session_id)
            raise HTTPException(status_code=401, detail="Authentication failed")

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        srp_session_manager.remove_session(auth_data.session_id)
        return schemas.SRPAuthenticateResponse(
            username=user.username,
            M2=base64.b64encode(HAMK).decode('utf-8'),
            access_token=access_token,
            success=True,
        )
    except Exception as e:
        srp_session_manager.remove_session(auth_data.session_id)
        raise HTTPException(status_code=401, detail=f"Verification failed: {str(e)}")
