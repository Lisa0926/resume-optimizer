import axios from 'axios';
import type { AxiosInstance } from 'axios';

// API 基础地址 - 使用相对路径，通过 Vite 代理到后端
const API_BASE_URL = '/api';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 秒 - 给 LLM 调用足够时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API 请求失败:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
