---
title: OpenKruise 工作负载
parent: 工作负载
nav_order: 5
---

1. TOC
{:toc}

## 介绍

{: .note }
KDO 平台在原生 Kubernetes 工作负载之外，集成了 [OpenKruise](https://openkruise.io/) 的增强工作负载，提供 **CloneSet** 与 **Kruise StatefulSet** 两种类型，用于满足**原地升级**、精细化分批发布等高级场景。

{: .important }
这两种资源由 OpenKruise 提供（API 组 `apps.kruise.io`）。**只有当前集群已安装 OpenKruise 时，控制台才会显示对应的菜单与资源**；平台会通过 API 发现自动检测 `apps.kruise.io` 是否可用，未安装时相关入口自动隐藏。

入口：**开发者界面 → 工作负载 → CloneSet / Kruise StatefulSet**（位于 `有状态应用(StatefulSet)` 之后）；**管理员界面 → 工作负载**分区同样提供这两个入口。


## CloneSet

CloneSet（`clonesets.apps.kruise.io/v1alpha1`）是 OpenKruise 面向**无状态、无差异应用**的高级工作负载，常用于替代原生 Deployment，适合需要高效发布与原地升级的场景。

关键特性：

- ✅ **原地升级（In-Place Update）**：只更新容器镜像而不重建 `容器组(Pod)`，避免 Pod 重新调度与 IP 变化，显著加快发布速度。
- ✅ **可配置的扩缩容与删除顺序**：支持按指定顺序（如先缩容旧副本、随机删除等）进行扩缩容。
- ✅ **分批发布与暂停**：支持分批灰度发布，发布过程中可暂停/恢复。
- ✅ **保留历史版本**：可保留多个历史版本用于快速回滚。

控制台中可以像 [无状态应用(Deployment)](/docs/dev/workloads/deployments/) 一样通过表单创建与编辑，也可以切换到 `YAML` 直接编辑。


## Kruise StatefulSet

Kruise StatefulSet（`statefulsets.apps.kruise.io/v1beta1`）是 OpenKruise 对原生 `StatefulSet` 的增强版本，保留了原生 StatefulSet 的**稳定网络标识**与**有序部署**能力，并额外提供：

- ✅ **原地升级**：升级时保留 Pod 与持久化卷，不重建 Pod、不重新挂载数据。
- ✅ **分批发布与最大不可用**：可通过发布策略控制发布节奏。
- ✅ **更灵活的持久卷声明(PVC)保留策略**：Pod 删除/缩容时可按策略保留或删除 PVC。
- ✅ **原地重启、镜像预热**等增强能力。

{: .warning }
Kruise StatefulSet 与 Kubernetes 内置的 `有状态应用(StatefulSet)` **同名，但属于不同的 API 组**（`apps.kruise.io` 与 `apps`）。控制台通过 API 组区分两者，使用时请勿混淆。


## 操作菜单

{: .note }
CloneSet 与 Kruise StatefulSet 的详情页右上角 **操作** 菜单提供常用操作（如扩缩容、重启、删除等），与原生工作负载的操作菜单风格一致。


## 与原生工作负载的对比

| 维度 | 无状态应用(Deployment) | 有状态应用(StatefulSet) | CloneSet | Kruise StatefulSet |
|:-----|:----------------------|:-----------------------|:---------|:-------------------|
| 面向场景 | 无状态应用 | 有状态应用 | 无状态应用 | 有状态应用 |
| 原地升级 | ❌ | ❌ | ✅ | ✅ |
| 稳定网络标识 | ❌ | ✅ | ❌ | ✅ |
| 分批发布控制 | 有限 | 有限 | ✅ | ✅ |
| 依赖 | 原生 Kubernetes | 原生 Kubernetes | OpenKruise | OpenKruise |

## 下一步

- 了解 [有状态应用(StatefulSet)](/docs/dev/workloads/statefulsets/)
- 了解 [无状态应用(Deployment)](/docs/dev/workloads/deployments/)
- 参考 [OpenKruise 官方文档](https://openkruise.io/)
