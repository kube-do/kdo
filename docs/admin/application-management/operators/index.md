---
title: 安装的 Operators
parent: 应用管理(管理员)
nav_order: 2
---

1. TOC
{:toc}

## 介绍

{: .note }
本页展示集群中已安装的 Operator，可查看 CSV 状态、批准策略以及由该 Operator 管理的自定义资源。

![已安装 Operators 列表](imgs/operators-page.svg)

*图：已安装 Operators 列表与 CSV 状态。*

## Operator 生命周期

```mermaid
flowchart TD
    A[进入已安装 Operators 列表] --> B[查看 Operator 详情]
    B --> C[检查 CSV 状态]
    B --> D[查看 Operator Pod 与命名空间]
    C --> E{CSV 是否 Succeeded}
    E -->|否| F[查看 Operator 日志与事件]
    E -->|是| G[查看提供的 CRD]
    F --> H[修复权限或依赖]
    H --> C
    G --> I[创建或管理自定义资源实例]
    I --> J[检查实例状态与事件]
    B --> K[调整批准策略]
    K --> L[升级或卸载 Operator]
    L --> M[清理关联资源]
```

CSV 状态为 `Succeeded` 只表示 Operator 自身部署成功；自定义资源是否正常，还需要结合实例的 `status` 与事件判断。

