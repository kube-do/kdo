---
title: 工作负载
parent: 开发者界面
nav_order: 3
---

## 介绍

**工作负载（Workloads）** 是在 Kubernetes 上运行的应用程序单元。KDO 平台为开发者提供了简化的界面来管理各种类型的 workload，无需直接编写复杂的 YAML 清单。

### 支持的工作负载类型

| 类型 | 描述 | 适用场景 |
|------|------|----------|
| **Pod** | 最基本的部署单元，一个或多个容器的组合 | 一次性任务、调试 |
| **Deployment** | 管理无状态应用，支持滚动更新、回滚 | Web 服务、API 服务 |
| **StatefulSet** | 管理有状态应用，提供稳定的网络标识和持久化存储 | 数据库、消息队列 |
| **DaemonSet** | 在每个节点上运行一个 Pod副本 | 日志收集、监控 Agent |
| **Job** | 运行一次性任务到完成 | 数据迁移、批处理 |
| **CronJob** | 定时运行的 Job | 定时备份、定时任务 |

---

## 功能特性

- ✅ **可视化创建**：通过表单填写参数，自动生成 YAML
- ✅ **即时操作**：启动、停止、重启、删除一键完成
- ✅ **实时状态**：查看 Pod 状态、资源使用、事件
- ✅ **日志查看**：直接在控制台查看容器标准输出日志
- ✅ **终端接入**：进入容器 shell 进行调试
- ✅ **YAML 编辑**：支持图形化和 YAML 两种编辑模式
- ✅ **批量操作**：同时管理多个 workload
- ✅ **版本历史**：查看和回滚到历史版本（仅 Deployment）

---

## 快速开始

### 创建无状态应用 (Deployment)

1. 进入 **开发者界面 → 工作负载**
2. 点击 **新建** → 选择 **Deployment**
3. 填写：
   - **名称**：`myapp`
   - **镜像**：`nginx:alpine`
   - **副本数**：`2`
   - **端口**：`80`
4. 点击 **添加**

平台将在几秒内创建 Deployment 并启动 Pod。

### 查看工作负载详情

点击列表中的工作负载名称，进入详情页：

- **概览**：基本信息、状态、副本数
- **容器组 (Pods)**：列表、状态、节点、镜像
- **配置**：环境变量、资源限制、健康检查
- **事件**：最近的操作事件
- **操作**：可执行的操作按钮

---

## 各类型工作负载说明

### Pod

最简单的单元，通常用于：

- 临时调试
- 一次性命令执行
- 作为 Job 的基础单元

**注意**：Pod 不提供自愈能力，删除即消失。生产环境建议使用 Deployment 或 StatefulSet。

### Deployment

最常用的无状态应用控制器：

- ✅ 自动恢复失败的 Pod
- ✅ 支持滚动更新和回滚
- ✅ 可以暂停/恢复部署
- ✅ 支持蓝绿/金丝雀发布（通过策略配置）

**常见配置：**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

### StatefulSet

为有状态应用设计：

- ✅ 稳定的、唯一的网络标识（`pod-0`, `pod-1`）
- ✅ 有序的部署和扩缩（按索引顺序）
- ✅ 稳定的持久化存储（PVC 随 Pod 保留）
- ✅ 优雅的终止和清理

**典型应用：** MySQL、PostgreSQL、Redis Cluster、Kafka、ZooKeeper

### DaemonSet

确保每个（或部分）节点上都运行一个 Pod：

- ✅ 节点新增时自动部署 Pod
- ✅ 适合集群级别的守护进程

**典型应用：** Fluentd/Fluent Bit（日志收集）、Prometheus Node Exporter、kube-proxy

### Job

运行一次性任务到完成：

- ✅ 支持并行任务
- ✅ 可设置重试策略（`backoffLimit`）
- ✅ 任务完成后 Pod 保留（可配置 TTL）

**典型应用：** 数据库初始化、数据迁移、批量计算

### CronJob

定时触发的 Job：

- ✅ 基于 Cron 表达式的调度（`*/5 * * * *`）
- ✅ 支持并发策略（Allow / Forbid / Replace）
- ✅ 保留历史执行记录（`successfulJobsHistoryLimit`）

**典型应用：** 定时备份、定时清理、定时报告

---

## 常见问题

### Q: 什么时候用 Deployment 而不是 Pod？

**答：** 除非是临时调试或一次性任务，否则都应使用 Deployment（或 StatefulSet）。Deployment 提供自愈、滚动更新、版本控制等关键能力。

### Q: StatefulSet 和 Deployment 如何选择？

- 需要**稳定身份标识**（固定主机名、有序编号）→ StatefulSet
- 需要**持久化存储绑定**（删除 Pod 不删数据）→ StatefulSet
- 其他大多数场景 → Deployment

### Q: 如何实现蓝绿发布？

使用 Deployment 的 `strategy.rollingUpdate` 配合以下步骤：
1. 部署新版本（与旧版本不同的 label selector）
2. 验证新版本健康
3. 切换 Service selector 指向新版本
4. 保留旧版本一段时间后删除

详细流程参考 [Kubernetes 蓝绿发布指南](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/#blue-green-deployment)。

### Q: Pod 一直处于 `Pending` 状态？

可能原因：
- 资源不足（CPU/Memory 请求超出节点容量）
- 节点选择器/亲和性不匹配
- GPU/特殊设备不可用
- PVC 未绑定

检查：
```bash
kubectl describe pod <pod-name>
kubectl get nodes -o wide
```

### Q: 如何查看 Pod 日志？

在控制台：
- 进入 Pod 详情 → **日志** 标签页
- 或使用 **终端** 功能进入容器

命令行：
```bash
kubectl logs -f <pod-name> -c <container-name>
```

---

## 下一步

- 学习 [配置管理](/dev/configurations/) - 使用 ConfigMap 和 Secret 管理应用配置
- 掌握 [存储管理](/dev/network-stroage/) - 持久化数据存储
- 了解 [工作负载操作](/workload-actions/) - 运行时运维能力
- 参考 [Kubernetes 官方文档](https://kubernetes.io/docs/concepts/workloads/)
