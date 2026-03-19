"""
Pydantic 请求/响应模型
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


# ==================== 标签相关 ====================

class TagBase(BaseModel):
    """标签基础模型"""
    name: str = Field(..., min_length=1, max_length=50, description="标签名称")


class TagCreate(TagBase):
    """创建标签请求"""
    pass


class TagResponse(TagBase):
    """标签响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ==================== 简历相关 ====================

class ResumeBase(BaseModel):
    """简历基础模型"""
    file_name: str = Field(..., max_length=255)
    file_type: str = Field(..., max_length=50)
    content_text: Optional[str] = None


class ResumeCreate(ResumeBase):
    """创建简历请求 (内部使用)"""
    file_path: str


class ResumeUpdate(BaseModel):
    """更新简历请求"""
    tags: Optional[list[str]] = None


class ResumeResponse(ResumeBase):
    """简历响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_path: str
    tags: list[TagResponse] = []
    created_at: datetime
    updated_at: datetime


class ResumeListResponse(BaseModel):
    """简历列表响应"""
    items: list[ResumeResponse]
    total: int


# ==================== 优化记录相关 ====================

class OptimizationRecordBase(BaseModel):
    """优化记录基础模型"""
    job_description: str
    original_content: str
    optimized_content: str


class OptimizationRecordCreate(OptimizationRecordBase):
    """创建优化记录请求"""
    resume_id: int
    conversation_history: Optional[str] = None


class OptimizationRecordResponse(OptimizationRecordBase):
    """优化记录响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int
    conversation_history: Optional[str] = None
    created_at: datetime


# ==================== LLM 优化相关 ====================

class OptimizeRequest(BaseModel):
    """优化请求"""
    resume_id: int
    job_description: str = Field(..., min_length=1, description="职位描述或输入内容")
    conversation_history: Optional[list[dict]] = None
    prompt: Optional[str] = Field(None, description="自定义 Prompt 模板")
    mode: str = Field(default="optimize", description="优化模式：optimize=智能优化，match=匹配优化，translate=翻译")


class OptimizeResponse(BaseModel):
    """优化响应"""
    optimized_content: str
    conversation_history: list[dict]


# ==================== 通用响应 ====================

class MessageResponse(BaseModel):
    """通用消息响应"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """错误响应"""
    detail: str
    success: bool = False
