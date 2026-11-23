---
title: "KDO 平台 CRD"
description: "KDO 平台、项目、集群、身份、通知、证书与镜像相关自定义资源的字段参考。"
sidebar_position: 7
doc_type: reference
audience: [admin, developer]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

本页由 CRD 清单生成。字段以对应版本的 OpenAPI schema 为准；`metadata` 等标准字段不再重复。

## AppEnv {#app-env}

项目环境，定义环境类型、目标集群以及删除时是否清理命名空间。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `appenvs` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `alias` | `string` | 否 | Alias 项目的中文名，比如开发环境，测试环境这些 |
| `cluster` | `string` | 是 | Cluster 集群名，用于多集群 |
| `disabled` | `boolean` | 否 | Disabled 这个环境是否启用，环境在禁用时不会同步项目信息，删除环境时要先把环境禁用 |
| `isPruneNS` | `boolean` | 否 | IsPruneNS 删除Env时是否删除对应的命名空间。未设置时默认为 true。 |
| `type` | `string` | 否 | Type 环境类型 |

### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `imageRetention` | `object` | 否 | ImageRetention 记录本环境对应 Harbor 项目最近一次旧镜像清理策略的对齐结果。 |


## AppProject {#app-project}

应用项目，定义项目成员以及删除时是否清理命名空间。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `appprojects` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `alias` | `string` | 否 | Alias 是指项目的简短中文 |
| `description` | `string` | 否 | Description 是指关于项目的一段描述 |
| `isPruneNS` | `boolean` | 否 | IsPruneNS 删除Project时是否删除对应的命名空间。未设置时默认为 true。 |
| `projectMembers` | `object` | 否 | ProjectMembers 项目成员 |

### projectMembers 字段 {#app-project-project-members}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `developer` | `array<object>` | 否 | Developer 开发者 |
| `ops` | `array<object>` | 否 | Ops 运维人员 |
| `project-admin` | `array<object>` | 是 | ProjectAdmin 项目管理员 |
| `qa` | `array<object>` | 否 | QA 测试人员 |
| `view` | `array<object>` | 否 | View 仅查看人员 |


### Status

该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。


## Cluster {#cluster}

纳管集群的连接、默认域名、监控日志地址、镜像仓库与 OIDC 配置。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `clusters` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `apiServerURL` | `string` | 否 | ApiServerURL 集群K8S API Server的地址 |
| `clusterAlertManagerURL` | `string` | 否 | ClusterAlertManagerURL 集群告警发送者URL，默认是AlertManager |
| `clusterLoggingURL` | `string` | 否 | ClusterLoggingURL 集群日志URL，默认是`http://lokistack-dev-gateway-http.openshift-logging.svc:8080`地址 |
| `clusterMeteringURL` | `string` | 否 | ClusterMeteringURL 集群监控URL，默认是Prometheus地址 |
| `cname` | `string` | 否 | Cname 集群别名 |
| `defaultDomain` | `string` | 否 | DefaultDomain Ingress所使用的默认后缀 |
| `description` | `string` | 否 | Description 集群描述 |
| `insecureSkipTLSVerify` | `boolean` | 否 | InsecureSkipTLSVerify 访问该集群 API Server 时是否跳过 TLS 证书校验（默认 false） |
| `mainCluster` | `boolean` | 否 | MainCluster 是否为管理集群 |
| `oidcIssuerURL` | `string` | 否 | OIDCIssuerURL 该集群 API Server 信任的 OIDC Issuer 地址，用于校验 Console 登录身份是否可被目标集群接受 |
| `registryURL` | `string` | 否 | RegistryURL 镜像仓库地址 |

### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `certificateExpiry` | `string` | 否 | CertificateExpiry 管理员 kubeconfig 客户端证书的到期时间 |
| `components` | `array<object>` | 否 | Components 各组件（API Server、监控、告警、日志、镜像仓库）的可达性 |
| `conditions` | `array<object>` | 否 | Conditions 集群连接、OIDC 校验、证书状态等条件 |
| `lastConnectedTime` | `string` | 否 | LastConnectedTime 最近一次成功连接目标集群的时间 |
| `version` | `string` | 否 | Version 目标集群的 Kubernetes 版本 |


