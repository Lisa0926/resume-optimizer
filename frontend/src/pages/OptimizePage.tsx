import React, { useState, useEffect } from 'react';
import { optimizeAPI, resumeAPI, ocrAPI, atsAPI, urlFetchAPI } from '../services/api';
import type { Resume } from '../types';
import { SparklesIcon, BeakerIcon, ClipboardDocumentIcon, ArrowDownTrayIcon, DocumentTextIcon, AdjustmentsHorizontalIcon, GlobeAltIcon, CheckCircleIcon, XCircleIcon, EyeIcon, ArrowRightIcon, PhotoIcon, TrashIcon, ChartBarIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// 默认 Prompt 模板
const DEFAULT_PROMPTS = {
  match: `# 角色
你是 20 年资深招聘官，精通 2026 招聘趋势与 ATS 筛选规则，极度严谨、绝对诚实、绝对不编造、绝对不修改结构数量。

# 输入
用户将提供：
- 原始简历
- 目标职位 JD

# 核心铁律（违反即输出错误）

## 内容铁律
- 所有输出内容 100% 必须来自原始简历。
- 绝对不新增、不脑补、不虚构任何工作经历、项目、技能、证书、成果、认证。
- 原始简历没有的内容，一律不出现。

## 结构数量铁律
- 原始简历有几段工作经历 → 优化后保留完全相同段数，不得增减。
- 原始简历有几段项目经历 → 优化后保留完全相同段数，不得增减。
- 原始简历中的大类别（个人信息、优势亮点、工作经历、项目经历、专业技能）→ 优化后必须全部保留，不得删除、合并、新增类别。

## 格式铁律
- 优势亮点：每条必须用 1.2.3. 序号罗列。
- 每一段工作经历内部条目：必须用 1.2.3. 序号罗列。
- 每一段项目经历内部条目：必须用 1.2.3. 序号罗列。
- 仅输出纯文本，无任何加粗、无 * 符号、无 Markdown。

## 语言铁律
- 优化后语言与原始简历完全一致，不切换中英文。

## 优势亮点刚性约束（必须严格执行）
- 最多 5 条。
- 每条最多 3 句话。
- 每条用 1.2.3. 序号罗列。
- 内容不与工作经历重复，只提炼核心竞争力。
- 优势亮点中禁止出现任何量化结果、数据、数字、百分比、金额、规模等，一律删除。

## 项目经历约束
- 项目经历是工作经历的细化支撑，内容不重合、不重复。
- 项目经历中必须展示量化结果、数据、成果，用数字体现价值。

## 风格铁律
- 短平快、精简务实、无虚词。
- 突出动作 + 结果，10 秒内看懂价值。
- 贴合 JD 关键词，提升 ATS 通过率。

## 输出规则
- 只输出优化后的完整简历内容。
- 绝对不输出思考过程、优化理由、解释、备注、提示语。
- 结构、段数、类别完全对齐原始简历，只优化措辞与关键词匹配度。

## 【最高优先级・绝对铁律・违反即停止输出】
- 绝对禁止生成原始简历中不存在的任何内容，包括但不限于：
  - 不存在的证书、认证、资质
  - 不存在的技能、工具、软件
  - 不存在的工作经历、项目经历
  - 不存在的成果、数据、量化结果
  - 不存在的教育背景、荣誉奖项
- 只要原始简历里没有写，就绝对不能出现。
- 任何模型自主脑补、编造、新增的内容都属于严重违规，必须立刻删除，绝不输出。
- 你只允许做两件事：措辞优化、关键词对齐、结构整理。除此之外，什么都不能加。
- 严禁以"优化""补充""完善"为名添加任何原始简历没有的信息。`,
  optimize: `# 角色
你是 20 年资深招聘官，精通 2026 招聘趋势与 ATS 筛选规则，极度严谨、绝对诚实、绝对不编造、绝对不修改结构数量。

# 输入
用户将提供：
- 原始简历
- 目标职位 JD

# 核心铁律（违反即输出错误）

## 内容铁律
- 所有输出内容 100% 必须来自原始简历。
- 绝对不新增、不脑补、不虚构任何工作经历、项目、技能、证书、成果、认证。
- 原始简历没有的内容，一律不出现。

## 结构数量铁律
- 原始简历有几段工作经历 → 优化后保留完全相同段数，不得增减。
- 原始简历有几段项目经历 → 优化后保留完全相同段数，不得增减。
- 原始简历中的大类别（个人信息、优势亮点、工作经历、项目经历、专业技能）→ 优化后必须全部保留，不得删除、合并、新增类别。

## 格式铁律
- 优势亮点：每条必须用 1.2.3. 序号罗列。
- 每一段工作经历内部条目：必须用 1.2.3. 序号罗列。
- 每一段项目经历内部条目：必须用 1.2.3. 序号罗列。
- 仅输出纯文本，无任何加粗、无 * 符号、无 Markdown。

## 语言铁律
- 优化后语言与原始简历完全一致，不切换中英文。

## 优势亮点刚性约束（必须严格执行）
- 最多 5 条。
- 每条最多 3 句话。
- 每条用 1.2.3. 序号罗列。
- 内容不与工作经历重复，只提炼核心竞争力。
- 优势亮点中禁止出现任何量化结果、数据、数字、百分比、金额、规模等，一律删除。

## 项目经历约束
- 项目经历是工作经历的细化支撑，内容不重合、不重复。
- 项目经历中必须展示量化结果、数据、成果，用数字体现价值。

## 风格铁律
- 短平快、精简务实、无虚词。
- 突出动作 + 结果，10 秒内看懂价值。
- 贴合 JD 关键词，提升 ATS 通过率。

## 输出规则
- 只输出优化后的完整简历内容。
- 绝对不输出思考过程、优化理由、解释、备注、提示语。
- 结构、段数、类别完全对齐原始简历，只优化措辞与关键词匹配度。

## 【最高优先级・绝对铁律・违反即停止输出】
- 绝对禁止生成原始简历中不存在的任何内容，包括但不限于：
  - 不存在的证书、认证、资质
  - 不存在的技能、工具、软件
  - 不存在的工作经历、项目经历
  - 不存在的成果、数据、量化结果
  - 不存在的教育背景、荣誉奖项
- 只要原始简历里没有写，就绝对不能出现。
- 任何模型自主脑补、编造、新增的内容都属于严重违规，必须立刻删除，绝不输出。
- 你只允许做两件事：措辞优化、关键词对齐、结构整理。除此之外，什么都不能加。
- 严禁以"优化""补充""完善"为名添加任何原始简历没有的信息。`,
  translate: `你是一个专业的翻译。请将用户的简历内容翻译成指定的语言。
要求：
1. 保持专业术语的准确性
2. 语言流畅、自然
3. 保持原文的格式和结构

请直接输出翻译后的简历内容，不需要额外解释。`,
};

// 优化模式类型
type OptimizeMode = 'optimize' | 'match' | 'translate';

interface ModeConfig {
  id: OptimizeMode;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  inputLabel: string;
  inputPlaceholder: string;
  defaultPrompt: string;
  resultTitle: string;
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'match',
    name: '匹配优化',
    icon: AdjustmentsHorizontalIcon,
    inputLabel: '职位描述 (JD)',
    inputPlaceholder: '粘贴目标职位的描述，AI 将基于招聘专家视角进行匹配优化...',
    defaultPrompt: DEFAULT_PROMPTS.match,
    resultTitle: '匹配优化结果',
  },
  {
    id: 'translate',
    name: '简历翻译',
    icon: GlobeAltIcon,
    inputLabel: '目标语言',
    inputPlaceholder: '请输入要翻译成的语言，例如：英文、日文、法文等...',
    defaultPrompt: DEFAULT_PROMPTS.translate,
    resultTitle: '翻译结果',
  },
  {
    id: 'optimize',
    name: '智能优化',
    icon: SparklesIcon,
    inputLabel: '职位描述 (JD)',
    inputPlaceholder: '粘贴目标职位的描述，包括岗位要求、职责、技能要求等...',
    defaultPrompt: DEFAULT_PROMPTS.optimize,
    resultTitle: '优化结果',
  },
];

function OptimizePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedMode, setSelectedMode] = useState<OptimizeMode>('match'); // 默认匹配优化
  const [inputText, setInputText] = useState(''); // JD 或目标语言
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPTS.match);
  const [fineTunePrompt, setFineTunePrompt] = useState(''); // 微调 prompt
  const [showPromptConfig, setShowPromptConfig] = useState(true); // 控制 Prompt 配置收起/展开 - 默认展开
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [originalText, setOriginalText] = useState(''); // 原始简历纯文本

  // P1-01: 关键词提取相关状态
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [showKeywords, setShowKeywords] = useState(false);

  // 匹配优化模式专用状态
  const [showAnalysis, setShowAnalysis] = useState(false); // 是否显示优化分析
  const [analysisContent, setAnalysisContent] = useState(''); // 优化分析内容
  const [showComparisonModal, setShowComparisonModal] = useState(false); // 是否显示对比弹窗
  const [optimizationStep, setOptimizationStep] = useState(1); // 当前步骤 (1-3)

  // JD 图片上传相关状态
  const [jdImageLoading, setJdImageLoading] = useState(false); // 图片识别加载中
  const [jdImageName, setJdImageName] = useState(''); // 上传的图片文件名
  const fileInputRef = React.useRef<HTMLInputElement>(null); // 文件输入引用

  // JD URL 抓取相关状态
  const [jdUrlLoading, setJdUrlLoading] = useState(false); // URL 抓取加载中
  const [jdUrl, setJdUrl] = useState(''); // 输入的 URL
  const jdUrlInputRef = React.useRef<HTMLInputElement>(null); // URL 输入框引用

  // ATS 评分相关状态
  const [atsScoreData, setAtsScoreData] = useState<{
    total_score: number;
    dimensions: Record<string, any>;
    suggestions: string[];
  } | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [showAtsScore, setShowAtsScore] = useState(false);

  // 二次优化相关状态
  const [showReoptimize, setShowReoptimize] = useState(false); // 是否显示二次优化输入框
  const [reoptimizePrompt, setReoptimizePrompt] = useState(''); // 二次优化的 Prompt
  const [reoptimizing, setReoptimizing] = useState(false); // 二次优化进行中

  // 原始简历预览对话框状态
  const [showPreviewModal, setShowPreviewModal] = useState(false); // 是否显示预览对话框
  const [previewResume, setPreviewResume] = useState<Resume | null>(null); // 当前预览的简历
  const [previewLoading, setPreviewLoading] = useState(false); // 预览加载中

  // 打开简历预览弹窗
  const openResumePreview = async (resume: Resume) => {
    setPreviewLoading(true);
    try {
      // 获取完整简历信息
      const fullResume = await resumeAPI.get(resume.id);
      setPreviewResume(fullResume);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('获取简历详情失败:', error);
      // 如果获取失败，至少使用基本信息
      setPreviewResume(resume);
      setShowPreviewModal(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 加载简历列表
  useEffect(() => {
    resumeAPI.list(1, 100).then(data => {
      setResumes(data.items || []);
      if (data.items?.length > 0) {
        setSelectedResumeId(String(data.items[0].id));
        setOriginalText(data.items[0].content_text || '');
      }
    }).catch(console.error);
  }, []);

  // 切换简历时更新原始内容
  useEffect(() => {
    const resume = resumes.find(r => r.id === parseInt(selectedResumeId));
    if (resume) {
      setOriginalText(resume.content_text || '');
    }
  }, [selectedResumeId, resumes]);

  // 切换模式时更新 prompt
  useEffect(() => {
    const mode = MODE_CONFIGS.find(m => m.id === selectedMode);
    if (mode) {
      setCustomPrompt(mode.defaultPrompt);
    }
  }, [selectedMode]);

  // 模拟进度条
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [loading]);

  // 切换模式时重置步骤
  useEffect(() => {
    setOptimizationStep(1);
    setAnalysisContent('');
    setShowAnalysis(false);
    setShowComparisonModal(false);
  }, [selectedMode]);

  // 处理 JD 图片上传和 OCR 识别
  const handleJdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传正确的图片文件');
      return;
    }

    setJdImageLoading(true);
    setError('');

    try {
      const result = await ocrAPI.extractText(file);
      if (result.success) {
        setInputText(result.text);
        setJdImageName(file.name);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || '图片识别失败';
      setError(detail);
    } finally {
      setJdImageLoading(false);
      // 重置文件输入，允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 清除上传的图片
  const handleClearJdImage = () => {
    setJdImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理 JD URL 抓取
  const handleFetchFromUrl = async () => {
    if (!jdUrl || !jdUrl.startsWith('http')) {
      setError('请输入正确的 URL 地址');
      return;
    }

    setJdUrlLoading(true);
    setError('');

    try {
      const result = await urlFetchAPI.fetchJobDescription(jdUrl);
      if (result.success) {
        setInputText(result.content);
        setJdUrl(''); // 清空输入框
        if (jdUrlInputRef.current) {
          jdUrlInputRef.current.value = '';
        }
      } else {
        setError(result.error || '抓取失败');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || '抓取失败';
      setError(detail);
    } finally {
      setJdUrlLoading(false);
    }
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResumeId || !inputText) {
      setError('请选择简历并输入必要信息');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setExtractedKeywords([]);
    setMatchedKeywords([]);
    setAnalysisContent('');
    setShowAnalysis(false);

    try {
      // 构建请求数据 - 合并主 prompt 和微调 prompt
      const requestData: any = {
        resume_id: parseInt(selectedResumeId),
        job_description: inputText,
        prompt: fineTunePrompt ? `${customPrompt}\n\n微调要求：\n${fineTunePrompt}` : customPrompt,
        mode: selectedMode,
        return_analysis: selectedMode === 'match', // 匹配优化模式返回分析
      };

      const data = await optimizeAPI.optimize(requestData);
      setResult(data.optimized_content);

      // 如果有分析内容，保存并显示
      if (data.analysis) {
        setAnalysisContent(data.analysis);
      }

      // P1-01: 提取关键词并计算匹配度
      extractKeywords(inputText, data.optimized_content);
      setOptimizationStep(3);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.detail || err.message || '优化失败，请检查 API Key 配置和网络连接';
      setError(detail);
      console.error('优化失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 切换对比模式
  // 打开对比弹窗
  const openComparison = () => {
    setShowComparisonModal(true);
  };

  // 生成对比文本（使用 diff 算法，忽略格式差异，用黄色高亮显示措辞差异）
  const generateDiffHtml = () => {
    if (!result || !originalText) return '';

    // 预处理：移除纯格式差异（换行、多余空格），只保留实际内容
    const normalizeText = (text: string) => {
      return text
        .replace(/\s+/g, ' ') // 将所有空白字符（包括换行）替换为单个空格
        .replace(/\.\s*\n\s*/g, '. ') // 规范化句号后的换行
        .replace(/,\s*\n\s*/g, ', ') // 规范化逗号后的换行
        .trim();
    };

    const normalizedOriginal = normalizeText(originalText);
    const normalizedResult = normalizeText(result);

    // 将文本按语义单元分割（标点和换行）
    const splitIntoTokens = (text: string) => {
      // 按标点和空格分割，保留分隔符
      const tokens: string[] = [];
      let currentToken = '';
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ' || char === '.' || char === ',' || char === ':' || char === ';' || char === '。' || char === ',' || char === ':' || char === ';') {
          if (currentToken) {
            tokens.push(currentToken);
            currentToken = '';
          }
          tokens.push(char);
        } else {
          currentToken += char;
        }
      }
      if (currentToken) {
        tokens.push(currentToken);
      }
      return tokens;
    };

    const originalTokens = splitIntoTokens(normalizedOriginal);
    const resultTokens = splitIntoTokens(normalizedResult);

    // 简单的 LCS diff 算法
    const lcs = (arr1: string[], arr2: string[]) => {
      const dp: number[][] = Array(arr1.length + 1).fill(null).map(() => Array(arr2.length + 1).fill(0));
      for (let i = 1; i <= arr1.length; i++) {
        for (let j = 1; j <= arr2.length; j++) {
          if (arr1[i - 1] === arr2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }
      // 回溯获取 diff 结果
      let i = arr1.length, j = arr2.length;
      const temp: { type: 'same' | 'diff' | 'same'; content: string }[] = [];
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && arr1[i - 1] === arr2[j - 1]) {
          temp.push({ type: 'same', content: arr1[i - 1] });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          temp.push({ type: 'diff', content: arr2[j - 1] });
          j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
          i--;
        }
      }
      return temp.reverse();
    };

    const diffResult = lcs(originalTokens, resultTokens);

    // 将 diff 结果转换为 HTML，忽略纯空格和标点的差异展示
    let html = '';
    let buffer = '';
    for (let i = 0; i < diffResult.length; i++) {
      const item = diffResult[i];
      // 跳过纯空格
      if (item.content === ' ') {
        html += ' ';
        continue;
      }
      // 标点符号直接添加，不标记差异
      if (['.', ',', ':', ';', '。', '，', '：', '；'].includes(item.content)) {
        if (buffer) {
          html += buffer;
          buffer = '';
        }
        html += item.content;
        continue;
      }
      if (item.type === 'diff') {
        if (buffer) {
          html += buffer;
          buffer = '';
        }
        html += `<mark style="background-color: rgb(254, 249, 195); padding: 2px 4px; border-radius: 2px;">${item.content}</mark>`;
      } else {
        buffer += item.content;
      }
    }
    if (buffer) {
      html += buffer;
    }

    // 将处理后的文本按段落格式化
    return html.replace(/  +/g, ' ').trim();
  };

  // P1-01: 从 JD 提取关键词并计算匹配度
  const extractKeywords = (jd: string, optimized: string) => {
    // 简单关键词提取逻辑（实际项目中可以使用后端 API）
    const jdWords = jd.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
    const resumeWords = optimized.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];

    // 常见停用词
    const stopWords = new Set(['with', 'that', 'this', 'will', 'have', 'been', 'were', 'are', 'and', 'the', 'for', 'but', 'not', 'you', 'your', 'from', 'such', 'can', 'about', 'into', 'which', 'their', 'there', 'they', 'what', 'more', 'each', 'also', 'some', 'would', 'these', 'other', 'when', 'where', 'while', 'after', 'before', 'between', 'under', 'above', 'through', 'during', 'without', 'within', 'upon', 'down', 'up', 'out', 'off', 'over', 'just', 'than', 'then', 'once', 'only', 'even', 'well', 'back', 'still', 'both', 'first', 'most', 'much', 'many', 'any', 'all', 'new', 'one', 'own', 'may', 'may', 'our', 'how', 'why', 'who', 'whom', 'does', 'did', 'has', 'had', 'its', 'said', 'she', 'he', 'her', 'him', 'his', 'use', 'used', 'using', 'being', 'know', 'like', 'want', 'need', 'make', 'made', 'take', 'took', 'taken', 'give', 'gave', 'given', 'find', 'found', 'work', 'worked', 'team', 'good', 'great', 'skills', 'skill', 'experience', 'years', 'year', 'role', 'position', 'company', 'responsibilities', 'include', 'including', 'responsible', 'strong', 'proven', 'excellent', 'required', 'preferred', 'plus', 'join', 'join', 'help', 'drive', 'deliver', 'support', 'manage', 'managing', 'leading', 'create', 'develop', 'developing', 'build', 'building', 'design', 'implement', 'implementation', 'ensure', 'collaborate', 'collaboration', 'cross', 'functional', 'stakeholders', 'products', 'product', 'services', 'service', 'solutions', 'solution', 'projects', 'project', 'data', 'analysis', 'analytical', 'problem', 'solving', 'communication', 'skills', 'organizational', 'ability', 'capable', 'highly', 'motivated', 'detail', 'oriented', 'time', 'management', 'multiple', 'priorities', 'deadlines', 'fast', 'paced', 'environment', 'dynamic', 'startup', 'corporate', 'remote', 'hybrid', 'onsite', 'travel', 'relocate', 'authorization', 'visa', 'sponsorship', 'degree', 'bachelor', 'master', 'education', 'certification', 'technical', 'domain', 'industry', 'field', 'area', 'related', 'equivalent', 'combination', 'professional', 'relevant', 'minimum', 'required', 'years', 'experience']);

    // 提取 JD 中的关键词（出现频率较高的）
    const wordCount = jdWords.reduce((acc, word) => {
      if (!stopWords.has(word)) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // 按频率排序，取前 15 个关键词
    const keywords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);

    setExtractedKeywords(keywords);

    // 计算匹配度
    const matched = keywords.filter(keyword =>
      resumeWords.some(rw => rw.includes(keyword) || keyword.includes(rw))
    );
    setMatchedKeywords(matched);
    setShowKeywords(true);
  };

  // P0-01: ATS 评分功能
  const handleAtsScore = async () => {
    if (!originalText || !inputText) {
      setError('请先输入简历内容和职位描述');
      return;
    }

    setAtsLoading(true);
    setError('');

    try {
      const result = await atsAPI.score(originalText, inputText);
      setAtsScoreData(result);
      setShowAtsScore(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'ATS 评分失败';
      setError(detail);
    } finally {
      setAtsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    alert('已复制到剪贴板');
  };

  const handleDownloadMD = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-resume-${selectedMode}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTXT = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-resume-${selectedMode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    // 使用浏览器打印功能生成 PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('请允许弹出窗口以生成 PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>优化简历 - ${selectedMode}</title>
        <style>
          @media print {
            @page { margin: 2cm; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { font-size: 18px; color: #444; margin-top: 20px; }
          h3 { font-size: 16px; color: #555; }
          ul { padding-left: 20px; }
          li { margin-bottom: 5px; }
          strong { font-weight: 600; }
          .section { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        ${markdownToHtml(result)}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Markdown 转 HTML
  const markdownToHtml = (markdown: string): string => {
    let html = markdown
      // 一级标题
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      // 二级标题
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      // 三级标题
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      // 加粗
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 项目符号列表
      .replace(/^[•\-] (.*)$/gm, '<li>$1</li>')
      // 换行
      .replace(/\n/g, '<br>');
    return html;
  };

  const handleDownloadWord = () => {
    // 将 Markdown 格式的文本转换为 Word 文档
    const lines = result.split('\n');
    const docChildren: any[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // 空行
      if (trimmedLine === '') {
        docChildren.push(new Paragraph({ text: '' }));
        return;
      }

      // 一级标题 # 姓名
      if (trimmedLine.startsWith('# ')) {
        docChildren.push(new Paragraph({
          text: trimmedLine.replace(/^#\s*/, ''),
          heading: HeadingLevel.TITLE,
          spacing: { before: 400, after: 300 },
          children: parseInlineFormatting(trimmedLine.replace(/^#\s*/, '')),
        }));
        return;
      }

      // 二级标题 ## 工作经历
      if (trimmedLine.startsWith('## ')) {
        docChildren.push(new Paragraph({
          text: trimmedLine.replace(/^##\s*/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
          children: parseInlineFormatting(trimmedLine.replace(/^##\s*/, '')),
        }));
        return;
      }

      // 三级标题 ### 公司名称
      if (trimmedLine.startsWith('### ')) {
        docChildren.push(new Paragraph({
          text: trimmedLine.replace(/^###\s*/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: parseInlineFormatting(trimmedLine.replace(/^###\s*/, '')),
        }));
        return;
      }

      // 项目符号列表 - 工作内容
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        docChildren.push(new Paragraph({
          text: trimmedLine.replace(/^[-•]\s*/, ''),
          bullet: { level: 0 },
          spacing: { before: 50, after: 50 },
          children: parseInlineFormatting(trimmedLine.replace(/^[-•]\s*/, '')),
        }));
        return;
      }

      // 普通段落（可能包含加粗）
      docChildren.push(new Paragraph({
        children: parseInlineFormatting(trimmedLine),
        spacing: { before: 100, after: 50 },
      }));
    });

    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: 'normal',
            name: 'Normal',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              size: 24,
              font: 'Microsoft YaHei',
            },
          },
        ],
      },
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `optimized-resume-${selectedMode}.docx`);
    });
  };

  // 解析 Markdown 内联格式（加粗）
  const parseInlineFormatting = (text: string): TextRun[] => {
    const runs: TextRun[] = [];
    // 匹配 **加粗** 格式
    const parts = text.split(/(\*\*.*?\*\*)/g);

    parts.forEach((part) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // 加粗文本
        runs.push(new TextRun({
          text: part.replace(/\*\*/g, ''),
          bold: true,
          size: 24,
          font: 'Microsoft YaHei',
        }));
      } else if (part.trim()) {
        // 普通文本
        runs.push(new TextRun({
          text: part,
          size: 24,
          font: 'Microsoft YaHei',
        }));
      }
    });

    return runs;
  };

  const handleResetPrompt = () => {
    const mode = MODE_CONFIGS.find(m => m.id === selectedMode);
    if (mode) {
      setCustomPrompt(mode.defaultPrompt);
    }
  };

  // 二次优化处理函数
  const handleReoptimize = async () => {
    if (!reoptimizePrompt.trim() || !result) {
      setError('请输入优化要求');
      return;
    }

    setReoptimizing(true);
    setError('');

    try {
      // 构建二次优化请求
      const requestData: any = {
        resume_id: parseInt(selectedResumeId),
        job_description: inputText,
        prompt: `${customPrompt}\n\n微调要求：\n${fineTunePrompt}\n\n二次优化要求：\n${reoptimizePrompt}`,
        mode: selectedMode,
        return_analysis: selectedMode === 'match',
      };

      const data = await optimizeAPI.optimize(requestData);

      // 保存之前的结果用于对比
      setOriginalText(result);
      setResult(data.optimized_content);

      // 如果有分析内容，保存并显示
      if (data.analysis) {
        setAnalysisContent(data.analysis);
      }

      // 清空二次优化输入
      setReoptimizePrompt('');
      setShowReoptimize(false);

      // 重新计算关键词匹配
      extractKeywords(inputText, data.optimized_content);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.detail || err.message || '二次优化失败';
      setError(detail);
      console.error('二次优化失败:', err);
    } finally {
      setReoptimizing(false);
    }
  };

  const selectedResume = resumes.find(r => r.id === parseInt(selectedResumeId));
  const currentMode = MODE_CONFIGS.find(m => m.id === selectedMode);
  const isMatchMode = selectedMode === 'match';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">简历智能优化</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            选择已上传的简历，使用 AI 能力进行优化、匹配或翻译
          </p>
        </div>

        {/* 模式选择 */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {MODE_CONFIGS.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-center gap-3
                ${selectedMode === mode.id
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-lg scale-105'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md'
                }`}
            >
              <div className={`p-2 rounded-xl ${selectedMode === mode.id ? 'bg-indigo-500' : 'bg-gray-100'}`}>
                <mode.icon className={`h-5 w-5 ${selectedMode === mode.id ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className="font-semibold">{mode.name}</span>
            </button>
          ))}
        </div>

        {/* 上方区域 - 输入区域 */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* 面板标题栏 */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {isMatchMode ? (
                  <>
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                    匹配优化配置
                  </>
                ) : (
                  <>
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs">1</span>
                    配置优化参数
                  </>
                )}
              </h2>
            </div>

            <div className="p-6">
              {/* 步骤 1: 选择简历 - 列表形式 */}
              {isMatchMode && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <label className="block text-sm font-bold text-blue-800 mb-3">
                      <span className="flex items-center gap-2">
                        <DocumentTextIcon className="h-4 w-4" />
                        选择要优化的简历（单选）
                      </span>
                    </label>
                    {resumes.length === 0 ? (
                      <div className="p-3 bg-white/80 backdrop-blur border border-blue-200 rounded-xl text-blue-700 text-sm">
                        <p className="font-medium">暂无简历</p>
                        <p className="text-xs">请先在简历管理中上传简历</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {resumes.map(resume => (
                          <div
                            key={resume.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer
                              ${selectedResumeId === String(resume.id)
                                ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50'
                              }`}
                            onClick={() => setSelectedResumeId(String(resume.id))}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                ${selectedResumeId === String(resume.id)
                                  ? 'border-indigo-500 bg-indigo-500'
                                  : 'border-gray-300'
                                }`}>
                                {selectedResumeId === String(resume.id) && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{resume.file_name}</p>
                                <p className="text-xs text-gray-500">
                                  {resume.file_type.toUpperCase()} · {new Date(resume.created_at).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openResumePreview(resume);
                              }}
                              className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all flex items-center gap-1"
                            >
                              <EyeIcon className="h-3 w-3" />
                              预览
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 输入 JD - 匹配优化模式 */}
              {isMatchMode && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <DocumentTextIcon className="h-4 w-4 text-indigo-500" />
                        目标职位描述和要求 (必填)
                      </span>
                    </label>

                    {/* 图片上传区域 */}
                    <div className="mb-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                          <PhotoIcon className="h-4 w-4" />
                          上传图片识别
                        </span>
                        {jdImageName && (
                          <button
                            type="button"
                            onClick={handleClearJdImage}
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <TrashIcon className="h-3 w-3" />
                            清除
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleJdImageUpload}
                          disabled={jdImageLoading}
                          className="hidden"
                          id="jd-image-upload"
                        />
                        <label
                          htmlFor="jd-image-upload"
                          className={`px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all flex items-center gap-2
                            ${jdImageLoading
                              ? 'bg-gray-100 text-gray-400 border border-gray-200'
                              : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm'
                            }`}
                        >
                          {jdImageLoading ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              识别中...
                            </>
                          ) : (
                            <>
                              <PhotoIcon className="h-4 w-4" />
                              选择图片
                            </>
                          )}
                        </label>
                        {jdImageName && (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                            ✓ 已识别：{jdImageName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-600 mt-2">
                        支持 JPG、PNG 格式，自动识别图片中的职位描述文字
                      </p>
                    </div>

                    {/* URL 抓取区域 */}
                    <div className="mb-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          URL 抓取职位
                        </span>
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          测试用
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          ref={jdUrlInputRef}
                          type="text"
                          value={jdUrl}
                          onChange={(e) => setJdUrl(e.target.value)}
                          placeholder="输入招聘网站 URL"
                          disabled={jdUrlLoading}
                          className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleFetchFromUrl}
                          disabled={jdUrlLoading || !jdUrl}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2
                            ${jdUrlLoading
                              ? 'bg-gray-100 text-gray-400 border border-gray-200'
                              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm'
                            }`}
                        >
                          {jdUrlLoading ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              抓取中...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="h-4 w-4" />
                              抓取
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-emerald-600 mt-2">
                        支持 BOSS 直聘、前程无忧、智联招聘、拉勾网、猎聘网（注：部分网站使用动态加载，可能无法抓取）
                      </p>
                    </div>

                    {/* 文本输入区域 */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-600">或手动粘贴/输入</span>
                        <span className="text-xs text-gray-400">{inputText.length} 字符</span>
                      </div>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="粘贴目标职位的描述，包括岗位要求、职责、技能要求等..."
                        rows={8}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all shadow-sm text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Prompt 配置 - 可编辑 */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-purple-800 flex items-center gap-2">
                        <BeakerIcon className="h-4 w-4" />
                        Prompt 配置
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPromptConfig(!showPromptConfig)}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          {showPromptConfig ? '收起' : '展开'}
                          <svg
                            className={`w-4 h-4 transition-transform ${showPromptConfig ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleResetPrompt}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                          title="重置为默认 Prompt"
                        >
                          ↺ 重置
                        </button>
                      </div>
                    </div>
                    {showPromptConfig && (
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="输入 Prompt 模板..."
                        rows={12}
                        className="w-full rounded-xl border border-purple-200 bg-white/90 backdrop-blur focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none shadow-sm text-xs text-gray-700 placeholder-purple-300 font-mono leading-relaxed"
                      />
                    )}
                  </div>

                  {/* 开始优化按钮 */}
                  <button
                    type="button"
                    onClick={handleOptimize}
                    disabled={loading || !inputText.trim() || !selectedResumeId}
                    className="w-full px-10 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin inline-block mr-2">⏳</span>
                        优化中...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="inline-block mr-2 h-5 w-5" />
                        开始匹配优化
                      </>
                    )}
                  </button>
                  {error && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700 shadow-sm">
                      <p className="font-bold flex items-center gap-2">
                        <span className="text-lg">⚠️</span> {error}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 非匹配优化模式 - 原有表单 */}
              {!isMatchMode && (
                <form onSubmit={handleOptimize}>
                  {/* 选择简历 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <label className="block text-sm font-bold text-blue-800 mb-2">
                        <span className="flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4" />
                          选择简历
                        </span>
                      </label>
                      {resumes.length === 0 ? (
                        <div className="p-3 bg-white/80 backdrop-blur border border-blue-200 rounded-xl text-blue-700 text-sm">
                          <p className="font-medium">暂无简历</p>
                          <p className="text-xs">请先上传简历</p>
                        </div>
                      ) : (
                        <select
                          value={selectedResumeId}
                          onChange={(e) => setSelectedResumeId(e.target.value)}
                          className="w-full rounded-xl border border-blue-200 bg-white/90 backdrop-blur focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 shadow-sm text-blue-900 font-medium"
                        >
                          {resumes.map(resume => (
                            <option key={resume.id} value={resume.id}>
                              {resume.file_name} ({resume.file_type})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* 微调输入 */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <label className="block text-sm font-bold text-amber-800 mb-2">
                        <span className="flex items-center gap-2">
                          <AdjustmentsHorizontalIcon className="h-4 w-4" />
                          微调要求（可选）
                        </span>
                      </label>
                      <textarea
                        value={fineTunePrompt}
                        onChange={(e) => setFineTunePrompt(e.target.value)}
                        placeholder="例如：'增加项目管理相关描述'、'使用更专业的术语'"
                        rows={3}
                        className="w-full rounded-xl border border-amber-200 bg-white/90 backdrop-blur focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none shadow-sm text-amber-900 placeholder-amber-300"
                      />
                    </div>

                    {/* Prompt 配置 - 可编辑 */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-purple-800 flex items-center gap-2">
                          <BeakerIcon className="h-4 w-4" />
                          Prompt 配置
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPromptConfig(!showPromptConfig)}
                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                          >
                            {showPromptConfig ? '收起' : '展开'}
                            <svg
                              className={`w-4 h-4 transition-transform ${showPromptConfig ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={handleResetPrompt}
                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            title="重置为默认 Prompt"
                          >
                            ↺ 重置
                          </button>
                        </div>
                      </div>
                      {showPromptConfig && (
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="输入 Prompt 模板..."
                          rows={12}
                          className="w-full rounded-xl border border-purple-200 bg-white/90 backdrop-blur focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none shadow-sm text-xs text-gray-700 placeholder-purple-300 font-mono leading-relaxed"
                        />
                      )}
                    </div>
                  </div>

                  {/* 目标职位内容输入域 */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold shadow-md">2</span>
                        {currentMode?.inputLabel}
                      </span>
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={currentMode?.inputPlaceholder}
                      rows={6}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all shadow-sm text-gray-700 placeholder-gray-400"
                    />
                  </div>

                  {/* 开始按钮 + 错误提示 */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading || !selectedResumeId || !inputText || resumes.length === 0}
                      className="flex justify-center items-center px-10 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                        text-white font-bold rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600
                        transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50
                        disabled:cursor-not-allowed disabled:hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          处理中...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-5 w-5 mr-2" />
                          开始{currentMode?.name}
                        </>
                      )}
                    </button>

                    {error && (
                      <div className="flex-1 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700 shadow-sm">
                        <p className="font-bold flex items-center gap-2">
                          <span className="text-lg">⚠️</span> {error}
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 下方区域 - 优化结果（全宽） */}
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
          {/* 面板标题栏 */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs">3</span>
                <BeakerIcon className="h-5 w-5" />
                {currentMode?.resultTitle}
              </h2>
              {result && (
                <div className="flex gap-2">
                  {/* 预览原始简历按钮 */}
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-white text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm"
                    title="查看原始简历"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    预览原始简历
                  </button>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                    title="复制"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                    复制
                  </button>
                  <div className="relative group">
                    <button
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                      title="下载"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      下载
                    </button>
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-200
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                      <button
                        onClick={handleDownloadPDF}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100 transition-colors"
                      >
                        📄 PDF 格式
                      </button>
                      <button
                        onClick={handleDownloadMD}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100 transition-colors"
                      >
                        📝 Markdown 格式
                      </button>
                      <button
                        onClick={handleDownloadWord}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100 transition-colors"
                      >
                        📄 Word 格式
                      </button>
                      <button
                        onClick={handleDownloadTXT}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                      >
                        📄 TXT 格式
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

            <div className="p-6">
              {/* P0-01: ATS 评分入口和结果 */}
              {originalText && inputText && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4 text-indigo-500" />
                      ATS 简历评分
                    </h3>
                    <button
                      onClick={handleAtsScore}
                      disabled={atsLoading}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 flex items-center gap-2
                        ${atsLoading
                          ? 'bg-gray-100 text-gray-400 border-gray-200'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-600 shadow-md hover:shadow-lg'
                        }`}
                    >
                      {atsLoading ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          评分中...
                        </>
                      ) : (
                        <>
                          <ChartBarIcon className="h-4 w-4" />
                          开始 ATS 评分
                        </>
                      )}
                    </button>
                  </div>

                  {/* ATS 评分结果面板 */}
                  {showAtsScore && atsScoreData && (
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-xs">✓</span>
                          ATS 兼容性评分报告
                        </h3>
                        <button
                          onClick={() => setShowAtsScore(false)}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          收起
                        </button>
                      </div>

                      {/* 总分 */}
                      <div className="mb-4 p-3 bg-white rounded-xl border border-indigo-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 font-medium">综合评分</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            {atsScoreData.total_score}
                            <span className="text-sm text-gray-400 font-normal">/100</span>
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              atsScoreData.total_score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                              atsScoreData.total_score >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-rose-500'
                            }`}
                            style={{ width: `${atsScoreData.total_score}%` }}
                          />
                        </div>
                      </div>

                      {/* 各维度评分 */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {Object.entries(atsScoreData.dimensions).map(([key, value]: [string, any]) => (
                          <div key={key} className="p-3 bg-white rounded-xl border border-indigo-100">
                            <div className="text-xs text-gray-500 mb-1 capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="flex items-end justify-between">
                              <span className="text-lg font-bold text-indigo-700">
                                {typeof value.score === 'number' ? Math.round(value.score) : 'N/A'}
                              </span>
                              <span className="text-xs text-gray-400">/ 100</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 改进建议 */}
                      {atsScoreData.suggestions && atsScoreData.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1">
                            <span>💡</span> 改进建议
                          </h4>
                          <ul className="space-y-1">
                            {atsScoreData.suggestions.slice(0, 5).map((suggestion, index) => (
                              <li key={index} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="text-indigo-500 mt-0.5">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* P1-01: 关键词匹配度 */}
              {showKeywords && extractedKeywords.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-xs">✓</span>
                      关键词匹配分析
                    </h3>
                    <button
                      onClick={() => setShowKeywords(false)}
                      className="text-xs text-emerald-600 hover:text-emerald-800"
                    >
                      收起
                    </button>
                  </div>

                  {/* 匹配度进度条 */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-700 font-medium">匹配度</span>
                      <span className="text-emerald-800 font-bold">
                        {Math.round((matchedKeywords.length / extractedKeywords.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
                        style={{ width: `${(matchedKeywords.length / extractedKeywords.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 关键词标签 */}
                  <div className="flex flex-wrap gap-2">
                    {extractedKeywords.map((keyword) => {
                      const isMatched = matchedKeywords.includes(keyword);
                      return (
                        <span
                          key={keyword}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                            ${isMatched
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          title={isMatched ? '已匹配' : '未匹配'}
                        >
                          {keyword}
                          {isMatched ? (
                            <CheckCircleIcon className="inline-block w-3 h-3 ml-1" />
                          ) : (
                            <XCircleIcon className="inline-block w-3 h-3 ml-1" />
                          )}
                        </span>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs text-emerald-600">
                    💡 绿色 = 已匹配，黄色 = 未匹配
                  </p>
                </div>
              )}

              {/* 进度条 */}
              {loading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="font-medium">处理进度</span>
                    <span className="font-bold text-indigo-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {result ? (
                <div className="space-y-4">
                  {/* 操作按钮：查看对比、查看分析、二次优化 */}
                  {isMatchMode && (
                    <div className="flex gap-3 mb-4">
                      <button
                        type="button"
                        onClick={openComparison}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 flex items-center gap-2
                          ${showComparisonModal
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600 shadow-lg'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                          }`}
                      >
                        <EyeIcon className="h-4 w-4" />
                        {showComparisonModal ? '✓ 对比中' : '查看对比'}
                      </button>
                      {analysisContent && (
                        <button
                          type="button"
                          onClick={() => setShowAnalysis(!showAnalysis)}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 flex items-center gap-2
                            ${showAnalysis
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-lg'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                            }`}
                        >
                          <AdjustmentsHorizontalIcon className="h-4 w-4" />
                          {showAnalysis ? '✓ 已展开' : '查看优化分析'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowReoptimize(!showReoptimize)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 flex items-center gap-2
                          ${showReoptimize
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-600 shadow-lg'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {showReoptimize ? '✓ 已展开' : '二次优化'}
                      </button>
                    </div>
                  )}

                  {/* 二次优化输入框 */}
                  {showReoptimize && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-bold text-indigo-800 flex items-center gap-2">
                          <SparklesIcon className="h-4 w-4" />
                          二次优化要求
                        </label>
                        <button
                          onClick={() => setShowReoptimize(false)}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          收起
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <textarea
                          value={reoptimizePrompt}
                          onChange={(e) => setReoptimizePrompt(e.target.value)}
                          placeholder="请输入需要进一步优化的要求，例如：'增加量化数据'、'精简工作经历描述'、'突出领导能力'..."
                          rows={3}
                          className="flex-1 rounded-xl border border-indigo-200 bg-white/90 backdrop-blur focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none shadow-sm text-indigo-900 placeholder-indigo-300"
                        />
                        <button
                          type="button"
                          onClick={handleReoptimize}
                          disabled={reoptimizing || !reoptimizePrompt.trim()}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                          {reoptimizing ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              优化中...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-5 w-5" />
                              开始优化
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-indigo-600 mt-2">
                        💡 基于当前优化结果进行二次优化，将覆盖之前的结果
                      </p>
                    </div>
                  )}

                  {/* 优化分析面板 */}
                  {isMatchMode && showAnalysis && analysisContent && (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                          <AdjustmentsHorizontalIcon className="h-4 w-4" />
                          优化分析
                        </h3>
                        <button
                          onClick={() => setShowAnalysis(false)}
                          className="text-xs text-amber-600 hover:text-amber-800"
                        >
                          收起
                        </button>
                      </div>
                      <div className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                        {analysisContent}
                      </div>
                    </div>
                  )}

                  {/* 优化结果文本框 - 增加高度 */}
                  <div className="relative">
                    <textarea
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      className="w-full h-[800px] p-4 bg-white/90 backdrop-blur border-2 border-indigo-200 rounded-xl
                        text-sm text-gray-700 font-sans leading-relaxed resize-none
                        focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none shadow-md"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className="text-indigo-500">💡</span> 内容可直接编辑
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100
                    flex items-center justify-center shadow-inner">
                    <BeakerIcon className="h-12 w-12 text-indigo-500" />
                  </div>
                  <p className="text-gray-600 font-semibold mb-2">{currentMode?.resultTitle || '优化结果'}将显示在这里</p>
                  <p className="text-sm text-gray-400">
                    配置参数后点击"开始{currentMode?.name}"按钮
                  </p>
                </div>
              )}
            </div>

          {/* 原始简历预览对话框 */}
          {showPreviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* 背景遮罩 */}
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowPreviewModal(false)}
              />
              {/* 对话框容器 */}
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* 标题栏 */}
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    简历预览 - {previewResume?.file_name || '原始简历'}
                  </h3>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                    title="关闭"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* 内容区域 */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {previewLoading ? (
                    <div className="text-center py-20">
                      <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                      <p className="text-gray-500 mt-4">加载预览中...</p>
                    </div>
                  ) : previewResume ? (
                    previewResume.file_type === 'pdf' ? (
                      // PDF 预览 - 使用 iframe 嵌入
                      <div className="w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <iframe
                          src={`${resumeAPI.getFileUrl(previewResume.id)}#toolbar=0`}
                          className="w-full h-full"
                          title="PDF 预览"
                        />
                      </div>
                    ) : (
                      // 文本格式预览
                      <div className="w-full h-[600px] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                        <div className="p-4 h-full overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                            {previewResume.content_text || '暂无内容'}
                          </pre>
                        </div>
                      </div>
                    )
                  ) : originalText ? (
                    // 原始文本预览（兼容旧逻辑）
                    <div className="w-full h-[600px] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                      <div className="p-4 h-full overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                          {originalText}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">暂无预览内容</p>
                    </div>
                  )}
                </div>
                {/* 底部按钮 */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 优化对比对话框 */}
          {showComparisonModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* 背景遮罩 */}
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowComparisonModal(false)}
              />
              {/* 对话框容器 */}
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* 标题栏 */}
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                    <EyeIcon className="h-5 w-5" />
                    优化前后对比
                  </h3>
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                    title="关闭"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* 内容区域 - 左右分栏对比 */}
                <div className="grid grid-cols-2 gap-4 p-6 max-h-[70vh] overflow-y-auto">
                  {/* 左侧：原始简历 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs">1</span>
                      原始简历
                    </h4>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-[60vh] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                        {originalText}
                      </pre>
                    </div>
                  </div>
                  {/* 右侧：优化后（黄色高亮差异） */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200 text-emerald-600 text-xs">2</span>
                      优化后
                      <span className="ml-auto text-xs text-emerald-600 font-normal">黄色高亮为差异内容</span>
                    </h4>
                    <div
                      className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-xl border border-emerald-200 max-h-[60vh] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: generateDiffHtml() }}
                    />
                  </div>
                </div>
                {/* 底部按钮 */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OptimizePage;
