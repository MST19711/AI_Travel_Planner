# SRP认证机制说明

## 概述

本项目使用SRP（Secure Remote Password）协议来增强用户认证安全性。SRP是一种零知识证明协议，确保密码在不安全的网络传输中不会被泄露。

## SRP协议原理

### 核心概念

- **零知识证明**: 服务器不存储用户密码，只存储验证器
- **相互认证**: 客户端和服务器相互验证身份
- **前向安全性**: 即使验证器泄露，也无法推导出原始密码

### 数学基础

SRP基于离散对数问题的困难性，使用大素数模数运算来确保安全性。

## 实现架构

### 数据库模型

用户模型已更新以支持SRP：

```python
class User(Base):
    __tablename__ = "users"
  
    # SRP认证相关字段
    srp_salt = Column(String(255), nullable=True)  # SRP盐值
    srp_verifier = Column(String(255), nullable=True)  # SRP验证器
  
    # 向后兼容字段
    password_hash = Column(String(255), nullable=True)
```

### API端点

#### 1. SRP注册

**端点**: `POST /auth/srp/register`

**请求**:

```json
{
  "username": "test_user",
  "email": "test@example.com"
}
```

**响应**:

```json
{
  "username": "test_user",
  "email": "test@example.com",
  "message": "用户注册成功"
}
```

#### 2. SRP挑战

**端点**: `POST /auth/srp/challenge`

**请求**:

```json
{
  "username": "test_user"
}
```

**响应**:

```json
{
  "username": "test_user",
  "salt": "base64_encoded_salt",
  "B": "base64_encoded_server_public_key"
}
```

#### 3. SRP认证

**端点**: `POST /auth/srp/authenticate`

**请求**:

```json
{
  "username": "test_user",
  "A": "base64_encoded_client_public_key",
  "M1": "base64_encoded_client_proof"
}
```

**响应**:

```json
{
  "username": "test_user",
  "M2": "base64_encoded_server_proof",
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

## 认证流程

### 注册流程

1. 客户端发送用户名、邮箱和密码到 `/auth/srp/register`
2. 服务器使用pysrp库生成盐值和验证器
3. 服务器存储用户名、邮箱、盐值和验证器
4. 服务器返回注册成功响应

### 登录流程

1. **挑战阶段**:

   - 客户端发送用户名到 `/auth/srp/challenge`
   - 服务器查找用户并返回盐值和服务器公钥B
2. **认证阶段**:

   - 客户端使用密码、盐值和服务器公钥生成客户端公钥A和证明M1
   - 客户端发送A和M1到 `/auth/srp/authenticate`
   - 服务器验证客户端证明M1
   - 服务器生成服务器证明M2
   - 服务器返回M2和JWT访问令牌
   - 客户端验证服务器证明M2，完成相互认证

## 安全特性

### 1. 密码保护

- 服务器不存储明文密码
- 传输过程中密码不会被泄露
- 即使数据库泄露，攻击者也无法获取用户密码

### 2. 中间人攻击防护

- 所有传输的数据都是临时密钥和证明
- 攻击者无法重放认证过程
- 每次认证使用不同的随机数

### 3. 相互认证

- 客户端验证服务器证明
- 服务器验证客户端证明
- 双方都确认对方拥有正确的密钥材料

## 技术实现

### 依赖库

使用 `pysrp` 库实现SRP协议：

```toml
srp = ">=1.0.16"
```

### 核心类

#### SRPAuth

主要的SRP认证管理器类，提供以下方法：

- `create_verifier()` - 创建验证器（注册时使用）
- `start_authentication()` - 开始认证流程（服务器端）
- `verify_authentication()` - 验证客户端认证
- `create_client_session()` - 创建客户端会话
- `verify_server_proof()` - 验证服务器证明

### 配置参数

- **ng_type**: SRP参数类型，默认为2048位
- **hash_alg**: 哈希算法，使用SHA256

## 测试

### 测试脚本

运行测试脚本验证完整的SRP认证流程：

```bash
cd backend
uv run python test_srp_auth.py
```

测试脚本会执行以下步骤：

1. SRP用户注册
2. SRP登录流程
3. 受保护端点访问
4. 错误密码测试

### 测试覆盖

- ✅ 用户注册成功
- ✅ 获取认证挑战成功
- ✅ 客户端会话创建成功
- ⚠️ 认证验证（需要进一步调试）

## 向后兼容性

系统同时支持传统的密码哈希认证和新的SRP认证：

- 新用户注册使用SRP认证
- 现有用户可继续使用传统认证
- API密钥加密仍使用传统密码哈希

## 最佳实践

### 1. 客户端实现

- 使用安全的随机数生成器
- 及时清理临时密钥材料
- 实现超时和重试机制

### 2. 服务器实现

- 使用强SRP参数（2048位或更高）
- 实现会话管理
- 监控异常认证尝试

### 3. 安全考虑

- 定期更新依赖库
- 监控安全公告
- 考虑实现二次认证

## 故障排除

### 常见问题

1. **认证失败**

   - 检查盐值和验证器是否正确存储
   - 验证客户端和服务器使用相同的SRP参数
2. **性能问题**

   - SRP计算可能较慢，考虑使用更快的硬件
   - 实现适当的缓存策略
3. **兼容性问题**

   - 确保客户端和服务器使用相同版本的pysrp
   - 启用RFC5054兼容性模式

## 参考资料

- [SRP协议RFC 5054](https://tools.ietf.org/html/rfc5054)
- [pysrp库文档](https://github.com/cocagne/pysrp)
- [OWASP认证指南](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
