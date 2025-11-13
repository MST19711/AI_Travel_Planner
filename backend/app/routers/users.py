from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..middleware import get_current_active_user
from ..crypto import encrypt_api_keys, decrypt_api_keys

router = APIRouter(prefix="/user", tags=["用户"])


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取当前用户信息"""
    return current_user


@router.put("/api-keys", response_model=schemas.APIKeysResponse)
async def update_api_keys(
    api_keys_data: schemas.APIKeysUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新用户API密钥"""
    # 验证密码hash（前端发送的已经是hash值）
    if current_user.password_hash != api_keys_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误"
        )
    
    # 准备要加密的API密钥数据
    api_keys_dict = {
        "openai_api_key": api_keys_data.openai_api_key,
        "openai_base_url": api_keys_data.openai_base_url,
        "openai_model": api_keys_data.openai_model,
        "amap_api_key": api_keys_data.amap_api_key,
        "xunfei_app_id": api_keys_data.xunfei_app_id,
        "xunfei_api_secret": api_keys_data.xunfei_api_secret,
        "xunfei_api_key": api_keys_data.xunfei_api_key,
        "glm_api_key": api_keys_data.glm_api_key,
    }
    
    # 使用密码hash加密API密钥
    encrypted_keys = encrypt_api_keys(api_keys_dict, current_user.password_hash)
    
    # 更新用户记录
    for key, value in encrypted_keys.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    
    # 返回解密后的API密钥（仅用于响应）
    decrypted_keys = decrypt_api_keys(encrypted_keys, current_user.password_hash)
    return schemas.APIKeysResponse(**decrypted_keys)


@router.get("/api-keys", response_model=schemas.APIKeysResponse)
async def get_api_keys(
    password: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户API密钥（需要密码解密）"""
    # 验证密码hash（前端发送的已经是hash值）
    if current_user.password_hash != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误"
        )
    
    # 准备加密的API密钥数据
    encrypted_keys = {
        "openai_api_key": current_user.openai_api_key,
        "openai_base_url": current_user.openai_base_url,
        "openai_model": current_user.openai_model,
        "amap_api_key": current_user.amap_api_key,
        "xunfei_app_id": current_user.xunfei_app_id,
        "xunfei_api_secret": current_user.xunfei_api_secret,
        "xunfei_api_key": current_user.xunfei_api_key,
        "glm_api_key": current_user.glm_api_key,
    }
    
    # 使用密码hash解密API密钥
    decrypted_keys = decrypt_api_keys(encrypted_keys, current_user.password_hash)
    return schemas.APIKeysResponse(**decrypted_keys)


@router.put("/profile", response_model=schemas.UserResponse)
async def update_profile(
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新用户个人信息"""
    # 检查用户名是否已存在（如果修改了用户名）
    if user_data.username and user_data.username != current_user.username:
        existing_user = db.query(models.User).filter(
            models.User.username == user_data.username
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
    
    # 检查邮箱是否已存在（如果修改了邮箱）
    if user_data.email and user_data.email != current_user.email:
        existing_email = db.query(models.User).filter(
            models.User.email == user_data.email
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
    
    # 更新用户信息
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user