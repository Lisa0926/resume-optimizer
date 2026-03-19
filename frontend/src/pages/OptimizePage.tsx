import { useState, useEffect } from 'react';
import { optimizeAPI, resumeAPI } from '../services/api';
import type { Resume } from '../types';
import { SparklesIcon, BeakerIcon, ClipboardDocumentIcon, ArrowDownTrayIcon, DocumentTextIcon, AdjustmentsHorizontalIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// 默认 Prompt 模板
const DEFAULT_PROMPTS = {
  match: `1，优化过程使用一步一步的思考链。
2，优化过程基于客观、真实、中立、不迎合的模式。
3，我履历里没有的经历不要添加。
4，使用和我的简历一致的语言（中文/英文）。
5，优化后的简历与原结构保持一致。项目经历也要优化。优化后以纯文本格式输出。
6，只返回优化后的简历内容，去除所有优化过程和优化原因。
7，保持短平快的风格。分句不要太长，要让人在 10 秒内了解我的核心动作、结果和优势。`,
  optimize: `你是一位专业的简历优化专家。你的任务是根据用户提供的职位描述，帮助优化简历内容，使其更符合目标职位的要求。

请遵循以下原则：
1. 突出与职位相关的技能和经验
2. 使用量化成果来展示能力
3. 调整关键词以匹配职位描述
4. 保持专业、简洁的表达
5. 建议具体的改进点

请直接输出优化后的简历内容，不需要额外解释。`,
  translate: `待输入`,
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
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [fineTunePrompt, setFineTunePrompt] = useState(''); // 微调 prompt
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  // 加载简历列表
  useEffect(() => {
    resumeAPI.list(1, 100).then(data => {
      setResumes(data.items || []);
      if (data.items?.length > 0) {
        setSelectedResumeId(String(data.items[0].id));
      }
    }).catch(console.error);
  }, []);

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

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResumeId || !inputText) {
      setError('请选择简历并输入必要信息');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      // 构建请求数据 - 合并主 prompt 和微调 prompt
      const requestData: any = {
        resume_id: parseInt(selectedResumeId),
        job_description: inputText,
        prompt: fineTunePrompt ? `${customPrompt}\n\n微调要求：\n${fineTunePrompt}` : customPrompt,
        mode: selectedMode,
      };

      const data = await optimizeAPI.optimize(requestData);
      setResult(data.optimized_content);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.detail || err.message || '优化失败，请检查 API Key 配置和网络连接';
      setError(detail);
      console.error('优化失败:', err);
    } finally {
      setLoading(false);
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
          spacing: { before: 50, after: 50, left: 360 },
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

  const handleSavePrompt = () => {
    localStorage.setItem(`prompt_${selectedMode}`, customPrompt);
    setShowPromptEditor(false);
    alert('Prompt 已保存');
  };

  const handleResetPrompt = () => {
    const mode = MODE_CONFIGS.find(m => m.id === selectedMode);
    if (mode) {
      setCustomPrompt(mode.defaultPrompt);
    }
  };

  const selectedResume = resumes.find(r => r.id === parseInt(selectedResumeId));
  const currentMode = MODE_CONFIGS.find(m => m.id === selectedMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-6 text-center">
          <SparklesIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">简历智能优化</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            选择已上传的简历，使用 AI 能力进行优化、匹配或翻译
          </p>
        </div>

        {/* 使用技巧 - 移到顶部 */}
        <div className="mb-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <SparklesIcon className="h-5 w-5 mr-2 text-indigo-500" />
            使用技巧
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center
                font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">选择功能</p>
                <p className="text-xs text-gray-500 mt-1">选择优化/匹配/翻译模式</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center
                font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">选择简历</p>
                <p className="text-xs text-gray-500 mt-1">从下拉列表中选择要处理的简历</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center
                font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">输入信息</p>
                <p className="text-xs text-gray-500 mt-1">输入 JD 或目标语言</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center
                font-bold text-sm flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">获取结果</p>
                <p className="text-xs text-gray-500 mt-1">AI 生成结果，可复制下载</p>
              </div>
            </div>
          </div>
        </div>

        {/* 模式选择 */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {MODE_CONFIGS.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2
                ${selectedMode === mode.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
            >
              <mode.icon className={`h-5 w-5 ${selectedMode === mode.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="font-medium">{mode.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 输入区域 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 h-fit">
            <form onSubmit={handleOptimize}>
              {/* 选择简历 */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  选择简历
                </label>
                {resumes.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700">
                    <p className="font-medium mb-2">暂无简历</p>
                    <p className="text-sm">请先在简历管理中上传简历</p>
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {resumes.map(resume => (
                      <option key={resume.id} value={resume.id}>
                        {resume.file_name} ({resume.file_type})
                      </option>
                    ))}
                  </select>
                )}
                {selectedResume && (
                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="flex items-start gap-3">
                      <DocumentTextIcon className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-indigo-800">
                        <p className="font-medium">{selectedResume.file_name}</p>
                        <p className="text-indigo-600 mt-1">
                          {selectedResume.tags.length > 0
                            ? `标签：${selectedResume.tags.map(t => t.name).join(', ')}`
                            : '暂无标签'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 输入 JD 或目标语言 */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentMode?.inputLabel}
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={currentMode?.inputPlaceholder}
                  rows={6}
                  className="w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Prompt 配置 - 只读展示 */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Prompt 配置（只读）
                  </label>
                  <button
                    type="button"
                    onClick={handleResetPrompt}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    重置默认
                  </button>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans max-h-32 overflow-y-auto">
                    {customPrompt}
                  </pre>
                </div>
              </div>

              {/* 微调输入窗口 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  微调要求（可选）
                </label>
                <textarea
                  value={fineTunePrompt}
                  onChange={(e) => setFineTunePrompt(e.target.value)}
                  placeholder="输入对本次优化的微调建议，例如：'增加项目管理相关描述'、'突出技术栈深度'等（临时使用，不保存）"
                  rows={3}
                  className="w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none text-sm"
                />
                {fineTunePrompt && (
                  <button
                    type="button"
                    onClick={() => setFineTunePrompt('')}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    清空微调要求
                  </button>
                )}
              </div>

              {/* 开始按钮 */}
              <button
                type="submit"
                disabled={loading || !selectedResumeId || !inputText || resumes.length === 0}
                className="w-full flex justify-center items-center px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500
                  text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600
                  transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50
                  disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    处理中...
                  </>
                ) : (
                  <>
                    {currentMode && <currentMode.icon className="h-5 w-5 mr-2" />}
                    开始{currentMode?.name}
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <p className="font-medium mb-1">处理失败</p>
                  <p>{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* 结果区域 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BeakerIcon className="h-5 w-5 mr-2 text-indigo-500" />
                {currentMode?.resultTitle}
              </h2>
              {result && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100
                      rounded-lg transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                    复制
                  </button>
                  <div className="relative group">
                    <button
                      className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100
                        rounded-lg transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      下载
                    </button>
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={handleDownloadMD}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100
                          rounded-t-lg border-b border-gray-100"
                      >
                        Markdown 格式
                      </button>
                      <button
                        onClick={handleDownloadWord}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100
                          border-b border-gray-100"
                      >
                        Word 格式
                      </button>
                      <button
                        onClick={handleDownloadTXT}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100
                          rounded-b-lg"
                      >
                        TXT 格式
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 进度条 */}
            {loading && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>处理进度</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {result ? (
              <div className="prose prose-sm max-h-[550px] overflow-y-auto bg-gradient-to-b from-gray-50 to-white
                rounded-xl p-4 border border-gray-100">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {result}
                </pre>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="h-20 w-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full
                  flex items-center justify-center mx-auto mb-6">
                  <BeakerIcon className="h-10 w-10 text-indigo-500" />
                </div>
                <p className="text-gray-500 font-medium mb-2">{currentMode?.resultTitle || '优化结果'}将显示在这里</p>
                <p className="text-sm text-gray-400">
                  选择简历并输入信息后，点击"开始{currentMode?.name}"按钮
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptimizePage;
