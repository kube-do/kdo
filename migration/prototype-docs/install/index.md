---
title: 安装与升级
description: KDO 安装、Kubernetes 准备、Keycloak 对接、升级、离线安装与备份恢复的入口。
doc_type: how-to
audience: [admin]
applies_to: ">= v2026.11"
tags: [安装, 升级, Kubernetes, Keycloak]
owner: docs-install
last_reviewed: 2026-11-20
status: stable
sidebar_label: 安装与升级
sidebar_position: 1
---

# 安装与升级

KDO 支持两种安装路径：

| 场景 | 路径 |
|---|---|
| 还没有 Kubernetes 集群 | 先[安装 Kubernetes](/docs/install/kubernetes/)，再[安装 KDO](/docs/install/kdo/) |
| 已有 Kubernetes 集群 | 确认版本和 OIDC 参数后，直接[安装 KDO](/docs/install/kdo/) |
| 需要自建身份平台 | 先[安装 Keycloak](/docs/install/keycloak/) |
| 需要升级 | 使用 `kdo-install upgrade`，详见安装页的升级章节 |

## 推荐顺序 {#order}

1. 确认节点、磁盘、网络和 Kubernetes 版本满足要求。
2. 准备 OIDC 身份平台，或确认现有 issuer 参数。
3. 生成 `kdo-install.yaml`，执行 `config validate`、`apiserver-check`、`preflight`。
4. 执行安装，保存 `/root/kdo-access-info.txt`。
5. 登录控制台，修改默认密码，创建项目和用户。

:::warning
安装器必须在控制面节点以 `root` 执行。生产环境不要跳过 `preflight`，也不要在未备份的情况下执行升级。
:::
