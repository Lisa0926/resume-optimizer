# 📋 Changelog 维护指南

## 自动化方案

### 方案 1：Git Hook 自动记录（已启用）
**位置**: `.git/hooks/post-commit`

**工作机制**: 每次 `git commit` 后自动记录到当天的 changelog

**使用方式**:
```bash
# 正常提交代码
git add .
git commit -m "修复 PDF 预览问题"

# post-commit hook 会自动更新 CHANGELOG-2026-03-20.md
```

---

### 方案 2：手动更新脚本
**位置**: `scripts/update-changelog.sh`

**使用方式**:
```bash
# 一天工作结束时，生成 changelog
./scripts/update-changelog.sh
```

**功能**:
- 检查是否有未提交的变更
- 创建当天的 changelog 模板（如果不存在）
- 自动填充 git 提交历史
- 提醒你填写概述和说明

---

### 方案 3：Claude 会话结束时生成（推荐）

**位置**: 项目根目录

**使用方式**: 在 Claude 会话结束前说：
```
请更新 changelog
```

Claude 会自动：
1. 查看今天的 git 提交
2. 读取变更的文件
3. 更新或创建 CHANGELOG-YYYY-MM-DD.md

---

## Changelog 文件位置

```
/home/lisa/claude_apps/resume-optimizer/
├── CHANGELOG-2026-03-20.md    # 每日 changelog
├── SESSION_SUMMARY.md          # 会话摘要（可选）
└── scripts/
    └── update-changelog.sh     # 更新脚本
```

---

## 最佳实践

### 每日工作流程

1. **开始工作前**:
   ```bash
   # 查看昨天的 changelog
   cat CHANGELOG-$(date -d yesterday +%Y-%m-%d).md
   ```

2. **工作过程中**:
   - 正常提交代码，post-commit hook 会自动记录

3. **一天工作结束时**:
   ```bash
   # 方式 A: 运行脚本
   ./scripts/update-changelog.sh

   # 方式 B: 让 Claude 生成
   # 在会话中说："请更新 changelog"
   ```

4. **下次启动 Claude 时**:
   ```bash
   # 让 Claude 读取最新 changelog
   cat CHANGELOG-*.md | tail -100
   ```

---

## Changelog 模板说明

```markdown
# 变更日志 - YYYY-MM-DD

## 概述
<!-- 用 1-2 句话总结今日工作 -->

---

## 修改文件

### 后端
| 文件 | 修改类型 | 说明 |
|------|----------|------|
| backend/xxx.py | 修改 | 修复 xxx 问题 |

### 前端
| 文件 | 修改类型 | 说明 |
|------|----------|------|

### 脚本/配置
| 文件 | 修改类型 | 说明 |
|------|----------|------|

---

## Git 提交历史
<!-- 由脚本自动生成 -->
```

---

## 恢复上下文

### 方法 1：读取最新 changelog
```bash
# 查看最近的变更
ls -t CHANGELOG-*.md | head -1 | xargs cat
```

### 方法 2：查看 git 历史
```bash
git log --oneline -20
```

### 方法 3：让 Claude 总结
```
请读取 CHANGELOG-*.md 和 git log，总结最近的工作进度
```

---

## 自动化程度对比

| 方案 | 自动化程度 | 优点 | 缺点 |
|------|------------|------|------|
| Git Hook | ⭐⭐⭐⭐⭐ | 完全自动 | 只有提交记录，缺少概述 |
| 手动脚本 | ⭐⭐⭐ | 半自动，有模板 | 需要记得运行 |
| Claude 生成 | ⭐⭐⭐⭐ | 有详细概述 | 需要主动要求 |

**推荐**: Git Hook + Claude 生成结合
- Git Hook 自动记录每次提交
- 一天工作结束前让 Claude 生成完整的 changelog（包括概述和分类）

---

**最后更新**: 2026-03-20
