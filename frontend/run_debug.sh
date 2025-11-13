#!/bin/bash

echo "🚀 启动AI旅行规划师前端Debug版本..."

# 检查是否已构建
if [ ! -d "build/web" ]; then
    echo "❌ 未找到构建文件，请先运行 build_debug.sh"
    exit 1
fi

# 启动开发服务器
echo "🌐 启动开发服务器在端口 8080..."
echo "📱 请在浏览器中访问: http://localhost:8080"
echo "⏹️  按 Ctrl+C 停止服务器"

# 使用Python启动简单的HTTP服务器
cd build/web
python3 -m http.server 8080