"""
SQLAlchemy 数据模型定义
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from database import Base


# 简历 - 标签 关联表 (多对多)
resume_tags = Table(
    "resume_tags",
    Base.metadata,
    Column("resume_id", Integer, ForeignKey("resumes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Resume(Base):
    """简历模型"""

    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # 文件信息
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # pdf, docx, md, txt

    # 解析内容
    content_text: Mapped[str] = mapped_column(Text, nullable=True)

    # 标签关系 (多对多)
    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        secondary=resume_tags,
        back_populates="resumes",
        lazy="selectin"
    )

    # 优化记录
    optimization_records: Mapped[list["OptimizationRecord"]] = relationship(
        "OptimizationRecord",
        back_populates="resume",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # 时间戳
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self):
        return f"<Resume(id={self.id}, file_name='{self.file_name}')>"

    def __str__(self):
        return f"简历：{self.file_name} ({self.file_type})"


class Tag(Base):
    """标签模型"""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    # 关联简历
    resumes: Mapped[list["Resume"]] = relationship(
        "Resume",
        secondary=resume_tags,
        back_populates="tags"
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}')>"

    def __str__(self):
        return f"标签：{self.name}"


class OptimizationRecord(Base):
    """优化记录模型"""

    __tablename__ = "optimization_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # 外键
    resume_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False
    )

    # 优化输入输出
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    original_content: Mapped[str] = mapped_column(Text, nullable=False)
    optimized_content: Mapped[str] = mapped_column(Text, nullable=False)

    # 对话历史 (JSON 字符串存储)
    conversation_history: Mapped[str] = mapped_column(Text, nullable=True)

    # 时间戳
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # 关联简历
    resume: Mapped["Resume"] = relationship(
        "Resume",
        back_populates="optimization_records"
    )
