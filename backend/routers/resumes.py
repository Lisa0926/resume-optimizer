"""
简历管理路由
"""
import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from database import get_db, init_db
from models import Resume, Tag, resume_tags
from schemas import (
    ResumeResponse,
    ResumeListResponse,
    ResumeUpdate,
    TagResponse,
    MessageResponse,
    ErrorResponse,
)
from utils.file_parser import FileParser
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/resumes", tags=["简历管理"])


@router.on_event("startup")
async def startup():
    """启动时初始化数据库"""
    await init_db()
    # 确保上传目录存在
    os.makedirs(settings.upload_dir, exist_ok=True)


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    上传简历文件
    """
    # 检查文件类型
    if not FileParser.is_supported(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型，支持的类型：{FileParser.get_supported_extensions()}"
        )

    # 生成唯一文件名
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.upload_dir, unique_filename)

    try:
        # 保存文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 解析文件内容
        content_text = await FileParser.parse_file(file_path)

        # 创建数据库记录
        db_resume = Resume(
            file_name=file.filename,
            file_path=file_path,
            file_type=file_ext.lower().lstrip("."),
            content_text=content_text
        )

        db.add(db_resume)
        await db.commit()
        await db.refresh(db_resume)

        return ResumeResponse.model_validate(db_resume)

    except Exception as e:
        await db.rollback()
        # 清理上传文件
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"上传失败：{str(e)}")


@router.get("", response_model=ResumeListResponse)
async def list_resumes(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """获取简历列表"""
    offset = (page - 1) * page_size

    # 查询总数
    count_result = await db.execute(select(func.count()).select_from(Resume))
    total = count_result.scalar()

    # 查询数据
    result = await db.execute(
        select(Resume)
        .options(selectinload(Resume.tags))
        .order_by(Resume.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    resumes = result.scalars().all()

    return ResumeListResponse(
        items=[ResumeResponse.model_validate(r) for r in resumes],
        total=total
    )


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """获取单个简历详情"""
    result = await db.execute(
        select(Resume)
        .options(selectinload(Resume.tags))
        .where(Resume.id == resume_id)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    return ResumeResponse.model_validate(resume)


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: int,
    update_data: ResumeUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新简历（标签）"""
    result = await db.execute(
        select(Resume)
        .options(selectinload(Resume.tags))
        .where(Resume.id == resume_id)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    # 更新标签
    if update_data.tags is not None:
        # 查找或创建标签
        tag_objects = []
        for tag_name in update_data.tags:
            tag_result = await db.execute(
                select(Tag).where(Tag.name == tag_name)
            )
            tag = tag_result.scalar_one_or_none()

            if not tag:
                tag = Tag(name=tag_name)
                db.add(tag)

            tag_objects.append(tag)

        resume.tags = tag_objects

    await db.commit()
    await db.refresh(resume)

    return ResumeResponse.model_validate(resume)


@router.delete("/{resume_id}", response_model=MessageResponse)
async def delete_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """删除简历"""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")

    # 删除文件
    try:
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)
    except Exception as e:
        print(f"删除文件失败：{e}")

    # 删除数据库记录
    await db.delete(resume)
    await db.commit()

    return MessageResponse(message="删除成功")


@router.delete("", response_model=MessageResponse)
async def batch_delete_resumes(
    ids: List[int] = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """批量删除简历"""
    await db.execute(
        delete(Resume).where(Resume.id.in_(ids))
    )
    await db.commit()

    return MessageResponse(message=f"成功删除 {len(ids)} 份简历")


@router.get("/tags/list", response_model=List[TagResponse])
async def list_resume_tags(db: AsyncSession = Depends(get_db)):
    """获取所有简历标签"""
    result = await db.execute(select(Tag).order_by(Tag.name))
    tags = result.scalars().all()
    return [TagResponse.model_validate(t) for t in tags]
