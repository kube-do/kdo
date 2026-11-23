---
title: "术语表"
description: "KDO 平台、应用交付、运行时和访问控制中的常用术语。"
sidebar_position: 2
doc_type: reference
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

本页汇总 KDO 文档中反复出现的术语。第一次阅读某个页面时，可以先在这里确认对象之间的关系。

## 平台模型

| 术语 | 说明 | 参考 |
|---|---|---|
| **KDO** | 面向 Kubernetes 的智能云原生平台，提供项目管理、应用交付、可观测性和多集群管理能力。 | [架构概览](/docs/architecture/) |
| **AppProject** | KDO 的项目模型，通常对应一个业务线或一组应用，并映射到一个或多个命名空间。 | [项目](/docs/developer/projects/) |
| **环境（AppEnv）** | 项目内的运行环境，例如 `dev`、`test`、`prod`，每个环境通常对应一个命名空间。 | [项目](/docs/developer/projects/) |
| **应用（Application）** | 项目环境中的部署单元，包含镜像、工作负载、服务、路由等资源。 | [创建 Git 应用](/docs/developer/applications/git/) |
| **命名空间（Namespace）** | Kubernetes 的资源隔离边界，KDO 用项目和环境组织命名空间。 | [命名空间](/docs/admin/namespaces/) |
| **平台配置** | Console、PAC、KDC 共用的平台级配置，主要存放在 `kubedo-system/console` ConfigMap。 | [平台配置](/docs/admin/platform-config/) |

## 应用交付

| 术语 | 说明 | 参考 |
|---|---|---|
| **Repository** | PAC 监听 Git 仓库的配置对象，定义仓库地址、分支、事件和流水线来源。 | [Repository 配置](/docs/developer/delivery/pac/repository-and-pipelinerun/repository/) |
| **PAC（Pipelines as Code）** | 把 Git 事件转换为 Tekton PipelineRun 的控制器，负责 Webhook、事件匹配和状态回写。 | [PAC 概览](/docs/developer/delivery/pac/) |
| **Pipeline** | Tekton 的流水线定义，由多个 Task 组成。 | [标准流水线](/docs/developer/delivery/pipelines/standard-pipeline/) |
| **PipelineRun** | Pipeline 的一次执行实例，记录本次运行的参数、状态和结果。 | [PipelineRun 配置](/docs/developer/delivery/pac/repository-and-pipelinerun/pipelinerun/) |
| **Task** | Tekton 的最小执行单元，通常对应一个构建、测试或部署步骤。 | [Tekton 资源对象](/docs/developer/delivery/pipelines/#tekton的资源对象) |
| **ApprovalTask** | KDO 提供的人工审批节点，插入 PipelineRun 后阻塞执行，等待审批人批准或拒绝。 | [审批任务](/docs/developer/delivery/pipelines/approval-task/) |
| **GitOps 写回** | 构建完成后把新镜像或清单元数据写回 Git 仓库，再由 PAC 触发部署。 | [持续交付](/docs/developer/best-practices/continuous-delivery/) |
| **语言模板** | 按仓库中的构建文件识别语言，并生成对应构建任务和镜像的模板。 | [语言应用](/docs/developer/applications/languages/) |

## 运行时

| 术语 | 说明 | 参考 |
|---|---|---|
| **Pod（容器组）** | Kubernetes 的最小调度单元，一个 Pod 可包含一个或多个容器，共享网络和存储。 | [容器组](/docs/developer/workloads/pods/) |
| **Deployment** | 无状态应用的工作负载控制器，负责副本数、滚动更新和回滚。 | [无状态应用](/docs/developer/workloads/deployments/) |
| **StatefulSet** | 有状态应用的工作负载控制器，为每个副本保留稳定的网络标识和存储。 | [有状态应用](/docs/developer/workloads/statefulsets/) |
| **DaemonSet** | 在每个或指定节点上运行一个 Pod 的工作负载，常用于日志、监控和网络组件。 | [守护进程集](/docs/admin/workloads/daemonsets/) |
| **Job / CronJob** | 一次性任务和定时任务的工作负载。 | [任务](/docs/developer/workloads/jobs/) |
| **HPA** | Horizontal Pod Autoscaler，根据 CPU、内存或自定义指标调整副本数。 | [HPA](/docs/developer/workload-operations/hpa/) |
| **Service** | 为一组 Pod 提供稳定访问入口和负载均衡。 | [服务](/docs/developer/network-storage/service/) |
| **Ingress** | 把集群外部 HTTP/HTTPS 请求路由到 Service 的资源。 | [路由](/docs/developer/network-storage/ingress/) |
| **PVC** | PersistentVolumeClaim，应用对存储资源的申请。 | [持久卷声明](/docs/developer/network-storage/pvc/) |
| **StorageClass** | 定义存储供应方式和参数的模板，PVC 通过它动态申请 PV。 | [存储](/docs/admin/storage/) |

## 访问与控制

| 术语 | 说明 | 参考 |
|---|---|---|
| **KDC** | KDO 的平台控制面 Operator，负责把 AppProject/AppEnv 落成命名空间、RBAC、Harbor 项目和部署凭据。 | [Operator](/docs/admin/operators/) |
| **KdcCertificate** | 自动维护 Ingress TLS 证书的 CRD，可按集群和命名空间分发和替换证书。 | [证书管理](/docs/admin/maintenance/certificates/) |
| **RBAC** | 基于角色的访问控制，KDO 把平台角色映射到 Kubernetes RoleBinding/ClusterRoleBinding。 | [权限管理](/docs/admin/access-control/rbac/) |
| **OIDC** | OpenID Connect，KDO 通过 Keycloak、Dex 或 Casdoor 等身份提供方完成登录和用户同步。 | [Keycloak](/docs/install/keycloak/) |
| **CloudShell** | 运行在集群内的浏览器终端，继承 KDO 账号权限，预装常用命令行工具。 | [CloudShell](/docs/developer/dev-environments/terminal/cloudshell/) |
| **LocalShell** | 在本地机器使用 `oc` 登录集群的终端模式，凭据写入本地 kubeconfig。 | [LocalShell](/docs/developer/dev-environments/terminal/localshell/) |
| **Harbor** | 平台使用的镜像仓库，KDC 会为项目创建 Harbor 项目和机器人账号。 | [应用镜像](/docs/developer/applications/) |

## 相关文档

- [参考手册](/docs/reference/)
- [KDO 平台架构](/docs/architecture/)
- [贡献指南](/docs/contributing/)
