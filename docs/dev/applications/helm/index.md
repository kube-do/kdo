---
title: Helm 应用
parent: 应用管理
nav_order: 4
---

## 介绍

**Helm 应用** 是基于 Helm Chart 部署 Kubernetes 应用的方式。Helm 是 Kubernetes 的包管理器，类似于 Ubuntu 的 apt 或 CentOS 的 yum。通过 Helm，你可以一键部署复杂的应用栈（如数据库、消息队列、监控套件），无需手动编写和管理大量 YAML。

### 为什么使用 Helm？

- ✅ **模板化**：Chart 提供参数化模板，一次定义，多次部署
- ✅ **版本管理**：支持应用版本锁定、升级、回滚
- ✅ **依赖管理**：Chart 可以声明依赖其他 Chart，自动安装
- ✅ **社区生态**：Helm Hub 有数千个官方和社区维护的 Chart
- ✅ **可重复**：不同环境使用相同 Chart，仅参数不同

---

## 核心概念

### Chart

Chart 是 Helm 的应用打包格式，是一个文件目录：

```
my-chart/
  Chart.yaml          # Chart 元数据（名称、版本、描述）
  values.yaml         # 默认配置值
  charts/             # 依赖的子 Chart（如果有）
  templates/          # 模板文件（Deployment、Service 等 Kubernetes 对象）
```

### Repository

Chart 仓库是存储和分发 Chart 的地方。KDO 默认集成：

- **stable**（社区维护）
- **bitnami**（高质量生产级 Chart）
- **kdo-local**（内部自定义 Chart）

### Release

Release 是 Chart 的一次部署实例。同一个 Chart 可以安装多次，每次都是一个独立的 Release，拥有独立的 Release 名称和配置。

---

## 快速开始

### 1. 浏览和搜索 Chart

进入 **应用管理 → Helm 应用**：

1. 点击 **新建**
2. 在搜索框输入关键词（如 `mysql`、`redis`、`nginx`）
3. 查看 Chart 列表：
   - **名称**：Chart 包名
   - **版本**：可用版本号
   - **描述**：功能简介
   - **AppVersion**：应用实际版本（如 MySQL 8.0）

4. 点击目标 Chart → 进入 **安装向导**

### 2. 安装 Helm 应用

**安装向导步骤：**

**Step 1: 基础信息**

| 字段 | 说明 | 建议 |
|------|------|------|
| **Release 名称** | 安装后实例的名称 | `mysql-prod` |
| **目标命名空间** | 部署到哪个 K8s 命名空间 | 选择已存在的命名空间 |
| **Chart 版本** | 选择稳定版本（避免 latest） | 如 `8.8.0` |

**Step 2: 参数配置（关键）**

KDO 提供图形化表单编辑 `values.yaml`：

- **全局参数（Global）**：影响所有子 Chart 的值
- **主组件参数**：主应用的配置（如数据库 root 密码、副本数）
- **子组件参数**（如果有）：依赖的子 Chart 配置

**常用参数示例（MySQL Chart）：**

```yaml
global:
  storageClass: "nfs-client"  # 存储类
  images:
    tag: "8.0"  # 镜像标签

auth:
  rootPassword: "ChangeMe123!"  # root 密码（必填）
  database: "mydb"  # 初始数据库

primary:
  persistence:
    size: 10Gi  # 数据卷大小
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"

replicaCount: 1  # 副本数（主从复制可设为 >1）
```

**Step 3: 审查与安装**

- 点击 **预览 YAML** 查看最终生成的 Kubernetes 资源
- 确认无误 → **添加**

KDO 后台调用 `helm install`（或 `helm upgrade` 如果 Upgrade 模式）创建资源。

### 3. 管理 Helm 应用

安装完成后，在 **Helm 应用** 列表找到你的 Release：

**操作菜单：**

- **详情**：查看 Release 信息、Notes、资源清单
- **升级**：修改参数后点击升级，更新应用
- **回滚**：恢复到历史版本的配置
- **删除**：卸载应用（可选择保留 PVC）

---

## 详细说明

### 值文件 (values.yaml)

Helm Chart 通过 `values.yaml` 提供默认配置。KDO 的图形界面本质上是对这个文件的编辑。理解值文件结构有助于高级用户直接编辑 YAML。

**值优先级（从低到高）：**

1. Chart 自带的 `values.yaml`（默认）
2. 用户通过 UI 提交的值
3. 升级时传入的 `--set` 参数
4. `--values` 指定的自定义 YAML 文件

