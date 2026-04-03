"""
OCR 图片识别路由
"""
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from utils.ocr_client import OCRClient
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/ocr", tags=["OCR 图片识别"])


@router.post("/extract-text")
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    从上传的图片中提取文字
    """
    # 检查 API Key
    api_key = settings.dashscope_api_key or os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="未配置阿里云百炼 API Key，请在.env 文件中设置 DASHSCOPE_API_KEY"
        )

    # 验证文件类型
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图片类型：{file.content_type}，仅支持 jpg/jpeg/png/gif/webp"
        )

    try:
        # 保存临时文件
        temp_dir = settings.upload_dir
        os.makedirs(temp_dir, exist_ok=True)
        temp_filename = f"ocr_{uuid.uuid4()}.jpg"
        temp_filepath = os.path.join(temp_dir, temp_filename)

        content = await file.read()
        with open(temp_filepath, 'wb') as f:
            f.write(content)

        try:
            # 调用 OCR 识别
            client = OCRClient(api_key=api_key, model=settings.dashscope_model or "qwen-vl-max-latest")
            extracted_text = await client.extract_text_from_image(image_path=temp_filepath)

            return {
                "success": True,
                "text": extracted_text
            }
        finally:
            # 清理临时文件
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"识别失败：{str(e)}")
