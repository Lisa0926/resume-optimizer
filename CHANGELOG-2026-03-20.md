# 2026-03-20 变更日志

## 概述
本日完成了夜间任务配置、飞书通知集成、代码优化和多项新功能开发。

---

## 一、定时任务配置

### 1.1 飞书通知集成
**目标**: 夜间任务执行完成后自动发送飞书通知

**配置项**:
| 配置项 | 值 |
|--------|-----|
| 飞书群聊 ID | 从 `backend/.env` 读取 (`FEISHU_NIGHTLY_TASK_GROUP`) |
| 通知内容 | 任务状态、执行摘要、日志摘要 |
| 发送方式 | openclaw message send |

**修改文件**: `run-night-job.sh`
- 添加飞书消息发送逻辑
- 提取任务最后 20 行日志作为摘要
- 根据退出码判断任务状态（成功/失败）
- 记录发送结果到 `logs/cron-nightly.log`

**测试结果**: ✅ 飞书消息成功发送

### 1.2 自动批准配置
**目标**: 允许夜间任务自动执行测试和代码修改

**修改文件**: `~/.openclaw/exec-approvals.json`

**批准的命令**:
```
- pytest
- python -m pytest
- bash *
- edit *
- write *
```

**配置命令**:
```bash
openclaw approvals allowlist add --agent "*" "pytest"
openclaw approvals allowlist add --agent "*" "python -m pytest"
openclaw approvals allowlist add --agent "*" "bash *"
openclaw approvals allowlist add --agent "*" "edit *"
openclaw approvals allowlist add --agent "*" "write *"
```

---

## 二、代码质量优化

### 2.1 清理冗余 pytest 配置
**文件**: `backend/tests/conftest.py`

**删除内容**:
- `pytest_configure()` 函数
- `event_loop` fixture

**原因**: `pytest.ini` 已配置 `asyncio_mode = auto`，无需重复配置

### 2.2 删除重复的 startup 事件处理器
**文件**: `backend/routers/resumes.py`

**删除内容**:
- `@router.on_event("startup")` 装饰器
- `startup()` 函数
- `init_db` 导入（不再使用）

**原因**: `main.py` 已使用 `lifespan` 事件处理器管理应用生命周期

### 2.3 移除未使用的 ABC 导入
**文件**: `backend/utils/file_parser.py`

**删除内容**:
- `from abc import ABC, abstractmethod`
- 类继承 `ABC`（无抽象方法，无需继承）

**原因**: 该类全部是 `@staticmethod` 方法，无需抽象基类

### 2.4 统一 API 参数风格
**文件**: `backend/schemas.py`, `backend/routers/optimizations.py`

**新增内容**:
- `SaveOptimizationRequest` Pydantic 模型
- 修改 `save_optimization` 使用 Pydantic 模型接收参数

**原因**: 与其他 API 保持一致的参数风格

### 2.5 修复批量删除未清理文件问题
**文件**: `backend/routers/resumes.py`

**修改内容**:
- 批量删除前先查询简历获取文件路径
- 删除数据库记录前先删除物理文件

**原因**: 避免删除数据库记录后遗留无用文件

### 2.6 更新 LLM Prompt 模板
**文件**: `backend/utils/llm_client.py`

**修改内容**:
- 更新 `match` 模式的 prompt，添加"一步一步的思考链"等要求
- 确保后端与前端的 prompt 一致

### 2.7 测试结果
```
======================== 13 passed, 5 warnings in 0.82s ========================
```
- 测试文件：`test_file_parser.py` (5 通过), `test_models.py` (4 通过), `test_routers.py` (4 通过)
- 警告从 6 个减少到 5 个

---

## 三、新功能开发

### 3.1 优化界面布局 - 三栏布局
**文件**: `frontend/src/pages/OptimizePage.tsx`

**布局结构**:
| 栏位 | 内容 |
|------|------|
| 左侧栏 | JD 输入、Prompt 配置（只读）、微调要求 |
| 中间栏 | 优化结果（**可编辑**）、下载按钮 |
| 右侧栏 | 原始简历纯文本预览 |

