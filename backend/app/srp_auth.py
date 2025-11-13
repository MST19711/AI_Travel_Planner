import srp
import secrets
import base64
from typing import Tuple, Optional, Dict, Any
import hashlib

srp.rfc5054_enable()


class SRPSession:
    def __init__(self):
        # 可以考虑使用Redis扩容
        self.sessions = {}
        srp.rfc5054_enable()

    def create_session(self, username: str, salt: bytes, verifier: bytes, A: bytes):
        """创建SRP会话并存储验证器对象"""
        # 创建服务器端SRP对象
        svr = srp.Verifier(
            username, salt, verifier, A, hash_alg=srp.SHA256, ng_type=srp.NG_2048
        )
        session_id = f"session_{username}_{id(svr)}"
        self.sessions[session_id] = {
            'username': username,
            'verifier': svr,
            'authenticated': False,
        }
        return session_id

    def get_session(self, session_id: str):
        return self.sessions.get(session_id)

    def remove_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]


# 全局SRP认证实例
srp_session_manager = SRPSession()


def generate_session_token() -> str:
    """生成会话令牌"""
    return secrets.token_urlsafe(32)


def hash_password_for_storage(password: str) -> str:
    """为存储生成密码hash（仅用于非SRP场景的兼容性）"""
    return hashlib.sha256(password.encode()).hexdigest()
