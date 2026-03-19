"""
阿里云百炼 LLM 客户端
"""
import os
import asyncio
from typing import Optional
from functools import partial
from dashscope import Generation
from dashscope.api_entities.dashscope_response import Role


class LLMClient:
    """阿里云百炼 API 客户端"""

    def __init__(self, api_key: str, model: str = "qwen-max"):
        """
        初始化 LLM 客户端

        Args:
            api_key: 阿里云百炼 API Key
            model: 模型名称，默认 qwen-max
        """
        self.api_key = api_key
        self.model = model
        # 显式设置 API key，确保 SDK 能正确识别
        Generation.api_key = api_key
        os.environ["DASHSCOPE_API_KEY"] = api_key

    async def optimize_resume(
        self,
        resume_content: str,
        job_description: str,
        conversation_history: Optional[list[dict]] = None,
        prompt_template: Optional[str] = None,
        mode: str = "optimize"
    ) -> tuple[str, list[dict]]:
        """
        优化简历内容

        Args:
            resume_content: 原始简历内容
            job_description: 职位描述
            conversation_history: 对话历史
            prompt_template: 自定义 Prompt 模板
            mode: 优化模式 (optimize=智能优化，match=匹配优化，translate=翻译)

        Returns:
            (优化后的内容，更新后的对话历史)
        """
        # 构建消息
        messages = self._build_messages(
            resume_content=resume_content,
            job_description=job_description,
            conversation_history=conversation_history,
            prompt_template=prompt_template,
            mode=mode
        )

        # 在线程池中调用同步 API，避免阻塞事件循环
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(
                Generation.call,
                model=self.model,
                messages=messages,
                result_format="message",
                api_key=self.api_key,
                timeout=120  # 设置 120 秒超时
            )
        )

        # 处理响应
        if response.status_code == 200:
            optimized_content = response.output.choices[0].message.content
            # 更新对话历史
            new_history = self._update_conversation_history(
                conversation_history or [],
                resume_content,
                job_description,
                optimized_content
            )
            return optimized_content, new_history
        else:
            raise Exception(f"LLM API 调用失败：{response.code} - {response.message}")

    def _build_messages(
        self,
        resume_content: str,
        job_description: str,
        conversation_history: Optional[list[dict]] = None,
        prompt_template: Optional[str] = None,
        mode: str = "optimize"
    ) -> list[dict]:
        """构建 API 请求消息"""

        # 默认 Prompt 模板
        default_prompts = {
            "optimize": """你是一位专业的简历优化专家。你的任务是根据用户提供的职位描述，帮助优化简历内容，使其更符合目标职位的要求。

请遵循以下原则：
1. 突出与职位相关的技能和经验
2. 使用量化成果来展示能力
3. 调整关键词以匹配职位描述
4. 保持专业、简洁的表达
5. 建议具体的改进点

输出格式要求：
- 使用 Markdown 格式输出
- 姓名使用一级标题（# 姓名）
- 各主要章节使用二级标题（## 求职意向、## 工作经历、## 项目经历、## 教育背景、## 专业技能等）
- 公司名、职位名、学校名等关键信息使用加粗（**加粗**）
- 工作内容使用项目符号列表（- 内容）
- 时间线清晰标注

重要：只输出优化后的简历内容（使用上述格式），不要包含任何优化说明、分析过程、改进建议或其他解释性文字。""",
            "match": """任务：
你是一个 20 年经验的资深企业招聘方，且贴合 2026 年招聘趋势和招聘需求。请优化我的简历，使之与我输入的目标职位 JD 更加匹配。
要求：
1，优化过程基于客观、真实、中立、不迎合的模式。
2，我履历里没有的经历不要添加。
3，使用和我的简历一致的语言（中文/英文）。
4，优化后的简历与原结构保持一致。

输出格式要求：
- 使用 Markdown 格式输出
- 姓名使用一级标题（# 姓名）
- 各主要章节使用二级标题（## 求职意向、## 工作经历、## 项目经历、## 教育背景、## 专业技能等）
- 公司名、职位名、学校名等关键信息使用加粗（**加粗**）
- 工作内容使用项目符号列表（- 内容）
- 时间线清晰标注

重要：只输出优化后的简历内容（使用上述格式），不要包含任何分析过程、优化说明或其他解释性文字。""",
            "translate": """你是一个专业的翻译。请将用户的简历内容翻译成指定的语言。
要求：
1. 保持专业术语的准确性
2. 语言流畅、自然
3. 保持原文的格式和结构

输出格式要求：
- 使用 Markdown 格式输出
- 姓名使用一级标题（# 姓名）
- 各主要章节使用二级标题（## 求职意向、## 工作经历、## 项目经历、## 教育背景、## 专业技能等）
- 公司名、职位名、学校名等关键信息使用加粗（**加粗**）
- 工作内容使用项目符号列表（- 内容）
- 时间线清晰标注

重要：只输出翻译后的简历内容（使用上述格式），不要包含任何翻译说明或其他解释性文字。""",
        }

        # 使用自定义 prompt 或默认 prompt
        system_prompt = prompt_template if prompt_template else default_prompts.get(mode, default_prompts["optimize"])

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        # 如果有对话历史，添加历史消息
        if conversation_history:
            messages.extend(conversation_history)
        else:
            # 首次请求
            user_prompt = f"""请帮我处理以下简历：

【输入内容】
{job_description}

【原始简历】
{resume_content}

请根据 system prompt 中的要求进行处理。"""
            messages.append({"role": "user", "content": user_prompt})

        return messages

    def _update_conversation_history(
        self,
        history: list[dict],
        resume_content: str,
        job_description: str,
        optimized_content: str
    ) -> list[dict]:
        """更新对话历史"""
        if not history:
            # 首次对话
            return [
                {"role": "user", "content": f"请帮我优化以下简历，使其更适合这个职位：\n\n【职位描述】\n{job_description}\n\n【原始简历】\n{resume_content}"},
                {"role": "assistant", "content": optimized_content}
            ]
        else:
            # 追加新对话
            return history + [
                {"role": "assistant", "content": optimized_content}
            ]

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """验证 API Key 格式"""
        return bool(api_key and len(api_key) >= 10)
