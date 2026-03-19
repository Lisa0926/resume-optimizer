"""
标签管理路由
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from database import get_db
from models import Tag, Resume
from schemas import TagResponse, TagCreate, MessageResponse
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/tags", tags=["标签管理"])


@router.post("", response_model=TagResponse)
async def create_tag(
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建新标签"""
    # 检查是否已存在
    result = await db.execute(
        select(Tag).where(Tag.name == tag_data.name)
    )
    existing_tag = result.scalar_one_or_none()

    if existing_tag:
        raise HTTPException(status_code=400, detail="标签已存在")

    tag = Tag(name=tag_data.name)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return TagResponse.model_validate(tag)


@router.get("", response_model=list[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    """获取所有标签"""
    result = await db.execute(
        select(Tag)
        .options(selectinload(Tag.resumes))
        .order_by(Tag.name)
    )
    tags = result.scalars().all()
    return [TagResponse.model_validate(t) for t in tags]


@router.delete("/{tag_id}", response_model=MessageResponse)
async def delete_tag(tag_id: int, db: AsyncSession = Depends(get_db)):
    """删除标签"""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")

    await db.delete(tag)
    await db.commit()

    return MessageResponse(message="删除成功")


@router.get("/{tag_id}/resumes", response_model=list)
async def get_tag_resumes(tag_id: int, db: AsyncSession = Depends(get_db)):
    """获取标签关联的所有简历"""
    result = await db.execute(
        select(Tag)
        .options(selectinload(Tag.resumes))
        .where(Tag.id == tag_id)
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")

    return tag.resumes
