---
title: "命名空间(Namespace)"
description: "在 Kubernetes 中，命名空间(Namespace)提供一种机制，将同一集群中的资源划分为相互隔离的组。 同一命名空间内的资源名称要唯一，但跨命名空间时没有这个要求。 命名空间作用域仅针对带有命名空间的对象(例如 Deployment 、 Service 等)，这种作用域对集群范围的对象(例如 StorageC"
sidebar_position: 2
doc_type: explanation
audience: [admin]
owner: docs-admin
last_reviewed: 2026-11-23
status: stable
---

## 介绍

:::note

在 Kubernetes 中，命名空间(Namespace)提供一种机制，将同一集群中的资源划分为相互隔离的组。 同一命名空间内的资源名称要唯一，但跨命名空间时没有这个要求。
命名空间作用域仅针对带有命名空间的对象(例如 `Deployment`、`Service` 等)，这种作用域对集群范围的对象(例如 `StorageClass`、`Node`、`PersistentVolume` 等)不适用。

:::

![kubernetes-namespaces.png](imgs/kubernetes-namespaces.png)

### 默认命名空间

:::note

Kubernetes 启动时会创建四个初始命名空间：

:::

1. **default** `Kubernetes` 包含这个命名空间，以便于你无需创建新的命名空间即可开始使用新集群。
2. **kube-node-lease** 该命名空间包含用于与各个节点关联的 `Lease`（租约）对象。 节点租约允许 `kubelet` 发送心跳， 由此控制面能够检测到节点故障。
3. **kube-public** 所有的客户端（包括未经身份验证的客户端）都可以读取该命名空间。 该命名空间主要预留为集群使用，以便某些资源需要在整个集群中可见可读。 该命名空间的公共属性只是一种约定而非要求。
4. **kube-system** 该命名空间用于 `Kubernetes` 系统创建的对象。

### 系统命名空间与默认显示

控制台会把以下命名空间视为**系统命名空间**，默认从命名空间下拉中隐藏，并在列表中标记为 Default：

| 前缀/名称 | 说明 |
|-----------|------|
| `kube-*` | Kubernetes 系统命名空间，如 `kube-system`、`kube-public`、`kube-node-lease` |
| `kubedo`、`kubedo-*` | KDO 平台组件命名空间，如 `kubedo-system`、`kubedo-notification` |
| `openshift-*` | OpenShift 组件命名空间 |
| `kubernetes-*` | Kubernetes 保留命名空间 |
| `default`、`openshift` | 默认/平台命名空间 |

需要查看或切换到这些命名空间时，可以在命名空间下拉中手动选择，或直接通过 URL 访问。

:::note

早期版本在 `default` 命名空间会显示 OpenShift SCC（Security Context Constraints）安全提示。由于 SCC 是 OpenShift 专属概念，在标准 Kubernetes 上并不适用，该提示已移除，避免误导。

:::

### 命名空间感知命令
使用 `kubectl` 命令时，你可以通过 -n 或 --namespace 参数来指定操作的命名空间。如果不指定，它将会作用于默认命名空间。
你可以使用`kubectl config set-context --current --namespace=<namespace_name>`来更改当前上下文的命名空间。

### 生命周期
当命名空间被创建后，它可以容纳各种类型的资源。当命名空间被删除时，它内部的所有资源也会被删除。


### 隔离性
- 命名空间(Namespace) 提供了一定程度的名称隔离。不同命名空间中的对象可以有相同的名字，因为它们由命名空间的上下文所区分。
- 它们也提供了配置的隔离，例如，[资源配额(ResourceQuota)](/docs/admin/namespaces/resource-quotas/)和[限制范围(LimitRange)](/docs/admin/namespaces/limit-ranges/)可以在命名空间级别定义。

### 命名空间和DNS
当你创建一个服务时， Kubernetes 会创建一个相应的 DNS 条目。
该条目的形式是`<服务名称>.<命名空间名称>.svc.cluster.local`，这意味着如果容器只使用<服务名称>，它将被解析到本地命名空间的服务。
这对于跨多个命名空间(如开发、测试和生产)使用相同的配置非常有用。如果你希望跨命名空间访问，则需要使用完全限定域名（FQDN）


## 查看命名空间
![namespaces.png](imgs/namespaces.webp)

在命名空间列表，是对整个集群的命名空间的概述

