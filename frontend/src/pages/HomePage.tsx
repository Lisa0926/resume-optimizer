import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  SparklesIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { resumeAPI } from '../services/api';
import type { Resume } from '../types';

function HomePage() {
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);

  useEffect(() => {
    resumeAPI.list(1, 5).then(data => {
      setRecentResumes(data.items || []);
    }).catch(console.error);
  }, []);

  const menuItems = [
    {
      title: '简历管理',
      description: '上传、管理、预览您的简历',
      icon: DocumentTextIcon,
      to: '/resumes',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      stats: `${recentResumes.length} 份简历`,
    },
    {
      title: '简历优化',
      description: 'AI 驱动，根据 JD 优化简历',
      icon: SparklesIcon,
      to: '/optimize',
      color: 'from-emerald-500 to-emerald-600',
      hoverColor: 'hover:from-emerald-600 hover:to-emerald-700',
      stats: 'AI 优化',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <SparklesIcon className="h-16 w-16 mx-auto mb-6 text-yellow-300 flex-shrink-0" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              智能简历优化器
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              上传您的简历，让 AI 帮您根据目标职位量身定制，提升求职成功率
            </p>
          </div>
        </div>
      </div>

      {/* Main Menu Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className={`group relative bg-white rounded-2xl shadow-lg p-8
                transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                ${item.hoverColor} bg-gradient-to-br ${item.color}`}
            >
              <div className="text-white">
                <item.icon className="h-14 w-14 mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/80 mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {item.stats}
                  </span>
                  <svg
                    className="h-6 w-6 transform group-hover:translate-x-2 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">最近简历</h2>
            <Link
              to="/resumes"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              查看全部
              <svg
                className="h-5 w-5 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {recentResumes.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">暂无简历</p>
              <Link
                to="/resumes"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500
                  text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600
                  transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                上传第一份简历
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{resume.file_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(resume.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {resume.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                    <Link
                      to="/optimize"
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500
                        text-white text-sm rounded-lg hover:from-emerald-600 hover:to-teal-600
                        transition-all duration-300"
                    >
                      优化
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg p-8 text-white">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">{recentResumes.length}</p>
              <p className="text-white/80">简历总数</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">100%</p>
              <p className="text-white/80">AI 优化率</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
