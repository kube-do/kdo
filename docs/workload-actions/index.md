---
title: 工作负载操作
nav_order: 6
---

## 介绍

**工作负载操作**提供对运行中应用（Deployment、StatefulSet、Pod 等）的实时管理能力。无需编辑 YAML，通过控制台或 API 即可执行常见运维操作。

### 支持的操作类型

| 操作 | 描述 | 适用工作负载 |
|------|------|--------------|
| 启动 / 停止 | 批量启停应用副本 | Deployment, StatefulSet, DaemonSet |
| 重启 | 滚动重启，按更新策略执行 | Deployment, StatefulSet |
| 扩缩容 | 调整副本数或 HPA | Deployment, StatefulSet |
| 更新策略 | 配置 RollingUpdate 参数 | Deployment, StatefulSet |
| 健康检查 | 添加/编辑 Liveness 和 Readiness Probe | 所有含容器的负载 |
| 资源限制 | 调整 CPU/Memory Request/Limit | 所有工作负载 |
| 存储管理 | 挂载/卸载 PersistentVolumeClaim | 所有可挂载存储的负载 |
| 事件查看 | 实时查看资源事件 | 所有工作负载 |

---

## 操作入口

在 **开发者界面 → 工作负载** 页面：

1. 选择要操作的工作负载（如 Deployment）
2. 在列表右侧点击 **操作** 按钮，或勾选后点击顶部 **批量操作**
3. 从下拉菜单选择操作类型
4. 填写表单并提交

操作执行后可在 **流水线运行** 或 **事件** 页面跟踪进度。

---

## 常用操作详解

### 编辑副本数

快速调整 Deployment 的副本数量：

- 输入期望的副本数（如 3）
- 平台执行滚动更新，保证服务不中断
- 详情：[编辑副本数](/docs/workload-actions/edit-pod-count/)

### 水平自动扩缩 (HPA)

基于 CPU/内存或自定义指标自动扩缩：

1. 点击 **添加 HPA**
2. 设置副本范围（min/max）
3. 选择指标类型和目标值
4. 保存后 HPA Controller 自动调整副本数
- 详情：[HPA 管理](/docs/workload-actions/hpa/)

### 中断预算 (PDB)

确保应用滚动更新时始终有最小可用副本：

- 定义 `minAvailable` 或 `maxUnavailable`
- KDO 在更新部署时自动遵守预算
- 详情：[PDB 配置](/docs/workload-actions/pdb/)

### 编辑健康检查

配置容器存活和就绪探针：

- **Liveness Probe**：检测容器是否存活，失败则重启
- **Readiness Probe**：检测容器是否就绪，失败则从 Service 负载均衡移除
- 支持 HTTP、TCP、Exec 三种方式
- 详情：[健康检查](/docs/workload-actions/edit-health-checks/)

### 添加存储

为有状态应用挂载持久化存储：

1. 选择已有的 PersistentVolumeClaim 或创建新 PVC
2. 指定挂载路径（容器内）
3. 可选：指定读写模式（ReadWriteOnce/ReadOnlyMany 等）
- 详情：[存储管理](/docs/workload-actions/add-storage/)

### 编辑更新策略

控制 Deployment 滚动更新行为：

- **Max Unavailable**：更新期间最多不可用的副本数
- **Max Surge**：更新期间最多额外启动的副本数
- 策略选择：`RollingUpdate`（默认）或 `Recreate`
- 详情：[更新策略](/docs/workload-actions/edit-update-strategy/)

### 编辑资源限制

调整容器的资源申请和限制：

| 字段 | 说明 | 示例 |
|------|------|------|
| CPU Request | 保证的最小 CPU | `500m` (0.5 核) |
| CPU Limit | 最大可使用 CPU | `2000m` (2 核) |
| Memory Request | 保证的最小内存 | `256Mi` |
| Memory Limit | 最大内存 | `1Gi` |

合理设置资源限制可以避免应用相互争抢资源。
- 详情：[资源限制](/docs/workload-actions/edit-resource-limits/)

---

## 操作最佳实践

- ✅ **小步调整**：扩缩容时一次调整少量副本，避免突变
- ✅ **先就绪后流量**：确保 Readiness Probe 配置正确，避免未就绪的 Pod 接收请求
- ✅ **设置 PDB**：对于关键应用，配置最小可用副本数
- ✅ **资源预留**：Request 接近实际用量，Limit 留有余量
- ✅ **观察再更新**：使用滚动更新策略时，监控新 Pod 是否健康再继续

---

## 脚本示例

通过 KDO API 执行操作的 curl 示例（仅作参考）：

```bash
# 扩缩容 Deployment
curl -X POST https://kdo.kube-do.cn/api/v1/workloads/deployments/myapp/scale \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"replicas": 3}'

# 添加 HPA
curl -X POST https://kdo.kube-do.cn/api/v1/workloads/deployments/myapp/hpa \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"minReplicas":2,"maxReplicas":5,"targetCPUUtilization":80}'
```

---

## 相关链接

- [工作负载概览](/docs/dev/workloads/) - 了解各种工作负载类型
- [应用管理](/docs/dev/applications/) - 创建和管理应用
- [可观测性](/docs/observability/) - 监控操作影响
