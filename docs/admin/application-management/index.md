---
title: 应用管理(管理员)
parent: 管理员界面
nav_order: 2
---

## 介绍

**应用管理**模块面向集群管理员，负责管理平台级别的应用组件和可插拔的 Kubernetes Operators。与开发者视角的应用（基于 Git 仓库的 CI/CD）不同，管理员的应用管理侧重于：

- **平台中间件**：数据库、消息队列、缓存等基础设施
- **Operator 生命周期**：安装、升级、删除 Operator
- **系统 Helm Chart**：KDO 平台自身的组件部署

### 核心组件对比

| 管理类型 | 描述 | 适用场景 | 管理者 |
|---------|------|---------|--------|
| **Helm 应用** | 通过 Helm Chart 部署的社区或自定义应用 | 中间件（MySQL、Redis、Kafka）、第三方服务 | 管理员/开发者 |
| **OperatorHub** | 浏览和安装来自 OperatorHub.io 的 Operators | 扩展 Kubernetes API，管理复杂应用（如数据库 Operator） | 管理员 |
| **已安装 Operators** | 查看和管理集群中已安装的 Operators |  Operators CR 实例管理、升级、卸载 | 管理员/高级用户 |

---

## 快速导航

### 常用任务

- [安装 Helm 应用](/admin/application-management/helm/) - 通过 Chart 快速部署中间件
- [从 OperatorHub 安装 Operator](/admin/application-management/operator-hub/) - 搜索并订阅 Operators
- [管理已安装的 Operators](/admin/application-management/operators/) - 查看版本、升级、删除
- [配置 Helm 仓库](/admin/application-management/helm-repositories/) - 添加自定义 Chart 源（待完善）
- [Operator 最佳实践](/admin/application-management/operator-best-practices/) - 权限、升级策略（待完善）

---

## 详细说明

### Helm 应用

Helm 是 Kubernetes 的包管理器，Chart 定义了应用的部署模板。KDO 集成 Helm 后端，支持：

- **内置仓库**：默认包含 common、bitnami 等流行仓库
- **版本选择**：查看 Chart 的所有可用版本，选择稳定或特定版本
- **参数配置**：图形化表单编辑 `values.yaml`，实时预览生成的 YAML
- **升级/回滚**：支持版本升级和快速回滚

**典型流程：**
1. 进入 **应用管理 → Helm 应用**
2. 点击 **新建**，选择 Namespace 和 Helm 仓库
3. 搜索 Chart（如 `mysql`）
4. 填写版本和参数（管理员可以预设默认值）
5. 提交后平台调用 `helm install` 或 `helm upgrade`

**管理员职责：**
- 维护 Helm 仓库列表（可信源）
- 审核 Chart 内容，避免安全风险
- 定义集群级 `values.yaml` 默认值（如资源限制、持久化配置）
- 定期升级到安全补丁版本

### OperatorHub

OperatorHub 提供了数百个经过认证的生产级 Operators。管理员可以通过 UI 直接订阅安装：

**安装流程：**
1. 进入 **应用管理 → OperatorHub**
2. 浏览或搜索目标 Operator（如 `postgresql`、`redis`）
3. 点击 **安装**，选择：
   - **命名空间**：通常安装在 `operators` 或专用命名空间
   - **安装模式**：All namespaces 或特定 namespace
   - **批准策略**：Automatic（自动升级）或 Manual（手动确认）
4. 等待 Operator 部署完成

**Operator Catalog：**
KDO 使用 ` OperatorHub` 的社区 catalog，也支持添加私有 catalog（Red Hat Marketplace、自定义）。

**管理员职责：**
- 定期更新 catalog 源，获取最新 Operator 版本
- 审核 Operator 的权限需求（RBAC）
- 将 Operator 分类提供给不同团队使用
- 监控已安装 Operator 的健康和版本

### 已安装 Operators

查看和管理集群中所有活跃的 Operator 实例：

- **Operator 列表**：名称、命名空间、版本、状态
- **Operator 详情**：查看 CSV（ClusterServiceVersion）、安装计划
- **Operators CR**：操作由该 Operator 管理的自定义资源（如 `PostgresCluster`、`Redis`）
- **升级/卸载**：执行 Operator 升级或完全移除

