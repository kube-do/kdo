---
title: KDO平台整体架构
nav_order: 14
---


KDO 是一站式云原生应用开发和运维平台，基于 Kubernetes，采用前后端分离架构。

---

## 整体架构

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             用户访问层                                     │
│          console.kube-do.dev（Ingress NGINX → Console NodePort 30080）      │
│          grafana.kube-do.dev (Ingress NGINX → Grafana）                     │
├──────────────────────────────────────────────────────────────────────────┤
│                         Console（Bridge Server）                           │
│              React 18 + PatternFly 6 前端 SPA                             │
│              Go 后端 — 认证 / 反向代理 / API 聚合                          │
│                    ↙            ↓            ↘                           │
│            K8s API Server   Prometheus    Alertmanager                    │
│            (kube-do.cn/v1   (监控指标)      (告警)                         │
│              CRD 代理)                                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                     KDC Controller（kube-do.cn/v1）                        │
│            Kubebuilder v4 Operator — 核心控制面                           │
│    AppProject / AppEnv / ImageStream / Image / User / Group / Cluster    │
├──────────────────────────────────────────────────────────────────────────┤
│  Harbor     Keycloak      Tekton Stack         OpenShift Logging         │
│  (镜像仓库)   (OIDC 认证)   Pipelines / Triggers   ClusterLogForwarder     │
│                            Chains / Results      →  LokiStack            │
│                            Dashboard / PAC        (Loki + Minio S3)      │
│                            Shipwright Build                             │
│                            Manual Approval Gate                          │
├──────────────────────────────────────────────────────────────────────────┤
│  Prometheus     Grafana       Cert Manager    Kubeapps                    │
│  Operator       (监控大屏)     (TLS 证书)       (Helm Chart 市场)           │
│  + Alertmanager                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│              DevWorkspace Operator      OpenShift Lightspeed + RAG       │
│              (云开发环境)                 (AI 运维助手)                      │
├──────────────────────────────────────────────────────────────────────────┤
│                    Kubernetes（v1.33.4，单节点 All-in-One）                  │
│          Calico CNI / CoreDNS / NFS Storage / Ingress NGINX              │
└──────────────────────────────────────────────────────────────────────────┘
```

## 核心组件

| 组件                              | 功能                                                    |
|---------------------------------|---------------------------------------------------------|
| **Console**                     | 前端控制台（React 18 + PatternFly 6）+ Go 后端聚合网关         |
| **KDC Controller**              | Kubebuilder v4 Operator，CRD 控制面 (kube-do.cn/v1)       |
| **Keycloak**                    | 身份提供者（OIDC），对接 K8s API Server 认证，PostgreSQL 存储    |
| **Harbor**                      | 镜像仓库（Core + Registry + Trivy + Notary + Portal），NodePort 30002 暴露 |
| **Prometheus Operator**         | 监控栈管理（Prometheus + Alertmanager + 各种 Exporter）      |
| **Grafana**                     | 监控可视化大屏，通过 `grafana.kube-do.cc` 访问                |
| **OpenShift Logging Operator**  | 日志采集管理（ClusterLogForwarder → Vector → LokiStack）     |
| **Loki Operator**               | LokiStack 生命周期管理（8 子组件: Distributor/Ingester/Querier 等） |
| **Minio**                       | S3 兼容对象存储，Loki 日志的持久化后端                           |
| **Tekton Operator**             | CI/CD 引擎全家桶（Pipelines / Triggers / Chains / Results / Dashboard） |
| **Pipelines-as-Code**           | Git 事件驱动 CI，通过 Webhook 自动触发 PipelineRun               |
| **Shipwright Build**            | 源码转镜像（S2I）构建引擎                                       |
| **Manual Approval Gate**        | Tekton 人工审批门禁                                           |
| **Cert Manager**                | TLS 证书自动签发和管理                                        |
| **Ingress NGINX**               | 统一南北向流量入口                                            |
| **Kubeapps**                    | Helm Chart 应用市场                                          |
| **DevWorkspace Operator**       | 云端开发环境（基于 Devfile）                                   |
| **OpenShift Lightspeed + RAG**  | AI 运维助手，基于知识库检索增强生成                               |
| **NFS Subdir External Provisioner** | 动态 NFS 存储供给（默认 StorageClass）                      |
| **Redis**                       | 会话缓存                                                   |
| **metrics-server**              | 节点指标采集                                                |
| **Event Router**                | Kubernetes 事件采集和转发                                     |
| **Notification**                | 通知（邮件等）                                               |

## Console（Bridge）服务器

Console 基于 OpenShift Console（Bridge）改造，是 KDO 平台的**唯一入口网关**，集前端 SPA 与后端代理于一体。详见 [[kdo-console]]。

### 前端 SPA

- **技术栈**: React 18 + PatternFly 6 + Redux 5 + Webpack 5/SWC + i18next + React Router 6
- **包管理**: 27 个 Yarn workspace 包
- **插件系统**:
    - **静态插件**: 编译到 bundle
    - **动态插件**: Webpack Module Federation，35+ 扩展类型
    - **SDK**: 3 个 npm 包 + `ConsoleRemotePlugin` Webpack 插件
    - **加载**: 运行时通过 `/api/plugins/<name>/plugin-manifest.json`
- **扩展类型**: perspective(视角)、navigation(5种)、page(4种)、action(4种)、dashboards(14种)、topology(6种)、feature-flags(3种)
- **操作 Action 系统**: 三层架构 — provider(32个) → hook(泛型 useCommonActions) → creator
- **拓扑图**: 管道与过滤器架构，ExtensibleModel 编排，HOC 组合组件工厂
- **Knative 插件**: Serving+Eventing 双子系统，4层 CRD 检测，4数据工厂+3组件工厂
- **Pipelines 插件**: Pipeline Builder 可视化 DAG 编辑器、Repository PAC 管理、Tekton Results 双模式

### 后端 Go 服务器

Console 后端 Go 服务器承担**API 网关和反向代理**职责：

- **认证层**: OIDC（Keycloak）/ OpenShift OAuth / disabled 三种模式，加密 Session Cookie（gorilla/sessions）
- **K8s 代理**: 反向代理 Kubernetes API（`/api/kubernetes/*`），通过 ServiceAccount 令牌直接访问
- **监控代理**: 代理 Prometheus（`prometheus-k8s.monitoring.svc:9090`）和 Alertmanager（`alertmanager-main.monitoring.svc:9093`）
- **API 层**: GraphQL、Helm、插件资产
- **KDO 扩展层**: `/api/console/user`（用户管理）、`/api/console/search`（搜索）、`/api/podfile`（Pod 文件）、`/api/console/logging/*`（日志）、`/api/console/ols/*`（AI Lightspeed）
- **多集群管理**: 读取 `Cluster` CRD（`kube-do.cn/v1`），每集群独立代理/认证

### 导航布局

- Masthead（顶部栏: Logo/项目选择/搜索/用户菜单）
- Sidebar（两级导航侧栏）
- NotificationDrawer（通知抽屉）
- 双视角: Admin（完整管理）/ Developer（精简应用开发）

## 平台部署模式

- 无基础设施依赖，可运行在任何 Kubernetes 集群
- 支持私有云、公有云(EKS/AKS/GKE)、VM、物理机
- 底层网络: Calico 等 CNI 插件
- 存储: NFS（默认），可对接云存储/Ceph/Gluster

---

## KDC Controller

KDC 是 KDO 平台的核心 Operator，负责声明式调和所有业务资源。

Refer to [[kdc-controller]] for:
- CRD 清单和 Controller 职责
- Webhook 验证逻辑
- 外部依赖（Harbor/Keycloak/Dex/Skopeo）
- 设计模式（延迟初始化/Hash 变更检测/Finalizer 清理）
