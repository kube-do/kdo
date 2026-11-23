---
title: "离线安装"
description: "在无法访问公网的环境中准备镜像、Chart 和安装器并完成 KDO 安装。"
sidebar_position: 5
doc_type: how-to
audience: [admin]
owner: docs-admin
last_reviewed: 2026-11-23
status: stable
---

离线安装的核心是提前准备安装器、容器镜像、Helm Chart 和系统依赖，并让集群从内网仓库拉取。开始前先在可联网环境完成一次同版本安装，记录实际使用的镜像和 Chart。

## 适用场景

- 生产集群不允许访问公网。
- 只能通过内网 Harbor、Nexus 或对象存储分发制品。
- 需要固定版本、可重复部署。
- 需要把安装介质带入隔离网络。

## 准备介质

在可联网环境准备：

| 介质 | 内容 |
| --- | --- |
| 安装器 | 目标版本的 `kdo-install` 二进制 |
| 容器镜像 | KDO、KDC、Console、PAC、Tekton、Keycloak、Harbor、Prometheus、Logging 等 |
| Helm Chart | 安装器使用的 Chart 或离线包 |
| 系统依赖 | NFS、containerd、conntrack、socat、ipset 等 |
| 配置 | `kdo-install.yaml`、域名、OIDC、证书和内网仓库地址 |

镜像清单应以目标版本实际使用的清单为准，不要手工猜测 tag。可以在联网环境执行一次安装或 `kdo-install status`，从 Pod 和 Deployment 中导出镜像列表。

## 导入镜像

将镜像保存为 tar：

```bash
ctr -n k8s.io images export kdo-images.tar \
  registry.example.com/kdo/console:v2026.11 \
  registry.example.com/kdo/kdc:v2026.11
```

在离线节点导入：

```bash
ctr -n k8s.io images import kdo-images.tar
ctr -n k8s.io images ls | grep kdo
```

如果使用内网 Harbor，建议先把镜像推送到 Harbor，再让集群从 Harbor 拉取；这样便于扫描、保留和权限控制。

```bash
docker tag console:v2026.11 harbor.example.com/kdo/console:v2026.11
docker push harbor.example.com/kdo/console:v2026.11
```

## 配置安装器

在 `kdo-install.yaml` 中把镜像仓库、域名、OIDC 和访问地址改为离线环境的值。常见需要确认的字段：

- `spec.cluster.nodeIP`、`spec.cluster.domain`
- `spec.oidc.issuerURL`、`spec.oidc.clientID`
- `spec.access.consoleURL`、`spec.access.keycloakURL`
- 镜像仓库地址和拉取 Secret
- `spec.ingress.enabled`、`spec.ingress.className`

如果安装器支持镜像仓库参数，优先使用配置文件而不是临时环境变量，保证可重复执行。

## 安装前检查

```bash
kdo-install config validate -config kdo-install.yaml
kdo-install apiserver-check -config kdo-install.yaml
kdo-install preflight -config kdo-install.yaml
```

额外确认：

- 所有节点可以解析内网 Harbor 域名。
- 节点时间同步正常，OIDC 对时间偏差敏感。
- 节点可以拉取测试镜像。
- 存储、NFS 和 PVC 动态供应可用。
- 防火墙允许 Kubernetes、Ingress、Harbor 和 OIDC 所需端口。

## 执行安装

```bash
kdo-install install -config kdo-install.yaml -yes -timeout 30m
```

镜像较多时适当延长超时。安装失败后先查看安装器输出和 Pod 事件，不要直接重复执行；确认失败原因并清理残留资源后再重试。

## 验证

```bash
kdo-install status -config kdo-install.yaml
kdo-install access-info -config kdo-install.yaml
kubectl get pod -A | grep -E 'kubedo|kdc|console|keycloak|harbor|tekton|pipelines-as-code'
```

验证 Console 登录、Harbor 拉取、PAC Webhook、流水线构建和 Ingress 访问。

## 常见问题

**ImagePullBackOff**

确认镜像已导入所有可能调度到的节点，或内网 Harbor 凭证正确；检查 `imagePullSecrets` 和节点网络。

**安装器等待超时**

先看失败组件的事件和日志，常见原因是镜像缺失、存储未就绪、DNS 不通或资源不足。

**Keycloak 启动慢**

首次启动需要初始化 realm 和数据库，离线环境镜像拉取也可能较慢；适当延长超时并检查数据库连接。

**无法访问 Ingress 域名**

配置 DNS 或 hosts，确认 Ingress Controller 和证书状态；NodePort 仍可作为临时入口。

## 相关文档

- [安装 KDO 平台](/docs/install/kdo/)
- [安装 Kubernetes](/docs/install/kubernetes/)
- [安装 Keycloak](/docs/install/keycloak/)
- [升级与回滚](/docs/admin/maintenance/upgrade/)
- [版本兼容性](/docs/reference/compatibility/)
