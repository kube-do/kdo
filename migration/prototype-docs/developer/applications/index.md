---
title: 应用管理
description: 在 KDO 中创建和管理 Git 应用、Helm 应用、镜像构建和手动镜像应用。
doc_type: how-to
audience: [developer]
applies_to: ">= v2026.11"
tags: [应用管理, Git 应用, Helm, 镜像构建]
owner: docs-dev
last_reviewed: 2026-11-20
status: stable
sidebar_label: 应用管理
sidebar_position: 2
---

# 应用管理

KDO 支持多种应用创建方式：

| 方式 | 适用场景 |
|---|---|
| [Git 应用](/docs/developer/applications/git/) | 代码在 Git 仓库，需要自动构建和部署 |
| Helm 应用 | 部署社区 Chart、中间件或第三方服务 |
| 镜像构建 | 有 Dockerfile，但不需要完整流水线 |
| 手动镜像 | 直接使用已有镜像，快速验证 |

Git 应用是主路径：平台会生成 `devfile.yaml`、`Dockerfile`、Kubernetes 清单和 `.tekton` 流水线，并在代码推送后自动构建、写回和部署。
