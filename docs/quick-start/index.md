---
title: 快速入门
parent: 快速入门
nav_order: 1
---

## 欢迎使用 KDO 平台

**KDO**（Kubernetes DevOps Platform）是一个面向云原生应用开发和运维的一站式平台。它整合了应用管理、CI/CD、可观测性、权限控制等能力，帮助团队高效地在 Kubernetes 上交付应用。

### 本指南包含什么？

本快速入门指南将引导你：

- ✅ **了解 KDO 的核心能力** - 熟悉平台的主要功能模块
- ✅ **完成首次安装** - 选择适合你的部署方式
- ✅ **登录并体验控制台** - 使用默认账号进入平台
- ✅ **创建第一个应用** - 从 Git 仓库部署一个示例应用
- ✅ **查看应用运行状态** - 使用观测平台监控应用

预计阅读时间：**15 分钟**

---

## 核心功能概览

KDO 围绕两大用户角色提供能力：

| 角色 | 主要界面 | 核心任务 |
|------|---------|---------|
| **开发者** | 开发者界面 | 创建应用、配置 CI/CD、管理部署、查看日志 |
| **管理员** | 管理员界面 | 集群运维、资源配额、网络策略、存储管理、监控告警 |

详细功能对比：

| 功能域 | 开发者 | 管理员 |
|--------|--------|--------|
| 应用管理 | ✅ Git 应用 / Helm / 镜像 | ✅ 系统 Operator / Helm |
| CI/CD | ✅ 自动流水线 | ✅ 基础设施流水线 |
| 工作负载 | ✅ Pod / Deployment / StatefulSet | ✅ DaemonSet / 节点管理 |
| 网络 | ✅ Service / Ingress | ✅ NetworkPolicy / 服务网格 |
| 存储 | ✅ PVC 申请 | ✅ StorageClass / PV 管理 |
| 监控 | ✅ 项目级仪表盘 | ✅ 集群级监控 |
| 日志 | ✅ 项目级日志检索 | ✅ 审计日志 / 全集群日志 |
| 权限 | ✅ 项目成员管理 | ✅ RBAC / 命名空间策略 |

---

## 准备开始

### 系统要求

#### 选项 1：从零部署（推荐新集群）

如果还没有 Kubernetes 集群：

1. **操作系统**：RHEL 9 / AlmaLinux 9 / Rocky 9 / Ubuntu 22.04+
2. **节点数量**：至少 3 个 Master + 2 个 Worker（生产建议 5+ 节点）
3. **资源**：
   - Master：2 CPU、4 GB RAM、40 GB 磁盘
   - Worker：4+ CPU、8 GB RAM、100 GB 磁盘（根据业务调整）
4. **网络**：
   - 所有节点互通（防火墙放行 6443、30000-32767、22 等端口）
   - 可解析的域名或稳定 IP（用于 Ingress 和平台访问）

#### 选项 2：接入现有集群

如果已有 Kubernetes 集群（v1.28+）：

1. 确认集群健康：`kubectl get nodes` 显示所有节点 `Ready`
2. 配置 OIDC 认证（Keycloak）或使用现有认证系统（详见 [安装指南](/install/)）
3. 确保集群资源充足（预留 CPU/Memory 供平台组件运行）

---

## 安装步骤

我们提供两种安装路径：

### 路径 A：全新部署（含 Kubernetes）

在没有现有集群的环境中，使用 KDO 安装脚本自动部署 Kubernetes 和平台组件：

1. [在 Linux 上安装 Kubernetes](/install/kubernetes/)
2. [在 Kubernetes 上安装 KDO](/install/kdo/)

👉 推荐：完整自动化，适合从零搭建

### 路径 B：接入现有集群

如果已有合规的 Kubernetes 集群，仅需安装 KDO 平台：

