---
title: 流水线
parent: 管理员界面
nav_order: 8
---

## 介绍

**流水线**（Pipelines）是 KDO 平台基于 Tekton 构建的 CI/CD 能力，支持自动化构建、测试、部署。管理员视角的流水线管理涵盖整个集群的流水线定义、任务模板、运行监控以及权限控制。

### 主要功能

| 功能 | 描述 | 入口位置 |
|------|------|----------|
| **流水线定义 (Pipeline)** | 定义 CI/CD 流程的各个阶段（构建、测试、部署） | 左侧菜单第8项 |
| **流水线运行 (PipelineRun)** | 执行流水线的实例，查看日志、状态、结果 | 左侧菜单第8项 |
| **任务 (Task)** | 可复用的流水线步骤单元（如 build、test、deploy） | 左侧菜单第8项 |
| **任务运行 (TaskRun)** | 任务的执行实例 | 左侧菜单第8项 |
| **流水线资源 (PipelineResource)** | 定义流水线的输入/输出（如 Git 仓库、镜像名称） | 左侧菜单第8项 |

---

## 快速导航

### 常用任务

- [查看流水线定义](/admin/pipeline/pipelines/) - 了解现有流水线的结构
- [监控流水线运行](/admin/pipeline/pipelineruns/) - 跟踪 CI/CD 执行状态
- [管理任务模板](/admin/pipeline/tasks/) - 创建可复用的步骤
- [配置流水线触发器](/admin/pipeline/triggers/) - Webhook 自动触发（待完善）

---

## 核心概念

### Pipeline vs PipelineRun

- **Pipeline**：静态定义，描述流程的结构（阶段、任务、参数）
- **PipelineRun**：动态执行，绑定具体的资源（如 Git 仓库 URL、镜像标签），启动一次流水线运行

**类比：**
- Pipeline = 菜谱（步骤、材料）
- PipelineRun = 根据菜谱做一次饭（具体的食材、火候）

### Task

Task 是 Pipeline 的原子步骤，可复用。例如：
- `build`：从源码构建镜像
- `test`：运行单元测试
- `deploy`：部署到 Kubernetes
- `scan`：安全扫描

Task 也是独立的 Kubernetes CRD，可以被多个 Pipeline 引用。

### PipelineResource

定义流水线的输入输出资源，如：
- `git-repo`：Git 仓库（触发源）
- `image`：镜像名称（构建产物）

在 **Embedded Pipelines**（KDO 应用内置）中，这些资源由平台自动生成，无需手动配置。

---

## 管理员职责

作为集群管理员，你负责：

1. **基础设施层流水线**
   - 集群升级流水线
   - 监控告警配置流水线
   - 备份恢复流水线

2. **平台能力提供**
   - 预装常用 Task（build、test、deploy）
   - 配置 Task 运行所需的 ServiceAccount 和权限
   - 管理共享的 PipelineResource（如公共镜像仓库凭证）

3. **权限管理**
   - 控制哪些用户可以创建/运行流水线
   - 限制 Task 的权限范围（避免滥用高权限 Task）
   - 审核流水线运行的日志和资源使用

4. **性能与容量**
   - 监控 TaskRunner Pod 的资源使用
   - 调整并发限制（避免过多并行 Task 耗尽集群资源）
   - 配置默认的持久化存储（Task 中间产物）

---

## 典型场景

### 1. 应用开发者的流水线（Embedded）

KDO 的 **应用（Application）** 自动生成流水线，无需管理员手动创建：

- 开发者创建应用时选择源码仓库
- 平台自动生成 `.tekton/` 目录中的 Pipeline 定义
- 推送代码自动触发构建、测试、部署

**管理员只需：**
- 确保 Tekton 组件正常运行
- 配置默认的 ServiceAccount 和镜像拉取密钥
- 监控集群资源是否充足

### 2. 集群维护流水线（管理员自用）

管理员可以创建专门的流水线用于集群运维：

**示例：集群版本升级**
```yaml
tasks:
  - backup-etcd
  - drain-nodes
  - upgrade-master
  - upgrade-workers
  - verify-cluster
```

**示例：批量节点打标**
```yaml
tasks:
  - label-nodes  # 根据硬件规格打标签
  - cordon-old   # 隔离旧节点
```

---

## 最佳实践

### 安全性

- 🔒 **最小权限**：Task 使用的 ServiceAccount 仅授予必要权限
- 🔒 **镜像信任**：只使用来自受信任仓库的 Task 镜像
- 🔒 **资源限制**：为 TaskRunner Pod 设置 CPU/Memory 限制
- 🔒 **Secret 管理**：使用 Kubernetes Secrets 或外部 Secret Store（如 Vault）

### 性能

- ⚡ **并发控制**：通过 `TektonConfig` 调整最大并发 PipelineRun 数量
- ⚡ **缓存利用**：配置 Task 的缓存策略（如 Maven、Docker layer cache）
- ⚡ **任务拆分**：长的 Pipeline 拆分为多个 Task，便于复用和并行
- ⚡ **选择轻量 Task**：优先使用 Alpine 或 Distroless 镜像作为 Task 运行器

### 可观测性

- 📊 **日志集中**：确保 Task 日志输出到标准输出，便于收集到 Elasticsearch/Loki
- 📊 **指标监控**：监控 PipelineRun 成功率、平均执行时间、失败原因
- 📊 **失败告警**：对持续失败的 Pipeline 设置通知（如企业微信、邮件）
- 📊 **审计追踪**：保留 PipelineRun 历史记录至少 90 天

---

## 常见问题

### Q: PipelineRun 一直处于 `Running` 状态？

- 检查 Task 是否卡在某个步骤（如等待输入、下载镜像慢）
- 查看 TaskRun 的日志：`kubectl logs -n <namespace> <taskrun-pod>`
- 确认 PVC 或 Secret 是否可由 ServiceAccount 访问
- 检查节点资源是否充足（CPU/Memory）

### Q: 如何限制用户只能运行特定流水线？

- 使用 Kubernetes RBAC：限制用户对 `PipelineRun` 的 `create` 权限
- 结合 KDO 的 AppProject 设置允许的 ClusterRoles
- 在命名空间级别绑定 Role，仅允许引用预定义的 Pipeline

### Q: Tekton 组件状态检查？

```bash
# 查看所有组件
kubectl get pods -n tekton-pipelines

# 查看 Webhook 是否正常
kubectl get deployment -n tekton-pipelines tekton-pipelines-webhook
```

如果组件异常，参考 [Tekton 故障排查指南](https://tekton.dev/docs/install/troubleshooting/)。

### Q: 如何为 Pipeline 添加审批步骤？

Tekton v0.38+ 支持 [PipelineApproval](https://tekton.dev/docs/pipelines/pipelineruns/#approvals)：

```yaml
spec:
  pipelineSpec:
    tasks: [...]
  pipelineRunSpec:
    pipelineRef:
      name: my-pipeline
    approvals:
    - name: "prod-deploy-approval"
      issuer: "admin@example.com"
```

需要 Tekton Dashboard 或自定义集成来管理审批操作。

---

## 相关链接

- [Tekton 官方文档](https://tekton.dev/docs/) - 完整 Pipelines as Code 指南
- [KDO 应用流水线架构](/dev/applications/pipelines/) - 开发者视角
- [Kubernetes ServiceAccount 与 RBAC](/rbac/) - 权限模型
- [可观测性平台](/observability/) - 监控流水线运行状态
