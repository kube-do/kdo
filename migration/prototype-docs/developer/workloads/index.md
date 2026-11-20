---
title: 工作负载
description: KDO 支持的工作负载类型：Deployment、StatefulSet、DaemonSet、Job、CronJob、Pod 和 OpenKruise。
doc_type: how-to
audience: [developer]
applies_to: ">= v2026.11"
tags: [工作负载, Deployment, StatefulSet, Job, Pod]
owner: docs-dev
last_reviewed: 2026-11-20
status: stable
sidebar_label: 工作负载
sidebar_position: 3
---

# 工作负载

工作负载是实际运行容器的资源对象。KDO 开发者界面提供以下类型：

| 类型 | 用途 |
|---|---|
| [无状态应用（Deployment）](/docs/developer/workloads/deployments/) | Web 服务、API、微服务 |
| 有状态应用（StatefulSet） | 需要稳定网络标识或持久存储的服务 |
| 守护进程集（DaemonSet） | 每个节点运行一份的代理、日志、监控组件 |
| 任务（Job） | 一次性批处理 |
| 计划任务（CronJob） | 按时间调度的批处理 |
| 容器组（Pod） | 直接查看和管理 Pod |
| OpenKruise | 高级部署、原地升级、CloneSet 等 |

集群级和系统级工作负载在[管理指南](/docs/admin/)中维护，避免与开发者视角混在一起。
