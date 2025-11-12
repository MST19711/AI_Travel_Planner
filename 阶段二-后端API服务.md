# 阶段二：后端API服务

## 目标
实现Python FastAPI后端服务，提供用户认证和行程管理API。

## 主要任务
- 用户注册登录系统
- API密钥配置管理
- 行程CRUD操作
- 数据库模型设计
- 基础认证中间件

## 核心API端点
- POST /auth/register - 用户注册
- POST /auth/login - 用户登录
- PUT /user/api-keys - 更新API密钥
- GET /trips - 获取行程列表
- POST /trips - 创建行程
- PUT /trips/{id} - 更新行程

## 数据库设计
- users表：用户信息、API密钥
- trips表：行程基本信息
- activities表：子行程信息

## 技术要点
- FastAPI框架
- SQLAlchemy ORM
- JWT认证
- API密钥由用户提供