---
title: 贡献指南
description: 如何参与 KDO 文档与示例的编写、评审和发布。
sidebar_position: 1
doc_type: how-to
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-20
status: draft
---

## 本地开发

```bash
pnpm install
pnpm start
```

## 文档约定

- 使用简体中文。
- 每页补齐 frontmatter。
- 标题使用显式英文锚点，避免中文锚点变化导致外链失效。
- 截图放在页面同目录的 `imgs/` 下。

## 提交前检查

```bash
pnpm build
node migration/check-url-parity.mjs
```