1. [根据 OIDC 平台配置 Kubernetes 认证](/install/kubernetes/#根据oidc平台设置kubernetes)
2. [安装 KDO 平台](/install/kdo/)

👉 推荐：已有集群生产环境

---

## 首次登录

安装完成后，访问 KDO 控制台：

```
http://<NODE_IP>:30080
```

**默认账号：**

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | `admin` | `Kdo@Pass#2025` | 管理员界面所有权限 |
| 项目管理员 | `pa1` | `Kdo#2025` | 默认项目 `kdo` 的管理员 |
| 开发者 | `dev1` | `Kdo#2025` | 默认项目 `kdo` 的开发者 |
| 测试人员 | `qa1` | `Kdo#2025` | 默认项目 `kdo` 的测试 |
| 运维人员 | `ops1` | `Kdo#2025` | 默认项目 `kdo` 的运维 |

**首次登录后：**

1. 📝 **修改密码**：右上角用户菜单 → 修改密码
2. 👥 **创建用户/团队**：管理员可登录 Keycloak 管理更多用户
3. 🏗️ **创建项目**：或使用预创建的 `kdo` 项目快速体验

---

## 第一个应用

我们以部署一个简单的 Nginx 应用为例。

### 步骤 1：准备源码仓库

KDO 支持从 Git 仓库自动生成应用。你可以在 GitHub/GitLab/Gitee 上创建一个简单的仓库：

```bash
# 示例：创建一个示例项目
git init my-first-app
cd my-first-app
cat > Dockerfile << 'EOF'
FROM nginx:alpine
COPY index.html /usr/share/nginx/html
EOF
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
  <head><title>Hello KDO</title></head>
  <body>
    <h1>🎉 恭喜！你的第一个应用已在 KDO 平台运行！</h1>
  </body>
</html>
EOF
git add . && git commit -m "Initial"
git remote add origin <your-git-repo-url>
git push -u origin main
```

### 步骤 2：在 KDO 创建应用

1. 登录 KDO 控制台（开发者视角）
2. 进入 **开发者界面 → 应用管理**
3. 点击 **新建应用** → **从 Git 仓库**
4. 填写：
   - **名称**：`my-first-app`
   - **仓库 URL**：你的 Git 仓库地址
   - **分支**：`main`
   - **凭证**：Git Token 或 SSH Key
5. 平台自动创建：
   - `.tekton/` 流水线（构建 + 部署）
   - 多环境：`dev`、`test`、`stage`、`prod`
6. 点击 **创建**

### 步骤 3：触发第一次构建

推送代码到仓库：

```bash
git commit --allow-empty -m "Trigger KDO build"
git push
```

在 KDO 控制台：

1. 进入应用详情 → **流水线运行**
2. 看到新的 PipelineRun 正在执行
3. 点击查看日志，等待状态变为 `Succeeded`

### 步骤 4：访问应用

构建成功后，应用会自动部署到 `dev` 环境：

1. 进入 **开发者界面 → 项目 → kdo → dev**
2. 找到 `my-first-app`，查看访问 URL
3. 点击链接，看到 "恭喜！你的第一个应用..."

---

## 后续学习

完成快速入门后，建议继续学习：

| 主题 | 文档 | 难度 |
|------|------|------|
| 应用管理进阶 | [应用管理概览](/dev/applications/) | ⭐⭐ |
| 工作负载详解 | [工作负载](/dev/workloads/) | ⭐⭐ |
| 配置管理 | [配置管理](/dev/configurations/) | ⭐⭐ |
| 网络与存储 | [网络与存储](/dev/network-stroage/) | ⭐⭐⭐ |
| 观测平台 | [观测平台](/observability/) | ⭐⭐ |
| 权限控制 | [权限管理](/rbac/) | ⭐⭐⭐ |

---

## 常见问题

### Q: 安装后控制台无法访问？

- 检查 KDO 服务是否运行：`kubectl get pods -n kdo`
- 检查端口是否正确：`kubectl get svc -n kdo` 查看 `kdo-console` 的 NodePort
- 检查防火墙是否放行 30080 端口
- 确保 /etc/hosts 已配置域名解析（如果使用域名）

### Q: 应用构建失败？

常见原因：
- Git 凭证错误（认证失败）
- Dockerfile 语法错误（构建阶段失败）
- 镜像仓库没有推送权限（检查 Harbor/Credentials）
- 资源配额不足（ResourceQuota 限制了 Pod/镜像数量）

查看流水线日志定位具体错误。

### Q: 应用部署后无法访问？

- 检查应用状态：Pod 是否 `Running`、`Ready`
- 检查 Ingress/Service 是否创建成功：`kubectl get svc,ingress -n <namespace>`
- 确认域名解析到正确节点 IP
- 查看应用日志：是否有启动错误

### Q: 如何创建多个环境？

KDO 默认项目包含 4 个环境：`dev`、`test`、`stage`、`prod`。如果需要额外的环境：

1. 管理员进入 **开发者界面 → 项目 → kdo**
2. 点击 **添加环境**，输入环境名称（如 `uat`）
3. 为环境配置独立的资源配额（可选）
4. 开发者可以在应用流水线中选择该环境进行部署

---

## 获取帮助

- 📖 **文档**：https://kdo.kube-do.cn/docs （或本仓库文档）
- 💬 **社区**：加入企业微信群/Discord 讨论
- 🐛 **问题反馈**：GitHub Issues 提交 Bug 或 Feature Request
- 📧 **联系运维**：platform@kube-do.cn

**祝你使用愉快！🚀**
