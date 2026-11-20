---
title: 工作负载操作
description: 扩缩容、HPA、PDB、健康检查、资源限制、更新策略和存储挂载等常用操作。
doc_type: how-to
audience: [developer]
applies_to: ">= v2026.11"
tags: [工作负载操作, 扩缩容, HPA, PDB, 健康检查]
owner: docs-dev
last_reviewed: 2026-11-20
status: stable
sidebar_label: 工作负载操作
sidebar_position: 4
---

# 工作负载操作

工作负载操作是从“工作负载”页面进入的横向任务集合，不再作为独立顶级栏目。

| 操作 | 说明 |
|---|---|
| 设置副本数 | 手动扩缩容；HPA 开启时可能被覆盖 |
| 配置 HPA | 按 CPU、内存或自定义指标自动扩缩 |
| 配置 PDB | 限制自愿中断时的可用副本数 |
| 设置健康检查 | 就绪、存活、启动探针 |
| 编辑资源限制 | requests/limits，影响调度和稳定性 |
| 添加存储 | 挂载 PVC 或临时卷 |
| 编辑更新策略 | 滚动更新的最大不可用/最大超额 |

:::note
本页是样板站占位页。正式迁移时会把现有 8 个 `workload-actions` 页面合并到这里，并按操作拆分。
:::