**改进**:
- 优化结果使用可编辑的 `<textarea>`
- 添加原始简历预览区域
- 删除"使用技巧"横幅，简化界面

### 3.2 PDF 预览功能
**文件**:
- `backend/routers/resumes.py` - 添加 `/files/{resume_id}` 接口
- `frontend/src/services/api.ts` - 添加 `getFileUrl()` 方法
- `frontend/src/pages/ResumeList.tsx` - 支持 PDF/文本预览切换

**实现方式**:
- PDF 文件通过 iframe 嵌入预览
- 纯文本使用 `<pre>` 标签显示
- 预览弹窗增大到 `max-w-5xl`

### 3.3 生成 PDF 功能
**文件**: `frontend/src/pages/OptimizePage.tsx`

**实现方式**:
- 添加 `handleDownloadPDF()` 函数
- 使用浏览器打印功能生成 PDF
- Markdown 转 HTML 格式化

**支持格式**:
- PDF（浏览器打印）
- Markdown
- Word (.docx)
- TXT

**应用范围**: 3 个子功能（匹配优化、智能优化、简历翻译）都可使用

---

## 四、修改文件汇总

### 后端 (6 个文件)
| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `backend/utils/llm_client.py` | 修改 | 更新 Prompt 模板 |
| `backend/tests/conftest.py` | 删除 | 清理冗余配置 |
| `backend/routers/resumes.py` | 修改 | 删除重复事件处理器、添加文件下载接口、修复批量删除 |
| `backend/routers/optimizations.py` | 修改 | 使用 Pydantic 模型 |
| `backend/schemas.py` | 新增 | 添加 SaveOptimizationRequest |
| `backend/utils/file_parser.py` | 删除 | 移除 ABC 导入 |

### 前端 (3 个文件)
| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `frontend/src/pages/OptimizePage.tsx` | 修改 | 三栏布局、PDF 生成、可编辑结果 |
| `frontend/src/pages/ResumeList.tsx` | 修改 | PDF 预览支持 |
| `frontend/src/services/api.ts` | 新增 | getFileUrl() 方法 |

### 脚本 (1 个文件)
| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `run-night-job.sh` | 修改 | 添加飞书通知 |

### 配置文件 (1 个文件)
| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `~/.openclaw/exec-approvals.json` | 修改 | 添加自动批准命令 |

---

## 五、依赖安装

```bash
cd frontend && npm install pdfjs-dist react-pdf --save
```

---

## 六、待办事项

1. **测试前端构建** - 运行 `npm run build` 验证
2. **测试 PDF 预览** - 启动服务验证 PDF 文件访问
3. **测试 PDF 生成** - 验证浏览器打印生成 PDF

---

## 七、快速恢复命令

```bash
# 查看修改
cd /home/lisa/claude_apps/resume-optimizer
git diff

# 测试后端
cd backend && source venv/bin/activate && python -m pytest tests/ -v

# 测试前端
cd frontend && npm run dev

# 测试夜间任务
bash run-night-job.sh

# 查看夜间任务日志
tail -f logs/cron-nightly.log
tail -f logs/nightly-*.log
```

---

## 八、重要配置摘要

### openclaw 配置
- 飞书通道：已启用
- 目标群聊：从 `backend/.env` 读取 (`FEISHU_NIGHTLY_TASK_GROUP`)
- 自动批准：pytest, bash *, edit *, write *

### 后端配置
- 上传目录：`/home/lisa/claude_apps/resume-optimizer/uploads/`
- 日志目录：`/home/lisa/claude_apps/resume-optimizer/logs/`

### 前端配置
- 开发端口：5173
- API 基础 URL：根据环境自动配置

---

**文档生成时间**: 2026-03-20
**最后更新**: 2026-03-20
# 测试 hook
### 2026-03-20

- 2381bdc - 测试 hook 执行
- 6f7233a - 测试：添加 changelog 自动生成功能到夜间任务

---

