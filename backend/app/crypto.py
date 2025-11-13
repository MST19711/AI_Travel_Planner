import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 从环境变量获取盐值，如果没有则生成一个固定的盐值
SALT = os.getenv("ENCRYPTION_SALT", "default-encryption-salt").encode()


def derive_key_from_hash(password_hash: str) -> bytes:
    """从用户密码hash派生加密密钥"""
    # 使用密码hash作为加密密钥的基础
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password_hash.encode()))
    return key


def encrypt_data(data: str, password_hash: str) -> str:
    """使用用户密码hash加密数据"""
    if not data:
        return ""
    
    key = derive_key_from_hash(password_hash)
    fernet = Fernet(key)
    encrypted_data = fernet.encrypt(data.encode())
    return base64.urlsafe_b64encode(encrypted_data).decode()


def decrypt_data(encrypted_data: str, password_hash: str) -> str:
    """使用用户密码hash解密数据"""
    if not encrypted_data:
        return ""
    
    try:
        key = derive_key_from_hash(password_hash)
        fernet = Fernet(key)
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = fernet.decrypt(encrypted_bytes)
        return decrypted_data.decode()
    except Exception:
        # 如果解密失败，返回空字符串
        return ""


def encrypt_api_keys(api_keys: dict, password_hash: str) -> dict:
    """加密API密钥字典（使用密码hash）"""
    encrypted_keys = {}
    for key, value in api_keys.items():
        if value:
            encrypted_keys[key] = encrypt_data(value, password_hash)
        else:
            encrypted_keys[key] = ""
    return encrypted_keys


def decrypt_api_keys(encrypted_keys: dict, password_hash: str) -> dict:
    """解密API密钥字典（使用密码hash）"""
    decrypted_keys = {}
    for key, value in encrypted_keys.items():
        if value:
            decrypted_keys[key] = decrypt_data(value, password_hash)
        else:
            decrypted_keys[key] = ""
    return decrypted_keys