**升级注意事项：**
- 检查 Operator 的 **Upgrade Policy**（自动 vs 手动）
- 查阅 Operator 的 **Release Notes**，了解 breaking changes
- 在测试环境验证后再应用到生产
- 备份 Operator 管理的自定义资源状态（可选导出 YAML）

---

## 权限与安全

### RBAC 角色

管理员应用管理需要以下权限：

| 操作 | Kubernetes 资源 | 权限 |
|------|----------------|------|
| 安装 Helm 应用 | `helmreleases.helm.toolkit.fluxcd.io`、`secrets`、`configmaps`、`pods`... | create, update, delete, get, list |
| 安装 Operator | `operators.operators.coreos.com`、`subscriptions.operators.coreos.com`、CSV... | create, update, delete, get, list |
| 管理已安装 Operators | 对应的 CRDs（如 `postgresclusters.postgres-operator.crunchydata.com`） | * |
| 查看集群资源 | 大多数资源类型 | get, list, watch |

### 安全建议

- 🔒 **Helm Chart 信任**：仅添加可信 Helm 仓库（内部或官方）
- 🔒 **Operator 最小权限**：Operators 通常需要高权限，安装前审查其 RBAC
- 🔒 **命名空间隔离**：将不同团队的 Operator 安装到独立命名空间
- 🔒 **网络策略**：限制 Operator 与外部网络的通信（如数据库连接）

---

## 最佳实践

### 应用部署

- 📦 **使用稳定版本**：生产环境选择 Chart 的 `latest` 之外的稳定版本
- 📦 **自定义 Values**：通过 KDO UI 覆盖关键参数（资源限制、副本数、持久化）
- 📦 **资源限制**：所有应用启用 CPU/Memory limits
- 📦 **持久化配置**：数据库等有状态应用必须使用 PVC

### Operator 管理

- 🔄 **订阅策略**：测试环境使用 Automatic，生产使用 Manual
- 🔄 **版本跟踪**：定期检查 Operator 和安全更新
- 🔄 **备份策略**：Operator 管理的资源配置备份（`kubectl get all -o yaml`）
- 🔄 **隔离安装**：避免所有 Operator 集中在一个命名空间，按业务分类

---

## 常见问题

### Q: Helm 应用安装失败？

- 检查 Helm 仓库是否可访问：`helm repo list`
- 确认参数值合法（如存储类是否存在、端口是否冲突）
- 查看 Helm release 状态：`helm status <release-name> -n <namespace>`
- 检查 Pod 日志：`kubectl logs -n <namespace> <pod-name>`

### Q: Operator 无法管理 CR？

- 确认 Operator 的 CSV 处于 `Succeeded` 状态
- 检查 CRD 是否已安装：`kubectl get crd`
- 验证 CR 的 `apiVersion`、`kind`、`metadata.name` 是否正确
- 查看 Operator 日志：`kubectl logs -n <operator-namespace> <operator-pod>`

### Q: 如何知道 Operator 支持哪些 CR？

- 查看 Operator 的 CSV：`kubectl get csv -n <namespace> -o yaml`
- CSV 中的 `customresourcedefinitions` 字段列出了提供的 CRD
- OperatorHub 页面通常也会说明

### Q: Operator 升级后 CR 不兼容？

某些 Operator 升级可能引入 CRD schema 变更：

- 查阅 Operator 的 Upgrade Notes
- 使用 `kubectl api-versions` 检查 CRD 的存储版本
- 必要时手动转换 CR YAML（参考 Operator 文档）
- 在测试环境验证后再升级生产

---

## 相关链接

- [Helm 官方文档](https://helm.sh/docs/)
- [OperatorHub.io](https://www.operatorhub.io/)
- [Kubernetes Operators 最佳实践](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [KDO 应用管理（开发者视角）](/dev/applications/)
- [Helm 应用使用指南](/admin/application-management/helm/)
- [OperatorHub 使用指南](/admin/application-management/operator-hub/)
