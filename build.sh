#!/bin/bash

# AI旅行规划师Docker构建脚本

echo "🏗️ 开始构建AI旅行规划师Docker镜像..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 构建镜像
docker build -t ai-travel-planner:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功"
    echo ""
    echo "🎯 运行方法："
    echo "1. 使用docker-compose（推荐）："
    echo "   docker-compose up -d"
    echo ""
    echo "2. 直接运行容器："
    echo "   docker run -d -p 8080:80 --name ai-travel-planner ai-travel-planner:latest"
    echo ""
    echo "📱 访问地址：http://localhost:8080"
else
    echo "❌ Docker镜像构建失败"
    exit 1
fi