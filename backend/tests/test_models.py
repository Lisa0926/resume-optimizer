"""
测试数据库模型
"""
import pytest
from sqlalchemy import select
from models import Resume, Tag


class TestModels:
    """模型测试类"""

    @pytest.mark.asyncio
    async def test_create_tag(self, test_db):
        """测试创建标签"""
        tag = Tag(name="Python")
        test_db.add(tag)
        await test_db.commit()
        await test_db.refresh(tag)

        result = await test_db.execute(select(Tag).where(Tag.name == "Python"))
        found_tag = result.scalar_one_or_none()

        assert found_tag is not None
        assert found_tag.name == "Python"

    @pytest.mark.asyncio
    async def test_create_resume(self, test_db):
        """测试创建简历"""
        resume = Resume(
            file_name="resume.pdf",
            file_path="/tmp/resume.pdf",
            file_type="pdf",
            content_text="John Doe - Python Developer"
        )
        test_db.add(resume)
        await test_db.commit()
        await test_db.refresh(resume)

        result = await test_db.execute(
            select(Resume).where(Resume.file_name == "resume.pdf")
        )
        found_resume = result.scalar_one_or_none()

        assert found_resume is not None
        assert found_resume.file_name == "resume.pdf"

    @pytest.mark.asyncio
    async def test_tag_repr(self, test_db):
        """测试标签字符串表示"""
        tag = Tag(name="Test")
        test_db.add(tag)
        await test_db.commit()

        assert "Test" in str(tag)

    @pytest.mark.asyncio
    async def test_resume_repr(self, test_db):
        """测试简历字符串表示"""
        resume = Resume(
            file_name="test.pdf",
            file_path="/tmp/test.pdf",
            file_type="pdf",
            content_text="Test"
        )
        test_db.add(resume)
        await test_db.commit()

        assert "test.pdf" in str(resume)
