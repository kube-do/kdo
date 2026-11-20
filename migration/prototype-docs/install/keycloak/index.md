---
title: 安装 Keycloak
description: 为 KDO 准备 Keycloak realm、client 和 OIDC 参数，或对接已有身份平台。
doc_type: how-to
audience: [admin]
applies_to: ">= v2026.11"
tags: [安装, Keycloak, OIDC, 身份认证]
owner: docs-install
last_reviewed: 2026-11-20
status: draft
sidebar_label: 安装 Keycloak
sidebar_position: 3
---

# 安装 Keycloak

KDO 使用 OIDC 做用户认证。可以由安装器部署 Keycloak，也可以对接现有 Keycloak、Dex 或 Casdoor。

## 需要准备 {#prepare}

| 参数 | 说明 |
|---|---|
| Issuer URL | 例如 `https://keycloak.example.com/realms/kdo` |
| Client ID | kube-apiserver 和 KDO 使用的 client |
| Client Secret | 保密客户端需要 |
| Username claim | 建议 `preferred_username` |
| Groups claim | 建议 `groups` |
| Groups prefix | KDO 建议 `kdo:` |

## 对接 kube-apiserver {#apiserver}

确认 kube-apiserver 已配置：

```text
--oidc-issuer-url=https://keycloak.example.com/realms/kdo
--oidc-client-id=kdo
--oidc-username-claim=preferred_username
--oidc-username-prefix=-
--oidc-groups-claim=groups
--oidc-groups-prefix=kdo:
```

改完后重启 kube-apiserver，再执行：

```bash
kdo-install apiserver-check -config kdo-install.yaml
```

:::warning
`issuerURL` 必须与 kube-apiserver 的 `--oidc-issuer-url` 完全一致，包括协议、域名、端口和路径。否则登录会失败。
:::
