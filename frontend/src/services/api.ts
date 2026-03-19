import apiClient from './client';
import type { Resume, Tag, ResumeListResponse, MessageResponse, OptimizeRequest, OptimizeResponse } from '../types';

// ==================== 简历 API ====================

export const resumeAPI = {
  // 上传简历
  upload: async (file: File): Promise<Resume> => {
    const formData = new FormData();
    formData.append('file', file);
    // 注意：client.ts 的拦截器已经返回 response.data，但 multipart/form-data 不需要解构
    const response = await apiClient.post<Resume>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  // 获取简历列表
  list: async (page = 1, pageSize = 10): Promise<ResumeListResponse> => {
    // 拦截器已返回 response.data
    const response = await apiClient.get<ResumeListResponse>('/resumes', {
      params: { page, page_size: pageSize },
    });
    return response;
  },

  // 获取单个简历
  get: async (id: number): Promise<Resume> => {
    const response = await apiClient.get<Resume>(`/resumes/${id}`);
    return response;
  },

  // 更新简历标签
  update: async (id: number, data: { tags?: string[] }): Promise<Resume> => {
    const response = await apiClient.put<Resume>(`/resumes/${id}`, data);
    return response;
  },

  // 删除简历
  delete: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/resumes/${id}`);
    return response;
  },

  // 批量删除
  batchDelete: async (ids: number[]): Promise<MessageResponse> => {
    const params = ids.map(id => `ids=${id}`).join('&');
    const response = await apiClient.delete<MessageResponse>(`/resumes?${params}`);
    return response;
  },

  // 获取所有标签
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/resumes/tags/list');
    return response;
  },
};

// ==================== 标签 API ====================

export const tagAPI = {
  // 获取标签列表
  list: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/tags');
    return response;
  },

  // 创建标签
  create: async (name: string): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/tags', { name });
    return response;
  },

  // 删除标签
  delete: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/tags/${id}`);
    return response;
  },
};

// ==================== 优化 API ====================

export const optimizeAPI = {
  // 优化简历
  optimize: async (data: OptimizeRequest): Promise<OptimizeResponse> => {
    const response = await apiClient.post<OptimizeResponse>('/optimizations', data);
    return response;
  },

  // 获取优化历史
  getRecords: async (resumeId: number) => {
    const response = await apiClient.get(`/optimizations/records/${resumeId}`);
    return response;
  },
};
