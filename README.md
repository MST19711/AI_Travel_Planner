# AI旅行规划师 (AI Travel Planner)

基于React + FastAPI的智能旅行规划应用，集成AI技术和地图服务，为用户提供完整的旅行规划解决方案。

## 项目概述

本项目是一个现代化的Web版AI旅行规划工具，通过AI了解用户需求，自动生成详细的旅行路线和建议，并提供地图导航和实时旅行辅助功能。系统采用React + TypeScript + FastAPI技术栈，集成了Leaflet地图、OpenAI API等多种服务，为用户提供智能化的旅行规划体验。

## 🎯 核心功能

### ✅ 已实现功能

1. **用户认证系统**
   - ✅ 注册/登录功能
   - ✅ 不安全密码传输模式（开发测试用）
   - ⏳ SRP安全认证协议（开发中）
   - ✅ JWT令牌管理
   - ✅ 认证状态持久化

2. **行程管理**
   - ✅ 创建、编辑、删除行程
   - ✅ 行程列表展示
   - ✅ 行程详情页面
   - ✅ 活动管理（添加、编辑、删除活动）
   - ✅ 行程状态管理（规划中、进行中、已完成、已取消）

3. **AI智能规划**
   - ✅ 基于OpenAI API的行程规划
   - ✅ 支持流式响应，实时显示生成过程
   - ✅ AI响应格式验证和重试机制
   - ✅ 支持多种AI提供商（OpenAI、DeepSeek等）
   - ✅ 智能行程数据解析和验证

4. **地图导航系统**
   - ✅ Leaflet地图集成
   - ✅ 地点搜索功能（使用Nominatim API）
   - ✅ 地图标记和信息窗口
   - ✅ 驾车路线规划（使用OSRM）
   - ✅ 多国家地图支持
   - ✅ 自定义地图样式和控件

5. **语音识别集成**
   - ✅ 科大讯飞语音识别服务
   - ✅ 语音输入旅行需求
   - ✅ 实时语音识别状态显示
   - ✅ WebSocket实时通信
   - ✅ 音频录制和重采样处理

6. **API密钥管理**
   - ✅ 用户级API密钥配置
   - ✅ 多服务API密钥管理（OpenAI、高德地图、科大讯飞、GLM）
   - ✅ 前端加密存储和自动解密
   - ✅ API密钥验证和错误处理

7. **响应式UI设计**
   - ✅ 横屏和竖屏自适应布局
   - ✅ 现代化的Tailwind CSS界面
   - ✅ 流畅的动画和交互效果
   - ✅ 路由守卫和权限控制

### 🚧 开发中功能

1. **预算分析功能**
   - ⏳ 基于AI的预算分析
   - ⏳ 费用统计和优化建议
   - ⏳ 预算与实际开销对比

2. **SRP安全认证**
   - ⏳ 安全远程密码协议完整实现
   - ⏳ 零知识证明认证机制
   - ⏳ 相互身份验证

3. **高级地图功能**
   - ⏳ 公交路线规划
   - ⏳ 多交通方式支持（步行、骑行）
   - ⏳ 实时交通信息

### 📋 TBD功能（未来规划）

1. **高级AI功能**
   - 基于GLM搜索API的智能搜索
   - 多轮对话优化行程规划
   - 实时旅行建议和调整

2. **社交功能**
   - 行程分享和协作编辑
   - 热门行程推荐
   - 用户评价和评分系统

3. **移动端优化**
   - PWA渐进式Web应用
   - 离线功能支持
   - 推送通知

4. **国际化支持**
   - 多语言界面
   - 多货币预算分析
   - 全球目的地支持

## 🛠️ 技术栈

### 前端技术
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **路由管理**: React Router DOM
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **图标库**: Lucide React
- **加密工具**: Crypto-JS
- **地图服务**: Leaflet + Leaflet Routing Machine
- **地图数据**: OpenStreetMap + Nominatim + OSRM

### 后端技术
- **框架**: Python + FastAPI
- **数据库**: SQLite (初期)
- **包管理**: uv
- **认证**: JWT + SRP协议
- **API文档**: OpenAPI/Swagger
- **ORM**: SQLAlchemy

