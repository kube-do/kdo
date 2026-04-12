---
title: 编辑更新策略
parent: 工作负载操作
---

## 介绍

**更新策略（Update Strategy）** 控制 Deployment 或 StatefulSet 在镜像或配置变更时如何滚动更新 Pod。它决定了新旧版本替换的速度和安全性，是保障服务持续可用的关键设置。

---

## 快速开始

### 修改更新策略

1. 进入目标 Deployment 详情页
2. 点击 **操作** → **编辑更新策略**
3. 选择策略类型：

#### 滚动更新（RollingUpdate）- 推荐

- **最大不可用 (maxUnavailable)**：更新期间最多可不可用的 Pod 数量或百分比
  - 示例：`1`（绝对数量）或 `25%`（百分比）
- **最大激增 (maxSurge)**：更新期间可以超出期望副本数的额外 Pod 数量或百分比
  - 示例：`1` 或 `25%`

#### 重新创建（Recreate）

- 先删除所有旧 Pod，再创建新 Pod
- **适用场景：** 不支持多版本共存的应用（如数据库升级）

4. 点击 **添加** 保存

---

## 详细说明

### RollingUpdate 参数解析

```
期望副本数：3
maxUnavailable: 25% → 最多 1 个 Pod 不可用（⌈3 × 0.25⌉ = 1）
maxSurge: 25% → 最多可以创建 1 个额外 Pod（最多同时运行 4 个）
```

**更新过程（示例副本数=3，maxSurge=1，maxUnavailable=1）：**

1. 启动第 4 个新 Pod（激增）
2. 等待新 Pod Ready
3. 删除 1 个旧 Pod（不可用增加 1）
4. 重复步骤 2-3，直到所有旧 Pod 被替换

**效果：** 始终至少有 2 个 Pod 可用，服务不中断。

### Recreate 策略

步骤：
1. 删除所有旧 Pod
2. 等待 Pod 完全终止
3. 创建新的 Pod

**特点：**
- 更新期间服务完全不可用
- 适用于单实例应用或有状态应用无法多版本共存

---

## 策略选择指南

| 场景 | 推荐策略 | 说明 |
|------|---------|------|
| 无状态 Web 服务 | `RollingUpdate` ✅ | 默认，保证服务不中断 |
| 多副本 API 服务 | `RollingUpdate` ✅ | 滚动更新，客户端无感知 |
| 有状态应用（StatefulSet） | `RollingUpdate` ✅ | StatefulSet 默认也是 RollingUpdate，但有序更新 |
| 单实例应用 | `Recreate` | 更新时短暂中断可接受 |
| 数据库主从切换 | 停机窗口 | 建议维护窗口 + Recreate |

---

## 参数调优

### 保守策略（高可用优先）

```yaml
maxUnavailable: 0     # 不允许任何不可用
maxSurge: 1           # 一次只多 1 个 Pod
```

特点：更新速度慢，但最大程度保证可用副本数。

### 激进策略（速度优先）

```yaml
maxUnavailable: 50%   # 允许一半不可用
maxSurge: 100%        # 可以翻倍
```

特点：更新快，但期间服务能力可能下降 50%。

### 默认策略

Kubernetes 默认：
- `maxUnavailable: 25%`
- `maxSurge: 25%`

对于大多数场景够用。

---

## 与 PDB 的交互

如果配置了 **PodDisruptionBudget (PDB)**，滚动更新需遵守 PDB 的最小可用要求。

**示例：**
- Deployment 副本数 = 3
- PDB `minAvailable: 2`
- RollingUpdate `maxUnavailable: 25%` → 1

更新时最多只能 1 个 Pod 不可用，但 PDB 要求至少 2 个可用，两者冲突，实际滚动更新会被 PDB 限制，可能更新缓慢。

**解决：**
- 调整 PDB 或 RollingUpdate 参数，确保 `maxUnavailable ≤ (replicas - minAvailable)`
- 或在维护窗口临时删除 PDB

---

## 常见问题

### Q: 更新策略修改后，旧 Pod 不更新？

更新策略只影响**新**的滚动更新。要让现有 Pod 按新策略更新：

1. 修改 Deployment 的 Pod 模板（如镜像版本）
2. 触发新的滚动更新（`kubectl rollout restart` 或修改镜像）
3. 新更新会使用最新配置的策略

### Q: 更新速度太慢？

- 检查 `maxSurge` 是否过小
- 检查新 Pod 启动时间（是否健康检查太慢？）
- 检查节点资源是否充足（新 Pod 调度失败）

### Q: Recreate 策略下，服务中断时间多久？

取决于 Pod 终止宽限期（`terminationGracePeriodSeconds`）和新 Pod 启动时间：

- 旧 Pod 终止：默认 30s（收到 SIGTERM 后等待）
- 新 Pod 启动：从镜像拉取到 Ready 的时间

可以通过缩短 `terminationGracePeriodSeconds` 减少中断，但需确保应用能快速优雅退出。

### Q: StatefulSet 也支持 RollingUpdate 吗？

支持。StatefulSet 的 RollingUpdate 有额外约束：

- 按索引顺序更新（从最大索引开始倒序）
- 每个 Pod 更新前等待前一个 Pod 进入 Ready
- 可以配置 `partition` 参数实现金丝雀升级

---

## 安全考虑

- ⚠️ **仅允许可信用户修改更新策略**：Require `patch` 权限控制
- ⚠️ **生产环境避免 `maxSurge: 0%` + `maxUnavailable: 100%`**：这等同于 Recreate
- ⚠️ **结合 PDB**：关键应用必须配置 PDB，避免更新期间完全不可用

---

## 相关链接

- [Kubernetes Deployment 更新策略](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy)
- [Kubernetes StatefulSet 更新](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#ordered-rolling-updates)
- [PodDisruptionBudget](/workload-actions/pdb/)
- [健康检查配置](/workload-actions/edit-health-checks/)
