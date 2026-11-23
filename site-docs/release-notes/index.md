---
title: "发布说明"
description: "KDO 平台各版本的变更、升级注意事项与已知问题。"
sidebar_position: 1
doc_type: reference
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

本页记录 KDO 平台的正式版本变更。发布说明只写已经发布、可以追溯的内容，不把开发中的功能写成已上线能力。

## 版本口径

- 平台版本以产品发布版本号为准，例如 `v2026.11`。
- 文档站不单独定义平台版本；页面通过 `applies_to` 标注适用版本。
- 一个版本发布后，发布说明、升级步骤和兼容性说明必须同时更新。
- 没有正式版本标签时，不创建追溯性的版本记录。

## 当前状态

截至 2026-11-23，仓库尚未建立正式版本标签，因此暂无历史版本记录。首次正式发布时，按下面的模板补充。

## 版本记录模板

每个版本使用一个二级标题，建议包含：

```markdown
## v2026.11

**发布日期**：2026-11-30

### 新增能力

- 新增能力及其对用户的影响。

### 行为变更

- 默认值、权限、接口或界面的变化。

### 升级步骤

- 升级前检查、执行命令、验证步骤。

### 已知问题

- 影响范围、规避方式、计划修复版本。

### 回滚方式

- 是否需要恢复数据、如何回到上一版本。
```

## 升级前检查

1. 阅读对应版本的发布说明和[版本兼容性](/docs/reference/compatibility/)。
2. 按[升级与回滚](/docs/admin/maintenance/upgrade/)完成备份和回滚演练。
3. 确认 Kubernetes、Keycloak、Tekton、Harbor 等依赖仍在支持范围内。
4. 在维护窗口内执行升级，并保留升级前的访问信息和配置。

## 相关文档

- [升级与回滚](/docs/admin/maintenance/upgrade/)
- [备份与恢复](/docs/admin/maintenance/backup-restore/)
- [版本兼容性](/docs/reference/compatibility/)
- [安全基线](/docs/admin/maintenance/security/)