### AI服务集成
- **大语言模型**: OpenAI API (支持DeepSeek、GPT等)
- **搜索服务**: 智谱GLM搜索API (计划集成)
- **语音识别**: 科大讯飞语音识别API (已实现)
- **地图服务**: OpenStreetMap (主要)、高德地图API (备用)

## 🏗️ 项目架构

### 前端架构 (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── components/        # 可复用组件
│   │   ├── Layout.tsx    # 主布局组件
│   │   ├── Header.tsx    # 顶部导航栏
│   │   ├── Sidebar.tsx   # 侧边栏导航
│   │   └── MapComponent.tsx # 地图组件
│   ├── pages/            # 页面组件
│   │   ├── auth/         # 认证页面
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── trips/        # 行程管理页面
│   │   │   ├── TripLayoutPage.tsx
│   │   │   ├── AITripPlanningPage.tsx
│   │   │   └── TripDetailPage.tsx
│   │   ├── chat/         # 聊天页面
│   │   ├── search/       # 搜索页面
│   │   ├── home/         # 首页
│   │   └── settings/     # 设置页面
│   ├── services/         # API服务
│   │   ├── authService.ts    # 认证服务
│   │   ├── tripService.ts    # 行程服务
│   │   ├── llmService.ts     # AI服务
│   │   ├── userService.ts    # 用户服务
│   │   └── leafletService.ts # 地图服务
│   ├── stores/           # 状态管理
│   │   └── authStore.ts      # 认证状态管理
│   ├── types/            # TypeScript类型定义
│   │   └── index.ts
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # 应用入口
│   └── index.css         # 全局样式
├── package.json          # 项目依赖
├── vite.config.ts        # Vite配置
├── tsconfig.json         # TypeScript配置
├── tailwind.config.js    # Tailwind CSS配置
└── index.html            # HTML入口
```

### 后端架构 (FastAPI + SQLAlchemy)
```
backend/
├── app/
│   ├── routers/          # API路由
│   │   ├── auth.py       # 认证路由
│   │   ├── users.py      # 用户管理路由
│   │   └── trips.py      # 行程管理路由
│   ├── models/           # SQLAlchemy数据模型
│   │   ├── User.py       # 用户模型
│   │   └── Trip.py       # 行程模型
│   ├── schemas/          # Pydantic模型
│   │   ├── auth.py       # 认证相关模型
│   │   ├── users.py      # 用户相关模型
│   │   └── trips.py      # 行程相关模型
│   ├── auth.py           # 认证逻辑
│   ├── srp_auth.py       # SRP认证实现
│   ├── database.py       # 数据库配置
│   ├── middleware.py     # 中间件
│   └── main.py          # 应用入口
├── pyproject.toml        # uv配置
├── .env.example          # 环境变量
└── create_tables.py      # 数据库表创建脚本
```

## 🔐 安全特性

### 数据安全设计
- **用户认证**: 支持SRP协议，服务器不存储用户密码
- **API密钥**: 用户级密钥管理，前端加密存储
- **数据传输**: HTTPS加密传输
- **会话管理**: JWT令牌，支持自动刷新

### 隐私保护
- **数据所有权**: 用户完全控制自己的行程数据
- **选择性分享**: 用户可选择分享行程给其他用户
- **数据加密**: 敏感数据在传输和存储时加密

## 🚀 快速开始

### 环境要求
- Python 3.9+
- Node.js 16+
- uv (Python包管理器)

### 后端启动
```bash
cd backend
# 安装依赖
uv sync

# 创建数据库表
python create_tables.py

