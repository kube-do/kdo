---
title: 容器组中断预算(PDB)
parent: 工作负载(管理员)
nav_order: 3
---

## 介绍

**PodDisruptionBudget（PDB）** 用于在计划内维护（如节点排空、集群升级）时，确保关键应用始终保持最小可用副本数。PDB 定义了一个应用中最多可以有多少个 Pod 不可用，从而防止维护操作导致服务完全中断。

### 为什么需要 PDB？

- ✅ **高可用保障**：滚动更新或节点维护时，保证最小可用副本
- ✅ **防止误操作**：管理员执行 `kubectl drain` 时，PDB 拒绝驱逐超过阈值的 Pod
- ✅ **自动化运维**：配合集群自动升级，Kubernetes 自动遵守 PDB 限制

---

## 快速开始

### 创建 PDB

1. 进入 **管理员界面 → 工作负载 → 容器组中断预算**
2. 点击 **新建 PDB**
3. 填写表单：

| 字段 | 说明 | 示例 |
|------|------|------|
| **名称** | PDB 标识 | `myapp-pdb` |
| **目标工作负载** | 选择受保护的 Deployment/StatefulSet | `myapp-deployment` |
| **最小可用** | 始终保持至少多少个 Pod 可用 | `2`（至少 2 个 Pod 始终运行）|
| **最大不可用** | 与最小可用二选一 | `50%`（最多 50% Pod 不可用）|

4. 点击 **添加**

**注意：** `minAvailable` 和 `maxUnavailable` 两者选一，不要同时设置。

### 查看 PDB

列表显示：
- **名称**、**命名空间**
- **目标工作负载**
- **最小可用 / 最大不可用**
- **当前可用** / **总副本数**（实时状态）

### 编辑/删除

- **编辑**：修改最小可用数或最大不可用比例
- **删除**：移除 PDB（应用将不再受保护）

---

## 详细说明

### PDB 工作原理

PDB 通过 Kubernetes API 定义，由控制器监听：

1. **用户定义规则**：
   ```yaml
   apiVersion: policy/v1
   kind: PodDisruptionBudget
   metadata:
     name: myapp-pdb
   spec:
     minAvailable: 2  # 或 maxUnavailable: "30%"
     selector:
       matchLabels:
         app: myapp
   ```

2. **干扰事件**：当用户执行 `kubectl drain <node>`，或云平台自动维护（如 AWS 节点重启），Kubernetes 产生 "Disruption"
3. **PDB 校验**：控制器检查如果执行该干扰，受影响的 Pod 数量是否超过阈值
4. **允许/拒绝**：
   - 如果不会违反 PDB → 允许驱逐
   - 如果会违反 → 拒绝操作并返回错误

### 选择器 (Selector)

PDB 通过 `selector` 匹配目标工作负载的 Pod 标签：

- 通常自动填充（选择 Deployment 的 `selector`）
- 可以手动修改为更复杂的标签组合

---

## minAvailable vs maxUnavailable

### 语义区别

| 策略 | 含义 | 示例（副本数=5） |
|------|------|------------------|
| `minAvailable: 3` | 至少 3 个 Pod 保持可用 | 最多驱逐 2 个 |
| `maxUnavailable: "40%"` | 最多 40% Pod 不可用（向上取整）| 最多驱逐 2 个（5 * 0.4 = 2） |

### 选择建议

- **高可用应用（数据库、API 网关）**：`minAvailable: n`（绝对数量）
- **可弹性伸缩的应用**：`maxUnavailable: "30%"`（百分比更灵活）
- **奇数副本**：`minAvailable` 设置比一半多 1，避免脑裂（如副本=3 → minAvailable=2）

---

## 典型配置场景

### 场景 1：3 副本 Web 服务，允许滚动更新

```yaml
minAvailable: 2  # 至少 2 个可用
```

解释：更新一个 Pod 时，还有 2 个可用；如果更新 2 个，只剩 1 个可用，违反了 PDB，Kubernetes 会等待第一个新 Pod 就绪后再驱逐第二个。

### 场景 2：5 副本微服务，维护时允许部分中断

```yaml
maxUnavailable: "40%"  # 最多 2 个不可用
```

解释：可以同时驱逐 2 个 Pod 进行维护，剩下 3 个继续服务。

### 场景 3：StatefulSet（有状态），不允许中断

