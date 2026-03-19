# 智能简历优化器

基于 AI 的简历优化和管理工具，支持多种简历格式解析、标签管理和智能优化功能。

## 功能特性

### 简历管理
- 支持上传 PDF、DOCX、MD、TXT 格式简历
- 简历列表展示、分页、预览
- 批量删除功能
- 标签管理（多对多关系）

### 标签管理
- 创建、删除标签
- 为简历添加/移除标签
- 标签筛选（待实现）

### 智能优化
- 输入目标职位 JD
- 调用阿里云百炼 API（Qwen 模型）优化简历
- 支持多轮对话微调
- 优化结果导出（TXT/MD）

## 技术栈

### 后端
- Python 3.10+
- FastAPI
- SQLAlchemy (Async)
- SQLite
- Pydantic

### 前端
- React 18
- TypeScript
- Vite
- TailwindCSS
- Headless UI
- React Router

### 文件解析
- PyPDF2 (PDF)
- python-docx (DOCX)
- markdown (MD)

### LLM 集成
- 阿里云百炼 SDK (DashScope)
- Qwen 模型

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+
- WSL (Ubuntu) 环境

### 一键安装

```bash
# 进入项目目录
cd resume-optimizer

# 运行安装脚本
./setup.sh
```

### 配置 API Key

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑 .env 文件，填入阿里云百炼 API Key
nano backend/.env
```

### 启动开发服务器

```bash
# 方式一：使用启动脚本
./start.sh

# 方式二：分别启动
# 后端
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 前端（新终端窗口）
cd frontend
npm run dev
```

### 访问应用
- 前端：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 项目结构

```
resume-optimizer/
├── backend/
│   ├── config.py          # 配置管理
│   ├── database.py        # 数据库连接
│   ├── main.py            # FastAPI 入口
│   ├── models.py          # SQLAlchemy 模型
│   ├── requirements.txt   # Python 依赖
│   ├── schemas.py         # Pydantic 模型
│   ├── routers/           # API 路由
│   │   ├── resumes.py     # 简历管理
│   │   ├── tags.py        # 标签管理
│   │   └── optimizations.py  # 智能优化
│   └── utils/             # 工具模块
│       ├── file_parser.py # 文件解析
│       └── llm_client.py  # LLM 客户端
├── frontend/
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API 服务
│   │   └── types/         # TypeScript 类型
│   └── package.json
├── uploads/               # 上传文件存储
├── data/                  # 数据库存储
├── setup.sh              # 安装脚本
└── start.sh              # 启动脚本
```

## API 接口

### 简历管理
- `POST /api/resumes/upload` - 上传简历
- `GET /api/resumes` - 获取简历列表
- `GET /api/resumes/{id}` - 获取简历详情
- `PUT /api/resumes/{id}` - 更新简历
- `DELETE /api/resumes/{id}` - 删除简历
- `DELETE /api/resumes?ids=[]` - 批量删除

### 标签管理
- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建标签
- `DELETE /api/tags/{id}` - 删除标签

### 智能优化
- `POST /api/optimizations` - 优化简历
- `GET /api/optimizations/records/{resumeId}` - 获取优化历史

## 获取阿里云百炼 API Key

1. 访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/)
2. 登录并创建 API Key
3. 将 API Key 填入 `backend/.env`

## 开发说明

### 后端开发
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

访问 http://localhost:8000/docs 查看 API 文档

### 前端开发
```bash
cd frontend
npm run dev
```

### 构建生产版本
```bash
cd frontend
npm run build
```

## 常见问题

### 上传文件失败
- 检查 `uploads/` 目录权限
- 确认文件大小不超过 10MB

### LLM 优化失败
- 检查 API Key 是否正确配置
- 确认网络连接正常
- 查看后端日志

### 前端无法连接后端
- 确认后端服务已启动
- 检查 CORS 配置

## License

MIT
