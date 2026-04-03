"""
ATS 评分 API
提供简历 ATS 兼容性评分功能
"""
from fastapi import APIRouter, HTTPException
from schemas import ATSScoreRequest, ATSScoreResponse
from typing import List, Dict
import re
from utils.llm_client import call_llm

router = APIRouter(prefix="/api/ats", tags=["ATS 评分"])


# ATS 评分维度
class ATSCriteria:
    """ATS 评分标准"""
    KEYWORD_MATCH = 0.30  # 关键词匹配度 30%
    FORMAT_SCORE = 0.20   # 格式规范性 20%
    READABILITY = 0.20    # 可读性 20%
    SKILL_COVERAGE = 0.15  # 技能覆盖度 15%
    EXPERIENCE_RELEVANCE = 0.15  # 经历相关性 15%


# 常见 ATS 关键词类别
KEYWORD_CATEGORIES = {
    "technical_skills": [
        "python", "java", "javascript", "typescript", "react", "vue", "angular",
        "node.js", "django", "fastapi", "flask", "sql", "mysql", "postgresql",
        "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
        "git", "linux", "ci/cd", "agile", "scrum", "api", "rest", "graphql",
        "machine learning", "ai", "data analysis", "tensorflow", "pytorch"
    ],
    "soft_skills": [
        "communication", "leadership", "team", "collaboration", "problem solving",
        "analytical", "creative", "detail-oriented", "self-motivated", "adaptability",
        "time management", "prioritization", "critical thinking"
    ],
    "action_verbs": [
        "developed", "designed", "implemented", "managed", "led", "created",
        "optimized", "improved", "increased", "reduced", "built", "architected",
        "deployed", "maintained", "tested", "delivered", "achieved", "executed"
    ],
    "metrics": [
        "%", "percent", "percentage", "increased", "reduced", "improved",
        "saved", "generated", "revenue", "cost", "efficiency", "performance",
        "scale", "users", "customers", "traffic", "conversion"
    ]
}


def calculate_keyword_match(resume_text: str, jd_text: str) -> Dict:
    """计算关键词匹配度"""
    resume_lower = resume_text.lower()
    jd_lower = jd_text.lower()

    # 提取 JD 中的关键词
    jd_keywords = set()
    for category, keywords in KEYWORD_CATEGORIES.items():
        for keyword in keywords:
            if keyword in jd_lower:
                jd_keywords.add(keyword)

    # 计算匹配
    matched_keywords = []
    missing_keywords = []

    for keyword in jd_keywords:
        if keyword in resume_lower:
            matched_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)

    # 计算匹配率
    if len(jd_keywords) == 0:
        match_rate = 1.0
    else:
        match_rate = len(matched_keywords) / len(jd_keywords)

    return {
        "score": match_rate * 100,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "total_keywords": len(jd_keywords)
    }


def calculate_format_score(resume_text: str) -> Dict:
    """计算格式规范性评分"""
    score = 100
    issues = []
    suggestions = []

    # 检查段落结构
    sections = resume_text.split('\n\n')
    if len(sections) < 3:
        score -= 15
        issues.append("简历内容过少，建议增加更多经历描述")
        suggestions.append("将简历分为个人信息、工作经历、项目经历、专业技能等部分")

    # 检查是否有量化成果
    has_metrics = any(metric in resume_text.lower() for metric in KEYWORD_CATEGORIES["metrics"])
    if not has_metrics:
        score -= 15
        issues.append("缺少量化成果描述")
        suggestions.append("使用数字和百分比来量化工作成果，如'提升 30% 效率'")

    # 检查是否有行动动词
    has_action_verbs = any(verb in resume_text.lower() for verb in KEYWORD_CATEGORIES["action_verbs"])
    if not has_action_verbs:
        score -= 10
        issues.append("缺少强有力的行动动词")
        suggestions.append("使用'开发'、'设计'、'实现'、'领导'等动词开始每条描述")

    # 检查联系方式（假设应该包含邮箱或电话格式）
    has_contact = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text))
    if not has_contact:
        score -= 10
        issues.append("未检测到邮箱地址")
        suggestions.append("添加有效的邮箱地址便于联系")

    # 确保分数不低于 0
    score = max(0, score)

    return {
        "score": score,
        "issues": issues,
        "suggestions": suggestions
    }


