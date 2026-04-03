"""
Pytest 配置文件
"""
import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from models import Resume, Tag

# 使用内存数据库进行测试
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# 配置 pytest-asyncio 插件
pytest_plugins = ('pytest_asyncio',)


@pytest.fixture(scope="function")
async def test_engine():
    """创建测试数据库引擎"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
async def test_db(test_engine):
    """创建测试数据库会话"""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session


@pytest.fixture
async def sample_tag(test_db):
    """创建示例标签"""
    tag = Tag(name="测试标签")
    test_db.add(tag)
    await test_db.commit()
    await test_db.refresh(tag)
    yield tag


@pytest.fixture
async def sample_resume(test_db):
    """创建示例简历"""
    resume = Resume(
        file_name="test.pdf",
        file_path="/tmp/test.pdf",
        file_type="pdf",
        content_text="测试简历内容"
    )
    test_db.add(resume)
    await test_db.commit()
    await test_db.refresh(resume)
    yield resume
