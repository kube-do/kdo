---
title: "网络"
description: "管理员网络视图在服务与路由之外提供 NetworkPolicy 管理，用于控制命名空间和 Pod 之间的入站、出站流量。"
sidebar_position: 5
doc_type: explanation
audience: [admin]
owner: docs-admin
last_reviewed: 2026-11-20
status: migrated
---

## 和开发者界面的区别

管理员的网络界面主要增加了网络策略页面。

## 管理员网络菜单
1. [服务](/docs/developer/network-storage/service/)
2. [路由](/docs/developer/network-storage/ingress/)
3. [网络策略](/docs/admin/networking/network-policies/)

## 功能地图

```mermaid
flowchart TD
    A[管理员网络] --> B[服务 Service]
    A --> C[路由 Ingress]
    A --> D[网络策略 NetworkPolicy]
    D --> E[Pod 选择器]
    D --> F[命名空间选择器]
    D --> G[IP 块选择器]
    B --> H[为 Pod 提供稳定访问入口]
    C --> I[对外暴露 HTTP 与 HTTPS]
    D --> J[控制 Pod 入站与出站]
    J --> K[由 Calico 等 CNI 执行]
    K --> L[实现零信任与多租户隔离]
```

服务与路由负责流量的接入和转发，网络策略负责决定哪些流量可以到达 Pod；两者配合构成完整的网络访问模型。
