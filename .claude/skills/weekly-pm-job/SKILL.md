---
name: weekly-pm-job
description: 每周日自动执行产品分析与 UI 优化
disable-model-invocation: false
---

# 每周产品经理迭代任务 Skill

读取并执行 `missions/weekly-pm-audit.yaml` 中定义的任务。

## 执行时间

**每周日凌晨 5:00** (Asia/Shanghai 时区)

## 任务列表

### 1. 竞品分析 (competitive-analysis)
1. 搜索同类主流产品（如 Canva 简历、LinkedIn、Resume.com、超级简历等）
2. 分析其核心功能亮点和用户体验设计
3. 对比当前项目，识别功能差距
4. 生成竞品分析报告到 `reports/competitive-analysis.md`

### 2. 产品规划 (product-planning)
1. 基于竞品分析，提出功能优化建议
2. 按用户价值和实现难度进行优先级排序（P0/P1/P2）
3. 生成产品待办列表到 `reports/product-backlog.md`
4. 标记 P0 级 UI 优化任务

### 3. UI/UX 优化 (ui-ux-improvement) ✅ 直接执行
1. 检查当前 UI 组件的一致性和可用性问题
2. 对比主流设计风格（Material Design、Apple HIG 等）
3. **直接执行** P0 优先级的 UI 改进
4. 记录修改到 `reports/ui-changelog.md`

### 4. 生成修改摘要 (generate-summary) ✅ 直接执行
1. 汇总本周代码变更
2. 生成 UI 修改摘要报告
3. 输出到 `reports/weekly-summary.md`

## 执行规则

### 直接执行（无需批准）
- ui-ux-improvement
- generate-summary

### 需要批准（暂停执行）
- feature-iteration
- refactor-pass
- code-review
- test-runner

## 完成标准

- [ ] 所有报告已生成
- [ ] UI 变更已提交

## 输出报告

1. `reports/competitive-analysis.md` - 竞品分析报告
2. `reports/product-backlog.md` - 产品待办列表
3. `reports/ui-changelog.md` - UI 修改日志
4. `reports/weekly-summary.md` - 周总结报告
