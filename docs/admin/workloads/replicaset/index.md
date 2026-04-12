---
title: 副本集(ReplicaSet)
parent: 工作负载(管理员)
nav_order: 2
---

## 介绍

**ReplicaSet（RS）** 是 Kubernetes 底层的副本控制器，确保运行的 Pod 副本数量始终与期望值一致。它是 Deployment 的底层实现，通常不直接使用，而是通过 Deployment 来管理。

### 核心作用

- ✅ **确保副本数量**：自动维持指定数量的 Pod 副本
- ✅ **故障恢复**：Pod 异常退出时自动创建新 Pod
- ✅ **扩缩容**：调整副本数触发滚动更新（但无版本控制）

---

## 何时需要 ReplicaSet？

**一般场景：** 使用 **Deployment** 即可，不要直接创建 ReplicaSet。

**特殊场景：**
- 不需要版本历史，简单的永久副本数维持
- 某些 Operator 内部使用 RS 作为组件（可查看）
- 理解 Deployment 的工作原理

---

## 快速开始

### 查看 ReplicaSet

1. 进入 **管理员界面 → 工作负载 → 副本集**
2. 列表显示：
   - **名称**：RS 名称（通常是 `<deployment-name>-<hash>`）
   - **命名空间**：所属命名空间
   - **副本数**：`当前/期望`
   - **镜像**：Pod 使用的镜像
   - **创建时间**

点击 RS 名称进入详情：
- **Pod 列表**：RS 管理的所有 Pod
- **YAML**：RS 原始定义
- **事件**：扩缩容、更新记录

### 创建 ReplicaSet（不推荐）

KDO 暂不提供 RS 的 UI 创建入口。如需创建，使用 YAML：

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: my-rs
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
```

然后 `kubectl apply -f rs.yaml`。

---

## 详细说明

### ReplicaSet vs Deployment

| 特性 | ReplicaSet | Deployment |
|------|------------|------------|
| **版本控制** | ❌ 无 | ✅ 支持 ReplicaSet 版本历史 |
| **滚动更新** | ❌ 不支持 | ✅ RollingUpdate / Recreate |
| **回滚** | ❌ 不能 | ✅ 一键回滚 |
| **声明式更新** | ⚠️ 有限 | ✅ 完全支持 |
| **适用场景** | 底层组件、简单需求 | **生产环境推荐** |

**结论：** 生产环境永远使用 **Deployment**，不要直接用 ReplicaSet。

---

## 工作原理

ReplicaSet 持续监控集群中匹配 `selector` 的 Pod：

1. **初始创建**：根据 `replicas` 创建指定数量的 Pod
2. **状态同步**：检查每个 Pod 的 `.status.phase`（Running? Ready?）
3. **缺失副本**：如果某个 Pod 被删除或崩溃，创建新 Pod 补足数量
4. **多余副本**：如果 Pod 数量超过 `replicas`，删除多余的（按创建时间）

---

## 常见问题

### Q: 可以直接修改 ReplicaSet 的 Pod 模板吗？

可以，但不推荐：

```bash
kubectl edit rs my-rs  # 修改 spec.template
```

修改后：
- RS 会识别模板变更
- **但不会自动滚动更新**，只会影响新创建的 Pod
- 已存在的 Pod 不会更新（需要手动删除）

这就是为什么需要 Deployment — 它提供了完整的滚动更新和回滚能力。

### Q: ReplicaSet 和 StatefulSet 区别？

- **ReplicaSet**：管理无状态应用，Pod 名称随机，没有稳定网络标识
- **StatefulSet**：管理有状态应用，Pod 有稳定名称（`app-0`、`app-1`），有序部署，持久存储绑定

### Q: 如何查看 ReplicaSet 管理的 Pod？

```bash
# 查看 RS 详情
kubectl describe rs my-rs

# 直接列出 Pod（通过 label selector）
kubectl get pods -l app=myapp
```

### Q: ReplicaSet 可以缩容到 0 吗？

可以。`replicas: 0` 会删除所有管理的 Pod。之后设置为 >0 会重新创建。

### Q: 删除 ReplicaSet 会删除 Pod 吗？

默认 **会删除**（级联删除）。如果想让 Pod 保留：

```bash
kubectl delete rs my-rs --cascade=orphan
```

---

## 相关链接

- [Kubernetes ReplicaSet 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)
- [Deployment 使用指南](/dev/workloads/deployments/)
- [Kubernetes 工作负载最佳实践](https://kubernetes.io/docs/concepts/workloads/controllers/)
