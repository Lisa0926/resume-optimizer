"""
文件解析工具 - 支持 PDF, DOCX, MD, TXT 格式
"""
import os
from pathlib import Path
from typing import Optional
from abc import ABC, abstractmethod


class FileParser(ABC):
    """文件解析器"""

    @staticmethod
    async def parse_file(file_path: str) -> Optional[str]:
        """
        根据文件类型解析文件内容

        Args:
            file_path: 文件路径

        Returns:
            解析后的文本内容，解析失败返回 None
        """
        ext = Path(file_path).suffix.lower()

        if ext == ".pdf":
            return FileParser._parse_pdf(file_path)
        elif ext == ".docx":
            return FileParser._parse_docx(file_path)
        elif ext == ".md":
            return FileParser._parse_markdown(file_path)
        elif ext == ".txt":
            return FileParser._parse_txt(file_path)
        else:
            return None

    @staticmethod
    def _parse_pdf(file_path: str) -> Optional[str]:
        """解析 PDF 文件"""
        try:
            from PyPDF2 import PdfReader

            reader = PdfReader(file_path)
            text_content = []

            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)

            return "\n\n".join(text_content)
        except Exception as e:
            print(f"PDF 解析失败 {file_path}: {e}")
            return None

    @staticmethod
    def _parse_docx(file_path: str) -> Optional[str]:
        """解析 DOCX 文件"""
        try:
            from docx import Document

            doc = Document(file_path)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
            return "\n\n".join(paragraphs)
        except Exception as e:
            print(f"DOCX 解析失败 {file_path}: {e}")
            return None

    @staticmethod
    def _parse_markdown(file_path: str) -> Optional[str]:
        """解析 Markdown 文件"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"Markdown 解析失败 {file_path}: {e}")
            return None

    @staticmethod
    def _parse_txt(file_path: str) -> Optional[str]:
        """解析 TXT 文件"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except UnicodeDecodeError:
            # 尝试其他编码
            try:
                with open(file_path, "r", encoding="gbk") as f:
                    return f.read()
            except Exception as e:
                print(f"TXT 解析失败 {file_path}: {e}")
                return None

    @staticmethod
    def get_supported_extensions() -> list[str]:
        """获取支持的文件扩展名"""
        return [".pdf", ".docx", ".md", ".txt"]

    @staticmethod
    def is_supported(file_path: str) -> bool:
        """检查文件类型是否支持"""
        ext = Path(file_path).suffix.lower()
        return ext in FileParser.get_supported_extensions()
