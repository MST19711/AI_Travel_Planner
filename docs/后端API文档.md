# AI旅行规划师 - 后端API文档

## 概述

AI旅行规划师后端API服务基于FastAPI框架构建，提供用户认证、行程管理和第三方API密钥管理等功能。采用SRP（Secure Remote Password）协议进行安全认证，确保用户密码不在网络中传输。

### 基础信息
- **API版本**: 0.2.0
- **基础URL**: `http://localhost:8000`
- **文档地址**: `/docs` (Swagger UI) 或 `/redoc` (ReDoc)
- **认证方式**: JWT Bearer Token
- **数据库**: SQLite (开发环境)
- **ORM**: SQLAlchemy

## 快速开始

### 1. 安装依赖
```bash
cd backend
uv sync
```

### 2. 创建数据库表
```bash
cd backend
python create_tables.py
```

### 3. 启动服务
```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 访问API文档
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 认证系统

### SRP认证流程

SRP（Secure Remote Password）是一种安全的密码认证协议，确保密码不在网络中传输。

#### 认证步骤：

1. **用户注册** - 客户端计算SRP盐值和验证器
2. **认证挑战** - 客户端发送公钥A，服务器返回盐值和公钥B
3. **认证验证** - 客户端发送证明M1，服务器验证并返回令牌

### 认证API

#### 1. 用户注册

**端点**: `POST /auth/register`

**描述**: 使用SRP协议注册新用户

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "srp_salt": "base64_string",
  "srp_verifier": "base64_string"
}
```

**字段说明**:
- `username`: 用户名（唯一）
- `email`: 邮箱地址（唯一）
- `srp_salt`: SRP盐值（Base64编码）
- `srp_verifier`: SRP验证器（Base64编码）

**响应**:
```json
{
  "username": "string",
  "email": "string",
  "message": "用户注册成功"
}
```

**错误码**:
- `400`: 用户名或邮箱已存在
- `422`: 请求数据验证失败

#### 2. SRP认证挑战

**端点**: `POST /auth/SRPAuthInit`

**描述**: 发起SRP认证挑战，获取服务器公钥和盐值

**请求体**:
```json
{
  "username": "string",
  "A": "base64_string"
}
```

**字段说明**:
- `username`: 用户名
- `A`: 客户端公钥（Base64编码）

**响应**:
```json
{
  "username": "string",
  "salt": "base64_string",
  "B": "base64_string",
  "session_id": "string"
}
```

**字段说明**:
- `salt`: SRP盐值（Base64编码）
- `B`: 服务器公钥（Base64编码）
- `session_id`: 会话ID，用于后续认证

**错误码**:
- `401`: 用户不存在
- `400`: 缺少客户端公钥或认证失败

#### 3. SRP认证验证

**端点**: `POST /auth/SRPAuthProof`

**描述**: 完成SRP认证，获取访问令牌

**请求体**:
```json
{
  "username": "string",
  "M1": "base64_string",
  "session_id": "string"
}
```

**字段说明**:
- `username`: 用户名
- `M1`: 客户端证明（Base64编码）
- `session_id`: 会话ID

**响应**:
```json
{
  "username": "string",
  "M2": "base64_string",
  "access_token": "string",
  "token_type": "bearer",
  "success": true
}
```

**字段说明**:
- `M2`: 服务器证明（Base64编码）
- `access_token`: JWT访问令牌
- `token_type`: 令牌类型，固定为"bearer"

**错误码**:
- `401`: 用户不存在、无效会话或认证失败

## 用户管理API

所有用户管理API都需要Bearer Token认证。

### 认证头格式
```
Authorization: Bearer <jwt_token>
```

### 1. 获取当前用户信息

**端点**: `GET /user/me`

**描述**: 获取当前登录用户的详细信息

