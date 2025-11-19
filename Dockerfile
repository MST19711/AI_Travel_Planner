# 多阶段构建Dockerfile - AI旅行规划师

# 设置构建时代理
ARG HTTP_PROXY=http://192.168.5.2:7890
ARG HTTPS_PROXY=http://192.168.5.2:7890

# 第一阶段：前端构建
FROM node:18-alpine AS frontend-builder

# 设置构建时代理
ENV HTTP_PROXY=http://192.168.5.2:7890
ENV HTTPS_PROXY=http://192.168.5.2:7890

WORKDIR /app/frontend

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制前端依赖文件
COPY frontend/package.json frontend/package-lock.json* ./

# 安装依赖
RUN npm ci --only=production

# 安装Linux兼容的esbuild
RUN npm install --save-dev @esbuild/linux-arm64

# 复制前端源代码
COPY frontend/ ./

# 设置生产环境变量
ENV VITE_API_BASE_URL=/api
ENV VITE_BASE_PATH=/
ENV VITE_APP_NAME=AI旅行规划师
ENV VITE_DEBUG=false

# 构建前端（使用生产模式）
RUN npm run build:prod

# 第二阶段：后端构建
FROM python:3.12-slim AS backend-builder

# 设置构建时代理
ENV HTTP_PROXY=http://192.168.5.2:7890
ENV HTTPS_PROXY=http://192.168.5.2:7890

WORKDIR /app

# 设置pip镜像源
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 安装系统依赖（临时禁用代理）
RUN NO_PROXY=* apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 安装uv包管理器
RUN pip install uv

# 复制后端依赖配置
COPY backend/pyproject.toml backend/uv.lock ./

# 创建虚拟环境并安装依赖
RUN uv venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
RUN uv pip install -r pyproject.toml

# 复制后端应用代码
COPY backend/app ./app

# 第三阶段：生产镜像
FROM python:3.12-slim

WORKDIR /app

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 复制Python虚拟环境
COPY --from=backend-builder /app/venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# 复制构建好的前端文件
COPY --from=frontend-builder /app/frontend/dist /var/www/html

# 复制后端应用代码（不包括数据库文件）
COPY --from=backend-builder /app/app ./app

# 复制数据库初始化脚本
COPY backend/create_tables.py ./create_tables.py

# 确保不包含任何开发环境的数据库文件
RUN rm -f /app/app.db /app/data/app.db /app/backend/app.db 2>/dev/null || true

# 复制Nginx配置
COPY nginx.conf /etc/nginx/sites-available/default

# 复制启动脚本
COPY start.sh .

# 创建必要的目录和设置权限
RUN mkdir -p /app/data \
    && chmod +x start.sh \
    && chown -R www-data:www-data /var/www/html \
    && chown -R www-data:www-data /app/data

# 设置环境变量
ENV PYTHONPATH=/app
ENV DATABASE_URL=sqlite:////app/data/app.db
ENV SECRET_KEY=your-production-secret-key-change-this
ENV ALGORITHM=HS256
ENV ACCESS_TOKEN_EXPIRE_MINUTES=30
ENV DEBUG=False
ENV ENVIRONMENT=production

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# 启动服务
CMD ["./start.sh"]