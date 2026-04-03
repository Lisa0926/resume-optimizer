"""
测试文件解析器
"""
import pytest
from utils.file_parser import FileParser


class TestFileParser:
    """文件解析器测试类"""

    def test_is_supported_pdf(self):
        """测试 PDF 文件类型检测"""
        assert FileParser.is_supported("test.pdf") is True
        assert FileParser.is_supported("TEST.PDF") is True

    def test_is_supported_docx(self):
        """测试 DOCX 文件类型检测"""
        assert FileParser.is_supported("test.docx") is True
        assert FileParser.is_supported("TEST.DOCX") is True

    def test_is_supported_md(self):
        """测试 Markdown 文件类型检测"""
        assert FileParser.is_supported("test.md") is True
        assert FileParser.is_supported("TEST.MD") is True

    def test_is_supported_unsupported(self):
        """测试不支持的文件类型"""
        assert FileParser.is_supported("test.txt") is True  # txt 是支持的
        assert FileParser.is_supported("test.jpg") is False
        assert FileParser.is_supported("test.png") is False

    def test_get_supported_extensions(self):
        """测试获取支持的文件扩展名"""
        extensions = FileParser.get_supported_extensions()
        assert isinstance(extensions, list)
        assert len(extensions) > 0
