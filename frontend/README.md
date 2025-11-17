# AI旅行规划师 - 原生Web前端

这是一个基于React + TypeScript + Vite构建的AI旅行规划师Web前端应用，替代了原有的Flutter前端。

## 项目结构

```
frontend/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Layout.tsx      # 主布局组件
│   │   ├── Header.tsx      # 顶部导航栏
│   │   └── Sidebar.tsx     # 侧边栏导航
│   ├── pages/              # 页面组件
│   │   ├── auth/           # 认证相关页面
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── home/           # 首页
│   │   │   └── HomePage.tsx
│   │   ├── trips/          # 行程管理页面
│   │   │   ├── TripDetailPage.tsx
│   │   │   ├── TripMapPage.tsx
│   │   │   └── AITripPlanningPage.tsx
│   │   ├── chat/           # 聊天页面
│   │   │   └── ChatPage.tsx
│   │   ├── search/         # 搜索页面
│   │   │   └── SearchPage.tsx
│   │   └── settings/       # 设置页面
│   │       ├── SettingsPage.tsx
│   │       └── ApiKeysPage.tsx
│   ├── services/           # API服务
│   │   └── authService.ts  # 认证服务
│   ├── stores/             # 状态管理
│   │   └── authStore.ts    # 认证状态管理
│   ├── types/              # TypeScript类型定义
│   │   └── index.ts
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── package.json            # 项目依赖
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
├── tailwind.config.js      # Tailwind CSS配置
└── index.html              # HTML入口
```

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **路由管理**: React Router DOM
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **图标库**: Lucide React
- **加密工具**: Crypto-JS

## 功能特性

### ✅ 已实现功能

1. **用户认证系统**
   - 登录/注册页面
   - Token认证管理
   - 路由守卫
   - 本地存储持久化

2. **响应式布局**
   - 桌面端和移动端适配
   - 侧边栏导航
   - 顶部导航栏
   - 现代化UI设计

3. **基础页面结构**
   - 首页（行程概览）
   - 登录/注册页面
   - 设置页面
   - API密钥配置页面
   - 各功能模块占位页面

### 🔄 待开发功能

1. **行程管理**
   - 行程创建、编辑、删除
   - 行程详情展示
   - 活动管理

2. **地图集成**
   - 高德地图集成
   - 地点标记
   - 路线规划

3. **AI功能**
   - 智能行程规划
   - 聊天助手
   - 智能搜索

4. **API集成**
   - 后端API对接
   - 实时数据同步
   - 错误处理

## 开发指南

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
cd frontend
npm install
```

### 开发运行

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
npm run type-check
```

## UI设计说明

### 设计原则

- **现代化**: 使用现代化的设计语言和交互模式
- **一致性**: 保持与原Flutter应用相似的视觉风格
- **响应式**: 支持桌面端和移动端
- **易用性**: 直观的用户界面和流畅的用户体验

### 色彩方案

- **主色调**: 蓝色 (#3B82F6)
- **辅助色**: 灰色调
- **成功色**: 绿色
- **警告色**: 橙色
- **错误色**: 红色

### 组件设计

- 使用Tailwind CSS的原子化类名
- 统一的圆角设计 (8px/12px)
- 一致的阴影效果
- 流畅的过渡动画

## 与原Flutter应用对比

### 相似之处

- 相同的应用名称和品牌标识
- 相似的功能模块划分
- 一致的蓝色主题色
- 类似的页面布局结构

### 改进之处

- **性能**: 更快的加载速度和响应时间
- **开发体验**: 更好的TypeScript支持
- **生态系统**: 丰富的React生态库
- **部署**: 更简单的Web部署流程

## 下一步开发计划

1. **后端API集成**
   - 对接用户认证API
   - 实现行程CRUD操作
   - 集成地图服务

2. **功能完善**
   - 实现完整的行程管理
   - 集成AI聊天功能
   - 添加地图交互

3. **优化改进**
   - 性能优化
   - 错误处理
   - 用户体验改进

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License