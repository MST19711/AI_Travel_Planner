#!/bin/bash

# 启动脚本 - AI旅行规划师容器启动脚本

echo "🚀 启动AI旅行规划师服务..."

# 检查并创建数据库
if [ ! -f "/app/data/app.db" ]; then
    echo "📁 创建数据库文件..."
    mkdir -p /app/data
    # 初始化数据库
    cd /app
    python create_tables.py
fi

# 启动后端服务（后台运行）
echo "🔧 启动FastAPI后端服务..."
cd /app
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 检查后端服务是否正常
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败，请检查日志"
    exit 1
fi

# 启动Nginx服务（前台运行）
echo "🌐 启动Nginx服务..."
nginx -g "daemon off;"