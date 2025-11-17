from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# 导入路由
from .routers import auth, users, trips

# 加载环境变量
load_dotenv()

# 创建FastAPI应用
app = FastAPI(
    title="AI旅行规划师API",
    description="基于AI的智能旅行规划服务后端API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由（添加/api前缀）
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(trips.router, prefix="/api")

@app.get("/")
async def root():
    """API根路径"""
    return {
        "message": "AI旅行规划师API服务",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )