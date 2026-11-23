---
title: "CRD 参考"
description: "KDO 平台、通知、证书、镜像与 Pipelines as Code 自定义资源的字段参考。"
sidebar_position: 6
doc_type: reference
audience: [admin, developer]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

本页由 CRD 清单生成，字段以对应版本的 OpenAPI schema 为准。升级 KDC 或 PAC 后应重新生成。

## 用户与平台资源

| CRD | Group / Version | Scope | Spec 字段 | 说明 |
|---|---|---|---|---|
| [AppEnv](./kdc.md#app-env) | `kube-do.cn/v1` | Namespaced | 5 | 项目环境，定义环境类型、目标集群以及删除时是否清理命名空间。 |
| [AppProject](./kdc.md#app-project) | `kube-do.cn/v1` | Cluster | 4 | 应用项目，定义项目成员以及删除时是否清理命名空间。 |
| [Cluster](./kdc.md#cluster) | `kube-do.cn/v1` | Cluster | 11 | 纳管集群的连接、默认域名、监控日志地址、镜像仓库与 OIDC 配置。 |
| [Group](./kdc.md#group) | `kube-do.cn/v1` | Cluster | 3 | 用户组，映射 IdP 的 groups claim，并作为 RBAC 授权主体。 |
| [KdcCertificate](./kdc.md#kdc-certificate) | `kube-do.cn/v1` | Cluster | 5 | 证书分发对象，按域名和集群把 TLS Secret 分发到目标命名空间。 |
| [Notification](./kdc.md#notification) | `kube-do.cn/v1` | Namespaced | 3 | 通知事件与投递记录，由通知控制器创建和维护。 |
| [NotificationChannel](./kdc.md#notification-channel) | `kube-do.cn/v1` | Cluster | 10 | 可复用的通知渠道，定义提供商、凭据、限流和可见范围。 |
| [NotificationPreference](./kdc.md#notification-preference) | `kube-do.cn/v1` | Cluster | 12 | 用户级通知偏好，定义渠道、类型、静默时段和摘要策略。 |
| [NotificationRule](./kdc.md#notification-rule) | `kube-do.cn/v1` | Namespaced | 8 | 项目级通知路由规则，按事件匹配接收人、渠道和静默时段。 |
| [User](./kdc.md#user) | `kube-do.cn/v1` | Cluster | 10 | 平台用户，保存 OIDC 身份、联系方式与启用状态。 |
| [Repository](./pac.md#repository) | `pipelinesascode.tekton.dev/v1alpha1` | Namespaced | 8 | Pipelines as Code 的代码仓库配置，定义 Git 提供商、分支环境、事件和流水线参数。 |

## 镜像相关内部资源

以下 CRD 由 KDC 管理镜像、镜像流和签名，通常不需要手工创建或编辑。

| CRD | Group / Version | Scope | 说明 |
|---|---|---|---|
| [Image](./kdc.md#image) | `kube-do.cn/v1` | Cluster | 容器镜像的不可变快照，包含镜像元数据与摘要。 |
| [ImageSignature](./kdc.md#image-signature) | `kube-do.cn/v1` | Cluster | 镜像签名，用于验证镜像来源与完整性。 |
| [ImageStream](./kdc.md#image-stream) | `kube-do.cn/v1` | Namespaced | 镜像流，维护 tag 到镜像的映射，可跟踪镜像版本变化。 |
| [ImageStreamImage](./kdc.md#image-stream-image) | `kube-do.cn/v1` | Namespaced | 通过 digest 定位 ImageStream 中的某个具体镜像。 |
| [ImageStreamImport](./kdc.md#image-stream-import) | `kube-do.cn/v1` | Namespaced | 镜像导入请求，创建时把外部镜像导入 ImageStream。 |
| [ImageStreamLayers](./kdc.md#image-stream-layers) | `kube-do.cn/v1` | Namespaced | ImageStream 中镜像的层索引，记录镜像由哪些 blob 组成。 |
| [ImageStreamMapping](./kdc.md#image-stream-mapping) | `kube-do.cn/v1` | Namespaced | 把单个 tag 映射到指定容器镜像的请求对象。 |
| [ImageStreamTag](./kdc.md#image-stream-tag) | `kube-do.cn/v1` | Namespaced | ImageStream 中的标签及其对应镜像。 |
| [ImageTag](./kdc.md#image-tag) | `kube-do.cn/v1` | Namespaced | 镜像标签，记录 tag、历史与当前引用的镜像。 |

## 字段约定

- `metadata`、`apiVersion`、`kind` 为标准 Kubernetes 字段，不在每个 CRD 下重复。
- `spec` 是期望状态，`status` 由控制器写入；修改 `status` 不会改变实际资源。
- 必填表示 schema 中的 `required`，不代表所有场景都必须显式填写。
- 对象字段只展开一层；更深层的字段以源码中的 OpenAPI schema 为准。

## 详细参考

- [KDO 平台 CRD](./kdc.md)
- [Pipelines as Code Repository](./pac.md)
- [参考手册](/docs/reference/)