## Group {#group}

用户组，映射 IdP 的 groups claim，并作为 RBAC 授权主体。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `groups` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `displayName` | `string` | 否 | DisplayName 供 UI 展示，为空时回落到 GroupName 或 metadata.name。 |
| `groupName` | `string` | 否 | GroupName 是 IdP 组名在 token 中的最终取值，例如 kdo:test。 本地逻辑组可为空，此时 RBAC 使用 metadata.name。 |
| `users` | `array<string>` | 否 | Users 指这个组里面包含的用户，取值为 User.spec.username（不是 CR 名）。 |

### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `conditions` | `array<object>` | 否 | Conditions 描述同步与绑定状态，便于在 UI 上展示失败原因。 |
| `lastSyncTime` | `string` | 否 | LastSyncTime 是最近一次成功同步的时间。 |
| `memberCount` | `integer` | 否 | MemberCount 是组内成员数量，便于列表页直接展示。 |
| `observedGeneration` | `integer` | 否 | ObservedGeneration 是控制器最近一次处理过的 spec 代次。 |
| `providerGroupID` | `string` | 否 | ProviderGroupID 是组在该 IdP 中的唯一 ID，用于维持绑定关系。 |
| `syncSource` | `string` | 否 | SyncSource 是当前同步来源的 Provider 名称。 |


## Image {#image}

容器镜像的不可变快照，包含镜像元数据与摘要。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `images` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

该层级没有可展示的字段。

### Status

该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。


## ImageSignature {#image-signature}

镜像签名，用于验证镜像来源与完整性。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `imagesignatures` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

该层级没有可展示的字段。

### Status

该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。


## ImageStreamImage {#image-stream-image}

通过 digest 定位 ImageStream 中的某个具体镜像。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `imagestreamimages` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

该层级没有可展示的字段。

### Status

该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。


## ImageStreamImport {#image-stream-import}

镜像导入请求，创建时把外部镜像导入 ImageStream。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `imagestreamimports` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `images` | `array<object>` | 否 | images 是待导入的单个镜像列表。 |
| `import` | `boolean` | 是 | import 为 true 时执行实际导入并将结果写入目标 ImageStream； 为 false 时仅计算导入结果（dry-run），不修改 ImageStream。 |
| `repository` | `object` | 否 | repository 可选的整个镜像仓库导入配置，用于批量导入仓库中的所有 tag。 |

### images 字段 {#image-stream-import-images}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `from` | `object` | 是 | from 是待导入镜像的来源引用。 |
| `importPolicy` | `object` | 否 | importPolicy 控制导入行为。 |
| `includeManifest` | `boolean` | 否 | includeManifest 是否在导入时包含完整的 manifest 数据。 |
| `referencePolicy` | `object` | 否 | referencePolicy 定义导入后镜像的引用方式。 |
| `to` | `object` | 否 | to 是导入后的目标 tag 名称，若为空则不指定目标 tag。 |


### repository 字段 {#image-stream-import-repository}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `from` | `object` | 是 | from 是待导入仓库的来源引用，目前仅支持 Kind=DockerImage。 |
| `importPolicy` | `object` | 否 | importPolicy 控制导入行为。 |
| `includeManifest` | `boolean` | 否 | includeManifest 是否在导入时包含完整的 manifest 数据。 |
| `referencePolicy` | `object` | 否 | referencePolicy 定义导入后镜像的引用方式。 |


### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `images` | `array<object>` | 否 | images 是对应 spec.images 中每个镜像的导入结果。 |
| `import` | `object` | 否 | import 是导入成功时更新后的目标 ImageStream。 |
| `observedGeneration` | `integer` | 否 | observedGeneration 是最近一次被处理的 spec generation，用于判断是否需要重新导入。 |
| `repository` | `object` | 否 | repository 是仓库批量导入的结果。 |


## ImageStreamLayers {#image-stream-layers}

ImageStream 中镜像的层索引，记录镜像由哪些 blob 组成。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `imagestreamlayers` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

该层级没有可展示的字段。

### Status

该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。


## ImageStreamMapping {#image-stream-mapping}

把单个 tag 映射到指定容器镜像的请求对象。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `imagestreammappings` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

该层级没有可展示的字段。

### Status

该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。


## ImageStream {#image-stream}

镜像流，维护 tag 到镜像的映射，可跟踪镜像版本变化。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `imagestreams` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `dockerImageRepository` | `string` | 否 | dockerImageRepository 镜像流底层对应的 Docker 仓库地址。 |
| `lookupPolicy` | `object` | 否 | lookupPolicy 控制同一命名空间内其他资源如何引用此镜像流中的镜像， 启用后可让 Pod、Build 等通过短名称直接引用镜像流中的镜像。 |
| `tags` | `array<object>` | 否 | tags 镜像流中的 tag 列表，每个元素定义了一个 tag 及其镜像来源、导入策略和引用策略。 |

### lookupPolicy 字段 {#image-stream-lookup-policy}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `local` | `boolean` | 否 | local 为 true 时，命名空间内的 Docker 短镜像引用（如 "mysql"） 将直接解析为此 ImageStream 中对应 tag 的镜像 ID，而无需访问远程镜像仓库。 |


### tags 字段 {#image-stream-tags}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `annotations` | `map` | 否 | annotations 是与此 tag 关联的注解，会复制到通过 ImageStreamTag 获取的镜像上。 |
| `from` | `object` | 否 | from 是此 tag 跟踪的镜像来源引用，可以是 DockerImage、ImageStreamTag 或 ImageStreamImage。 |
| `generation` | `integer` | 否 | generation 是跟踪 spec tag 变更的计数器。当 spec tag 的 generation 大于 status 中的 generation 时，触发重新导入。设置为 nil 或 0 也会触发导入。 |
| `importPolicy` | `object` | 否 | importPolicy 控制镜像的导入方式。 |
| `name` | `string` | 是 | name 是 tag 的名称（如 "latest"、"v1.0"、"prod"） |
| `reference` | `boolean` | 否 | reference 为 true 表示此 tag 是引用类型，直接使用 from 指向的镜像地址， 不执行实际的镜像导入。默认为 false。 |
| `referencePolicy` | `object` | 否 | referencePolicy 定义其他组件（如构建、部署）应如何使用此 tag 的镜像拉取地址。 |


### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `dockerImageRepository` | `string` | 否 | dockerImageRepository 此镜像流在内部 Registry 中的有效访问地址。 |
| `publicDockerImageRepository` | `string` | 否 | publicDockerImageRepository 集群外部可访问的公开拉取地址。 |
| `tags` | `array<object>` | 否 | tags 记录每个 tag 的镜像历史。Items[0] 是最新的镜像版本。 |


## ImageStreamTag {#image-stream-tag}

ImageStream 中的标签及其对应镜像。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `imagestreamtags` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

该层级没有可展示的字段。

### Status

该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。


## ImageTag {#image-tag}

镜像标签，记录 tag、历史与当前引用的镜像。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `imagetags` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `annotations` | `map` | 否 | annotations 是与此 tag 关联的注解，会复制到通过 ImageStreamTag 获取的镜像上。 |
| `from` | `object` | 否 | from 是此 tag 跟踪的镜像来源引用，可以是 DockerImage、ImageStreamTag 或 ImageStreamImage。 |
| `generation` | `integer` | 否 | generation 是跟踪 spec tag 变更的计数器。当 spec tag 的 generation 大于 status 中的 generation 时，触发重新导入。设置为 nil 或 0 也会触发导入。 |
| `importPolicy` | `object` | 否 | importPolicy 控制镜像的导入方式。 |
| `name` | `string` | 是 | name 是 tag 的名称（如 "latest"、"v1.0"、"prod"） |
| `reference` | `boolean` | 否 | reference 为 true 表示此 tag 是引用类型，直接使用 from 指向的镜像地址， 不执行实际的镜像导入。默认为 false。 |
| `referencePolicy` | `object` | 否 | referencePolicy 定义其他组件（如构建、部署）应如何使用此 tag 的镜像拉取地址。 |

### from 字段 {#image-tag-from}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `apiVersion` | `string` | 否 | API version of the referent. |
| `fieldPath` | `string` | 否 | If referring to a piece of an object instead of an entire object, this string should contain a valid JSON/Go field access statement, such as desiredState.manifest.containers[2]. For example, if the object reference is to a container within a pod, this would take on a value like:… |
| `kind` | `string` | 否 | Kind of the referent. More info: `https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds` |
| `name` | `string` | 否 | Name of the referent. More info: `https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names` |
| `namespace` | `string` | 否 | Namespace of the referent. More info: `https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/` |
| `resourceVersion` | `string` | 否 | Specific resourceVersion to which this reference is made, if any. More info: `https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#concurrency-control-and-consistency` |
| `uid` | `string` | 否 | UID of the referent. More info: `https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#uids` |


### importPolicy 字段 {#image-tag-import-policy}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `importMode` | `string` | 否 | importMode 控制如何导入镜像 manifest。 |
| `insecure` | `boolean` | 否 | insecure 为 true 时允许跳过 TLS 证书验证或使用 HTTP 连接。 |
| `scheduled` | `boolean` | 否 | scheduled 为 true 时，系统将定期检查此 tag 对应的镜像是否有更新。 |


### referencePolicy 字段 {#image-tag-reference-policy}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `string` | 否 | type 决定镜像拉取地址的生成方式，可选 Source 或 Local。 |


### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `conditions` | `array<object>` | 否 | conditions 是该 tag 的状态条件列表 |
| `items` | `array<object>` | 是 | items 是镜像历史记录列表，按时间倒序排列 |
| `tag` | `string` | 是 | tag 是此历史记录对应的 tag 名称 |


## KdcCertificate {#kdc-certificate}

证书分发对象，按域名和集群把 TLS Secret 分发到目标命名空间。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `kdccertificates` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `clusterRefs` | `array<string>` | 否 | ClusterRefs 目标集群名称列表（对应 Cluster CR 的 metadata.name）。 非空时精确指定这些集群；为空表示所有集群（含管理集群）。 |
| `deliveryPolicy` | `object` | 否 | DeliveryPolicy 控制证书分发与替换的目标范围。 |
| `domains` | `array<string>` | 是 | Domains 证书覆盖的域名（SAN），支持精确域名与通配符（如 *.example.com）。 用于匹配 Ingress 的 host，并校验来源证书是否覆盖这些域名。 |
| `secretName` | `string` | 否 | SecretName 仅作为 Ingress TLS 未显式指定 secretName 时的兜底 Secret 名称， 默认等于 KdcCertificate 对象名。通常无需设置，因为 Ingress TLS 一般都会命名 Secret。 |
| `sourceSecretRef` | `object` | 是 | SourceSecretRef 引用一个 kubernetes.io/tls 类型 Secret 作为证书来源（必须包含 tls.crt/tls.key）。 私钥不会写入本 CR，推荐通过此方式提供证书。 |

### deliveryPolicy 字段 {#kdc-certificate-delivery-policy}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `autoReplace` | `boolean` | 否 | AutoReplace 为 true 时，发现目标证书到期时间早于本证书即自动替换，默认 true。 |
| `excludeNamespaces` | `array<string>` | 否 | ExcludeNamespaces 显式排除的命名空间黑名单（优先级高于白名单）。 |
| `includeNamespaces` | `array<string>` | 否 | IncludeNamespaces 显式包含的命名空间白名单。 |
| `ingressSelector` | `object` | 否 | IngressSelector 按 Ingress 标签选择参与替换的对象；为空时依据 Domains 匹配 host。 |
| `namespaceSelector` | `object` | 否 | NamespaceSelector 按命名空间标签选择（与 IncludeNamespaces 取并集）。 |
| `replaceBeforeDays` | `integer` | 否 | ReplaceBeforeDays 兜底阈值（天）。当无法解析目标证书到期时间失败时无法生效； 设置后，只要目标证书剩余天数低于该值也会触发替换。为空表示仅按到期时间比较。 |


### sourceSecretRef 字段 {#kdc-certificate-source-secret-ref}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | `string` | 否 | name is unique within a namespace to reference a secret resource. |
| `namespace` | `string` | 否 | namespace defines the space within which the secret name must be unique. |


### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `conditions` | `array<object>` | 否 | Conditions 证书有效性与同步状态条件。 |
| `domains` | `array<string>` | 否 | Domains 从证书实际解析出的域名（SAN）。 |
| `lastSyncTime` | `string` | 否 | LastSyncTime 最近一次成功同步的时间。 |
| `notAfter` | `string` | 否 | NotAfter 当前来源证书的到期时间。 |
| `observedGeneration` | `integer` | 否 | ObservedGeneration 最近一次处理的 spec generation。 |
| `targets` | `array<object>` | 否 | Targets 已发现并管理的目标 Secret。 |


## NotificationChannel {#notification-channel}

可复用的通知渠道，定义提供商、凭据、限流和可见范围。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `notificationchannels` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `allowedProjects` | `array<string>` | 否 | AllowedProjects limits project-scoped channels to these AppProject names. |
| `default` | `boolean` | 否 | Default marks the platform default channel. Managed rules (for example the auto-created project-admin rule) use it when a project does not pick a channel explicitly. At most one channel should be default; Console rejects a second default and the notifier reports a condition. |
| `displayName` | `string` | 否 | — |
| `mode` | `string` | 是 | NotificationChannelMode is the delivery mode of a channel. |
| `options` | `object` | 否 | NotificationChannelOptions holds provider-specific options. |
| `provider` | `string` | 是 | NotificationChannelProvider is the IM provider used by a channel. |
| `rateLimit` | `object` | 否 | NotificationRateLimit configures a token bucket for one channel. |
| `scope` | `string` | 否 | NotificationScope controls who may use a channel. |
| `secretRef` | `object` | 是 | NotificationSecretReference points to a Secret holding channel credentials. |
| `template` | `string` | 否 | Template overrides the built-in template for this channel. |

### options 字段 {#notification-channel-options}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `apiBase` | `string` | 否 | APIBase overrides the provider API base URL for private deployments or proxies. |
| `mentionable` | `boolean` | 否 | Mentionable indicates whether the channel supports mentioning recipients. |


### rateLimit 字段 {#notification-channel-rate-limit}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `burst` | `integer` | 否 | Burst is the maximum burst size. |
| `perMinute` | `integer` | 否 | PerMinute is the sustained requests per minute. It takes precedence over QPS when set. |
| `qps` | `string` | 否 | QPS is the sustained requests per second. |


### secretRef 字段 {#notification-channel-secret-ref}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | `string` | 是 | Name is the Secret name. |
| `namespace` | `string` | 是 | Namespace must be the dedicated notification namespace. |


### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `capabilities` | `object` | 否 | NotificationCapabilities describes what a channel can render. |
| `conditions` | `array<object>` | 否 | — |
| `lastTestTime` | `string` | 否 | — |
| `observedGeneration` | `integer` | 否 | — |


## NotificationPreference {#notification-preference}

用户级通知偏好，定义渠道、类型、静默时段和摘要策略。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `notificationpreferences` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `bindings` | `map` | 否 | — |
| `categories` | `array<string>` | 否 | — |
| `channelTypes` | `array<string>` | 否 | — |
| `channels` | `array<string>` | 否 | Channels optionally limits delivery to these channel names. |
| `digest` | `string` | 否 | — |
| `enabled` | `boolean` | 否 | Enabled defaults to true. It is a pointer so a preference that only sets bindings or quiet hours does not silently unsubscribe the user. |
| `language` | `string` | 否 | — |
| `overrides` | `array<object>` | 否 | — |
| `quietHours` | `object` | 否 | NotificationQuietHours suppresses non-urgent notifications in a time window. |
| `severityThreshold` | `string` | 否 | — |
| `types` | `array<string>` | 否 | — |
| `user` | `string` | 是 | User is the User CR name. |