KDO 当前主要使用第 2 层（UI 配置）。

### 依赖管理

某些 Chart 声明了 `dependencies`（如 `bitnami/wordpress` 依赖 `bitnami/mysql`）。安装时：

- Helm 自动下载并安装依赖 Chart
- KDO UI 会显示所有子 Chart 的配置项

注意：依赖 Chart 的升级/回滚会随着主 Chart 一起操作。

---

## 最佳实践

### 选择 Chart

- 📦 **官方优先**：优先选择 bitnami、stable 等官方维护的 Chart
- 📦 **检查活跃度**：查看 Chart 的 last update、download count、issue 数量
- 📦 **版本匹配**：Chart 版本与应用版本对应（如 `mysql-8.8.0` 对应 MySQL 8.0）
- 📦 **阅读 README**：Chart 的 README 包含重要配置说明和已知问题

### 参数配置

- 🔧 **强制修改密码**：`rootPassword`、`postgresPassword` 等必须修改
- 🔧 **资源限制**：设置 `resources.requests/limits` 避免资源争抢
- 🔧 **存储类**：根据环境选择 `nfs-client`（dev）或 `managed-csi`（prod）
- 🔧 **副本数**：生产环境至少 2（高可用），注意某些 Chart 主从架构特殊

### 版本管理

- 🔄 **固定版本**：生产环境锁定 Chart 版本，避免自动升级
- 🔄 **先测试再生产**：在 dev/test 环境验证后再应用到 prod
- 🔄 **升级前备份**：重要数据（如数据库）提前备份
- 🔄 **回滚准备**：`helm rollback` 可快速回退

### 安全

- 🔒 **私有仓库**：公司内部 Chart 使用私有 Helm Repository
- 🔒 **镜像拉取**：私有镜像配置 `imagePullSecrets`
- 🔒 **NetworkPolicy**：限制 Pod 间不必要的网络访问
- 🔒 **RBAC**：限制非管理员用户安装 Helm 应用

---

## 常见问题

### Q: Helm 应用安装失败？

在 KDO UI 看不到详细错误，可以：
1. 查看 **流水线运行** 或 **事件** 页面
2. 或命令行：
   ```bash
   helm list -n <namespace>
   helm status <release-name> -n <namespace>  # 查看失败原因
   kubectl get pods -n <namespace> --watch   # 观察 Pod 状态
   kubectl describe pod <pod-name> -n <namespace>  # 查看事件
   ```

常见原因：
- 参数错误（如密码太短、存储类不存在）
- 资源配额不足（ResourceQuota 限制）
- 节点选择器/污点不匹配
- 镜像拉取失败（网络或 secret）

### Q: 如何升级 Helm 应用？

1. 进入 Helm 应用详情
2. 点击 **升级**
3. 修改需要变更的参数（如镜像版本、副本数）
4. 预览 YAML → **添加**
5. 等待升级完成

**升级策略：**
- 默认是 RollingUpdate（Deployment 控制）
- 可以通过 `strategy.*` 参数调整 `maxUnavailable`、`maxSurge`

### Q: 升级失败如何回滚？

1. Helm 应用详情 → **历史版本**
2. 选择上一个稳定版本 → **回滚**
3. 或命令行：
   ```bash
   helm history my-release -n <namespace>  # 查看版本号
   helm rollback my-release 1 -n <namespace>
   ```

### Q: 如何获取 Helm Chart 的完整参数列表？

- 下载 Chart 查看 `values.yaml`：
  ```bash
  helm pull bitnami/mysql --untar
  cat mysql/values.yaml
  ```
- 或访问 Helm Repository 的 Chart 页面（如果提供）
- KDO UI 通常只展示常用参数，完整参数需查看 Chart 文档

### Q: Helm 应用和标准应用（Pipelines as Code）如何选择？

| 场景 | 推荐方式 |
|------|---------|
| 快速部署中间件（MySQL、Redis、Kafka） | Helm 应用 ✅ |
| 自定义业务应用，需要完整 CI/CD | 标准应用 ✅ |
| 需要高度自定义流水线（测试、安全扫描） | 标准应用 ✅ |
| 简单临时服务 | 手动镜像 或 Helm |

---

## 相关链接

- [Helm 官方文档](https://helm.sh/docs/)
- [Bitnami Helm Charts](https://github.com/bitnami/charts)
- [KDO 应用管理概览](/dev/applications/)
- [Helm 应用 vs 标准应用对比](/dev/applications/)