def calculate_readability_score(resume_text: str) -> Dict:
    """计算可读性评分"""
    score = 100
    issues = []
    suggestions = []

    lines = resume_text.split('\n')

    # 检查行长度
    long_lines = [line for line in lines if len(line) > 100]
    if len(long_lines) > 3:
        score -= 10
        issues.append("部分行过长")
        suggestions.append("将长句拆分为短句，每行控制在 80-100 字符以内")

    # 检查 bullet points（使用 - 或 * 或数字开头）
    bullet_lines = [line for line in lines if line.strip().startswith(('-', '*', '•')) or
                   re.match(r'^\d+[\.\)]', line.strip())]
    bullet_ratio = len(bullet_lines) / max(len(lines), 1)

    if bullet_ratio < 0.3:
        score -= 15
        issues.append("缺少列表格式")
        suggestions.append("使用项目符号或编号列表来组织内容")

    # 检查空行比例（应该有适当的留白）
    empty_lines = [line for line in lines if not line.strip()]
    empty_ratio = len(empty_lines) / max(len(lines), 1)

    if empty_ratio < 0.1:
        score -= 10
        issues.append("内容过于密集")
        suggestions.append("适当增加段落间距，提高可读性")
    elif empty_ratio > 0.4:
        score -= 5
        issues.append("空行过多")
        suggestions.append("减少不必要的空行")

    score = max(0, score)

    return {
        "score": score,
        "issues": issues,
        "suggestions": suggestions
    }


def calculate_skill_coverage(resume_text: str, jd_text: str) -> Dict:
    """计算技能覆盖度评分"""
    resume_lower = resume_text.lower()
    jd_lower = jd_text.lower()

    # 常见技能关键词
    skill_keywords = [
        "skill", "ability", "proficient", "familiar", "experience", "expertise",
        "knowledge", "competent", "capable", "trained", "certified",
        "python", "java", "javascript", "sql", "database", "framework",
        "tool", "platform", "technology", "system", "software", "language"
    ]

    # 统计技能提及次数
    skill_count = sum(1 for kw in skill_keywords if kw in resume_lower)

    # 根据 JD 长度期望的技能提及数
    expected_skills = max(5, len(jd_lower) // 200)

    if skill_count >= expected_skills:
        score = 100
    else:
        score = (skill_count / expected_skills) * 100

    suggestions = []
    if skill_count < expected_skills:
        suggestions.append(f"建议增加专业技能描述，当前提及{skill_count}次，建议{expected_skills}次以上")

    return {
        "score": score,
        "skill_count": skill_count,
        "expected_skills": expected_skills,
        "suggestions": suggestions
    }


def calculate_experience_relevance(resume_text: str, jd_text: str) -> Dict:
    """计算经历相关性评分"""
    # 使用 LLM 分析经历相关性
    try:
        prompt = f"""
分析简历经历与职位描述的相关性。

职位描述：
{jd_text[:1000]}

简历内容：
{resume_text[:1000]}

请按以下 JSON 格式返回分析结果：
{{
    "score": 0-100,
    "relevant_experiences": ["相关经历 1", "相关经历 2"],
    "gaps": ["差距 1", "差距 2"],
    "suggestions": ["建议 1", "建议 2"]
}}
"""
        # 调用 LLM 分析
        analysis = call_llm(prompt, temperature=0.3)
        import json
        result = json.loads(analysis)
        return result
    except Exception as e:
        # 降级处理
        return {
            "score": 70,
            "relevant_experiences": [],
            "gaps": ["无法详细分析，建议手动对比 JD 要求"],
            "suggestions": ["确保工作经历与目标职位相关"]
        }


@router.post("/score", response_model=ATSScoreResponse)
async def calculate_ats_score(request: ATSScoreRequest) -> ATSScoreResponse:
    """
    计算简历 ATS 评分
    """
    resume_text = request.resume_content
    jd_text = request.job_description

    if not resume_text or not jd_text:
        raise HTTPException(status_code=400, detail="简历内容和职位描述不能为空")

    # 各维度评分
    keyword_result = calculate_keyword_match(resume_text, jd_text)
    format_result = calculate_format_score(resume_text)
    readability_result = calculate_readability_score(resume_text)
    skill_result = calculate_skill_coverage(resume_text, jd_text)
    experience_result = calculate_experience_relevance(resume_text, jd_text)

    # 计算加权总分
    total_score = (
        keyword_result["score"] * ATSCriteria.KEYWORD_MATCH +
        format_result["score"] * ATSCriteria.FORMAT_SCORE +
        readability_result["score"] * ATSCriteria.READABILITY +
        skill_result["score"] * ATSCriteria.SKILL_COVERAGE +
        experience_result["score"] * ATSCriteria.EXPERIENCE_RELEVANCE
    )

    # 生成综合建议
    all_suggestions = (
        keyword_result.get("missing_keywords", [])[:5] +  # 最多 5 个缺失关键词
        format_result.get("suggestions", []) +
        readability_result.get("suggestions", []) +
        skill_result.get("suggestions", []) +
        experience_result.get("suggestions", [])
    )

    return ATSScoreResponse(
        total_score=round(total_score, 1),
        dimensions={
            "keyword_match": keyword_result,
            "format": format_result,
            "readability": readability_result,
            "skill_coverage": skill_result,
            "experience_relevance": experience_result
        },
        suggestions=all_suggestions[:10]  # 最多 10 条建议
    )
