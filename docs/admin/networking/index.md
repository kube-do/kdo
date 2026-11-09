---
title: 网络
parent: 管理员界面
nav_order: 4
---

## 和开发者界面的区别

管理员的网络界面主要增加了网络策略页面。

## 管理员网络菜单
1. [服务](/docs/dev/network-storage/services/)
2. [路由](/docs/dev/network-storage/ingresses/)
3. [网络策略](/docs/admin/networking/networkpolicies/)

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
