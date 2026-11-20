---
title: 安装 Kubernetes
description: 为 KDO 准备 Kubernetes 集群的版本、节点、网络与 OIDC 前置条件。
doc_type: how-to
audience: [admin]
applies_to: ">= v2026.11"
tags: [安装, Kubernetes, KubeKey, OIDC]
owner: docs-install
last_reviewed: 2026-11-20
status: draft
sidebar_label: 安装 Kubernetes
sidebar_position: 1
---

# 安装 Kubernetes

KDO 需要 Kubernetes v1.28 及以上。可以用 KubeKey、托管 Kubernetes 或现有集群，只要满足版本、OIDC 和资源要求。

## 前置条件 {#prerequisites}

| 项目 | 建议 |
|---|---|
| 操作系统 | RHEL 9 / AlmaLinux 9 / Rocky 9 / Ubuntu 22.04+ |
| 节点 | 生产建议至少 3 个控制面节点、2 个以上工作节点 |
| 资源 | 控制面 2 CPU / 4 GB；工作节点 4 CPU / 8 GB 起 |
| 网络 | 节点互通，放行 6443、30000-32767、22 等端口 |
| OIDC | kube-apiserver 配置 issuer、client、username/groups claim |

## 安装步骤 {#install}

1. 准备节点和 SSH 免密。
2. 使用 KubeKey 生成集群配置，写入 OIDC 参数。
3. 执行集群安装，确认所有节点 `Ready`。
4. 安装 Ingress Controller、存储和镜像仓库等基础组件。
5. 回到[安装 KDO](/docs/install/kdo/) 执行平台安装。

```bash
kubectl get nodes
kubectl cluster-info
```

:::note
本页是样板站中的精简版。正式迁移时会保留现有 KubeKey 安装步骤、OIDC 参数示例和排障内容。
:::
