# AI旅行规划师 (AI Travel Planner)

基于Flutter Web的智能旅行规划应用，集成AI技术简化旅行规划过程。

## 项目概述

本项目是一个Web版的AI旅行规划工具，通过AI了解用户需求，自动生成详细的旅行路线和建议，并提供实时旅行辅助功能。

## 技术栈

- **前端**: Flutter Web
- **后端**: Python + FastAPI
- **数据库**: SQLite (初期)
- **AI服务**: OpenAI API (默认DeepSeek-chat)
- **地图服务**: 高德地图API
- **语音识别**: 科大讯飞语音识别API
- **搜索服务**: 智谱GLM搜索API

## 核心功能

1. **智能行程规划**: 通过语音或文字输入生成个性化旅行路线
2. **费用预算与管理**: AI预算分析和旅行开销记录
3. **用户管理与数据存储**: 注册登录系统，云端行程同步
4. **地图导航**: 基于高德地图的地理位置服务和导航
5. **语音识别**: 基于科大讯飞API的语音输入功能

## 项目结构

```
ai-travel-planner/
├── backend/                 # Python后端服务
│   ├── app/                # 应用代码
│   ├── requirements.txt    # Python依赖
│   └── pyproject.toml      # uv配置
├── frontend/               # Flutter前端应用
│   ├── lib/               # Dart代码
│   ├── pubspec.yaml       # Flutter依赖
│   └── web/               # Web配置
├── docs/                  # 项目文档
├── config/               # 配置文件
└── README.md            # 项目说明
```

## 开发环境要求

- Python 3.9+
- Flutter 3.0+ (Web支持)
- uv (Python包管理器)

## 快速开始

### 后端启动
```bash
cd backend
uv run uvicorn app.main:app --reload
```

### 前端启动
```bash
cd frontend
flutter run -d chrome
```

## 配置说明

**重要：所有API密钥将与用户账户绑定，每个用户只能使用自己设置的API密钥。系统不会使用任何全局或默认的API密钥。**

用户可在账户设置界面配置以下API密钥：
- OpenAI API Key
- 高德地图API Key
- 科大讯飞语音识别API Key
- 智谱GLM搜索API Key

API密钥为空时相关服务不可用，但不影响其他服务的使用。

## 许可证

[待添加]