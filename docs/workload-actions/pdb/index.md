---
title: 容器组中断预算(PDB)
parent: 工作负载操作
nav_order: 1
---


1. TOC
{:toc}

## 介绍

{: .note }
Kubernetes 的 PodDisruptionBudget (PDB) 是一种资源对象，它允许用户定义应用程序可以容忍的中断程度。
通过设置 PDB，你可以确保在计划内维护（例如节点升级、自动缩放等）期间，关键应用始终有一定数量的 Pod 在运行，从而避免服务不可用的情况


## 工作流程

```mermaid
flowchart TD
    A[为工作负载定义 PDB] --> B[设置标签选择器]
    B --> C{选择约束方式}
    C -->|minAvailable| D[声明最小可用副本数或百分比]
    C -->|maxUnavailable| E[声明最大不可用副本数或百分比]
    D --> F[节点维护开始 drain]
    E --> F
    F --> G[驱逐 API 检查 PDB 状态]
    G --> H{驱逐后是否仍满足预算}
    H -->|是| I[允许驱逐并迁移 Pod]
    H -->|否| J[拒绝驱逐并等待副本恢复]
    J --> G
    I --> K[维护继续 应用保持可用]
```

## 使用场景
1. **高可用性应用:** 对于需要保证一定水平的服务可用性的应用，比如数据库集群、API 服务器等，可以利用 PDB 来防止由于计划内的操作而导致的服务中断。
2. **批处理作业:** 对于那些即使部分失败也可以接受的任务，可以设置较低的 minAvailable 或较高的 maxUnavailable，以便更灵活地响应集群变化。
3. **节点维护:** 当执行节点级别的维护任务时，如更新操作系统或 Kubernetes 版本，PDB 可以帮助确保只有在安全的情况下才会迁移 Pod。


{: .warning }
PDB 仅适用于自愿中断（voluntary disruptions），如节点排空（drain）。对于非自愿中断（involuntary disruptions），如硬件故障或节点宕机，PDB 不起作用。
如果你的应用没有合适的标签选择器，那么 PDB 将不会生效。
PDB 应该根据实际业务需求和系统架构合理设计，以平衡可靠性和灵活性。


## 配置方式
PDB 可以通过以下两种方式之一来定义：
1. **minAvailable(最小可用):** 指定最小可用 Pod 数量或百分比。
2. **maxUnavailable(最大不可用):** 指定最大不可用 Pod 数量或百分比。

![edit-pdb.png](imgs/edit-pdb.png)