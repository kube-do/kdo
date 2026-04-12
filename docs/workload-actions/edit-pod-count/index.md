---
title: 设置副本数
parent: 工作负载操作
---

## 介绍

调整 Deployment 或 StatefulSet 的副本数（replicas）是实现应用**扩缩容**的直接方式。KDO 提供图形化界面，让你无需编辑 YAML 即可快速调整副本数量。

---

## 快速开始

### 扩缩容无状态应用 (Deployment)

1. 进入 **开发者界面 → 工作负载**，选择 **无状态应用** Tab
2. 找到目标 Deployment，点击右侧 **操作图标** 或勾选后点击顶部 **批量操作**
3. 选择 **编辑副本数**
4. 输入新的副本数（如 `3`、`5`、`10`）
5. 点击 **添加**

**效果：**
- Deployment 控制器会自动创建或删除 Pod，使副本数达到目标值
- 滚动更新期间，应用继续服务（根据更新策略）

### 扩缩容有状态应用 (StatefulSet)

操作步骤相同，但注意：
- StatefulSet 扩缩容是**有序**的（扩容按索引 0→N，缩容按 N→0）
- 确保存储（PVC）绑定正确，避免数据丢失

---

## 详细说明

### 副本数 vs HPA

如果开启了 **HPA（水平自动扩缩）**，手动调整副本数的选项将**不显示**。此时应通过 **编辑 HPA** 来调整副本范围。

**原因：**
- HPA 自动根据指标调整副本数
- 手动修改可能被 HPA 立即覆盖
- 如果想禁用 HPA，先删除 HPA 资源

---

## 操作注意事项

### 扩容

- ✅ 新 Pod 会按照 Deployment 的 `strategy` 创建（滚动更新）
- ✅ 确保集群有足够的资源（CPU/内存）容纳新副本
- ✅ 检查可用节点数（调度可能失败）
- ✅ 如果使用 HPA，手动扩容后 HPA 仍可能在指标驱动下调整回某个值

### 缩容

- ⚠️ **数据安全**：缩容会删除 Pod，如有状态应用（StatefulSet），确保数据已备份或 PVC 保留策略正确
- ⚠️ **服务中断**：如果缩容后剩余副本数 < Service 的负载均衡能力，可能影响吞吐量
- ⚠️ **PDB 限制**：如果配置了 PodDisruptionBudget，缩容可能被阻止（PDB 要求最小可用副本）

---

## 最佳实践

### 扩容策略

- 📈 **逐步扩容**：一次性扩容太多可能导致调度压力，建议每次增加 1-2 个副本
- 📈 **监控资源**：扩容前检查节点剩余资源，避免调度失败
- 📈 **预热时间**：应用启动需要时间，扩容后等待 Pod Ready 再增加流量

### 缩容策略

- 📉 **避免频繁缩容**：频繁扩缩容可能导致 Pod 频繁创建销毁，增加负载
- 📉 **HPA 稳定性**：如果使用 HPA，调整 `minReplicas` 而非手动缩容
- 📉 **优雅终止**：确保应用处理 `SIGTERM`，完成当前请求再退出（K8s default 30s）

### 与应用生命周期结合

- 🔄 **蓝绿发布**：通过修改副本数实现（先部署新版本，然后切换 Service selector，最后缩容旧版本）
- 🔄 **金丝雀发布**：先将少量流量路由到新版本（副本数少），观察无误后逐步增加

---

## 常见问题

### Q: 副本数修改后没反应？

- 检查 Deployment 状态：`kubectl get deploy <name>`
- 查看事件：`kubectl describe deploy <name>`
- 可能原因：资源不足（节点不够）、节点选择器不匹配、Pod 创建失败（查看 Pod 日志）

### Q: 扩缩容后 Pod 一直 Pending？

- 调度问题：`kubectl get pod <name> -o wide` 看节点分配
- 资源不足：检查节点剩余 CPU/内存
- PVC 绑定失败：PVC 处于 Pending

### Q: HPA 开启后无法手动修改副本数？

这是预期行为。HPA 会覆盖 Deployment 的 `replicas` 字段。

**解决方法：**
1. 调整 HPA 的 `minReplicas` / `maxReplicas`
2. 或删除 HPA 后手动管理副本数

### Q: 缩容会删除 PVC 吗？

**不会。** PVC 和 PV 是独立资源，缩容只删除 Pod，PVC 保留。数据不会丢失，下次扩容会自动绑定。

### Q: 扩缩容速度慢？

Deployment 滚动更新速度由以下参数控制：

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # 最多可以超出期望副本数的 Pod 数
    maxUnavailable: 0  # 最多可以不可用的 Pod 数
```

调整这些值可以加快或减缓扩缩容速度。

---

## 相关链接

- [Kubernetes Deployment 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes StatefulSet 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [HPA 自动扩缩](/workload-actions/hpa/)
- [更新策略配置](/workload-actions/edit-update-strategy/)
- [PodDisruptionBudget](/workload-actions/pdb/)
