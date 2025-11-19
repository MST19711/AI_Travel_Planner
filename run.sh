#!/bin/bash

# AI旅行规划师一键启动脚本

set -e  # 遇到错误立即退出

echo "🎯 AI旅行规划师一键启动脚本"
echo "================================"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境配置文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，使用默认配置"
    echo "📝 如需自定义配置，请复制.env.example为.env并修改"
    cp .env.example .env 2>/dev/null || echo "使用默认环境变量"
fi

# 构建并启动服务
echo "🔨 构建Docker镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "🎉 AI旅行规划师已成功启动"
    echo "📱 访问地址: http://localhost:8080"
    echo "📚 API文档: http://localhost:8080/docs"
    echo "🔧 管理界面: http://localhost:8080/settings"
    echo ""
    echo "💡 使用说明:"
    echo "   - 首次使用请注册账号"
    echo "   - 在设置页面配置您的API密钥"
    echo "   - 开始规划您的旅行吧！"
    echo ""
    echo "🛑 停止服务: docker-compose down"
    echo "📊 查看日志: docker-compose logs -f"
else
    echo "❌ 服务启动失败，请检查日志: docker-compose logs"
    exit 1
fi