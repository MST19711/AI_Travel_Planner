from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..middleware import get_current_active_user

router = APIRouter(prefix="/user", tags=["用户"])


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """获取当前用户信息"""
    return current_user


@router.put("/api-keys", response_model=schemas.APIKeysResponse)
async def update_api_keys(
    api_keys_data: schemas.APIKeysUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """更新用户API密钥 - 前端已加密，后端直接存储"""

    # API密钥已经在前端加密，直接存储
    update_data = {
        "openai_api_key": api_keys_data.openai_api_key,
        "openai_base_url": api_keys_data.openai_base_url,
        "openai_model": api_keys_data.openai_model,
        "amap_api_key": api_keys_data.amap_api_key,
        "xunfei_app_id": api_keys_data.xunfei_app_id,
        "xunfei_api_secret": api_keys_data.xunfei_api_secret,
        "xunfei_api_key": api_keys_data.xunfei_api_key,
        "glm_api_key": api_keys_data.glm_api_key,
    }

    # 更新用户记录
    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    # 返回存储的API密钥
    return schemas.APIKeysResponse(**update_data)


@router.get("/api-keys", response_model=schemas.APIKeysResponse)
async def get_api_keys(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """获取用户API密钥（客户端已加密，后端直接返回）"""
    # API密钥已经在前端加密，直接返回存储的加密数据
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

    return schemas.APIKeysResponse(**encrypted_keys)


@router.put("/profile", response_model=schemas.UserResponse)
async def update_profile(
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """更新用户个人信息"""
    # 检查用户名是否已存在（如果修改了用户名）
    if user_data.username and user_data.username != current_user.username:
        existing_user = (
            db.query(models.User)
            .filter(models.User.username == user_data.username)
            .first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在"
            )

    # 检查邮箱是否已存在（如果修改了邮箱）
    if user_data.email and user_data.email != current_user.email:
        existing_email = (
            db.query(models.User).filter(models.User.email == user_data.email).first()
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="邮箱已被注册"
            )

    # 更新用户信息
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/delete", response_model=schemas.UserDeleteResponse)
async def delete_user(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """注销用户账户（永久删除）"""
    # 仅依赖JWT认证，无需额外密码验证
    # 删除用户及其所有相关数据
    # 由于设置了级联删除，用户的行程和活动也会被自动删除
    db.delete(current_user)
    db.commit()

    return schemas.UserDeleteResponse(
        message="用户注销成功，所有数据已永久删除", username=current_user.username
    )
