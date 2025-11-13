from pydantic import BaseModel, Field, field_validator
from typing import Optional, Annotated
import base64
import re
import secrets

# 自定义类型：Base64编码的字符串
Base64Str = Annotated[str, Field(pattern=r'^[A-Za-z0-9+/]*={0,2}$')]

# 自定义类型：十六进制字符串
HexStr = Annotated[str, Field(pattern=r'^[0-9a-fA-F]+$')]

# 大整数类型（通常用base64编码传输）
BigIntStr = Base64Str

# 哈希值类型（通常32或64字节，用base64或hex编码）
HashStr = Base64Str  # 或者 HexStr，根据实现选择


def bigint_to_base64(bigint_value: int) -> BigIntStr:
    """将大整数转换为base64编码字符串"""
    byte_length = (bigint_value.bit_length() + 7) // 8
    bytes_value = bigint_value.to_bytes(byte_length, byteorder='big')
    return base64.b64encode(bytes_value).decode('utf-8')


def base64_to_bigint(base64_str: Base64Str) -> int:
    """将base64编码字符串转换回大整数"""
    bytes_value = base64.b64decode(base64_str)
    return int.from_bytes(bytes_value, byteorder='big')


def generate_secure_salt(length: int = 32) -> str:
    """生成安全的随机salt（base64编码）"""
    salt_bytes = secrets.token_bytes(length)
    return base64.b64encode(salt_bytes).decode('utf-8')


def bytes_to_base64(bytes_data: bytes) -> Base64Str:
    """将bytes数据转换为base64编码字符串"""
    return base64.b64encode(bytes_data).decode('utf-8')


def base64_to_bytes(base64_str: Base64Str) -> bytes:
    """将base64编码字符串转换回bytes数据"""
    return base64.b64decode(base64_str)


def bytes_to_base64url(bytes_data: bytes) -> str:
    """将bytes数据转换为URL安全的base64编码字符串"""
    return base64.urlsafe_b64encode(bytes_data).decode('utf-8').rstrip('=')


def base64url_to_bytes(base64url_str: str) -> bytes:
    """将URL安全的base64编码字符串转换回bytes数据"""
    # 补齐缺失的等号
    padding = 4 - len(base64url_str) % 4
    if padding != 4:
        base64url_str += '=' * padding
    return base64.urlsafe_b64decode(base64url_str)
