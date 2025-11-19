# 前端部署说明

## 环境配置

### 环境变量
复制 `.env.example` 为 `.env` 并根据部署环境修改：

```bash
# 开发环境
cp .env.example .env

# 生产环境
cp .env.example .env.production
```

### 环境变量说明
- `VITE_API_BASE_URL`: API基础URL，部署时设置为 `/api` 通过nginx代理
- `VITE_BASE_PATH`: 部署基础路径，用于子路径部署（如 `/app/`）
- `VITE_APP_NAME`: 应用名称
- `VITE_DEV_SERVER_PORT`: 开发服务器端口
- `VITE_DEBUG`: 是否启用调试模式

## 构建和部署

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
# 标准构建
npm run build

# 生产环境构建
npm run build:prod
```

### 预览构建结果
```bash
# 标准预览
npm run preview

# 生产环境预览
npm run preview:prod

# 网络可访问预览
npm run serve
```

## 部署配置

### 单域名部署
当应用部署在根路径时：
- `VITE_BASE_PATH=/`
- `VITE_API_BASE_URL=/api`

### 子路径部署
当应用部署在子路径时（如 `/app/`）：
- `VITE_BASE_PATH=/app/`
- `VITE_API_BASE_URL=/api`

### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 路由配置

### 路由常量
所有路由路径统一在 `src/config/routes.ts` 中管理：
- `ROUTES`: 路由路径常量
- `NAV_ROUTES`: 导航路径常量
- `routeBuilder`: 路由生成器函数

### 使用示例
```typescript
// 使用路由常量
import { ROUTES, NAV_ROUTES } from './config/routes'

// 导航到设置页面
navigate(NAV_ROUTES.SETTINGS)

// 生成动态路由
const tripDetailRoute = routeBuilder.tripDetail(tripId)
```

## 注意事项

1. **API密钥管理**: API密钥由用户在设置页面配置，不在环境变量中设置
2. **相对路径**: 所有API调用使用相对路径，通过nginx代理到后端服务
3. **路由兼容**: 支持HTML5 History模式，确保服务器配置正确
4. **环境区分**: 使用不同的环境变量文件区分开发和生产环境

## 故障排除

### 路由404问题
确保服务器配置了SPA回退：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### API调用失败
检查nginx代理配置是否正确，确保 `/api` 路径正确代理到后端服务。

### 静态资源加载失败
检查 `VITE_BASE_PATH` 配置是否与部署路径一致。