**响应**:
```json
{
  "id": 1,
  "userID": 1,
  "username": "string",
  "email": "string",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### 2. 更新用户个人信息

**端点**: `PUT /user/profile`

**描述**: 更新当前用户的个人信息

**请求体**:
```json
{
  "username": "string",
  "email": "string"
}
```

**字段说明**:
- `username`: 新用户名（可选）
- `email`: 新邮箱地址（可选）

**响应**: 更新后的用户信息

**错误码**:
- `400`: 用户名或邮箱已存在

### 3. 更新API密钥

**端点**: `PUT /user/api-keys`

**描述**: 更新用户的第三方API密钥（客户端负责加密）

**请求体**:
```json
{
  "openai_api_key": "string",
  "openai_base_url": "string",
  "openai_model": "string",
  "amap_api_key": "string",
  "xunfei_app_id": "string",
  "xunfei_api_secret": "string",
  "xunfei_api_key": "string",
  "glm_api_key": "string"
}
```

**字段说明**: 所有API密钥字段都是可选的，客户端负责在发送前对敏感数据进行加密

**响应**: 更新后的API密钥配置

### 4. 获取API密钥

**端点**: `GET /user/api-keys`

**描述**: 获取用户的API密钥配置（客户端已加密）

**响应**: API密钥配置（客户端负责解密）

### 5. 注销用户账户

**端点**: `DELETE /user/delete`

**描述**: 永久删除用户账户及其所有数据

**响应**:
```json
{
  "message": "用户注销成功，所有数据已永久删除",
  "username": "string"
}
```

## 行程管理API

所有行程管理API都需要Bearer Token认证。

### 1. 获取行程列表

**端点**: `GET /trips/`

**描述**: 获取当前用户的行程列表，支持分页和状态过滤

**查询参数**:
- `page`: 页码（默认1）
- `size`: 每页数量（默认10，最大100）
- `status`: 行程状态过滤（可选：planning, in_progress, completed, cancelled）

**响应**:
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "title": "string",
      "status": "planning",
      "trip_data": {
        "title": "行程标题",
        "description": "行程描述",
        "startDate": "2024-07-01T00:00:00.000",
        "endDate": "2024-07-03T00:00:00.000",
        "budget": 3000,
        "participants": 2,
        "preferences": {
          "food": ["日料", "寿司"],
          "activities": ["观光", "购物"],
          "accommodation": "商务酒店"
        },
        "activities": [
          {
            "title": "活动标题",
            "description": "活动详细描述",
            "location": "具体地点",
            "city": "城市名称",
            "countryCode": "国家代码",
            "startTime": "2024-07-01T10:00:00.000",
            "endTime": "2024-07-01T13:00:00.000",
            "estimatedCost": 200,
            "notes": "备注信息"
          }
        ]
      },
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ],
  "total": 10,
  "page": 1,
  "size": 10,
  "pages": 1
}
```

### 2. 创建行程

**端点**: `POST /trips/`

**描述**: 创建新的行程（存储明文JSON数据）

**请求体**:
```json
{
  "title": "string",
  "trip_data": {
    "title": "行程标题",
    "description": "行程描述",
    "startDate": "2024-07-01T00:00:00.000",
    "endDate": "2024-07-03T00:00:00.000",
    "budget": 3000,
    "participants": 2,
    "preferences": {
      "food": ["日料", "寿司"],
      "activities": ["观光", "购物"],
      "accommodation": "商务酒店"
    },
    "activities": [
      {
        "title": "活动标题",
        "description": "活动详细描述",
        "location": "具体地点",
        "city": "城市名称",
        "countryCode": "国家代码",
        "startTime": "2024-07-01T10:00:00.000",
        "endTime": "2024-07-01T13:00:00.000",
        "estimatedCost": 200,
        "notes": "备注信息"
      }
    ]
  }
}
```

**字段说明**:
- `title`: 行程标题
- `trip_data`: 明文的行程数据（JSON格式）

**响应**: 创建的行程信息

### 3. 获取行程详情

**端点**: `GET /trips/{trip_id}`

**描述**: 获取特定行程的详细信息

**路径参数**:
- `trip_id`: 行程ID

**响应**: 行程详细信息

**错误码**:
- `404`: 行程不存在

### 4. 更新行程

**端点**: `PUT /trips/{trip_id}`

**描述**: 更新行程信息（更新明文JSON数据）

**路径参数**:
- `trip_id`: 行程ID

**请求体**:
```json
{
  "title": "string",
  "status": "string",
  "trip_data": {
    "title": "行程标题",
    "description": "行程描述",
    "startDate": "2024-07-01T00:00:00.000",
    "endDate": "2024-07-03T00:00:00.000",
    "budget": 3000,
    "participants": 2,
    "preferences": {
      "food": ["日料", "寿司"],
      "activities": ["观光", "购物"],
      "accommodation": "商务酒店"
    },
    "activities": [
      {
        "title": "活动标题",
        "description": "活动详细描述",
        "location": "具体地点",
        "city": "城市名称",
        "countryCode": "国家代码",
        "startTime": "2024-07-01T10:00:00.000",
        "endTime": "2024-07-01T13:00:00.000",
        "estimatedCost": 200,
        "notes": "备注信息"
      }
    ]
  }
}
```

