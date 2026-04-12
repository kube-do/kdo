---
title: 限制范围(LimitRange)
parent: 管理
nav_order: 5
---

## 介绍

**LimitRange** 用于为命名空间设置容器资源请求（requests）和限制（limits）的默认值、最小值和最大值。它确保新创建的 Pod 符合资源规范，防止某个容器申请过多或过少资源，从而维护集群稳定性和公平性。

### 为什么需要 LimitRange？

- ✅ **默认值**：开发者忘记设置资源限制时，自动填充合理的默认值
- ✅ **约束边界**：防止申请过小（导致 QoS 过低）或过大（浪费资源）
- ✅ **配额前置**：配合 ResourceQuota，确保单个容器不会耗尽命名空间总配额
- ✅ **规范统一**：团队内资源配置标准化

---

## 快速开始

### 创建 LimitRange

1. 进入 **管理员界面 → 管理 → 限制范围**
2. 点击 **新建限制范围**
3. 选择目标 **命名空间**
4. 配置约束：

| 约束类型 | 说明 | 示例 |
|---------|------|------|
| **默认请求** | 未指定 requests 时的默认值 | CPU: `100m`, Memory: `128Mi` |
| **默认限制** | 未指定 limits 时的默认值 | CPU: `500m`, Memory: `512Mi` |
| **最小请求** | requests 不能低于此值 | CPU: `50m`, Memory: `64Mi` |
| **最大请求** | requests 不能超过此值 | CPU: `2000m`, Memory: `4Gi` |
| **最小限制** | limits 不能低于此值 | CPU: `100m`, Memory: `128Mi` |
| **最大限制** | limits 不能超过此值 | CPU: `4000m`, Memory: `8Gi` |
| **最大请求/限制比** | limits/requests 最大比例 | `4`（limits 不超过 requests 的 4 倍）|

5. 点击 **添加**

### 查看 LimitRange

列表显示：
- 命名空间
- 默认请求/限制
- 最小/最大范围
- 创建时间

点击详情查看完整 YAML。

---

## 详细说明

### LimitRange 结构示例

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: development
spec:
  limits:
  - default:  # 默认 limits（如果未指定）
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:  # 默认 requests（如果未指定）
      cpu: "100m"
      memory: "128Mi"
    min:  # 最小允许值
      cpu: "50m"
      memory: "64Mi"
    max:  # 最大允许值
      cpu: "2000m"
      memory: "4Gi"
    maxRatio:  # limits/requests 最大比例
      cpu: 4
      memory: 4
    type: Container  # 作用于 Container
  - default:  # Pod 级别的默认（可选）
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Pod
```

### 生效时机

- **新创建的资源**：LimitRange 只对新创建的 Pod/Container 生效
- **已存在资源**：不受影响（需重启或重新创建）
- **默认值填充**：当 Pod spec 缺失 requests/limits 时，Kubelet 自动注入默认值

---

## 约束类型详解

### 1. default / defaultRequest

如果用户未明确指定，自动填充的值：

```yaml
# 用户写的 Pod（未指定资源）
containers:
- name: nginx
  image: nginx

# 经过 LimitRange 注入后等价于：
containers:
- name: nginx
  image: nginx
  resources:
    requests:
      cpu: "100m"
      memory: "128Mi"
    limits:
      cpu: "500m"
      memory: "512Mi"
```

### 2. min / max

- **min**：requests 不能小于此值，否则 Pod 创建失败
- **max**：limits 不能大于此值，否则 Pod 创建失败

**示例：**
```yaml
min:
  cpu: "50m"
  memory: "64Mi"
max:
  cpu: "2000m"
  memory: "4Gi"
```

如果 Pod 设置 `cpu: 10m`，会被拒绝（低于 min）；设置 `cpu: 5000m` 也会被拒绝（超过 max）。

### 3. maxRatio

`limits / requests` 的最大比例，防止设置过于悬殊（如 requests 1m，limits 1000m）。

```yaml
maxRatio: 4  # limits 不能超过 requests 的 4 倍
```

如果 Pod 设置 `requests.cpu=100m, limits.cpu=500m` → 比例 5 → 被拒绝。

---

## 最佳实践

### 命名空间策略

- 🎯 **按环境差异化**：
  - `dev`：宽松（默认值小，上限高）
  - `prod`：严格（默认值合理，上限合理）
- 🎯 **默认值合理**：defaultRequest 应接近应用实际需求，避免浪费
- 🎯 **maxRatio 适中**：4-10 之间，避免过度超售导致 QoS 劣化

### 配合 ResourceQuota

LimitRange 约束单个容器，ResourceQuota 约束整个命名空间：

```yaml
# LimitRange：每个容器至少 100m CPU
# ResourceQuota：命名空间总共 10 CPU
# 效果：该命名空间最多创建 100 个容器（10 / 0.1）
```

两者结合，实现微观+宏观双重控制。

---

## 常见问题

### Q: LimitRange 不生效？

- 确认 LimitRange 已创建在目标命名空间：`kubectl get limitrange -n <ns>`
- 确认 Pod 创建时间在 LimitRange 之后
- 检查 Pod spec 是否已经显式设置了 requests/limits（显式值不覆盖，只会补默认值）
- 查看 Pod 事件：`kubectl describe pod <name>` 看是否有被拒绝的记录

### Q: Pod 创建失败，提示资源值超出 LimitRange？

检查错误信息：
- `exceeded limit`：limits 超过 max
- `less than min`：requests 低于 min
- `ratio`：maxRatio 超限

修改 Pod spec 使其满足 LimitRange 约束，或调整 LimitRange 本身。

### Q: LimitRange 会影响已运行的 Pod 吗？

不会。LimitRange 只在 Pod 创建时验证和注入默认值。已运行 Pod 不受影响。如需调整，需删除重建（或 edit 后触发滚动更新）。

### Q: 可以设置多个 LimitRange 吗？

一个命名空间只能有 **一个** LimitRange。如果需要不同约束，可以将不同应用分到不同命名空间。

### Q: LimitRange 和 ResourceQuota 冲突？

不会冲突，它们是 complementary：
- LimitRange：单个容器/ Pod 的边界
- ResourceQuota：命名空间总资源上限

如果同时配置，Pod 必须同时满足两者才能创建。

---

## 相关链接

- [Kubernetes LimitRange 官方文档](https://kubernetes.io/docs/concepts/policy/limit-range/)
- [Kubernetes ResourceQuota](/admin/management/resourcequotas/)
- [Kubernetes 资源管理](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [AppProject 自动配额](/admin/management/appprojects/)
