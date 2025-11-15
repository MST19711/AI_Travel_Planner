from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# 使用标准字符串类型而不是自定义类型
from pydantic import Field


# 基础模型
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True


# 用户相关模型
class UserBase(BaseSchema):
    username: str
    email: str  # TODO: 添加基本的邮箱格式验证

    @validator('email')
    def validate_email_format(cls, v):
        # TODO: 实现基本的邮箱格式验证
        if '@' not in v:
            raise ValueError('邮箱格式不正确')
        return v


# SRP认证相关模型
class SRPRegisterRequest(BaseSchema):
    """SRP注册请求"""

    username: str
    email: str
    srp_salt: str = Field(..., pattern=r'^[A-Za-z0-9+/]*={0,2}$')
    srp_verifier: str = Field(..., pattern=r'^[A-Za-z0-9+/]*={0,2}$')


class SRPRegisterResponse(BaseSchema):
    """SRP注册响应"""

    username: str
    email: str
    message: str = "用户注册成功"


class SRPChallengeRequest(BaseSchema):
    """SRP挑战请求"""

    username: str
    A: str = Field(..., pattern=r'^[A-Za-z0-9+/]*={0,2}$')  # 客户端公钥


class SRPChallengeResponse(BaseSchema):
    """SRP挑战响应"""

    username: str
    salt: str = Field(..., pattern=r'^[A-Za-z0-9+/]*={0,2}$')  # SRP盐值
    B: str = Field(..., pattern=r'^[A-Za-z0-9+/]*={0,2}$')  # 服务器公钥
    session_id: str  # 会话ID


class SRPAuthenticateRequest(BaseSchema):
    """SRP认证请求"""

    username: str
    M1: str = Field(..., pattern=r'^[A-Za-z0-9+/]*={0,2}$')  # 客户端证明
    session_id: str  # 会话ID


class SRPAuthenticateResponse(BaseSchema):
    """SRP认证响应"""

    username: str
    M2: Optional[str] = Field(None, pattern=r'^[A-Za-z0-9+/]*={0,2}$')  # 服务器证明
    access_token: Optional[str]
    token_type: str = "bearer"
    success: bool


class UserUpdate(BaseSchema):
    username: Optional[str] = None
    email: Optional[str] = None


class UserResponse(UserBase):
    id: int
    userID: int
    is_insecure_auth: bool = False  # 是否使用不安全密码传输
    created_at: datetime
    updated_at: datetime


# API密钥相关模型
class APIKeysBase(BaseSchema):
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_model: Optional[str] = None
    amap_api_key: Optional[str] = None
    xunfei_app_id: Optional[str] = None
    xunfei_api_secret: Optional[str] = None
    xunfei_api_key: Optional[str] = None
    glm_api_key: Optional[str] = None


class APIKeysUpdate(APIKeysBase):
    pass  # 所有API密钥字段都是可选的，前端负责加密


class APIKeysResponse(APIKeysBase):
    pass


# 行程相关模型
class TripBase(BaseSchema):
    title: str
    status: str = "planning"  # planning, in_progress, completed, cancelled


class TripCreate(BaseSchema):
    title: str
    encrypted_data: str  # 前端加密后的行程数据


class TripUpdate(BaseSchema):
    title: Optional[str] = None
    status: Optional[str] = None
    encrypted_data: Optional[str] = None  # 前端加密后的行程数据


class TripResponse(TripBase):
    id: int
    user_id: int
    encrypted_data: str  # 加密的行程数据，前端负责解密
    created_at: datetime
    updated_at: datetime


# 认证相关模型
class Token(BaseSchema):
    access_token: str
    token_type: str


class TokenData(BaseSchema):
    username: Optional[str] = None


# 响应包装模型
class ListResponse(BaseSchema):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


# 不安全密码传输相关模型
class InsecureRegisterRequest(BaseSchema):
    """不安全密码传输注册请求"""

    username: str
    email: str
    password: str  # 明文密码


class InsecureLoginRequest(BaseSchema):
    """不安全密码传输登录请求"""

    username: str
    password: str  # 明文密码


class InsecureLoginResponse(BaseSchema):
    """不安全密码传输登录响应"""

    username: str
    access_token: str
    token_type: str = "bearer"
    is_insecure_auth: bool = True


# 用户注销相关模型
class UserDeleteResponse(BaseSchema):
    """用户注销响应"""

    message: str = "用户注销成功，所有数据已永久删除"
    username: str
