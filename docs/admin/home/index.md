---
title: 主页
parent: 管理员界面
nav_order: 1
---

## 介绍

**管理员界面**提供了集群级别的管理能力，包括应用管理、资源管控、网络配置、存储管理、观测平台等核心功能。不同于开发者界面专注于应用开发，管理员界面面向集群运维，提供更底层的资源控制和策略配置能力。

### 主要功能模块

| 模块 | 描述 | 入口位置 |
|------|------|----------|
| **应用管理** | Helm 应用部署、Operator 生命周期管理 | 左侧菜单第2项 |
| **工作负载** | 管理 DaemonSet、ReplicaSet、Pod Disruption Budget | 左侧菜单第3项 |
| **网络** | 网络策略、服务、路由配置 | 左侧菜单第4项 |
| **存储** | 持久卷、存储类、卷快照管理 | 左侧菜单第5项 |
| **观测平台** | 集群监控、日志、告警（待完善） | 左侧菜单第6项 |
| **流水线** | CI/CD 流水线配置（待完善） | 左侧菜单第8项 |
| **管理** | 资源配额、节点、命名空间、CRD | 左侧菜单第9项 |

---

## 快速导航

### 常用任务

- [安装 Helm 应用](/admin/application-management/helm/) - 通过 Helm Chart 部署应用
- [部署 Operator](/admin/application-management/operators/) - 安装和管理 Kubernetes Operators
- [配置网络策略](/admin/networking/networkpolicies/) - 控制 Pod 间访问规则
- [管理存储类](/admin/storage/storageclasses/) - 定义持久化存储类型
- [设置资源配额](/admin/management/resourcequotas/) - 限制命名空间资源使用

---

## 权限说明

管理员界面功能需要以下权限：

- `*` 集群级别资源（大部分操作）
- `namespaces` 管理命名空间
- `nodes` 查看和管理节点

如需细粒度权限控制，请参考 [RBAC 配置指南](/dev/security/rbac/)（待补充）。

---

## 最佳实践

> **⚠️ 注意**：管理员操作会影响整个集群，请谨慎执行！

### 操作前检查

- ✅ 确认操作窗口（避免业务高峰期）
- ✅ 备份关键资源（删除前导出 YAML）
- ✅ 了解影响范围（资源配额变更可能触发 Eviction）
- ✅ 测试环境验证后再应用到生产

### 资源管理建议

- 📊 为每个团队/项目创建独立 Namespace
- 📊 设置 ResourceQuota 防止资源滥用
- 📊 使用 LimitRange 规范容器资源请求/限制
- 📊 定期检查节点资源使用率，及时扩容

---

## 相关链接

- [Kubernetes 官方文档](https://kubernetes.io/docs/) - 参考底层概念
- [开发者界面概览](/dev/) - 了解应用开发者视角
- [集群架构说明](/concepts/cluster-architecture/) - 理解 KDO 集群设计
