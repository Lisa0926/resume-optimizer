"""
测试 API 路由
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db
from models import Resume, Tag


def create_test_client(test_db):
    """创建测试客户端的辅助函数"""
    def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    return client


def cleanup_client():
    """清理客户端依赖"""
    app.dependency_overrides.clear()


class TestResumesRouter:
    """简历路由测试"""

    @pytest.mark.asyncio
    async def test_list_resumes_empty(self, test_db, monkeypatch):
        """测试空列表"""
        client = create_test_client(test_db)

        response = client.get("/api/resumes")

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

        cleanup_client()

    @pytest.mark.asyncio
    async def test_list_tags_empty(self, test_db, monkeypatch):
        """测试空标签列表"""
        client = create_test_client(test_db)

        response = client.get("/api/tags")

        assert response.status_code == 200
        assert response.json() == []

        cleanup_client()


class TestTagsRouter:
    """标签路由测试"""

    @pytest.mark.asyncio
    async def test_create_tag(self, test_db, monkeypatch):
        """测试创建标签"""
        client = create_test_client(test_db)

        response = client.post(
            "/api/tags",
            json={"name": "新标签"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "新标签"

        cleanup_client()

    @pytest.mark.asyncio
    async def test_create_duplicate_tag(self, test_db, sample_tag, monkeypatch):
        """测试创建重复标签"""
        client = create_test_client(test_db)

        response = client.post(
            "/api/tags",
            json={"name": sample_tag.name}
        )

        assert response.status_code == 400

        cleanup_client()
