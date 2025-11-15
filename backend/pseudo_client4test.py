import requests
import json
import base64
import secrets
import srp
import hashlib
from typing import Dict, Any, Optional

# 服务器基础URL
BASE_URL = "http://localhost:8000"

# 启用RFC5054兼容性
srp.rfc5054_enable()


class SRPClient:
    """SRP客户端认证类"""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session_id = None
        self.access_token = None
        self.username = None

    def register_user(self, username: str, email: str, password: str) -> Dict[str, Any]:
        """注册新用户并生成SRP凭证"""
        try:
            # 使用pysrp生成salt和verifier
            salt, verifier = srp.create_salted_verification_key(
                username, password, hash_alg=srp.SHA256, ng_type=srp.NG_4096
            )

            # 构建注册请求数据
            register_data = {
                "username": username,
                "email": email,
                "srp_salt": base64.b64encode(salt).decode('utf-8'),
                "srp_verifier": base64.b64encode(verifier).decode('utf-8'),
            }

            # 发送POST请求到注册接口
            response = requests.post(
                f"{self.base_url}/auth/register",
                json=register_data,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 200:
                print(f"✅ 用户注册成功: {username}")
                return response.json()
            else:
                print(f"❌ 用户注册失败: {response.status_code} - {response.text}")
                return {
                    "error": f"HTTP {response.status_code}",
                    "detail": response.text,
                }

        except Exception as e:
            print(f"❌ 注册过程出错: {str(e)}")
            return {"error": "RegistrationError", "detail": str(e)}

    def authenticate(self, username: str, password: str) -> bool:
        """执行完整的SRP认证流程"""
        try:
            self.username = username

            # 第一阶段：初始化认证
            url_init = f"{self.base_url}/auth/SRPAuthInit"

            # 创建客户端SRP对象 - 按照官方示例
            usr = srp.User(username, password, hash_alg=srp.SHA256, ng_type=srp.NG_4096)
            uname, A = usr.start_authentication()

            payload_init = {
                "username": username,
                "A": base64.b64encode(A).decode('utf-8'),
            }

            response_init = requests.post(url_init, json=payload_init)
            result_init = response_init.json()

            if response_init.status_code != 200:
                print(f"❌ 认证初始化失败: {result_init}")
                return False

            self.session_id = result_init['session_id']
            salt = base64.b64decode(result_init['salt'])
            B = base64.b64decode(result_init['B'])

            # 第二阶段：验证 - 按照官方示例
            url_verify = f"{self.base_url}/auth/SRPAuthProof"

            # 处理服务器挑战
            M = usr.process_challenge(salt, B)
            if M is None:
                print("❌ 处理服务器挑战失败")
                return False

            payload_verify = {
                "username": username,
                "M1": base64.b64encode(M).decode('utf-8'),
                "session_id": self.session_id,
            }

            response_verify = requests.post(url_verify, json=payload_verify)
            result_verify = response_verify.json()

            if response_verify.status_code != 200:
                print(f"❌ 认证验证失败: {result_verify}")
                return False

            # 验证服务器的HAMK - 按照官方示例
            HAMK = base64.b64decode(result_verify['M2'])
            usr.verify_session(HAMK)

            if not usr.authenticated():
                print("❌ 服务器验证失败")
                return False

            # 获取访问令牌
            self.access_token = result_verify['access_token']
            print("✅ SRP认证成功！")
            return True

        except Exception as e:
            print(f"❌ 认证过程出错: {str(e)}")
            return False

    def get_auth_headers(self) -> Dict[str, str]:
        """获取认证头信息"""
        if not self.access_token:
            raise ValueError("用户未认证，请先调用authenticate方法")
        return {"Authorization": f"Bearer {self.access_token}"}


class TripDataManager:
    """行程数据管理类"""

    def __init__(self):
        pass

    def prepare_trip_data(self, trip_data: Dict[str, Any]) -> Dict[str, Any]:
        """准备行程数据（不再需要加密）"""
        return trip_data

    def parse_trip_data(self, trip_data: Dict[str, Any]) -> Dict[str, Any]:
        """解析行程数据（不再需要解密）"""
        return trip_data


class TestClient:
    """完整的测试客户端"""

    def __init__(self):
        self.srp_client = SRPClient()
        self.trip_manager = TripDataManager()
        self.test_user = None
        self.test_trip = None

    def setup_test_user(self) -> bool:
        """设置测试用户"""
        try:
            # 生成随机测试用户数据
            username = f"test_user_{secrets.token_hex(4)}"
            email = f"{username}@example.com"
            password = "test_password_123"

            print(f"📝 测试用户信息:")
            print(f"   用户名: {username}")
            print(f"   邮箱: {email}")
            print(f"   密码: {password}")

            # 注册用户
            print("📤 注册用户...")
            register_result = self.srp_client.register_user(username, email, password)

            if "error" in register_result:
                print(f"❌ 用户注册失败: {register_result}")
                return False

            # 登录用户
            print("🔐 用户登录...")
            auth_success = self.srp_client.authenticate(username, password)

            if not auth_success:
                print("❌ 用户登录失败")
                return False

            self.test_user = {
                "username": username,
                "email": email,
                "password": password,
            }

            # 初始化行程管理器
            self.trip_manager = TripDataManager()

            return True

        except Exception as e:
            print(f"❌ 设置测试用户失败: {str(e)}")
            return False

    def upload_api_keys(self) -> bool:
        """上传API密钥"""
        try:
            if not self.srp_client.access_token:
                print("❌ 用户未登录")
                return False

            # 生成密码hash用于API密钥加密
            password_hash = hashlib.sha256(
                self.test_user["password"].encode()
            ).hexdigest()

            # 准备测试API密钥数据
            api_keys_data = {
                "password": password_hash,
                "openai_api_key": "sk-test-openai-key-" + secrets.token_hex(16),
                "openai_base_url": "https://api.openai.com/v1",
                "openai_model": "gpt-4",
                "amap_api_key": "test-amap-key-" + secrets.token_hex(8),
                "xunfei_app_id": "test-xunfei-app-id",
                "xunfei_api_secret": "test-xunfei-secret-" + secrets.token_hex(16),
                "xunfei_api_key": "test-xunfei-key-" + secrets.token_hex(16),
                "glm_api_key": "test-glm-key-" + secrets.token_hex(16),
            }

            print("🔑 上传API密钥...")
            response = requests.put(
                f"{BASE_URL}/user/api-keys",
                json=api_keys_data,
                headers=self.srp_client.get_auth_headers(),
            )

            if response.status_code == 200:
                print("✅ API密钥上传成功")
                return True
            else:
                print(f"❌ API密钥上传失败: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            print(f"❌ 上传API密钥失败: {str(e)}")
            return False

    def create_trip(self) -> bool:
        """创建测试行程"""
        try:
            if not self.srp_client.access_token:
                print("❌ 用户未登录")
                return False

            # 创建测试行程数据
            trip_data = {
                "title": "测试行程 - 北京三日游",
                "destination": "北京",
                "start_date": "2024-01-15",
                "end_date": "2024-01-17",
                "budget": 5000,
                "travelers": 2,
                "preferences": {
                    "food": ["中餐", "火锅"],
                    "activities": ["历史景点", "购物"],
                    "accommodation": "酒店",
                },
                "activities": [
                    {
                        "day": 1,
                        "date": "2024-01-15",
                        "items": [
                            {"time": "09:00", "activity": "抵达北京首都机场"},
                            {"time": "11:00", "activity": "入住酒店"},
                            {"time": "13:00", "activity": "午餐 - 全聚德烤鸭"},
                            {"time": "15:00", "activity": "参观故宫博物院"},
                        ],
                    },
                    {
                        "day": 2,
                        "date": "2024-01-16",
                        "items": [
                            {"time": "08:00", "activity": "早餐"},
                            {"time": "09:00", "activity": "游览天安门广场"},
                            {"time": "11:00", "activity": "参观天坛"},
                            {"time": "14:00", "activity": "王府井购物"},
                        ],
                    },
                    {
                        "day": 3,
                        "date": "2024-01-17",
                        "items": [
                            {"time": "09:00", "activity": "游览颐和园"},
                            {"time": "12:00", "activity": "午餐"},
                            {"time": "15:00", "activity": "前往机场返程"},
                        ],
                    },
                ],
            }

            # 准备行程数据
            prepared_data = self.trip_manager.prepare_trip_data(trip_data)

            # 创建行程请求
            trip_request = {
                "title": trip_data["title"],
                "trip_data": prepared_data,
            }

            print("📝 创建行程...")
            response = requests.post(
                f"{BASE_URL}/trips/",
                json=trip_request,
                headers=self.srp_client.get_auth_headers(),
            )

            if response.status_code == 200:
                self.test_trip = response.json()
                print(f"✅ 行程创建成功 - ID: {self.test_trip['id']}")
                return True
            else:
                print(f"❌ 行程创建失败: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            print(f"❌ 创建行程失败: {str(e)}")
            return False

    def get_trips_list(self) -> Optional[Dict[str, Any]]:
        """获取行程列表"""
        try:
            if not self.srp_client.access_token:
                print("❌ 用户未登录")
                return None

            print("📋 获取行程列表...")
            response = requests.get(
                f"{BASE_URL}/trips/", headers=self.srp_client.get_auth_headers()
            )

            if response.status_code == 200:
                trips_list = response.json()
                print(f"✅ 获取到 {trips_list['total']} 个行程")
                return trips_list
            else:
                print(f"❌ 获取行程列表失败: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"❌ 获取行程列表失败: {str(e)}")
            return None

    def download_and_decrypt_trip(self) -> bool:
        """下载并解密行程数据"""
        try:
            if not self.test_trip:
                print("❌ 没有可下载的行程")
                return False

            print("📥 下载行程数据...")
            response = requests.get(
                f"{BASE_URL}/trips/{self.test_trip['id']}",
                headers=self.srp_client.get_auth_headers(),
            )

            if response.status_code == 200:
                downloaded_trip = response.json()
                trip_data = downloaded_trip['trip_data']

                print("📊 获取到的行程数据:")
                print(f"   标题: {trip_data.get('title', 'N/A')}")
                print(f"   目的地: {trip_data.get('destination', 'N/A')}")
                print(f"   天数: {len(trip_data.get('activities', []))}")
                print(f"   预算: {trip_data.get('budget', 'N/A')}元")
                return True
            else:
                print(f"❌ 下载行程失败: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            print(f"❌ 下载解密行程失败: {str(e)}")
            return False

    def delete_user(self) -> bool:
        """注销用户"""
        try:
            if not self.srp_client.access_token:
                print("❌ 用户未登录")
                return False

            print("🗑️ 注销用户...")
            response = requests.delete(
                f"{BASE_URL}/user/delete", headers=self.srp_client.get_auth_headers()
            )

            if response.status_code == 200:
                print("✅ 用户注销成功")
                return True
            else:
                print(f"❌ 用户注销失败: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            print(f"❌ 用户注销失败: {str(e)}")
            return False

    def test_wrong_password_auth(self) -> bool:
        """测试使用错误密码认证"""
        try:
            if not self.test_user:
                print("❌ 没有测试用户")
                return False

            print("🔐 测试错误密码认证...")
            print("   使用错误密码尝试登录...")

            # 使用错误的密码尝试认证
            wrong_password = "wrong_password_456"
            auth_success = self.srp_client.authenticate(
                self.test_user["username"], wrong_password
            )

            if auth_success:
                print("❌ 安全测试失败：错误密码竟然认证成功了！")
                return False
            else:
                print("✅ 安全测试通过：错误密码被正确拒绝")
                return True

        except Exception as e:
            print(f"❌ 安全测试出错: {str(e)}")
            return False

    def test_wrong_username_auth(self) -> bool:
        """测试使用错误用户名认证"""
        try:
            print("🔐 测试错误用户名认证...")
            print("   使用错误用户名尝试登录...")

            # 使用错误的用户名尝试认证
            wrong_username = "non_existent_user_123"
            wrong_password = "any_password"
            auth_success = self.srp_client.authenticate(wrong_username, wrong_password)

            if auth_success:
                print("❌ 安全测试失败：不存在的用户竟然认证成功了！")
                return False
            else:
                print("✅ 安全测试通过：不存在的用户被正确拒绝")
                return True

        except Exception as e:
            print(f"❌ 安全测试出错: {str(e)}")
            return False

    def test_unauthorized_access(self) -> bool:
        """测试未授权访问保护"""
        try:
            print("🔐 测试未授权访问保护...")
            print("   尝试在未登录状态下访问受保护资源...")

            # 尝试在没有认证的情况下访问受保护资源
            response = requests.get(f"{BASE_URL}/trips/")

            # 401 Unauthorized 或 403 Forbidden 都是正确的安全响应
            if response.status_code in [401, 403]:
                print(
                    f"✅ 安全测试通过：未授权访问被正确拒绝 (状态码: {response.status_code})"
                )
                return True
            else:
                print(f"❌ 安全测试失败：未授权访问返回状态码 {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ 安全测试出错: {str(e)}")
            return False

    def run_full_test(self) -> bool:
        """运行完整的端到端测试"""
        print("🚀 开始完整的端到端测试流程...")
        print("=" * 50)

        # 功能测试步骤
        functional_steps = [
            ("设置测试用户", self.setup_test_user),
            ("上传API密钥", self.upload_api_keys),
            ("创建行程", self.create_trip),
            ("获取行程列表", self.get_trips_list),
            ("下载并解密行程", self.download_and_decrypt_trip),
        ]

        # 安全测试步骤
        security_steps = [
            ("测试错误密码认证", self.test_wrong_password_auth),
            ("测试错误用户名认证", self.test_wrong_username_auth),
            ("测试未授权访问保护", self.test_unauthorized_access),
            ("注销用户", self.delete_user),
        ]

        success_count = 0
        total_steps = len(functional_steps) + len(security_steps)

        # 执行功能测试
        print("\n🔧 功能测试阶段")
        print("-" * 30)
        for step_name, step_func in functional_steps:
            print(f"\n📋 步骤 {success_count + 1}/{total_steps}: {step_name}")
            print("-" * 30)

            if step_func():
                success_count += 1
                print(f"✅ {step_name} - 成功")
            else:
                print(f"❌ {step_name} - 失败")
                break

        # 执行安全测试
        print("\n🔒 安全测试阶段")
        print("-" * 30)
        for step_name, step_func in security_steps:
            print(f"\n📋 步骤 {success_count + 1}/{total_steps}: {step_name}")
            print("-" * 30)

            if step_func():
                success_count += 1
                print(f"✅ {step_name} - 成功")
            else:
                print(f"❌ {step_name} - 失败")
                break

        print("\n" + "=" * 50)
        print(f"📊 测试结果: {success_count}/{total_steps} 个步骤成功")

        if success_count == total_steps:
            print("🎉 完整的端到端测试全部成功！")
            return True
        else:
            print("💥 测试过程中出现失败")
            return False


def main():
    """主函数 - 运行完整测试"""
    print("🚀 AI旅行规划师 - 客户端端到端测试")
    print("=" * 50)

    try:
        # 创建测试客户端
        test_client = TestClient()

        # 运行完整测试
        success = test_client.run_full_test()

        if success:
            print("\n🎉 所有测试都通过了！系统功能正常。")
        else:
            print("\n💥 测试失败，请检查服务器状态和网络连接。")

    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保服务器正在运行")
        print("💡 提示: 运行 'uvicorn app.main:app --reload --port 8000' 启动服务器")
    except Exception as e:
        print(f"❌ 测试过程中出现异常: {str(e)}")


if __name__ == "__main__":
    main()
