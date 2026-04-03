"""
路由模块
"""
from .resumes import router as resumes_router
from .tags import router as tags_router
from .optimizations import router as optimizations_router
from .ocr import router as ocr_router
from .ats import router as ats_router
from .url_fetch import router as url_fetch_router

__all__ = [
    "resumes_router",
    "tags_router",
    "optimizations_router",
    "ocr_router",
    "ats_router",
    "url_fetch_router"
]
