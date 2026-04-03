"""
网页内容抓取工具 - 从 URL 提取正文内容
"""
import re
import asyncio
from typing import Optional
from functools import partial
import httpx


class WebScraper:
    """网页抓取器"""

    # 常见招聘网站的内容选择器
    JOB_BOARD_SELECTORS = {
        "zhipin.com": {
            "name": "BOSS 直聘",
            "content_selector": ".job-sec-text",
            "title_selector": ".job-title-container h1",
            "fallback_selector": ".job-detail",
        },
        "51job.com": {
            "name": "前程无忧",
            "content_selector": ".bmsg.job_msg",
            "title_selector": "h1.cn",
        },
        "zhilian.com": {
            "name": "智联招聘",
            "content_selector": ".job-detail-content",
            "title_selector": ".position-headline",
        },
        "lagou.com": {
            "name": "拉勾网",
            "content_selector": ".job-detail",
            "title_selector": ".job-name",
        },
        "liepin.com": {
            "name": "猎聘网",
            "content_selector": ".job-detail",
            "title_selector": ".job-title",
        },
    }

    @staticmethod
    async def fetch_page(url: str, timeout: int = 30) -> str:
        """
        获取网页内容

        Args:
            url: 网页 URL
            timeout: 超时时间（秒）

        Returns:
            网页 HTML 内容
        """
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        }

        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=timeout) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text

    @staticmethod
    def extract_text_from_html(html: str, url: str) -> str:
        """
        从 HTML 提取正文内容

        Args:
            html: HTML 内容
            url: 网页 URL

        Returns:
            提取的文本内容
        """
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")

        # 移除不需要的元素
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # 检测网站
        domain = url.split("/")[2].lower() if "://" in url else url.split("/")[0].lower()

        # 查找匹配的选择器
        selector_info = None
        for site_domain, selector in WebScraper.JOB_BOARD_SELECTORS.items():
            if site_domain in domain:
                selector_info = selector
                break

        if selector_info:
            # 尝试使用特定选择器
            content_selector = selector_info.get("content_selector")
            if content_selector:
                element = WebScraper._find_element_by_selector(soup, content_selector)
                if element:
                    return WebScraper._clean_text(element.get_text())

                # 尝试备用选择器
                fallback = selector_info.get("fallback_selector")
                if fallback:
                    fallback_element = WebScraper._find_element_by_selector(soup, fallback)
                    if fallback_element:
                        return WebScraper._clean_text(fallback_element.get_text())

        # 通用提取：查找包含最多文本的元素
        main_content = WebScraper._find_main_content(soup)
        return WebScraper._clean_text(main_content.get_text()) if main_content else WebScraper._clean_text(soup.get_text())

    @staticmethod
    def _find_main_content(soup) -> Optional:
        """查找主要内容区域"""
        # 尝试常见的内容容器
        common_tags = ["article", "main", "section", "div"]
        common_classes = ["content", "main", "article", "detail", "job-detail", "job-content", "description"]

        for tag in common_tags:
            for class_name in common_classes:
                element = soup.find(tag, class_=lambda x: x and class_name in x.lower() if isinstance(x, str) else x and any(class_name in c.lower() for c in x))
                if element and len(element.get_text(strip=True)) > 200:
                    return element

        #  fallback: 查找最大的文本块
        max_text_len = 0
        max_element = None
        for div in soup.find_all("div"):
            text = div.get_text(strip=True)
            if len(text) > max_text_len:
                max_text_len = len(text)
                max_element = div

        return max_element if max_text_len > 100 else soup.body

    @staticmethod
    def _parse_selector(selector: str) -> tuple:
        """
        解析选择器字符串为标签名和类名列表

        Args:
            selector: 选择器字符串，如 ".job-detail" 或 "div.content"

        Returns:
            (tag_name, class_names) 元组
        """
        class_parts = selector.split(".")
        tag_name = class_parts[0] if class_parts[0] else "*"
        class_names = class_parts[1:]
        return tag_name, class_names

    @staticmethod
    def _find_element_by_selector(soup, selector: str):
        """
        根据选择器查找元素

        Args:
            soup: BeautifulSoup 对象
            selector: 选择器字符串

        Returns:
            找到的元素或 None
        """
        tag_name, class_names = WebScraper._parse_selector(selector)
        for class_name in class_names:
            element = soup.find(tag_name, class_=lambda x, cn=class_name: x and cn in x if isinstance(x, str) else x and any(cn in c for c in x))
            if element:
                return element
        return None

    @staticmethod
    def _clean_text(text: str) -> str:
        """清理文本"""
        # 移除多余空白
        text = re.sub(r'\s+', ' ', text)
        # 移除特殊字符
        text = re.sub(r'[^\w\s\u4e00-\u9fff\.\,\!\?\:\;\(\)\-\'\"]', '', text)
        # 修剪
        return text.strip()

    @classmethod
    async def extract_job_description(cls, url: str) -> dict:
        """
        从招聘 URL 提取职位描述

        Args:
            url: 招聘页面 URL

        Returns:
            包含标题和描述的字典
        """
        try:
            html = await cls.fetch_page(url)
            text_content = cls.extract_text_from_html(html, url)

            # 检测网站获取标题选择器
            domain = url.split("/")[2].lower() if "://" in url else url.split("/")[0].lower()
            title = ""

            for site_domain, selector in cls.JOB_BOARD_SELECTORS.items():
                if site_domain in domain:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(html, "html.parser")
                    title_selector = selector.get("title_selector")
                    if title_selector:
                        title_element = WebScraper._find_element_by_selector(soup, title_selector)
                        if title_element:
                            title = title_element.get_text(strip=True)
                    break

            return {
                "success": True,
                "title": title,
                "content": text_content,
                "url": url
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "url": url
            }


