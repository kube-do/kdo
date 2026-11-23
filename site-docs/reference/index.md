---
title: "参考手册"
description: "KDO 的对象、配置、命令行与运维参考入口，按对象和任务查找准确的字段、命令与约束。"
sidebar_position: 1
doc_type: reference
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

## 怎么用参考手册

参考手册用于查“准确值”，不负责讲完整操作流程。需要完成一个任务时，先看对应的操作指南；需要确认字段、命令或默认行为时，再回到这里。

- **按对象查**：AppProject、Repository、PipelineRun、ApprovalTask、KdcCertificate 等。
- **按配置查**：Console 平台配置、安装参数、OIDC/Keycloak、PAC 日志。
- **按命令查**：LocalShell、`oc`/`kubectl`、`tkn pac`。
- **按约束查**：版本兼容、资源限制、权限边界。

## 对象与 CRD

| 对象 | 用途 | 参考入口 |
|---|---|---|
| AppProject | 项目、环境与命名空间的组织单元 | [AppProject](/docs/admin/namespaces/appprojects/) |
| Namespace / ResourceQuota / LimitRange | 命名空间隔离与资源约束 | [命名空间](/docs/admin/namespaces/)、[ResourceQuota](/docs/admin/namespaces/resource-quotas/)、[LimitRange](/docs/admin/namespaces/limit-ranges/) |
| Repository | PAC 的代码仓库配置，定义分支、事件和流水线来源 | [Repository CR](/docs/developer/delivery/pac/repository-and-pipelinerun/repository/) |
| PipelineRun | 一次流水线执行的参数、事件与状态 | [PipelineRun](/docs/developer/delivery/pac/repository-and-pipelinerun/pipelinerun/) |
| ApprovalTask | 在 PipelineRun DAG 中插入人工审批节点 | [审批任务](/docs/developer/delivery/pipelines/approval-task/) |
| HorizontalPodAutoscaler | 按 CPU、内存或自定义指标扩缩副本 | [HPA](/docs/developer/workload-operations/hpa/) |
| KdcCertificate | Ingress TLS 证书的自动分发与替换 | [证书管理](/docs/admin/maintenance/certificates/) |
| CustomResourceDefinition | 查看集群中安装的 CRD 及其版本 | [CRD](/docs/admin/namespaces/crd/) |
| CRD 字段 | KDO 与 PAC 自定义资源的 Spec/Status 字段 | [CRD 参考](/docs/reference/crd/) |

## 配置参考

| 配置 | 作用 | 参考入口 |
|---|---|---|
| Console 平台配置 | 认证、镜像仓库、监控、界面、代理和高级 YAML | [平台配置](/docs/admin/platform-config/) |
| 安装配置 | KDO 安装器参数、集群与组件选项 | [安装配置](/docs/install/config/) |
| Keycloak / OIDC | 内置或外部身份源、客户端与回调配置 | [Keycloak 与 OIDC](/docs/install/keycloak/) |
| PAC 日志 | 通过 TektonConfig 和命名空间分割调整日志 | [PAC 日志](/docs/developer/delivery/pac/manage/logging/) |
| 通知渠道 | 邮件、Webhook、企业微信、钉钉等通知配置 | [通知中心](/docs/admin/notifications/) |
| 存储 | StorageClass、PVC、快照与默认 NFS 存储 | [存储](/docs/admin/storage/) |
| 权限 | 角色、RoleBinding 与项目成员权限 | [RBAC](/docs/admin/access-control/rbac/) |

## 命令行与运维

| 工具 | 用途 | 参考入口 |
|---|---|---|
| LocalShell | 在本地使用 `oc`/`kubectl` 访问集群 | [LocalShell](/docs/developer/dev-environments/terminal/localshell/) |
| CloudShell | 在集群内直接使用预装命令行工具 | [CloudShell](/docs/developer/dev-environments/terminal/cloudshell/) |
| `tkn pac` | 管理 PAC Repository、PipelineRun 与日志 | [`tkn pac` 命令](/docs/developer/delivery/pac/manage/tkn-pac/) |
| Tekton 资源 | Task、Pipeline、PipelineRun、Workspace 等对象 | [Tekton 资源对象](/docs/developer/delivery/pipelines/#tekton的资源对象) |
| 流水线排查 | PipelineRun 未触发、控制器日志与 Token 作用域 | [PAC 排障](/docs/developer/delivery/pac/manage/troubleshooting/) |

## 版本与兼容性

- 页面 frontmatter 的 `applies_to` 表示适用版本；未标注时默认适用于当前文档版本。
- 升级前先阅读[发布说明](/docs/release-notes/)，确认行为变更、弃用项和回滚条件。
- 跨版本的对象字段、配置项和 CLI 参数可能变化；涉及生产升级时，以对应版本的 Release Notes 和安装包中的 schema 为准。
- [CRD 参考](/docs/reference/crd/)由 KDC 与 PAC 的 CRD 清单生成；升级组件后应重新生成，避免字段漂移。
- OpenAPI、CLI 和配置 schema 仍按代码生成方向补充。

## 约定

- 对象名使用 Kubernetes 资源名；中文解释放在字段说明中。
- 命令默认在 LocalShell 或已配置 kubeconfig 的终端执行。
- YAML 示例只保留可运行的最小字段；完整字段以对应页面和 CRD schema 为准。
- 参考页不写“点击哪里”的操作步骤，操作步骤放到 How-to 页面。

## 相关文档

- [术语表](/docs/reference/glossary/)：平台、交付、运行时和访问控制术语。
- [版本兼容性](/docs/reference/compatibility/)：Kubernetes、Keycloak、Tekton、Harbor 的兼容性判断。
- [排障索引](/docs/reference/troubleshooting/)：按现象查找安装、登录、构建、部署和存储问题。
- [任务索引](/docs/reference/task-index/)：按角色和任务查找入口。
- [贡献指南](/docs/contributing/)：新增或修改参考页的约定。
- [架构](/docs/architecture/)：对象之间的整体关系。
- [发布说明](/docs/release-notes/)：版本变更与升级注意事项。
