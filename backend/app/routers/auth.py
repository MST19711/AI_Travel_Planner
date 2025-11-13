from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import secrets

from ..database import get_db
from .. import models, schemas
from ..auth import (
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from ..srp_auth import srp_auth, generate_session_token

router = APIRouter(prefix="/auth", tags=["认证"])

# 存储SRP服务器实例的临时存储（生产环境应使用Redis等）
_srp_sessions = {}


# 用户注册（使用SRP认证）
@router.post("/register", response_model=schemas.SRPRegisterResponse)
async def register(
    register_data: schemas.SRPRegisterRequest,
    db: Session = Depends(get_db)
):
    """用户注册"""
    # 检查用户名是否已存在
    existing_user = db.query(models.User).filter(
        models.User.username == register_data.username
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    existing_email = db.query(models.User).filter(
        models.User.email == register_data.email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    # 创建SRP验证器
    salt, verifier = srp_auth.create_verifier(
        register_data.username,
        register_data.password
    )
    
    # 创建新用户
    db_user = models.User(
        username=register_data.username,
        email=register_data.email,
        srp_salt=salt,
        srp_verifier=verifier
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return schemas.SRPRegisterResponse(
        username=db_user.username,
        email=db_user.email
    )


@router.post("/challenge", response_model=schemas.SRPChallengeResponse)
async def challenge(
    challenge_data: schemas.SRPChallengeRequest,
    db: Session = Depends(get_db)
):
    """认证挑战 - 客户端发送A，服务器返回salt和B"""
    # 查找用户
    user = db.query(models.User).filter(
        models.User.username == challenge_data.username
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )
    
    # 验证客户端公钥A是否提供
    if not challenge_data.A:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="缺少客户端公钥A"
        )
    
    # 创建新的SRP认证实例
    srp_instance = srp_auth.__class__()
    
    # 开始SRP认证流程 - 传入客户端公钥A
    B = srp_instance.start_authentication(
        challenge_data.username,
        user.srp_salt,
        user.srp_verifier,
        challenge_data.A
    )
    
    # 生成会话ID并存储SRP实例
    session_id = secrets.token_urlsafe(16)
    _srp_sessions[session_id] = srp_instance
    
    return schemas.SRPChallengeResponse(
        username=challenge_data.username,
        salt=user.srp_salt,
        B=B,
        session_id=session_id
    )


@router.post("/authenticate", response_model=schemas.SRPAuthenticateResponse)
async def authenticate(
    auth_data: schemas.SRPAuthenticateRequest,
    db: Session = Depends(get_db)
):
    """认证验证 - 客户端发送M1，服务器返回M2和token"""
    # 查找用户
    user = db.query(models.User).filter(
        models.User.username == auth_data.username
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )
    
    # 检查会话ID
    if not auth_data.session_id or auth_data.session_id not in _srp_sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的会话ID"
        )
    
    # 获取对应的SRP实例
    srp_instance = _srp_sessions[auth_data.session_id]
    
    # 验证SRP认证 - 只需要M1，不需要A（A已经在challenge阶段传入）
    M2 = srp_instance.verify_authentication(auth_data.M1)
    
    # 清理会话
    if auth_data.session_id in _srp_sessions:
        del _srp_sessions[auth_data.session_id]
    
    if not M2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SRP认证失败"
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return schemas.SRPAuthenticateResponse(
        username=user.username,
        M2=M2,
        access_token=access_token
    )