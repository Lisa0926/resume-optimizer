"""
智能优化路由
"""
import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Resume, OptimizationRecord
from schemas import (
    OptimizeRequest,
    OptimizeResponse,
    OptimizationRecordResponse,
    MessageResponse,
)
from utils.llm_client import LLMClient
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/optimizations", tags=["智能优化"])


@router.post("", response_model=OptimizeResponse)
async def optimize_resume(
    request: OptimizeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    优化简历
    """
    # 获取简历
    result = await db.execute(
        select(Resume).where(Resume.id == request.resume_id)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    if not resume.content_text:
        raise HTTPException(status_code=400, detail="简历内容为空，无法优化")

    # 检查 API Key
    api_key = settings.dashscope_api_key or os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="未配置阿里云百炼 API Key，请在.env 文件中设置 DASHSCOPE_API_KEY"
        )

    # 调用 LLM 优化
    client = LLMClient(api_key=api_key, model=settings.dashscope_model)

    try:
        optimized_content, conversation_history = await client.optimize_resume(
            resume_content=resume.content_text,
            job_description=request.job_description,
            conversation_history=request.conversation_history,
            prompt_template=request.prompt,
            mode=request.mode
        )

        return OptimizeResponse(
            optimized_content=optimized_content,
            conversation_history=conversation_history
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"优化失败：{str(e)}")


@router.post("/save", response_model=MessageResponse)
async def save_optimization(
    resume_id: int,
    job_description: str,
    original_content: str,
    optimized_content: str,
    conversation_history: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    """保存优化记录"""
    record = OptimizationRecord(
        resume_id=resume_id,
        job_description=job_description,
        original_content=original_content,
        optimized_content=optimized_content,
        conversation_history=conversation_history
    )

    db.add(record)
    await db.commit()

    return MessageResponse(message="优化记录已保存")


@router.get("/records/{resume_id}", response_model=list[OptimizationRecordResponse])
async def get_optimization_records(
    resume_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取简历的优化历史"""
    result = await db.execute(
        select(OptimizationRecord)
        .where(OptimizationRecord.resume_id == resume_id)
        .order_by(OptimizationRecord.created_at.desc())
    )
    records = result.scalars().all()

    return [OptimizationRecordResponse.model_validate(r) for r in records]
