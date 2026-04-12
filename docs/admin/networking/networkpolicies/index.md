---
title: 网络策略
parent: 网络
nav_order: 1
---

## 介绍

**NetworkPolicy** 定义 Pod 之间以及 Pod 与外部网络之间的访问控制规则。它采用基于标签的 selector 模型，允许管理员实施零信任网络架构，限制不必要的横向移动。

### 为什么需要网络策略？

- ✅ **安全隔离**：默认拒绝所有，仅允许必要的通信
- ✅ **合规要求**：满足安全审计和行业规范（如 PCI-DSS）
- ✅ **微服务安全**：防止被攻陷的 Pod 横向扫描其他服务
- ✅ **环境隔离**：开发、测试、生产环境网络边界

---

## 快速开始

### 前提条件

NetworkPolicy 需要 CNI 插件支持。KDO 默认使用 **Calico**（支持 NetworkPolicy）。

验证：
```bash
kubectl get pods -n kube-system | grep calico
```

### 创建 NetworkPolicy

1. 进入 **管理员界面 → 网络 → 网络策略**
2. 点击 **新建网络策略**
3. 填写表单：

| 字段 | 说明 | 示例 |
|------|------|------|
| **名称** | 策略标识 | `allow-frontend-to-backend` |
| **命名空间** | 策略作用的命名空间（默认当前） | `default` |
| **策略类型** | Ingress / Egress / Both | `Ingress`（控制入站）|
| **Pod 选择器** | 策略应用于哪些 Pod | `app=backend`（选择所有 backend 标签的 Pod）|
| **入口规则** | 允许哪些来源访问这些 Pod | 见下方 |
| **出口规则** | 允许这些 Pod 访问哪些目标 | 可选 |

4. 点击 **添加**

### 规则配置示例

#### 示例 1：允许特定命名空间访问

**场景**：`backend` Pod 只允许 `frontend` 命名空间访问

- **Pod 选择器**：`app=backend`
- **入口规则**：
  - 来自：`namespaceSelector: {name: frontend}`

#### 示例 2：允许特定 Pod 访问特定端口

**场景**：`backend` Pod 允许 `frontend` Pod 访问 8080 端口

- **Pod 选择器**：`app=backend`
- **入口规则**：
  - 来源：`podSelector: {matchLabels: {app: frontend}}`
  - 端口：`8080/TCP`

#### 示例 3：禁止所有出口（锁定）

**场景**：某些敏感 Pod 不允许访问外部网络

- **策略类型**：Egress
- **出口规则**：空（没有规则即拒绝所有）
- 或显式允许仅访问特定 IP：
  - `to: [{ipBlock: {cidr: 10.0.0.0/24}}]`

---

## 详细说明

### NetworkPolicy 结构

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api
  namespace: default
spec:
  podSelector:  # 选择哪些 Pod 应用此策略
    matchLabels:
      app: api
  policyTypes:
  - Ingress  # 生效方向：入站、出站或两者
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

### 选择器种类

| 选择器类型 | 字段 | 说明 |
|-----------|------|------|
| **Pod 选择器** | `podSelector` | 基于 Pod 标签匹配 |
| **命名空间选择器** | `namespaceSelector` | 基于命名空间标签匹配 |
| **IP 块选择器** | `ipBlock` | 基于 CIDR 匹配 IP（常用于外部网络）|

可以组合多个 `from` 规则，满足其一即可（OR 逻辑）。

### 默认行为

- **无 NetworkPolicy**：默认允许所有入站和出站（允许所有）
- **至少一个 Ingress 策略**：其他未被选中的 Pod 仍允许所有（选择性限制）
- **如果有任何 Ingress 策略**：未被任何 Ingress 策略覆盖的 Pod 实际上**仍然允许所有**，除非你创建一个空策略（`podSelector: {}` 且无 `from`）来拒绝所有。

**正确理解：** NetworkPolicy 是 **白名单** 机制。一个策略只对匹配的 Pod 生效。想要"拒绝所有"，需要确保该 Pod 被一个空策略覆盖。

---

## 典型场景

### 场景 1：三层架构隔离

```
前端 (frontend) → 后端 (backend) → 数据库 (db)
```

**策略：**
1. `backend` 允许 `frontend` 访问 `8080`
2. `db` 允许 `backend` 访问 `3306`
3. 各层之间禁止直接跨层访问

### 场景 2：多租户隔离

不同项目命名空间 `team-a`、`team-b` 默认不能互访：

