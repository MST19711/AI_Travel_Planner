# AI旅行规划师 - 容器化部署指南

本文档详细说明如何使用Docker容器化部署AI旅行规划师应用。

## 目录
- [快速开始](#快速开始)
- [使用预构建镜像](#使用预构建镜像)
- [从源码构建](#从源码构建)
- [服务架构](#服务架构)
- [数据持久化](#数据持久化)
- [故障排除](#故障排除)

## 快速开始

### 方式一：使用预构建镜像（推荐）

如果您获得了预构建的Docker镜像文件，这是最快的部署方式：

```bash
# 1. 加载Docker镜像
docker load < ai-travel-planner-docker-image.tar.gz

# 2. 验证镜像加载成功
docker images | grep ai-travel-planner

# 3. 创建并启动容器
docker run -d \
  -p 8080:80 \
  -v ai_travel_data:/app/data \
  --name ai-travel-planner \
  --restart unless-stopped \
  aipt-ai-travel-planner:latest

# 4. 查看容器状态
docker ps | grep ai-travel-planner

# 5. 查看启动日志
docker logs -f ai-travel-planner
```

服务将在 http://localhost:8080 启动

### 方式二：使用docker-compose（推荐用于开发）

```bash
# 给脚本添加执行权限（仅需一次）
chmod +x run.sh

# 一键启动
./run.sh
```

服务将在 http://localhost:8080 启动

### 手动启动

```bash
# 1. 复制环境配置文件
cp .env.example .env

# 2. 构建并启动服务
docker-compose up -d

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

## 使用预构建镜像

### 镜像说明

预构建镜像包含：
- 完整的前端构建产物（React + TypeScript + Vite）
- 后端服务（FastAPI + Python 3.12）
- Nginx Web服务器
- 所有必需的依赖和配置

镜像大小：约70MB（压缩后）

### 导入镜像

```bash
# 从压缩文件导入
docker load < ai-travel-planner-docker-image.tar.gz

# 或使用gunzip
gunzip -c ai-travel-planner-docker-image.tar.gz | docker load

# 验证导入成功
docker images aipt-ai-travel-planner:latest
```

### 运行容器

#### 基础运行
```bash
docker run -d \
  -p 8080:80 \
  -v ai_travel_data:/app/data \
  --name ai-travel-planner \
  aipt-ai-travel-planner:latest
```

#### 完整配置运行
```bash
docker run -d \
  -p 8080:80 \
  -v ai_travel_data:/app/data \
  -e SECRET_KEY=your-production-secret-key \
  -e ACCESS_TOKEN_EXPIRE_MINUTES=1440 \
  --name ai-travel-planner \
  --restart unless-stopped \
  --health-cmd="curl -f http://localhost/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  aipt-ai-travel-planner:latest
```

### 访问应用

- **前端界面**: http://localhost:8080
- **API文档**: http://localhost:8080/docs
- **健康检查**: http://localhost:8080/health

## 从源码构建

### 使用docker-compose构建

```bash
# 1. 克隆项目
git clone <repository-url>
cd AIPT

# 2. 构建并启动
docker-compose build
docker-compose up -d

# 3. 查看服务状态
docker-compose ps
```

### 手动构建镜像

```bash
# 构建镜像
docker build -t ai-travel-planner:latest .

# 运行容器
docker run -d \
  -p 8080:80 \
  -v ai_travel_data:/app/data \
  --name ai-travel-planner \
  ai-travel-planner:latest
```

### 导出镜像

```bash
# 导出并压缩镜像
docker save aipt-ai-travel-planner:latest | gzip > ai-travel-planner-docker-image.tar.gz

# 查看文件大小
ls -lh ai-travel-planner-docker-image.tar.gz
```

## 服务架构

### 容器内服务

- **Nginx (端口80)**:
  - 静态文件服务（前端）
  - API反向代理
  - WebSocket代理支持
- **FastAPI (端口8000)**:
  - RESTful API服务
  - WebSocket服务（语音识别）
- **SQLite数据库**:
  - 数据持久化存储
  - 存储在Docker卷中

### 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Python 3.12 + FastAPI + SQLAlchemy
- **数据库**: SQLite（生产环境建议使用PostgreSQL）
- **Web服务器**: Nginx 1.x
- **容器**: Docker + Docker Compose

### 端口映射

| 服务 | 容器内端口 | 主机端口 | 说明 |
|------|-----------|---------|------|
| Nginx | 80 | 8080 | HTTP服务 |
| FastAPI | 8000 | - | 内部服务 |

### WebSocket支持

容器已配置Nginx WebSocket代理，支持：
- 科大讯飞语音识别服务
- 实时通信功能
- 长连接保持（86400秒）

Nginx配置示例：
```nginx
location /api/ {
    proxy_pass http://localhost:8000/api/;
    
    # WebSocket支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

## 环境配置

### 必需的环境变量

```bash
# 复制并修改.env文件
cp .env.example .env

# 主要配置项
SECRET_KEY=your-very-secure-production-secret-key-change-this
DATABASE_URL=sqlite:////app/data/app.db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEBUG=False
ENVIRONMENT=production
```

### 可选配置

```bash
# API服务端点（用户在前端界面配置）
# OPENAI_BASE_URL=https://api.deepseek.com
# OPENAI_MODEL=deepseek-chat
# GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
# XUNFEI_WS_URL=wss://iat-api.xfyun.cn/v2/iat
# AMAP_BASE_URL=https://restapi.amap.com/v3
```

## 管理命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 容器管理

```bash
# 进入容器
docker exec -it ai-travel-planner bash

# 查看容器资源使用
docker stats ai-travel-planner

# 备份数据
docker cp ai-travel-planner:/app/data ./backup/
```

### 开发模式

```bash
# 前端开发
cd frontend && npm run dev

# 后端开发
cd backend && python -m uvicorn app.main:app --reload
```

## 数据持久化

### 数据卷说明

应用使用Docker命名卷确保数据安全：

| 卷名 | 挂载点 | 用途 |
|------|--------|------|
| `ai_travel_data` | `/app/data` | SQLite数据库文件 |

### 数据卷位置

- Docker Desktop (Mac/Windows): 通过Docker管理
- Linux: `/var/lib/docker/volumes/aipt_ai_travel_data/_data`

### 查看数据

```bash
# 查看数据卷列表
docker volume ls | grep ai_travel

# 查看数据卷详情
docker volume inspect aipt_ai_travel_data

# 进入容器查看数据
docker exec -it ai-travel-planner ls -lh /app/data
```

### 备份数据

```bash
# 备份数据库
docker run --rm -v ai-travel-planner_ai_travel_data:/source -v $(pwd):/backup alpine \
  tar czf /backup/ai-travel-data-$(date +%Y%m%d).tar.gz -C /source .
```

### 恢复数据

```bash
# 恢复数据库
docker run --rm -v ai-travel-planner_ai_travel_data:/target -v $(pwd):/backup alpine \
  tar xzf /backup/ai-travel-data-YYYYMMDD.tar.gz -C /target
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 修改docker-compose.yml中的端口映射
   ports:
     - "8081:80"  # 改为其他端口
   ```

2. **构建失败**
   ```bash
   # 清理缓存重新构建
   docker-compose build --no-cache
   ```

3. **服务无法访问**
   ```bash
   # 检查服务状态
   docker-compose ps
   docker-compose logs ai-travel-planner
   ```

4. **数据库问题**
   ```bash
   # 重置数据库（会丢失所有数据）
   docker-compose down -v
   docker-compose up -d
   ```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs ai-travel-planner
```

## 生产环境部署

### 安全建议

1. **修改默认密钥**
   ```bash
   # 生成安全的SECRET_KEY
   openssl rand -hex 32
   
   # 在docker run时指定
   docker run -d \
     -e SECRET_KEY=$(openssl rand -hex 32) \
     ...
   ```

2. **使用HTTPS**
   - 使用Nginx反向代理配置SSL
   - 推荐使用Let's Encrypt免费证书
   - 启用HTTP到HTTPS重定向

3. **数据库安全**
   - 生产环境建议使用PostgreSQL
   - 定期备份数据库
   - 限制数据库访问权限

4. **网络安全**
   - 使用防火墙限制端口访问
   - 配置CORS策略
   - 启用请求速率限制

### 环境变量配置

生产环境推荐的环境变量：

```bash
docker run -d \
  -p 8080:80 \
  -v ai_travel_data:/app/data \
  -e SECRET_KEY=your-very-secure-production-secret-key \
  -e ACCESS_TOKEN_EXPIRE_MINUTES=1440 \
  -e DEBUG=False \
  -e ENVIRONMENT=production \
  --name ai-travel-planner \
  --restart unless-stopped \
  aipt-ai-travel-planner:latest
```

### 性能优化

1. **资源限制**
   ```yaml
   # 在docker-compose.yml中添加
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '1.0'
   ```

2. **数据库优化**
   - 考虑使用PostgreSQL替代SQLite
   - 配置数据库连接池

## 更新部署

### 使用新镜像更新

```bash
# 1. 停止并删除旧容器（保留数据）
docker stop ai-travel-planner
docker rm ai-travel-planner

# 2. 加载新镜像
docker load < ai-travel-planner-docker-image-new.tar.gz

# 3. 启动新容器（使用相同的数据卷）
docker run -d \
  -p 8080:80 \
  -v ai_travel_data:/app/data \
  --name ai-travel-planner \
  --restart unless-stopped \
  aipt-ai-travel-planner:latest
```

### 从源码更新

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 零停机更新（高级）

```bash
# 1. 启动新版本容器（使用不同端口）
docker run -d \
  -p 8081:80 \
  -v ai_travel_data:/app/data \
  --name ai-travel-planner-new \
  aipt-ai-travel-planner:latest

# 2. 验证新容器正常运行
curl http://localhost:8081/health

# 3. 切换流量（修改负载均衡器或反向代理配置）

# 4. 停止旧容器
docker stop ai-travel-planner
docker rm ai-travel-planner

# 5. 重命名新容器
docker rename ai-travel-planner-new ai-travel-planner
```

### 回滚版本

```bash
# 回滚到特定版本
git checkout <commit-hash>

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 监控和维护

### 健康检查

容器内置健康检查机制：

```bash
# 查看容器健康状态
docker inspect ai-travel-planner --format='{{.State.Health.Status}}'

# 手动执行健康检查
curl http://localhost:8080/health
```

### 日志管理

```bash
# 查看实时日志
docker logs -f ai-travel-planner

# 查看最近100行日志
docker logs --tail 100 ai-travel-planner

# 查看特定时间的日志
docker logs --since 2024-01-01T00:00:00 ai-travel-planner
```

### 资源监控

```bash
# 查看容器资源使用
docker stats ai-travel-planner

# 查看容器详细信息
docker inspect ai-travel-planner
```

## 技术支持

如果遇到问题，请：

1. **查看日志**
   ```bash
   docker logs ai-travel-planner
   docker-compose logs
   ```

2. **检查服务状态**
   ```bash
   docker ps
   docker-compose ps
   curl http://localhost:8080/health
   ```

3. **查看系统资源**
   ```bash
   docker stats
   df -h
   ```

4. **提交Issue**
   - 提供错误日志
   - 说明部署环境
   - 描述复现步骤

## 附录

### 常用命令速查

```bash
# 容器管理
docker ps                           # 查看运行中的容器
docker ps -a                        # 查看所有容器
docker logs <container>             # 查看容器日志
docker exec -it <container> bash    # 进入容器
docker stop <container>             # 停止容器
docker start <container>            # 启动容器
docker restart <container>          # 重启容器
docker rm <container>               # 删除容器

# 镜像管理
docker images                       # 查看镜像列表
docker rmi <image>                  # 删除镜像
docker save <image> > file.tar      # 导出镜像
docker load < file.tar              # 导入镜像

# 数据卷管理
docker volume ls                    # 查看数据卷列表
docker volume inspect <volume>      # 查看数据卷详情
docker volume rm <volume>           # 删除数据卷
```

### 配置文件位置

| 文件 | 容器内路径 | 说明 |
|------|-----------|------|
| Nginx配置 | `/etc/nginx/sites-available/default` | Web服务器配置 |
| 数据库 | `/app/data/app.db` | SQLite数据库文件 |
| 后端代码 | `/app/app/` | FastAPI应用代码 |
| 前端文件 | `/var/www/html/` | React构建产物 |

---

**最后更新**: 2024-11-19
**版本**: 1.0.0