import { useState, useEffect, useCallback } from 'react';
import { tagAPI } from '../services/api';
import type { Tag } from '../types';
import { PlusIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';

function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tagAPI.list();
      setTags(data || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setCreating(true);
    try {
      await tagAPI.create(newTagName.trim());
      setNewTagName('');
      await loadTags();
    } catch (error) {
      console.error('创建标签失败:', error);
      alert('创建失败，标签可能已存在');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个标签吗？')) return;

    try {
      await tagAPI.delete(id);
      await loadTags();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">标签管理</h1>
          <p className="text-gray-500 dark:text-gray-400">创建和管理简历分类标签，方便组织和筛选简历</p>
        </div>

        {/* 创建标签表单 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-800/50 p-6 mb-6 border border-gray-100 dark:border-gray-800">
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="输入标签名称，如：前端、后端、产品经理..."
              className="flex-1 rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={creating || !newTagName.trim()}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500
                text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600
                transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {creating ? '创建中...' : '创建标签'}
            </button>
          </form>
        </div>

        {/* 标签列表 */}
        {loading ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800">
            <TagIcon className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">暂无标签</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">创建第一个标签开始使用</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                共 {tags.length} 个标签
              </p>
            </div>
            {tags.map((tag, index) => (
              <div
                key={tag.id}
                className="flex justify-between items-center px-6 py-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200
                  first:rounded-t-none last:rounded-b-none border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                style={{ borderRadius: index === 0 ? '0' : '0' }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500
                    flex items-center justify-center shadow-md">
                    <TagIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{tag.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      创建于 {new Date(tag.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="p-3 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TagsPage;