| 菜单            | 说明                                                                                                                                                         |
|:--------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| 名称            | 命名空间的名字                                                                                                                                                    |
| 显示名称          | 命名空间的显示名称                                                                                                                                                  |
| 状态            | 命名空间的状况                                                                                                                                                    |
| 容器组           | 命名空间内运行的容器组数量                                                                                                                                              |
| 内存-U/R/L(GiB) | 命名空间的内存状态，U表示命名空间内全部容器组实际使用的内存量， R表示命名空间内全部容器组`请求值(Request)`的内存量， L表示命名空间内全部容器组`限制值(Limit)`的内存量。[更多内容](/docs/developer/workload-operations/resource-limits/)     |
| CPU-U/R/L(核)  | 命名空间的CPU状态，U表示命名空间内全部容器组实际使用的CPU量， R表示命名空间内全部容器组`请求值(Request)`的CPU量， L表示命名空间内全部容器组`限制值(Limit)`的CPU量。[更多内容](/docs/developer/workload-operations/resource-limits/) |
| 网络(Tx/Rx)     | 命名空间内全部容器组的`网络发送(Tx)`和`接收(Rx)`的网络速率。                                                                                                                       |
| 创建            | 命名空间的创建时间                                                                                                                                                  |

## 命名空间详情

### 命名空间概述
命名空间概述页面的内容对应就是环境概要信息页面的内容。更多信息，请参考[环境概要信息](/docs/developer/overview/environments/)
![](imgs/namespace.webp)


### 命名空间工作负载
命名空间概述页面的内容对应就是工作负载信息拓扑页面。更多信息，请参考[应用拓扑信息](/docs/developer/workloads/topology/)
![](imgs/namespace-topology.webp)


### 命名空间访问控制
![](imgs/namespace-access.webp)


### 命名空间角色绑定
![](imgs/namespace-roles.webp)

## 命名空间生命周期

```mermaid
flowchart TD
    A[创建命名空间] --> B[命名空间进入 Active]
    B --> C[创建工作负载与 Pod]
    B --> D[设置 ResourceQuota]
    B --> E[设置 LimitRange]
    B --> F[绑定 RoleBinding 与 ServiceAccount]
    C --> G[Service 生成 DNS 记录]
    G --> H[服务名.命名空间.svc.cluster.local]
    B --> I[系统命名空间默认隐藏]
    B --> J[删除命名空间]
    J --> K[级联删除内部资源]
    B --> L[列表展示状态与资源用量]
```

命名空间删除是不可逆的级联操作；删除前应先确认配额、存储与工作负载的归属，避免误删其他团队仍在使用的资源。

## 常用操作

### 创建命名空间

在管理员界面进入 **命名空间**，点击 **创建**，填写名称和显示名称。名称创建后不可修改，建议使用小写字母、数字和短横线。

```bash
kubectl create namespace team-demo
kubectl get namespace team-demo
```

### 设置配额和限制

为新命名空间设置 [ResourceQuota](/docs/admin/namespaces/resource-quotas/) 和 [LimitRange](/docs/admin/namespaces/limit-ranges/)，避免单个项目耗尽集群资源。

```bash
kubectl get resourcequota,limitrange -n team-demo
```

### 绑定权限

通过 [RBAC](/docs/admin/access-control/rbac/) 为团队绑定角色。优先使用命名空间级 `RoleBinding`，不要为普通成员绑定集群级管理员权限。

### 删除命名空间

```bash
kubectl get all,pvc,ingress -n team-demo
kubectl delete namespace team-demo
```

删除前确认：

- 没有其他团队或系统组件依赖该命名空间。
- PVC 和外部存储中的数据已备份。
- 相关 DNS、Ingress 和证书可以下线。
- 没有正在运行的构建、部署或定时任务。

## 常见问题

### 命名空间一直 Terminating

通常是有资源无法删除，例如 finalizer、CRD、PVC 或 APIService。查看命名空间状态和残留资源：

```bash
kubectl get namespace team-demo -o yaml
kubectl api-resources --verbs=list --namespaced -o name | \
  xargs -n1 kubectl get -n team-demo --ignore-not-found
```

不要直接删除 namespace 的 finalizer，先确认残留资源和数据归属。

### Pod 创建被拒绝

检查 ResourceQuota 是否已用尽、LimitRange 是否要求必须设置 requests/limits，以及准入 Webhook 是否拦截。

### 跨命名空间访问失败

同命名空间可以只用服务名，跨命名空间需要使用 `<service>.<namespace>.svc.cluster.local`，并确认 NetworkPolicy 允许访问。

### 看不到系统命名空间

控制台默认隐藏 `kube-*`、`kubedo-*` 等系统命名空间，可以在下拉中手动选择或通过 URL 访问。

## 最佳实践

- 按团队或环境划分命名空间，不要把生产和管理组件混在一起。
- 为每个命名空间设置配额、限制和默认网络策略。
- 命名空间名称保持稳定，不把随机后缀写进自动化脚本。
- 删除前先做资源盘点，必要时先缩容和备份。
- 使用标签记录 owner、环境和成本中心，便于审计和清理。

## 相关文档

- [资源配额](/docs/admin/namespaces/resource-quotas/)
- [限制范围](/docs/admin/namespaces/limit-ranges/)
- [RBAC](/docs/admin/access-control/rbac/)
- [网络策略](/docs/admin/networking/network-policies/)
- [AppProject](/docs/admin/namespaces/appprojects/)
- [存储](/docs/admin/storage/)
