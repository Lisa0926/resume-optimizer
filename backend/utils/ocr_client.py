"""
阿里云百炼 OCR 客户端 - 使用 Qwen-VL 视觉模型进行图片文字识别
"""
import os
import base64
from typing import Optional
from functools import partial
import asyncio
from dashscope import MultiModalConversation


class OCRClient:
    """阿里云百炼 OCR 客户端 - 使用视觉模型识别图片文字"""

    def __init__(self, api_key: str, model: str = "qwen-vl-max-latest"):
        """
        初始化 OCR 客户端

        Args:
            api_key: 阿里云百炼 API Key
            model: 视觉模型名称，默认 qwen-vl-max-latest
        """
        self.api_key = api_key
        self.model = model
        MultiModalConversation.api_key = api_key
        os.environ["DASHSCOPE_API_KEY"] = api_key

    async def extract_text_from_image(
        self,
        image_path: Optional[str] = None,
        image_url: Optional[str] = None,
        image_base64: Optional[str] = None
    ) -> str:
        """
        从图片提取文字

        Args:
            image_path: 本地图片路径
            image_url: 图片 URL
            image_base64: Base64 编码的图片数据

        Returns:
            提取的文字内容
        """
        # 构建图片内容
        if image_path:
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            image_content = {
                "image": f"data:image/jpeg;base64,{image_data}"
            }
        elif image_url:
            image_content = {"image": image_url}
        elif image_base64:
            image_content = {"image": f"data:image/jpeg;base64,{image_base64}"}
        else:
            raise ValueError("必须提供 image_path、image_url 或 image_base64 之一")

        # 构建消息
        messages = [{
            "role": "user",
            "content": [
                image_content,
                {"text": "请识别这张图片中的所有文字内容，并原样返回。不要添加任何说明或分析。"}
            ]
        }]

        # 在线程池中调用同步 API
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(
                MultiModalConversation.call,
                model=self.model,
                messages=messages,
                api_key=self.api_key,
                timeout=60
            )
        )

        # 处理响应
        if response.status_code == 200:
            extracted_text = response.output.choices[0].message.content[0]["text"]
            return extracted_text.strip()
        else:
            raise Exception(f"OCR 识别失败：{response.code} - {response.message}")

    @staticmethod
    def validate_image(file_path: str) -> bool:
        """验证图片文件"""
        if not os.path.exists(file_path):
            return False
        # 检查文件大小 (最大 10MB)
        if os.path.getsize(file_path) > 10 * 1024 * 1024:
            return False
        # 检查扩展名
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        ext = os.path.splitext(file_path)[1].lower()
        return ext in allowed_extensions
