---
title: 架构与原理
description: KDO 的整体架构、核心对象模型、端到端交付链路和安全设计。
doc_type: explanation
audience: [developer, admin]
applies_to: ">= v2026.11"
tags: [架构, 对象模型, 交付链路, 安全]
owner: docs-arch
last_reviewed: 2026-11-20
status: stable
sidebar_label: 架构与原理
sidebar_position: 1
---

# 架构与原理

架构部分回答“为什么这样设计”，不重复操作步骤。

| 主题 | 内容 |
|---|---|
| 整体架构 | Console、PAC、KDC 三仓协作关系 |
| 核心对象模型 | AppProject → AppEnv → Application → Workload → Pod |
| 端到端交付链路 | Git → 构建 → 镜像 → GitOps 写回 → 部署 |
| 安全设计 | OIDC、RBAC、受限 kubeconfig、镜像与证书 |

:::note
本页是样板站占位页。正式迁移时会补充三仓集成架构图和对象关系图。
:::
