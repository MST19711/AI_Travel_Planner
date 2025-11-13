import srp
import secrets
import base64
from typing import Tuple, Optional, Dict, Any
import hashlib


class SRPAuth:
    """SRP认证管理器"""
    
    def __init__(self, ng_type: int = srp.NG_2048):
        """
        初始化SRP认证管理器
        
        Args:
            ng_type: SRP参数类型，默认为2048位
        """
        self.ng_type = ng_type
        # 启用RFC5054兼容性
        srp.rfc5054_enable()
    
    def create_verifier(self, username: str, password: str) -> Tuple[str, str]:
        """
        创建SRP验证器（用于用户注册）
        
        Args:
            username: 用户名
            password: 密码
            
        Returns:
            Tuple[salt, verifier] - 盐值和验证器
        """
        # 使用pysrp创建盐值和验证器
        salt, verifier = srp.create_salted_verification_key(
            username.encode('utf-8'), 
            password.encode('utf-8'),
            ng_type=self.ng_type
        )
        
        # 转换为base64字符串便于存储
        salt_b64 = base64.b64encode(salt).decode('utf-8')
        verifier_b64 = base64.b64encode(verifier).decode('utf-8')
        
        return salt_b64, verifier_b64
    
    def start_authentication(self, username: str, salt: str, verifier: str, A: str) -> str:
        """
        开始认证流程（服务器端）
        
        Args:
            username: 用户名
            salt: 盐值（base64编码）
            verifier: 验证器（base64编码）
            A: 客户端公钥（base64编码）
            
        Returns:
            str: 服务器公钥B（base64编码）
        """
        # 解码盐值、验证器和客户端公钥
        salt_bytes = base64.b64decode(salt)
        verifier_bytes = base64.b64decode(verifier)
        A_bytes = base64.b64decode(A)
        
        # 创建服务器实例 - 必须传入客户端公钥A
        self._server_instance = srp.Verifier(
            username.encode('utf-8'),
            salt_bytes,
            verifier_bytes,
            A_bytes,
            ng_type=self.ng_type
        )
        
        # 生成服务器公钥B - 使用get_challenge方法
        _, B = self._server_instance.get_challenge()
        
        # 转换为base64字符串
        B_b64 = base64.b64encode(B).decode('utf-8')
        
        return B_b64
    
    def verify_authentication(self, M1: str) -> Optional[str]:
        """
        验证客户端认证信息
        
        Args:
            M1: 客户端证明（base64编码）
            
        Returns:
            Optional[str]: 服务器证明M2（base64编码），验证失败返回None
        """
        if not hasattr(self, '_server_instance'):
            raise ValueError("必须先调用start_authentication开始认证流程")
        
        # 解码客户端证明
        M1_bytes = base64.b64decode(M1)
        
        try:
            # 验证客户端证明并获取服务器证明
            # A已经在创建Verifier时传入，这里只需要验证M1
            M2 = self._server_instance.verify_session(M1_bytes)
            
            if M2 is not None:
                # 转换为base64字符串
                return base64.b64encode(M2).decode('utf-8')
            else:
                print("SRP认证验证失败: 客户端证明验证失败")
                return None
        except Exception as e:
            print(f"SRP认证验证失败: {e}")
            return None
    
    def create_client_session(self, username: str, password: str, salt: str, B: str) -> Tuple[str, str, Any]:
        """
        创建客户端会话（客户端使用）
        
        Args:
            username: 用户名
            password: 密码
            salt: 盐值（base64编码）
            B: 服务器公钥（base64编码）
            
        Returns:
            Tuple[A, M1, client] - 客户端公钥、证明和客户端实例
        """
        # 解码盐值和服务器公钥
        salt_bytes = base64.b64decode(salt)
        B_bytes = base64.b64decode(B)
        
        # 创建客户端实例
        clt = srp.User(
            username.encode('utf-8'),
            password.encode('utf-8'),
            ng_type=self.ng_type
        )
        
        # 开始认证流程 - 获取客户端公钥A
        A, _ = clt.start_authentication()
        
        # 处理服务器挑战 - 这会计算共享密钥和M1
        M1 = clt.process_challenge(salt_bytes, B_bytes)
        
        # 转换为base64字符串
        A_b64 = base64.b64encode(A).decode('utf-8')
        M1_b64 = base64.b64encode(M1).decode('utf-8')
        
        return A_b64, M1_b64, clt
    
    def verify_server_proof(self, client_instance: Any, M2: str) -> bool:
        """
        验证服务器证明（客户端使用）
        
        Args:
            client_instance: 客户端实例
            M2: 服务器证明（base64编码）
            
        Returns:
            bool: 验证是否成功
        """
        try:
            # 解码服务器证明
            M2_bytes = base64.b64decode(M2)
            
            # 验证服务器证明
            client_instance.verify_session(M2_bytes)
            return True
        except Exception:
            return False


# 全局SRP认证实例
srp_auth = SRPAuth()


def generate_session_token() -> str:
    """生成会话令牌"""
    return secrets.token_urlsafe(32)


def hash_password_for_storage(password: str) -> str:
    """为存储生成密码hash（仅用于非SRP场景的兼容性）"""
    return hashlib.sha256(password.encode()).hexdigest()