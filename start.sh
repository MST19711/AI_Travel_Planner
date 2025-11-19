#!/bin/bash

# 启动脚本 - AI旅行规划师容器启动脚本

set -e  # 遇到错误立即退出

echo "🚀 启动AI旅行规划师服务..."

# 检查并创建数据库
if [ ! -f "/app/data/app.db" ]; then
    echo "📁 创建数据库文件..."
    mkdir -p /app/data
    # 初始化数据库
    cd /app
    python create_tables.py
    echo "✅ 数据库初始化完成"
fi

# 检查数据库连接
echo "🔍 检查数据库连接..."
cd /app
python -c "
import os
from app.database import engine
try:
    with engine.connect() as conn:
        print('✅ 数据库连接正常')
except Exception as e:
    print(f'❌ 数据库连接失败: {e}')
    exit(1)
"

# 启动后端服务（后台运行）
echo "🔧 启动FastAPI后端服务..."
cd /app
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 &

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ 后端服务启动成功"
        break
    fi
    echo "等待后端服务启动... ($i/30)"
    sleep 2
done

# 检查后端服务是否正常
if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ 后端服务启动失败，请检查日志"
    exit 1
fi

# 启动Nginx服务（前台运行）
echo "🌐 启动Nginx服务..."
echo "🎉 AI旅行规划师服务已启动完成！"
echo "📱 访问地址: http://localhost:8080"
echo "📚 API文档: http://localhost:8080/docs"
nginx -g "daemon off;"