---
title: 管理
parent: 管理员界面
nav_order: 9
---

## 介绍

**管理**模块提供了集群级别的资源管控能力，帮助管理员维护集群的健康运行、资源分配和命名空间组织。该模块涵盖资源配额、节点管理、命名空间、自定义资源定义（CRD）以及应用项目（AppProject）等核心运维功能。

### 主要功能

| 功能 | 描述 | 入口 |
|------|------|------|
| **资源配额 (ResourceQuota)** | 限制命名空间的资源使用总量（CPU、内存、存储、对象数量等） | [ResourceQuota](/admin/management/resourcequotas/) |
| **资源范围 (LimitRange)** | 为命名空间设置容器资源请求/限制的默认值和约束范围 | [LimitRange](/admin/management/limitranges/) |
| **节点管理 (Nodes)** | 查看和管理集群节点状态、标签、污点、资源容量 | [Nodes](/admin/management/nodes/) |
| **命名空间 (Namespaces)** | 创建和管理命名空间，实现多租户资源隔离 | [Namespaces](/admin/management/namespaces/) |
| **应用项目 (AppProjects)** | KDO 特有的项目模型，映射到命名空间并提供额外约束 | [AppProjects](/admin/management/appprojects/) |
| **自定义资源 (CRD)** | 查看和管理集群中安装的自定义资源定义 | [CustomResourceDefinitions](/admin/management/customresourcedefinitions/) |

---

## 快速导航

### 常用任务

- [创建 ResourceQuota](/admin/management/resourcequotas/) - 限制项目资源使用
- [设置 LimitRange](/admin/management/limitranges/) - 规范容器资源配置
- [查看节点状态](/admin/management/nodes/) - 监控集群容量和健康
- [创建命名空间](/admin/management/namespaces/) - 为新团队/环境隔离资源
- [配置 AppProject](/admin/management/appprojects/) - KDO 项目权限管理

---

## 核心概念

### 资源配额 (ResourceQuota)

ResourceQuota 用于限制命名空间内的资源使用总量，防止某个项目占用过多集群资源。

**支持的配额项：**
- 计算资源：`requests.cpu`、`requests.memory`、`limits.cpu`、`limits.memory`
- 存储资源：`requests.storage`（所有 PVC 的总和）
- 对象数量：`pods`、`services`、`replicationcontrollers`、`secrets`、`configmaps` 等
- 扩展资源：`requests.<ext>`、`limits.<ext>`

**示例：**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: development
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    requests.storage: 50Gi
    pods: "20"
    services: "10"
```

### 节点管理 (Nodes)

管理员视角的节点管理包括：
- **节点状态**：`Ready`、`NotReady`、`SchedulingDisabled`
- **资源容量**：CPU、内存、GPU、可分配容量
- **节点标签**：用于Pod调度选择（`nodeSelector`、`nodeAffinity`）
- **污点 (Taints)**：排斥不匹配的 Pod（如 `dedicated=master:NoSchedule`）
- **运行时信息**：内核版本、Docker/Containerd 版本、操作系统

**关键操作：**
- 查看节点详情（资源使用、标签、污点）
- 排空节点（`kubectl drain`）用于维护
- 删除/恢复节点（从集群移除或重新加入）

### 命名空间 (Namespaces)

命名空间提供逻辑隔离，是 Kubernetes 多租户的基础。

**命名场景：**
- 按环境划分：`dev`、`test`、`prod`
- 按团队划分：`team-a`、`team-b`
- 按项目划分：`project-x`、`project-y`

**资源隔离：**
每个命名空间有独立的资源池，配合 ResourceQuota 限制用量。

**操作：**
- 创建命名空间
- 查看命名空间状态
- 设置默认 ResourceQuota 和 LimitRange
- 删除命名空间（自动清理所有资源）

### 应用项目 (AppProjects)

AppProject 是 KDO 特有的概念，用于管理一组相关的应用和环境。每个 AppProject 映射到一个或多个 Kubernetes 命名空间，并提供额外的约束：

- **允许的集群角色**：项目成员可以使用的角色（如 `admin`、`edit`、`view`）
- **边缘项目设置**：是否允许从外部镜像仓库拉取镜像
- **命名空间创建策略**：自动创建环境命名空间（dev/test/stage/prod）

**典型配置：**
```yaml
apiVersion: kdo.project.io/v1alpha1
kind: AppProject
metadata:
  name: myproject
spec:
  allowedClusterRoles:
  - admin
  - edit
  - view
  edgeMembers:
  - user1
  - user2
```

---

## 最佳实践

### 资源管控

- 📊 **每项目必有 Quota**：为每个 AppProject 或命名空间设置 ResourceQuota
- 📊 **设置 LimitRange**：避免容器无限制申请资源
- 📊 **定期审核**：检查资源使用率，调整配额以适应实际需求
- 📊 **预留缓冲**：集群总容量预留 20% 应对突发流量

### 节点运维

- 🔧 **统一标签**：为节点打上环境、区域、功能等标签，便于调度
- 🔧 **污点策略**：关键节点（如 Master）设置污点避免应用调度
- 🔧 **监控**：持续监控节点资源使用率，提前扩容
- 🔧 **定期维护**：排空节点进行内核更新、安全补丁等操作

### 命名空间策略

- 🏷️ **命名规范**：使用小写字母、短横线分隔（如 `team-frontend`）
- 🏷️ **隔离原则**：不同环境/团队使用独立命名空间
- 🏷️ **生命周期**：及时清理不再使用的命名空间
- 🏷️ **RBAC 绑定**：在命名空间级别绑定 RoleBinding，精细化权限

---

## 常见问题

### Q: ResourceQuota 不支持的资源类型？

ResourceQuota 支持的资源列表取决于 Kubernetes 版本和启用的 API 组。可以通过以下命令查看：
```bash
kubectl explain resourcequota --api-version=v1
```
如果某些资源无法设置配额，可能需要启用相应的 API 扩展（如自定义资源）。

### Q: 节点 NotReady 如何处理？

1. 确认节点网络是否正常
2. 检查 kubelet 日志：`journalctl -u kubelet -f`
3. 检查 Docker/Containerd 状态
4. 如果节点故障，考虑从集群移除并替换新节点

### Q: LimitRange 不生效？

- 确认 LimitRange 在目标命名空间已创建
- LimitRange 只对新创建的 Pod 生效，已有 Pod 不会自动调整
- 检查请求值是否在范围之外（超出最小值或最大值会被拒绝）

### Q: 如何自动为新项目创建配额？

可以使用 Kubernetes 的 `LimitRanger` 和 `ResourceQuota` 准入控制器，或者通过 KDO 的 AppProject 模板功能预先定义配额。

---

## 相关链接

- [Kubernetes ResourceQuota 官方文档](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [Kubernetes LimitRange 官方文档](https://kubernetes.io/docs/concepts/policy/limit-range/)
- [Kubernetes 节点管理](https://kubernetes.io/docs/concepts/architecture/nodes/)
- [Kubernetes 命名空间](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
- [AppProject CRD 参考](/admin/management/appprojects/)
