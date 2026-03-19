// 简历类型
export interface Resume {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  content_text: string | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

// 标签类型
export interface Tag {
  id: number;
  name: string;
  created_at: string;
}

// 优化记录类型
export interface OptimizationRecord {
  id: number;
  resume_id: number;
  job_description: string;
  original_content: string;
  optimized_content: string;
  conversation_history: string | null;
  created_at: string;
}

// API 响应类型
export interface ResumeListResponse {
  items: Resume[];
  total: number;
}

export interface MessageResponse {
  message: string;
  success?: boolean;
}

// 优化请求类型
export interface OptimizeRequest {
  resume_id: number;
  job_description: string;
  conversation_history?: Record<string, unknown>[];
}

export interface OptimizeResponse {
  optimized_content: string;
  conversation_history: Record<string, unknown>[];
}