# 启动开发服务器
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动
```bash
cd frontend
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问应用
- 前端界面: http://localhost:5173
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## 🐳 Docker部署

项目提供了完整的Docker容器化部署方案，支持一键启动整个应用。

### 快速开始

#### 方法一：使用预构建镜像（推荐）

1. **加载预构建镜像**
   ```bash
   # 从压缩文件加载镜像
   docker load < ai-travel-planner-docker-image.tar.gz
   
   # 验证镜像加载成功
   docker images | grep ai-travel-planner
   ```

2. **运行容器**
   ```bash
   docker run -d -p 8080:80 --name ai-travel-planner ai-travel-planner:latest
   ```

3. **访问应用**
   - 前端界面: http://localhost:8080
   - API文档: http://localhost:8080/docs
   - 健康检查: http://localhost:8080/health

#### 方法二：使用docker-compose

1. **构建并启动容器**
   ```bash
   # 构建镜像并启动服务
   docker-compose up -d
   
   # 或者使用构建脚本
   ./build.sh
   docker-compose up -d
   ```

2. **访问应用**
   - 前端界面: http://localhost:8080
   - API文档: http://localhost:8080/docs
   - 健康检查: http://localhost:8080/health

3. **查看服务状态**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

4. **停止服务**
   ```bash
   docker-compose down
   ```

#### 方法三：从源码构建镜像

1. **构建镜像**
   ```bash
   docker build -t ai-travel-planner:latest .
   ```

2. **运行容器**
   ```bash
   docker run -d -p 8080:80 --name ai-travel-planner ai-travel-planner:latest
   ```

### 镜像打包和分发

#### 保存镜像到文件
```bash
# 将镜像保存并压缩为tar.gz文件
docker save aipt-ai-travel-planner:latest | gzip > ai-travel-planner-docker-image.tar.gz

# 查看文件大小
ls -lh ai-travel-planner-docker-image.tar.gz
```

#### 从文件加载镜像
```bash
# 从压缩文件直接加载镜像
docker load < ai-travel-planner-docker-image.tar.gz

# 或使用gunzip
gunzip -c ai-travel-planner-docker-image.tar.gz | docker load
```

#### 验证镜像
```bash
# 检查镜像信息
docker images ai-travel-planner:latest

# 运行测试容器
docker run --rm -p 8080:80 ai-travel-planner:latest
```

### 环境配置

1. **复制环境变量文件**
   ```bash
   cp .env.example .env
   ```

2. **编辑配置**（可选）
   修改 `.env` 文件中的安全配置：
   ```env
   SECRET_KEY=your-very-secure-production-secret-key
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

### 数据持久化

容器使用数据卷确保数据安全：
- `ai_travel_data`: 存储SQLite数据库文件
- `ai_travel_logs`: 存储Nginx日志文件

### 服务架构

容器内运行以下服务：
- **Nginx (端口80)**: 静态文件服务和API反向代理
- **FastAPI (端口8000)**: 后端API服务
- **SQLite数据库**: 数据存储

### 健康检查

容器包含健康检查机制，可通过以下方式验证：
```bash
# 检查容器健康状态
docker inspect ai-travel-planner --format='{{.State.Health.Status}}'

# 直接访问健康端点
curl http://localhost:8080/health
```

### 开发环境 vs 生产环境

| 环境 | 启动方式 | 特点 |
|------|----------|------|
| 开发环境 | `cd backend && uv run uvicorn...` + `cd frontend && npm run dev` | 热重载、调试模式 |
| 生产环境 | Docker容器 | 优化性能、安全配置、持久化存储 |

### 一键启动开发环境
```bash
# 启动后端服务
cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 启动前端服务（新终端）
cd frontend && npm run dev
```

## ⚙️ 配置说明

### API密钥配置
**重要**: 所有API密钥与用户账户绑定，每个用户只能使用自己设置的API密钥。

用户可在账户设置界面配置以下API密钥：
- **OpenAI API Key**: 用于AI行程规划
- **高德地图API Key**: 用于地图和导航服务
- **科大讯飞语音识别API Key**: 用于语音输入功能
- **智谱GLM搜索API Key**: 用于智能搜索功能

API密钥为空时相关服务不可用，但不影响其他服务的使用。

## 🎨 项目特点

### 1. 智能化程度高
- **AI驱动**: 基于大语言模型的智能行程规划
- **多模态输入**: 支持文字和语音两种输入方式
- **实时响应**: 流式API提供实时生成体验
- **智能验证**: AI响应格式自动验证和重试

### 2. 用户体验优秀
- **响应式设计**: 完美适配横屏和竖屏显示
- **直观操作**: 拖拽调整、语音输入等便捷操作
- **实时反馈**: 操作状态实时提示和进度显示
- **错误处理**: 完善的错误提示和恢复机制