```yaml
minAvailable: <副本数>  # 如 StatefulSet 副本=3，则 minAvailable: 3
```

解释：所有副本必须保持可用，节点维护时只能选择不驱逐该 Pod 的节点（或重启整个 StatefulSet）。

---

## 最佳实践

### 策略设计

- 🎯 **基于 SLA 设定**：可用性 99.9% 的应用，minAvailable 应设置为高比例（如 80%）
- 🎯 **考虑更新窗口**：滚动更新期间可能有短暂不可用，留足缓冲区
- 🎯 **与 HPA 协同**：如果应用使用 HPA 自动扩缩，PDB 的 minAvailable 不要设得高于 HPA 的最小副本数
- 🎯 **区分环境**：
  - 生产环境：严格 PDB（minAvailable 高）
  - 测试环境：可放宽（maxUnavailable 高）

### 运维配合

- 📋 **记录 PDB**：将关键应用的 PDB 记录在运维手册
- 📋 **审批流程**：需要违反 PDB 的操作（如强制 drain），应有审批机制
- 📋 **监控告警**：对持续违反 PDB 的操作发送告警（可能过度维护）

---

## Management 操作的影响

### 节点排空（`kubectl drain`）

当管理员对节点执行 `kubectl drain <node>`：

1. Kubernetes 尝试驱逐该节点上的所有 Pod
2. 对于每个受 PDB 保护的 Deployment：
   - 检查驱逐后是否违反 PDB
   - 如果违反，拒绝驱逐，节点保留部分 Pod
   - 如果不违反，允许驱逐，Pod 迁移到其他节点
3. 等待被驱逐的 Pod 在其他节点就绪
4. 节点变为 `SchedulingDisabled`，可以安全维护

### 集群自动升级

如果集群使用自动升级工具（如 `kubeadm upgrade` 或 GKE 自动升级）：

- 升级前会尝试排空节点，触发 PDB 检查
- 如果所有节点都因 PDB 无法排空，升级会等待或失败
- 建议分批升级，并确保有足够的节点容量容纳迁移的 Pod

---

## 常见问题

### Q: PDB 不生效？

- 检查 PDB 的 `selector` 是否正确匹配目标 Pod 标签
- 确认目标工作负载的 Pod 数量 > 0
- 查看事件：`kubectl describe pdb <name>`
- 确认操作类型：PDB 只对 `voluntary disruptions`（如 drain）生效，硬件故障不遵守

### Q: `kubectl drain` 仍然强制驱逐了 Pod？

可能原因：
- Pod 不属于任何 PDB 保护的工作负载（或 PDB 不存在）
- PDB 允许的不可用数已计算，驱逐不违反阈值
- 使用了 `--force` 或 `--delete-emptydir-data` 参数（绕过 PDB）

### Q: StatefulSet 需要 PDB 吗？

需要。StatefulSet 的 Pod 有稳定身份和数据，更不应该全部中断。设置 `minAvailable` 时应考虑：
- 奇数副本：使用 `minAvailable: (replicas+1)/2` 避免脑裂
- 偶数副本：建议至少 50% 可用

### Q: PDB 和 HPA 冲突？

如果 HPA 扩缩容到低于 `minAvailable` 的数量，PDB 会：

- 阻止 Pod 被删除（缩容触发时）
- 导致 HPA 无法继续缩容

**配置建议：**
```yaml
# HPA
minReplicas: 3
maxReplicas: 10

# PDB
minAvailable: 2  # 允许缩容到 3-2=1？不，实际不能低于 2，HPA 缩容会被 PDB 阻止
```

正确做法：`minAvailable <= HPA.minReplicas - 1`，确保有缓冲。

### Q: 如何查看 PDB 是否被违反？

```bash
kubectl get pdb
kubectl describe pdb my-pdb
```

输出中的 `Status` 部分：
- `Current Healthy`：当前健康（可用）的 Pod 数
- `Desired Healthy`：期望健康的 Pod 数（根据 PDB 计算）
- `Disruptions Allowed`：当前允许的驱逐数量（0 表示已达上限）

---

## 相关链接

- [Kubernetes PDB 官方文档](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
- [Kubernetes 节点管理](/admin/management/nodes/)
- [Deployment 更新策略](/workload-actions/edit-update-strategy/)
- [HPA 自动扩缩](/workload-actions/hpa/)
