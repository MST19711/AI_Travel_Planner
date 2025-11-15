# AI旅行规划师 - 账号功能说明

## 功能概述

本项目实现了完整的用户账号管理系统，包括：

- ✅ **用户注册** - 使用SRP协议的安全注册
- ✅ **用户登录** - 使用SRP协议的安全认证
- ✅ **个人信息管理** - 查看和编辑用户信息
- ✅ **退出登录** - 安全的会话管理
- ✅ **账户注销** - 永久删除用户账户

## 技术架构

### 前端技术栈
- **Flutter** - 跨平台UI框架
- **Riverpod** - 状态管理
- **GoRouter** - 路由管理
- **Shared Preferences** - 本地存储
- **dsrp** - SRP认证库

### 后端API集成
- **SRP认证** - 安全远程密码协议
- **JWT令牌** - 无状态认证
- **RESTful API** - 标准HTTP接口

## 核心功能说明

### 1. SRP安全认证

SRP（Secure Remote Password）协议确保密码不在网络中传输，提供零知识证明。

**注册流程：**
1. 客户端生成SRP盐值和验证器
2. 发送到服务器存储
3. 服务器不存储明文密码

**登录流程：**
1. 客户端发起认证挑战
2. 服务器返回盐值和公钥
3. 客户端计算证明并发送
4. 服务器验证并返回JWT令牌

### 2. 页面结构

```
lib/
├── pages/
│   ├── auth/
│   │   ├── login_page.dart      # 登录页面
│   │   ├── register_page.dart   # 注册页面
│   │   └── profile_page.dart    # 个人信息页面
│   └── home/
│       └── home_page.dart       # 首页
├── providers/
│   └── auth_provider.dart       # 认证状态管理
├── services/
│   ├── srp_auth_service.dart    # SRP认证服务
│   ├── user_service.dart        # 用户管理服务
│   └── storage_service.dart     # 本地存储服务
├── models/
│   └── auth_models.dart         # 数据模型
└── config/
    └── router.dart              # 路由配置
```

### 3. 状态管理

使用Riverpod管理认证状态：

```dart
class AuthState {
  final bool isAuthenticated;
  final String? token;
  final String? username;
  final String? email;
  final int? userId;
}
```

### 4. 路由保护

自动重定向未认证用户到登录页面：

```dart
redirect: (context, state) {
  final isLoggedIn = authState.isAuthenticated;
  final isAuthPath = state.matchedLocation.startsWith('/login') ||
      state.matchedLocation.startsWith('/register');

  if (!isLoggedIn && !isAuthPath) {
    return '/login';
  }
  if (isLoggedIn && isAuthPath) {
    return '/home';
  }
  return null;
}
```

## 使用说明

### 1. 注册新用户

1. 打开应用，点击"立即注册"
2. 输入用户名、邮箱和密码
3. 点击注册按钮
4. 注册成功后自动跳转到登录页面

### 2. 用户登录

1. 在登录页面输入用户名和密码
2. 点击登录按钮
3. 成功认证后跳转到首页

### 3. 管理个人信息

1. 在首页点击右上角用户图标
2. 查看个人信息
3. 点击编辑按钮修改信息
4. 保存更改

### 4. 退出登录

1. 在个人信息页面
2. 点击"退出登录"按钮
3. 确认操作
4. 自动跳转到登录页面

### 5. 注销账户

1. 在个人信息页面
2. 点击"注销账户"按钮
3. 确认操作（不可恢复）
4. 所有数据将被永久删除

## 安全特性

### 1. 密码安全
- 使用SRP协议，密码不在网络中传输
- 客户端负责密码加密
- 服务器只存储加密验证器

### 2. 会话安全
- JWT令牌认证
- 自动令牌刷新
- 安全的本地存储

### 3. 数据保护
- 敏感数据安全清除
- 安全的字节数组处理
- 内存安全保护

## 开发说明

### 环境要求
- Flutter 3.0+
- Dart 3.0+
- 后端API服务运行在 localhost:8000

### 运行项目
```bash
cd frontend
flutter pub get
flutter run
```

### 测试账号功能
1. 确保后端服务运行
2. 启动Flutter应用
3. 测试注册、登录、退出等流程
4. 验证路由保护和状态管理

## 注意事项

1. **生产环境**：需要配置真实的API端点
2. **安全配置**：建议使用自定义SRP素数
3. **错误处理**：完善的异常处理和用户提示
4. **性能优化**：考虑添加加载状态和缓存机制

## 扩展功能

未来可以扩展的功能：
- 密码重置
- 邮箱验证
- 第三方登录
- 双因素认证
- 会话管理