### 3. 技术架构先进
- **现代化技术栈**: React + FastAPI组合
- **模块化设计**: 清晰的代码结构和职责分离
- **状态管理**: Zustand提供轻量级状态管理
- **类型安全**: TypeScript确保代码质量

### 4. 扩展性强
- **插件化架构**: 易于添加新的AI服务
- **配置灵活**: 用户级API密钥管理
- **国际化就绪**: 架构支持多语言扩展
- **移动端兼容**: 为未来移动端开发做好准备

## 🔮 未来展望

### 短期目标 (1-3个月)
- [x] 完成地图基础显示功能
- [x] 实现地图标记和搜索功能
- [x] 完成路线规划功能
- [ ] 实现预算分析功能
- [ ] 完善SRP安全认证
- [ ] 优化AI规划算法
- [x] 集成语音识别功能

### 中期目标 (3-6个月)
- [ ] 集成GLM搜索API到AI规划流程
- [ ] 实现行程分享和协作功能
- [ ] 开发移动端PWA应用
- [ ] 添加多语言支持
- [ ] 实现公交和步行路线规划

### 长期愿景 (6-12个月)
- [ ] 构建旅行社交平台
- [ ] 开发AI旅行助手聊天机器人
- [ ] 实现AR/VR旅行预览功能
- [ ] 建立旅行大数据分析平台

## 🤝 贡献指南

我们欢迎社区贡献！请参考以下步骤：

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

如有问题或建议，请通过以下方式联系我们：
- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: contact@example.com

---

## 📊 项目统计

- **开发语言**: TypeScript, Python, SQL
- **代码行数**: ~15,000+ 行
- **API接口**: 20+ 个
- **支持国家**: 200+ 个
- **地图服务**: OpenStreetMap + Nominatim + OSRM
- **AI服务**: OpenAI, DeepSeek, GLM (计划中)

---

## 🙏 致谢

感谢以下开源项目和服务提供商：
- [React](https://reactjs.org/) - 前端框架
- [FastAPI](https://fastapi.tiangolo.com/) - 后端框架
- [Leaflet](https://leafletjs.com/) - 地图库
- [OpenStreetMap](https://www.openstreetmap.org/) - 地图数据
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [OpenAI](https://openai.com/) - AI服务

---

## 🗺️ 地图功能使用指南

### Leaflet地图集成

项目已集成Leaflet地图服务，支持以下功能：

#### ✅ 已实现功能
- ✅ **基础地图显示**: 在React应用中显示OpenStreetMap地图
- ✅ **地点搜索**: 使用Nominatim API进行全球地点搜索
- ✅ **地点标记**: 标记行程中的关键地点，支持自定义弹出窗口
- ✅ **驾车路线规划**: 使用OSRM进行路线规划和导航
- ✅ **多国家支持**: 支持全球主要旅行目的国家的地图显示
- ✅ **响应式设计**: 地图自适应不同屏幕尺寸

#### 配置步骤

1. **地图服务配置**
   - 项目使用免费的OpenStreetMap服务，无需API Key
   - 地点搜索使用Nominatim API（开源）
   - 路线规划使用OSRM（开源路由服务）

2. **使用地图功能**
   - 在行程详情页面查看地图
   - 系统会根据行程活动的地点信息自动显示地图
   - 支持手动搜索和添加地点
   - 可以规划多个地点间的驾车路线

#### 技术实现

地图功能通过以下方式实现：
- **前端**: React + Leaflet + TypeScript
- **地图服务**: OpenStreetMap (瓦片地图)
- **地点搜索**: Nominatim API (地理编码)
- **路线规划**: OSRM API (开源路由服务)
- **组件化**: 可复用的地图组件和地图服务
- **状态管理**: 与React状态管理集成

#### 地图特性

1. **交互功能**
   - 点击标记显示详细信息
   - 拖拽和缩放地图
   - 选择地点用于行程规划
   - 自定义弹出窗口内容

2. **路线规划**
   - 支持多个途经点
   - 实时路线计算
   - 距离和时间估算
   - 路线说明面板

3. **全球覆盖**
   - 支持200+国家地区
   - 多语言地名显示
   - 自动根据国家代码调整地图视图

---

**AI旅行规划师** - 让每一次旅行都成为完美的体验 ✈️
