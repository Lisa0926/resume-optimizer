# 智能简历优化器

基于 AI 的简历优化和管理工具，支持多种格式简历解析、标签管理和智能优化。

## 功能特性

### 简历管理
- 支持 PDF、DOCX、MD、TXT 格式解析
- 简历列表展示和分页
- 批量删除
- 标签管理（多对多关联）

### 智能优化
- 输入目标职位 JD
- AI 驱动简历优化（阿里云百炼 API）
- 多轮对话微调
- 优化结果导出

## 技术栈

**后端**
- Python 3.10+ / FastAPI / SQLAlchemy / SQLite
- Pydantic / PyPDF2 / python-docx

**前端**
- React 18 / TypeScript / Vite
- TailwindCSS / Headless UI

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+

### 安装

```bash
# 克隆项目
git clone https://github.com/Lisa0926/resume-optimizer.git
cd resume-optimizer

# 安装后端依赖
cd backend
pip install -r requirements.txt

# 安装前端依赖
cd ../frontend
npm install
```

### 配置

```bash
# 复制环境变量模板
cp backend/.env.sample backend/.env
```

编辑 `backend/.env` 设置 API Key：

```bash
# 阿里云百炼 API Key
DASHSCOPE_API_KEY=your_api_key_here
```

获取 API Key：https://bailian.console.aliyun.com/

### 启动服务

```bash
# 启动后端（终端 1）
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 启动前端（终端 2）
cd frontend
npm run dev
```

### 访问应用

- 前端：http://localhost:5173
- API 文档：http://localhost:8000/docs

## 项目结构

```
resume-optimizer/
├── backend/
│   ├── routers/        # API 路由
│   ├── models.py       # 数据模型
│   ├── schemas.py      # Pydantic 模型
│   ├── utils/          # 工具模块
│   └── main.py         # FastAPI 入口
├── frontend/
│   ├── src/
│   │   ├── components/ # 组件
│   │   └── pages/      # 页面
│   └── package.json
├── uploads/            # 上传文件（本地存储）
├── data/               # 数据库（本地存储）
└── backend/.env.sample # 环境变量模板
```

## API 接口

### 简历管理
- `POST /api/resumes/upload` - 上传简历
- `GET /api/resumes` - 获取简历列表
- `DELETE /api/resumes/{id}` - 删除简历

### 标签管理
- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建标签
- `DELETE /api/tags/{id}` - 删除标签

### 智能优化
- `POST /api/optimizations` - 优化简历
- `GET /api/optimizations/records/{resumeId}` - 获取优化历史

## License

MIT