### overrides 字段 {#notification-preference-overrides}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `category` | `string` | 否 | — |
| `enabled` | `boolean` | 否 | — |
| `type` | `string` | 否 | — |


### quietHours 字段 {#notification-preference-quiet-hours}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `end` | `string` | 否 | End is HH:MM in the configured timezone. |
| `start` | `string` | 否 | Start is HH:MM in the configured timezone. |
| `timezone` | `string` | 否 | Timezone is an IANA timezone name. |


### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `conditions` | `array<object>` | 否 | — |
| `observedGeneration` | `integer` | 否 | — |


## NotificationRule {#notification-rule}

项目级通知路由规则，按事件匹配接收人、渠道和静默时段。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `notificationrules` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `aggregation` | `object` | 否 | NotificationAggregation groups events into one Notification. Reserved: the notifier aggregates by NotificationSpec.Event.AggregationKey today, so the window and by fields are accepted but not evaluated. |
| `enabled` | `boolean` | 否 | Enabled defaults to true. It is a pointer so a rule that omits the field is not silently disabled. |
| `fallback` | `boolean` | 否 | Fallback rules only apply when no regular rule matched the event. The auto-created project-admin rule is a fallback so a project rule for the same event never produces a duplicate notification. |
| `match` | `object` | 否 | NotificationMatch filters events for a rule. |
| `quietHours` | `object` | 否 | NotificationQuietHours suppresses non-urgent notifications in a time window. |
| `recipients` | `object` | 否 | NotificationRecipients defines who should receive matching events. |
| `template` | `string` | 否 | Template overrides the built-in template for this rule. |
| `urgentTypes` | `array<string>` | 否 | UrgentTypes bypass quiet hours. |

### aggregation 字段 {#notification-rule-aggregation}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `by` | `array<string>` | 否 | By lists event data keys used to build the aggregation key. |
| `window` | `string` | 否 | Window is the aggregation window. Zero disables aggregation. |


### match 字段 {#notification-rule-match}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `appEnvs` | `array<string>` | 否 | — |
| `categories` | `array<string>` | 否 | — |
| `labels` | `map` | 否 | Labels are matched against EventEnvelope.labels using exact key/value matching. |
| `repositories` | `array<string>` | 否 | — |
| `scopes` | `array<string>` | 否 | — |
| `severities` | `array<string>` | 否 | — |
| `types` | `array<string>` | 否 | — |


### quietHours 字段 {#notification-rule-quiet-hours}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `end` | `string` | 否 | End is HH:MM in the configured timezone. |
| `start` | `string` | 否 | Start is HH:MM in the configured timezone. |
| `timezone` | `string` | 否 | Timezone is an IANA timezone name. |


### recipients 字段 {#notification-rule-recipients}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `alsoGroup` | `boolean` | 否 | AlsoGroup sends a group copy even when direct messages are available. |
| `channels` | `array<string>` | 否 | Channels limits delivery to these NotificationChannel names. |
| `fallbackToGroup` | `boolean` | 否 | FallbackToGroup sends to the rule's project group when no user recipient is available. |
| `groupMention` | `string` | 否 | GroupMention defaults to none. @all is deliberately unsupported. |
| `mode` | `string` | 否 | Mode is union by default; fallback only uses later subject types when earlier ones yield nobody. |
| `subjects` | `array<object>` | 否 | Subjects are evaluated in order. |


### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `conditions` | `array<object>` | 否 | — |
| `observedGeneration` | `integer` | 否 | — |


## Notification {#notification}