**字段说明**: 所有字段都是可选的
- `title`: 行程标题
- `status`: 行程状态
- `trip_data`: 明文的行程数据（JSON格式）

**响应**: 更新后的行程信息

**错误码**:
- `404`: 行程不存在

### 5. 删除行程

**端点**: `DELETE /trips/{trip_id}`

**描述**: 删除特定行程及其所有活动

**路径参数**:
- `trip_id`: 行程ID

**响应**:
```json
{
  "message": "行程删除成功"
}
```

**错误码**:
- `404`: 行程不存在

## 系统API

### 1. 根路径

**端点**: `GET /`

**描述**: API服务状态信息

**响应**:
```json
{
  "message": "AI旅行规划师API服务",
  "version": "0.1.0",
  "status": "running"
}
```

### 2. 健康检查

**端点**: `GET /health`

**描述**: 服务健康状态检查

**响应**:
```json
{
  "status": "healthy"
}
```

## 数据模型

### 用户模型 (User)
```python
{
  "id": "int (主键)",
  "userID": "int (用户ID)",
  "username": "string (用户名)",
  "email": "string (邮箱)",
  "srp_salt": "string (SRP盐值)",
  "srp_verifier": "string (SRP验证器)",
  "openai_api_key": "string (OpenAI API密钥)",
  "openai_base_url": "string (OpenAI基础URL)",
  "openai_model": "string (OpenAI模型)",
  "amap_api_key": "string (高德地图API密钥)",
  "xunfei_app_id": "string (讯飞App ID)",
  "xunfei_api_secret": "string (讯飞API密钥)",
  "xunfei_api_key": "string (讯飞API Key)",
  "glm_api_key": "string (GLM API密钥)",
  "created_at": "datetime (创建时间)",
  "updated_at": "datetime (更新时间)"
}
```

### 行程模型 (Trip)
```python
{
  "id": "int (主键)",
  "user_id": "int (用户ID)",
  "title": "string (行程标题)",
  "status": "string (状态: planning, in_progress, completed, cancelled)",
  "trip_data": "dict (明文的行程数据，JSON格式)",
  "created_at": "datetime (创建时间)",
  "updated_at": "datetime (更新时间)"
}
```

## 错误处理

### 标准错误响应格式
```json
{
  "detail": "错误描述信息"
}
```

### 常见错误码
- `400`: 请求数据验证失败
- `401`: 未授权或认证失败
- `403`: 禁止访问
- `404`: 资源不存在
- `422`: 请求数据格式错误
- `500`: 服务器内部错误

## 安全特性

### 1. SRP认证
- 使用SRP协议，密码不在网络中传输
- 支持前向安全性
- 防止重放攻击

### 2. JWT令牌
- 令牌有效期30分钟
- 使用HS256算法签名
- 每次服务器重启重新生成密钥

### 3. 数据安全
- API密钥在客户端加密后存储
- 服务器仅存储加密的API密钥数据
- 行程数据以明文JSON格式存储，便于后端处理

### 4. CORS配置
- 开发环境允许所有来源（生产环境应限制）

## 开发说明

### 环境变量
创建 `.env` 文件：
```env
DATABASE_URL=sqlite:///./app.db
ENCRYPTION_SALT=your-encryption-salt
SECRET_KEY=your-very-secure-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 依赖管理
使用 `uv` 包管理器：
```bash
cd backend
uv sync
```

### 数据库操作
```bash
# 创建数据库表
python create_tables.py

# 重置数据库（删除并重新创建）
rm app.db
python create_tables.py
```

### 测试
```bash
cd backend
uv run pytest
```

### API测试
```bash
# 测试伪客户端
uv run python pseudo_client4test.py
```

## 版本历史

- **v0.2.0** (当前版本)
  - 完整的用户认证系统（SRP协议 + 不安全传输）
  - 行程管理功能（完整CRUD）
  - API密钥管理（前端加密）
  - 数据加密存储
  - 改进的行程数据结构
  - JWT令牌管理
  - 中间件和错误处理

- **v0.1.0** (历史版本)
  - 基础用户认证系统
  - 简单行程管理
  - 基础API密钥管理

---

**注意**: 本文档基于当前代码版本 v0.1.0，API可能会在后续版本中更新。