---
title: 应用管理
parent: 开发者界面
nav_order: 2
---

1. TOC
{:toc}

## 应用管理概览

KDO 平台支持多种方式创建和管理应用程序，满足不同场景的需求：

| 方式 | 说明 | 自动化程度 | 适用场景 |
|------|------|-----------|----------|
| [应用](/docs/dev/applications/repository/) | 基于 Git 仓库，自动生成 CI/CD 流水线 | ⭐⭐⭐⭐⭐ | 需要持续集成/持续部署的代码项目 |
| [流水线](/docs/dev/applications/pipelines/) | Tekton 流水线配置与管理 | ⭐⭐⭐⭐⭐ | 自定义 CI/CD 流程 |
| [Helm 应用](/docs/dev/applications/helm/) | 使用 Helm Chart 部署社区组件 | ⭐⭐⭐⭐ | 复杂应用、中间件、第三方服务 |
| [镜像构建](/docs/dev/applications/builds/) | 从 Dockerfile 构建镜像并部署 | ⭐⭐⭐ | 有源码需要构建，但无需完整流水线 |
| [手动镜像](/docs/dev/applications/add/) | 直接使用已有容器镜像 | ⭐ | 快速部署、测试、一次性服务 |

---

## 快速开始

### 标准应用（推荐）

如果你的代码已托管在 GitHub/GitLab/Gitee/Gitea 中，建议使用 **[应用](/docs/dev/applications/repository/)** 方式：

1. 准备代码仓库，确保包含：
   - 应用代码
   - `Dockerfile`（或使用平台内置构建模板）
   - `kubernetes/` 目录（包含 Deployment、Service 等资源配置）
2. 在 KDO 平台创建应用，填写 Git URL 和 Token
3. 平台自动生成多环境、多分支的流水线
4. 代码推送后自动触发构建与部署

详细步骤请参阅：[创建应用](/docs/dev/applications/repository/#创建应用)

### Helm 应用

适用于部署社区应用或复杂组件：

1. 选择 Helm 仓库（内置或自定义）
2. 搜索目标 Chart（如 MySQL、Redis、Nginx）
3. 填写参数（版本、命名空间、配置值）
4. 一键安装

详细步骤请参阅：[Helm 应用](/docs/dev/applications/helm/)

### 手动部署

适用于已有镜像或简单服务：

- **使用已有镜像**：[手动镜像](/docs/dev/applications/add/)
- **从源码构建镜像**：[镜像构建](/docs/dev/applications/builds/)

---

## 核心概念

### Pipelines as Code

KDO 采用 **Pipelines as Code** 理念，将 CI/CD 流水线定义与源码一同存储在 Git 仓库中（`.tekton/` 目录）。这种方式：

- ✅ 流水线可版本化管理
- ✅ 团队协作编辑
- ✅ 与 Pull Request 集成
- ✅ 自动触发构建

详细原理请参阅：[Pipelines as Code 介绍](/docs/dev/applications/repository/#pipelines-as-code介绍)

### 嵌入流水线 vs 标准流水线

| 类型 | 定义方式 | 触发方式 | 适用场景 |
|------|----------|----------|----------|
| **嵌入流水线** | PipelineRun + 模板参数 | 自动（从应用信息生成） | 标准应用，无需手动编辑 |
| **标准流水线** | Pipeline CR | 手动/触发器 | 复杂流程、复用组件 |

详细对比请参阅：[流水线文档](/docs/dev/applications/pipelines/#kdo流水线)

---

## 应用生命周期管理

创建应用后，你可以：

- **查看详情**：应用信息、URL、资源使用、事件日志
- **分支流水线**：为不同分支配置构建与部署策略
- **流水线运行**：查看历史执行记录、回滚、重新运行
- **YAML 编辑**：直接修改应用定义（高级功能）

详细操作请访问对应文档章节。

---

## 常见问题

### Q: 应该选择哪种方式创建应用？

- **有源码 + 需要 CI/CD** → 使用 **[应用](/docs/dev/applications/repository/)**
- **部署社区组件（如数据库）** → 使用 **[Helm 应用](/docs/dev/applications/helm/)**
- **只有镜像，无源码** → 使用 **[手动镜像](/docs/dev/applications/add/)**
- **有源码，只需简单构建** → 使用 **[镜像构建](/docs/dev/applications/builds/)**

### Q: 如何修改流水线触发分支？

进入应用的 **分支流水线** 菜单，选择对应环境的分支进行编辑。支持图形化和 YAML 两种方式。

### Q: 流水线失败怎么办？

查看 **[流水线运行](/docs/dev/applications/pipelines/)** 记录，点击失败的运行查看详细日志。常见问题包括：
- Dockerfile 语法错误
- k8s 资源配置不合理
- 镜像仓库认证失败
- 资源配额不足

---

## 下一步

- 了解 [开发者控制台概览](/docs/dev/home/)
- 学习 [工作负载管理](/docs/dev/workloads/)
- 掌握 [网络与存储](/docs/dev/network-stroage/)
- 配置 [可观测性](/docs/observability/)

如有疑问，请查阅 [管理员指南](/docs/admin/) 或联系平台运维团队。