```yaml
# 拒绝所有跨命名空间访问
podSelector: {}  # 选中所有 Pod
policyTypes:
- Ingress
ingress: []  # 没有规则 = 拒绝所有入站（除了同命名空间）
```

### 场景 3：出口限制

某些 Pod 只允许访问外部特定 API：

```yaml
podSelector:
  matchLabels:
    app: restricted
policyTypes:
- Egress
egress:
- to:
  - ipBlock:
      cidr: 203.0.113.0/24  # 仅允许访问此网段
```

同时可以允许访问集群 DNS：
```yaml
- to:
  - namespaceSelector: {name: kube-system}
    podSelector: {matchLabels: {k8s-app: kube-dns}}
  ports:
  - protocol: UDP
    port: 53
```

---

## 最佳实践

### 策略设计

- 🛡️ **最小权限**：只开放必要的端口和协议
- 🛡️ **默认拒绝**：先创建空策略拒绝所有，再逐步添加允许规则
- 🛡️ **命名空间隔离**：不同业务/团队使用不同命名空间，通过 `namespaceSelector` 控制
- 🛡️ **记录日志**：NetworkPolicy 本身不记录流量日志，结合 Calico 的 Flow Logger 或 eBPF 工具

### 运维管理

- 📋 **版本控制**：NetworkPolicy YAML 纳入 Git
- 📋 **测试验证**：策略生效后，从不同来源测试连通性（`curl`、`nc`、`telnet`）
- 📋 **定期审计**：检查策略是否过时或过于宽松
- 📋 **命名规范**：`allow-<source>-to-<destination>-<port>` 格式

### 与 Service 交互

NetworkPolicy 作用于 **Pod IP**，而非 Service IP。Service 只是 Pod 的负载均衡器。因此：
- 规则中的 `podSelector` 指向的是 Service 后面的 Pod
- 规则中的 `ports` 是 Pod 容器端口（不是 Service 端口）

---

## 常见问题

### Q: NetworkPolicy 不生效？

- 确认 CNI 支持（Calico、Cilium 等）：`kubectl get pods -n kube-system`
- 确认策略应用到正确的命名空间和 Pod 标签
- 查看策略是否 `policyTypes` 包含 `Ingress` 或 `Egress`
- 检查是否有其他策略冲突（多个策略是叠加的，取更严格的）

### Q: 策略生效后服务无法访问？

- 检查 Pod 标签是否匹配策略的 `podSelector` 和 `from` 条件
- 检查端口号和协议（TCP/UDP）是否正确
- 检查来源 Pod 是否在同一个命名空间（默认同命名空间允许）
- 使用 `kubectl exec` 进入 Pod 内部测试连接性

### Q: 如何测试网络策略？

```bash
# 在源 Pod 测试访问目标 Pod
kubectl exec -it <source-pod> -- curl http://<target-pod-ip>:<port>

# 查看策略列表
kubectl get networkpolicy -n <namespace>

# 查看策略详情
kubectl describe networkpolicy <name> -n <namespace>
```

### Q: NetworkPolicy 会影响集群内部 DNS 吗？

默认情况下，如果策略限制了所有入站，**不会**影响 DNS（CoreDNS），因为 DNS 查询是到 ClusterIP Service，仍然在同命名空间。但某些严格策略可能需要显式允许 DNS：

```yaml
egress:
- to:
  - namespaceSelector: {name: kube-system}
    podSelector: {matchLabels: {k8s-app: kube-dns}}
  ports:
  - protocol: UDP
    port: 53
```

### Q: 可以设置默认拒绝所有吗？

是的，创建一个"catch-all"策略：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: default
spec:
  podSelector: {}  # 选中所有 Pod
  policyTypes:
  - Ingress
  - Egress
  ingress: []  # 空列表 = 拒绝所有入站
  egress: []   # 空列表 = 拒绝所有出站
```

然后为需要通信的 Pod 创建额外的允许策略。

### Q: 性能影响？

NetworkPolicy 由 CNI 实现（如 Calico）在数据平面处理。简单的策略对性能影响极小（<5%）。过于复杂的策略（大量规则、大规模集群）可能增加 iptables/ipsets 大小，需监控节点性能。

---

## 相关链接

- [Kubernetes NetworkPolicy 官方文档](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Calico 网络策略指南](https://docs.projectcalico.org/security/network-policy/)
- [Kubernetes 零信任网络模型](https://kubernetes.io/docs/concepts/security/network-policies/)
- [KDO 开发者网络存储](/dev/network-stroage/)
