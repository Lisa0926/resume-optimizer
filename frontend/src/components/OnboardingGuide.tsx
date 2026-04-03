import { useState, useEffect } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, SparklesIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tip?: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: '上传简历',
    description: '支持 PDF、DOCX、Markdown 格式，AI 将自动解析内容',
    icon: CloudArrowUpIcon,
    tip: '建议上传最新版本的简历，以获得最佳优化效果',
  },
  {
    title: '管理标签',
    description: '为简历添加技能标签，便于分类和快速查找',
    icon: DocumentTextIcon,
    tip: '标签可以帮助您更好地组织多份不同方向的简历',
  },
  {
    title: '智能优化',
    description: '输入目标职位描述，AI 将为您量身定制优化简历',
    icon: SparklesIcon,
    tip: '优化时可以微调 Prompt，让 AI 更好地理解您的需求',
  },
];

interface OnboardingGuideProps {
  onComplete?: () => void;
}

export function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (hasSeenOnboarding === 'true') {
      setIsVisible(false);
      onComplete?.();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* 关闭按钮 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* 进度条 */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1">
          <div
            className="h-full bg-white/50 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 内容区域 */}
        <div className="p-8">
          {/* 步骤指示器 */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index <= currentStep ? 'w-8 bg-indigo-500' : 'w-2 bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 图标 */}
          <div className="h-20 w-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <step.icon className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          </div>

          {/* 标题和描述 */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-3">
            {step.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{step.description}</p>

          {/* 提示信息 */}
          {step.tip && (
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-indigo-700 dark:text-indigo-300 flex items-start">
                <SparklesIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                {step.tip}
              </p>
            </div>
          )}

          {/* 导航按钮 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              上一步
            </button>

            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                开始使用
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors font-medium"
              >
                下一步
                <ChevronRightIcon className="h-5 w-5 ml-1" />
              </button>
            )}
          </div>

          {/* 跳过提示 */}
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full mt-4 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              跳过引导
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
