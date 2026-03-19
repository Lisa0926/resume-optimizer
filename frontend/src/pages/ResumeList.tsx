import { useState, useEffect, useCallback, useRef } from 'react';
import { resumeAPI, tagAPI } from '../services/api';
import type { Resume, Tag } from '../types';
import {
  TrashIcon,
  DocumentTextIcon,
  TagIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  EyeIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedResumes, setSelectedResumes] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // 预览状态
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [previewTab, setPreviewTab] = useState<'text' | 'raw'>('text'); // text=纯文本预览，raw=原始内容

  // 标签管理状态
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [currentResumeForTags, setCurrentResumeForTags] = useState<Resume | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  // 拖拽上传状态
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await resumeAPI.list(currentPage, pageSize);
      setResumes(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('加载简历失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const loadTags = useCallback(async () => {
    try {
      const data = await resumeAPI.getTags();
      setTags(data || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  }, []);

  useEffect(() => {
    loadResumes();
    loadTags();
  }, [loadResumes, loadTags]);

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // 检查文件类型
    const allowedTypes = ['.pdf', '.docx', '.md', '.txt'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert('不支持的文件类型，请上传 PDF、DOCX、MD 或 TXT 文件');
      return;
    }

    setUploading(true);
    try {
      await resumeAPI.upload(file);
      await loadResumes();
      // 显示成功提示
    } catch (error: any) {
      console.error('上传失败:', error);
      alert(`上传失败：${error.response?.data?.detail || '请检查文件格式'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // 拖拽上传处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // 删除简历
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这份简历吗？')) return;

    try {
      await resumeAPI.delete(id);
      await loadResumes();
      setSelectedResumes(selectedResumes.filter(r => r !== id));
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedResumes.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedResumes.length} 份简历吗？`)) return;

    try {
      await resumeAPI.batchDelete(selectedResumes);
      await loadResumes();
      setSelectedResumes([]);
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  // 选择/取消选择简历
  const toggleSelectResume = (id: number) => {
    setSelectedResumes(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedResumes.length === resumes.length) {
      setSelectedResumes([]);
    } else {
      setSelectedResumes(resumes.map(r => r.id));
    }
  };

  // 打开标签管理弹窗
  const openTagModal = (resume: Resume) => {
    setCurrentResumeForTags(resume);
    setSelectedTags(resume.tags.map(t => t.name));
    setTagModalOpen(true);
  };

  // 保存标签
  const saveTags = async () => {
    if (!currentResumeForTags) return;

    try {
      await resumeAPI.update(currentResumeForTags.id, { tags: selectedTags });
      await loadResumes();
      setTagModalOpen(false);
    } catch (error) {
      console.error('保存标签失败:', error);
    }
  };

  // 创建新标签
  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await tagAPI.create(newTagName.trim());
      setNewTagName('');
      await loadTags();
    } catch (error) {
      console.error('创建标签失败:', error);
    }
  };

  // 切换标签选择
  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">简历管理</h1>
          <p className="text-gray-500">管理您的简历文件，支持 PDF、DOCX、MD、TXT 格式</p>
        </div>

        {/* 上传区域 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-8 border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
            ${isDragOver
              ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
              : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
            }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.md,.txt"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 font-medium">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <CloudArrowUpIcon className={`h-16 w-16 mb-4 ${isDragOver ? 'text-indigo-600' : 'text-gray-400'}`} />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragOver ? '释放以上传文件' : '点击或拖拽文件到此处上传'}
              </p>
              <p className="text-sm text-gray-500">
                支持格式：PDF、DOCX、MD、TXT（最大 10MB）
              </p>
            </div>
          )}
        </div>

        {/* 批量操作栏 */}
        {selectedResumes.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl p-4 flex justify-between items-center shadow-lg">
            <span className="font-medium">已选择 {selectedResumes.length} 份简历</span>
            <button
              onClick={handleBatchDelete}
              className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              删除选中
            </button>
          </div>
        )}

        {/* 简历列表 */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <FolderOpenIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">暂无简历</h3>
            <p className="text-gray-500 mb-6">上传第一份简历开始使用</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500
                text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600
                transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              上传简历
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedResumes.length === resumes.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      文件名
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      标签
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resumes.map((resume) => (
                    <tr key={resume.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedResumes.includes(resume.id)}
                          onChange={() => toggleSelectResume(resume.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                            <DocumentTextIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{resume.file_name}</p>
                            <button
                              onClick={() => setPreviewResume(resume)}
                              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center mt-1"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              预览内容
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase
                          ${resume.file_type === 'pdf' ? 'bg-red-100 text-red-700' :
                            resume.file_type === 'docx' ? 'bg-blue-100 text-blue-700' :
                              resume.file_type === 'md' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                          }`}>
                          {resume.file_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {resume.tags.length === 0 ? (
                            <span className="text-gray-400 text-sm">—</span>
                          ) : (
                            resume.tags.map(tag => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800"
                              >
                                <TagIcon className="h-3 w-3 mr-1" />
                                {tag.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(resume.created_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openTagModal(resume)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="管理标签"
                          >
                            <TagIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(resume.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="mt-6 flex justify-between items-center bg-white rounded-xl shadow-lg px-6 py-4">
              <p className="text-sm text-gray-600">
                显示 <span className="font-medium text-gray-900">{(currentPage - 1) * pageSize + 1}</span> -{' '}
                <span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, total)}</span>{' '}
                共 <span className="font-medium text-gray-900">{total}</span> 条
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 预览弹窗 */}
      <Dialog
        open={!!previewResume}
        onClose={() => {
          setPreviewResume(null);
          setPreviewTab('text');
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl max-h-[80vh] bg-white rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <DocumentTextIcon className="h-5 w-5 text-white" />
                  </div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {previewResume?.file_name}
                  </Dialog.Title>
                </div>
                {/* 预览模式切换 */}
                <div className="flex gap-1 ml-4 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewTab('text')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      previewTab === 'text'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    纯文本预览
                  </button>
                  <button
                    onClick={() => setPreviewTab('raw')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      previewTab === 'raw'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    原始内容
                  </button>
                </div>
              </div>
              <button
                onClick={() => setPreviewResume(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {previewResume?.content_text ? (
                previewTab === 'text' ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-gray-50 p-4 rounded-xl">
                      {previewResume.content_text}
                    </pre>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre text-xs text-gray-600 font-mono leading-relaxed bg-gray-50 p-4 rounded-xl overflow-x-auto">
                      {previewResume.content_text}
                    </pre>
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>无法解析文件内容</p>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* 标签管理弹窗 */}
      <Dialog
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                管理标签
              </Dialog.Title>
              <button
                onClick={() => setTagModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {/* 新建标签 */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="输入新标签名称"
                  className="flex-1 rounded-xl border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  onKeyPress={(e) => e.key === 'Enter' && createTag()}
                />
                <button
                  onClick={createTag}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm
                    hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              {/* 标签列表 */}
              <div className="flex flex-wrap gap-2 mb-6 max-h-60 overflow-y-auto">
                {(tags || []).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                      selectedTags.includes(tag.name)
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
                {(!tags || tags.length === 0) && (
                  <p className="text-sm text-gray-400 w-full text-center py-4">暂无标签，请创建新标签</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
              <button
                onClick={() => setTagModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveTags}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl
                  hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-md"
              >
                保存
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default ResumesPage;