通知事件与投递记录，由通知控制器创建和维护。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Namespaced` |
| Plural | `notifications` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `audience` | `object` | 否 | Audience is set for platform announcements. The console audience picker writes it; recipient resolution for announcements still broadcasts to platform group channels, so the field is advisory today. |
| `batchID` | `string` | 否 | BatchID links shards of a large announcement. Reserved for sharded sends. |
| `event` | `object` | 是 | EventEnvelope is the provider-neutral event carried by a Notification. |

### audience 字段 {#notification-audience}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `group` | `string` | 否 | — |
| `projectRole` | `string` | 否 | — |
| `type` | `string` | 是 | — |


### event 字段 {#notification-event}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `actions` | `array<object>` | 否 | — |
| `aggregationKey` | `string` | 否 | AggregationKey groups events that should share one Notification object. |
| `body` | `string` | 否 | — |
| `category` | `string` | 是 | — |
| `correlationID` | `string` | 否 | — |
| `data` | `map` | 否 | — |
| `dedupeKey` | `string` | 否 | — |
| `labels` | `map` | 否 | — |
| `links` | `array<object>` | 否 | — |
| `occurredAt` | `string` | 是 | — |
| `project` | `string` | 否 | — |
| `scope` | `string` | 是 | — |
| `severity` | `string` | 是 | — |
| `source` | `string` | 是 | — |
| `sourceEventID` | `string` | 是 | — |
| `title` | `string` | 否 | — |
| `type` | `string` | 是 | — |


### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `alerts` | `array<object>` | 否 | Alerts tracks Alertmanager fingerprints for incident aggregation. |
| `deliveries` | `array<object>` | 否 | — |
| `deliveryHistory` | `array<object>` | 否 | DeliveryHistory keeps a bounded snapshot of deliveries from previous aggregation rounds so retries do not erase the audit trail. |
| `events` | `array<object>` | 否 | Events tracks appended events for aggregation. |
| `lastEventAt` | `string` | 否 | — |
| `observedGeneration` | `integer` | 否 | — |
| `phase` | `string` | 否 | — |
| `rules` | `array<string>` | 否 | Rules are the matched NotificationRule names. |
| `skipped` | `array<object>` | 否 | — |


## User {#user}

平台用户，保存 OIDC 身份、联系方式与启用状态。

| 项目 | 值 |
|---|---|
| Group | `kube-do.cn` |
| Version | `v1` |
| Scope | `Cluster` |
| Plural | `users` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `dingtalkId` | `string` | 否 | DingTalkID 钉钉 ID |
| `email` | `string` | 否 | Email 电子邮箱地址 |
| `enabled` | `boolean` | 否 | Enabled 指用户是否启用 |
| `feishuId` | `string` | 否 | FeishuID 飞书 ID |
| `fullName` | `string` | 否 | FullName 全名 |
| `identities` | `array<string>` | 否 | Identities 身份提供者身份列表（如 github:12345, ldap:uid=john...) |
| `phone` | `string` | 否 | Phone 手机号码 |
| `subject` | `string` | 否 | Subject 是 OIDC 的 sub，用户在该 IdP 中的唯一且不可变的身份锚点。 |
| `username` | `string` | 否 | Username 是 OIDC 身份名（preferred_username），同时用于 Kubernetes username 与 RBAC subject。 保持 IdP 原值（可能包含大写、中文），不用于资源命名；创建后不可变更。 |
| `wechatWorkId` | `string` | 否 | WeChatWorkID 企业微信 ID |

### Status

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `conditions` | `array<object>` | 否 | Conditions 描述同步与绑定状态，便于在 UI 上展示失败原因。 |
| `lastSyncTime` | `string` | 否 | LastSyncTime 是最近一次成功同步的时间。 |
| `observedGeneration` | `integer` | 否 | ObservedGeneration 是控制器最近一次处理过的 spec 代次。 |
| `providerUserID` | `string` | 否 | ProviderUserID 是用户在该 IdP 中的唯一 ID，用于维持绑定关系。 |
| `syncSource` | `string` | 否 | SyncSource 是当前同步来源的 Provider 名称。 |
