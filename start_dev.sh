#!/bin/bash

# AI旅行规划师开发环境启动脚本

echo "🚀 启动AI旅行规划师开发环境..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python 3.9+"
    exit 1
fi

# 检查uv是否安装
if ! command -v uv &> /dev/null; then
    echo "📦 安装uv包管理器..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source ~/.bashrc
fi

# 检查Flutter环境
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter未安装，请先安装Flutter 3.0+"
    echo "参考: https://flutter.dev/docs/get-started/install"
    exit 1
fi

# 检查Flutter Web支持
if ! flutter devices | grep -q "chrome"; then
    echo "🌐 启用Flutter Web支持..."
    flutter config --enable-web
fi

echo "✅ 环境检查通过"

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend
if [ ! -f .env ]; then
    echo "📝 创建后端环境配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 backend/.env 文件配置数据库和密钥"
fi

echo "📦 安装Python依赖..."
uv sync

echo "🚀 启动FastAPI服务器..."
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd ..

# 启动前端服务
echo "🎨 启动前端服务..."
cd frontend

echo "📦 获取Flutter依赖..."
flutter pub get

echo "🚀 启动Flutter Web开发服务器..."
flutter run -d chrome &
FRONTEND_PID=$!

cd ..

echo ""
echo "🎉 开发环境启动完成！"
echo "📱 前端: http://localhost:8080"
echo "🔧 后端: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo ""; echo "🛑 停止服务..."; kill $BACKEND_PID $FRONTEND_PID; exit 0' INT
wait