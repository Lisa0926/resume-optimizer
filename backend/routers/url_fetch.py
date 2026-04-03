"""
URL 内容抓取路由 - 从招聘网站获取职位描述
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from utils.web_scraper import WebScraper

router = APIRouter(prefix="/api/url", tags=["URL 内容抓取"])


class UrlFetchRequest(BaseModel):
    """URL 抓取请求"""
    url: str = Field(..., description="招聘页面 URL")


class UrlFetchResponse(BaseModel):
    """URL 抓取响应"""
    success: bool
    title: str = ""
    content: str = ""
    url: str = ""
    error: str = ""


@router.post("/fetch-job-description", response_model=UrlFetchResponse)
async def fetch_job_description(request: UrlFetchRequest):
    """
    从招聘网站 URL 提取职位描述
    """
    url = request.url

    # 验证 URL 格式
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL 格式不正确，必须以 http://或 https://开头")

    # 验证是否是招聘网站
    allowed_domains = [
        "zhipin.com",      # BOSS 直聘
        "51job.com",       # 前程无忧
        "zhilian.com",     # 智联招聘
        "lagou.com",       # 拉勾网
        "liepin.com",      # 猎聘网
        "m.zhipin.com",    # BOSS 直聘移动端
        "touch.51job.com", # 前程无忧移动端
    ]

    domain_valid = any(domain in url.lower() for domain in allowed_domains)
    if not domain_valid:
        raise HTTPException(
            status_code=400,
            detail=f"暂不支持该招聘网站，目前支持：BOSS 直聘、前程无忧、智联招聘、拉勾网、猎聘网"
        )

    try:
        # 提取职位描述
        result = await WebScraper.extract_job_description(url)

        if result.get("success"):
            content = result.get("content", "")
            # 检测是否是动态加载内容
            if not content or len(content) < 50 or "加载中" in content or "请检查" in content:
                raise HTTPException(
                    status_code=500,
                    detail="该页面内容为动态加载，无法直接抓取。建议手动复制职位描述粘贴到输入框中。"
                )
            return UrlFetchResponse(
                success=True,
                title=result.get("title", ""),
                content=content,
                url=url
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "抓取失败"))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"抓取失败：{str(e)}")


@router.get("/fetch-job-description")
async def fetch_job_description_get(url: str = Query(..., description="招聘页面 URL")):
    """
    从招聘网站 URL 提取职位描述 (GET 方法)
    """
    return await fetch_job_description(UrlFetchRequest(url=url))
