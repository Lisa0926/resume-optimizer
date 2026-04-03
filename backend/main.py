"""
智能简历优化器 - FastAPI 后端入口
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings

# 获取配置
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 确保上传目录存在
    os.makedirs(settings.upload_dir, exist_ok=True)

    print(f"✓ 应用启动：http://{settings.backend_host}:{settings.backend_port}")
    print(f"✓ 数据库路径：{settings.db_path}")
    print(f"✓ 上传目录：{settings.upload_dir}")

    yield

    # 关闭时执行（清理资源）
    print("✓ 应用关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.app_name,
    description="智能简历优化器 - 基于 AI 的简历优化和管理工作",
    version="1.0.0",
    lifespan=lifespan,
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
from routers import resumes_router, tags_router, optimizations_router, ocr_router, ats_router, url_fetch_router

app.include_router(resumes_router)
app.include_router(tags_router)
app.include_router(optimizations_router)
app.include_router(ocr_router)
app.include_router(ats_router)
app.include_router(url_fetch_router)


@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "智能简历优化器 API",
        "docs": "/docs",
        "health": "/api/health"
    }
