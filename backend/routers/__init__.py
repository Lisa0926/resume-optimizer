"""
路由模块
"""
from .resumes import router as resumes_router
from .tags import router as tags_router
from .optimizations import router as optimizations_router

__all__ = ["resumes_router", "tags_router", "optimizations_router"]
