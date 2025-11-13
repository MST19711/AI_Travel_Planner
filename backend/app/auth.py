from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import secrets
import base64


# 运行时生成随机JWT密钥（每次服务器重启都会重新生成）
def generate_random_secret_key() -> str:
    """生成32字节的随机密钥，使用base64编码"""
    random_bytes = secrets.token_bytes(32)
    return base64.urlsafe_b64encode(random_bytes).decode('utf-8')


# JWT配置
SECRET_KEY = generate_random_secret_key()
ALGORITHM = "HS256"  # 固定使用HS256算法
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 固定30分钟过期


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建JWT访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """验证JWT令牌"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
