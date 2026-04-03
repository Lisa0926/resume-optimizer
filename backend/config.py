"""
应用配置管理
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os

# 获取 backend 目录路径
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


class Settings(BaseSettings):
    """应用配置"""

    model_config = SettingsConfigDict(extra='allow', env_file=os.path.join(BACKEND_DIR, ".env"), env_file_encoding='utf-8')

    # 应用基础配置
    app_name: str = "智能简历优化器"
    debug: bool = True

    # 服务配置
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # 数据库配置 - WSL 环境下使用绝对路径
    db_path: str = os.path.join(
        os.path.dirname(BACKEND_DIR),
        "data",
        "resume_optimizer.db"
    )
    database_url: str = f"sqlite+aiosqlite:///{db_path}"

    # 文件上传配置
    upload_dir: str = os.path.join(
        os.path.dirname(BACKEND_DIR),
        "uploads"
    )
    max_upload_size: int = 10 * 1024 * 1024  # 10MB

    # 阿里云百炼 API 配置
    dashscope_api_key: str = ""  # 从环境变量获取
    dashscope_model: str = "qwen-max"

    # CORS 配置
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


@lru_cache
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
