---
title: Kdo Web控制台
parent: 集群配置
nav_order: 1
---



# Kdo Console 项目介绍与架构说明

## 项目简介

Kdo Console 是一个**多集群 Kubernetes 管理平台**。它不仅是 K8s API 的友好 Web UI，更是一个涵盖认证、监控、日志、应用生命周期管理、镜像仓库、多集群联邦的综合性管理控制台。

Kdo Console 运行在**kubedo-system**这个namespace，deployment名字是**console**。

---

## 核心功能

###   Kubernetes 资源管理
- 对所有 K8s 核心资源（Pod、Deployment、Service、ConfigMap、Secret 等）的 CRUD
- 内置 YAML 编辑器（Monaco Editor），支持资源创建与编辑
- Pod 日志实时查看、Web Terminal 远程登录、文件上传下载
- 跨命名空间资源搜索（按名称或 IP）

###   多集群管理
- 通过自定义 CRD `Cluster`（`kube-do.cn/v1`）纳管多个 K8s 集群
- 统一视图查看所有集群的资源，支持集群切换
- 每个集群的监控（Thanos/Prometheus）、告警（AlertManager）独立代理
- 主集群 + 托管集群的联邦管理

###   OIDC 认证（Keycloak）
- 支持 Keycloak 作为 OIDC 身份提供商
- RP-initiated logout（Keycloak Session 注销）
- 权限基于 `kube-do.cn/v1 User/Group` CRD
- 支持静态 Token（开发模式）和 OpenShift OAuth

###   应用生命周期管理
- **AppProject / AppEnv** CRD：项目与多环境（dev/test/stage/prod）管理
- ImageStream / BuildConfig 操作（kube-do.cn API Group）
- 工作负载启停（通过 annotation `kube-do.cn/replicas` 保存原始副本数）
- 从 Git 仓库 / 容器镜像导入应用

###   监控与告警
- 集成 Prometheus / Thanos，提供指标查询和监控面板
- AlertManager 告警管理
- 集群级和多租户级监控路由

###   日志与可观测性
- Loki 日志查询
- Jaeger 链路追踪
- Kiali 服务网格可视化
- OLS（OpenLightSpeed）AI 助手

###   镜像仓库管理
- 集成 Harbor 镜像仓库，支持镜像查询与推送配置

---

## 系统架构

```
┌────────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                         │
│   index.html  |  JS Bundles  |  CSS  |  WebSocket (Terminal)      │
└──────────────────┬─────────────────────────────────────────────────┘
                   │
                   │ HTTP / WebSocket
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Bridge (Go HTTP Server) —— cmd/bridge/           │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Static      │  │  Auth        │  │  Proxy Layer             │  │
│  │  Assets      │  │  Middleware  │  │  ┌────────────────────┐  │  │
│  │  (frontend   │  │  + CSRF     │  │  │ K8s API Proxy      │  │  │
│  │   dist/)     │  │  + OIDC     │  │  ├────────────────────┤  │  │
│  └─────────────┘  └──────────────┘  │  │ Thanos/Prometheus   │  │  │
│                                      │  ├────────────────────┤  │  │
│  ┌──────────────────────────────┐   │  │ AlertManager        │  │  │
│  │  API Handlers                 │   │  ├────────────────────┤  │  │
│  │  ┌────── ────── ┬──────────┐ │   │  │ Helm Charts        │  │  │
│  │  │ OLM/Operator │ Logging  │ │   │  ├────────────────────┤  │  │
│  │  ├──────────────┼──────────┤ │   │  │ Dynamic Plugins    │  │  │
│  │  │ Helm         │ Search   │ │   │  ├────────────────────┤  │  │
│  │  ├──────────────┼──────────┤ │   │  │ GitOps             │  │  │
│  │  │ Knative      │ Podfile  │ │   │  └────────────────────┘  │  │
│  │  ├──────────────┼──────────┤ │   └──────────────────────────┘  │
│  │  │ GraphQL      │ Terminal │ │                                  │
│  │  └──────────────┴──────────┘ │   ┌──────────────────────────┐  │
│  └──────────────────────────────┘   │  Multi-Cluster Router     │  │
│                                      │  (pkg/cluster/)           │  │
│  ┌──────────────────────────────┐   └──────────────────────────┘  │
│  │  Controller Manager           │                                  │
│  │  (tech-preview)               │                                  │
│  │  └ ClusterCatalog Reconciler  │                                  │
│  └──────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
                   │
                   │ 代理（Proxy）请求到后端服务
                   │
  ┌────────────────┼────────────────────────────────────┐
  │                ▼                                    │
  │  ┌─────────────────────┐  ┌──────────────────────┐  │
  │  │ Kubernetes API       │  │ Managed Cluster A    │  │
  │  │ (主集群)              │  │ K8s API / Thanos /   │  │
  │  │                      │  │ AlertManager         │  │
  │  └─────────────────────┘  └──────────────────────┘  │
  │                                                    │
  │  ┌─────────────────────┐  ┌──────────────────────┐  │
  │  │ Thanos / Prometheus  │  │ Managed Cluster B    │  │
  │  │ (集群内监控)          │  │ K8s API / Thanos /   │  │
  │  └─────────────────────┘  │ AlertManager         │  │
  │                            └──────────────────────┘  │
  │  ┌─────────────────────┐                              │
  │  │ AlertManager (告警)  │                              │
  │  └─────────────────────┘                              │
  │  ┌─────────────────────┐  ┌──────────────────────┐  │
  │  │ Keycloak (OIDC)     │  │ Harbor (镜像仓库)     │  │
  │  └─────────────────────┘  └──────────────────────┘  │
  └────────────────────────────────────────────────────┘
```

### 核心设计模式：代理（Proxy）模式

Console 的核心设计是一个**统一的反向代理网关**。所有前端 API 请求都经过 Bridge Server 处理：

1. **认证拦截** — 每次请求先经过认证中间件验证身份
2. **CSRF 防护** — 敏感操作需要 CSRF Token
3. **Bearer Token 注入** — 在代理到后端时自动注入用户 Token
4. **请求路由** — 根据路径分发到不同的后端服务
5. **多集群路由** — 根据请求上下文选择目标集群

这种设计的优势：
- 前端无需直接暴露 K8s API Server
- Token 在服务端管理，安全性高
- 统一控制跨域（CORS）、标头过滤、协议转换
- 多集群请求透明路由

---


---

## 技术栈

### 后端 (Go)

| 类别 | 技术 | 用途 |
|------|------|------|
| 语言 | Go 1.25+ | HTTP Server |
| HTTP 框架 | 标准库 `net/http` | 路由、中间件 |
| 认证 | OIDC / OAuth2 | `coreos/go-oidc`、自实现 Keycloak 集成 |
| 代理 | `net/http/httputil.ReverseProxy` | 统一反向代理 |
| 配置 | `gopkg.in/yaml.v2` | YAML 配置解析 |
| K8s 集成 | `client-go`、`controller-runtime` | K8s API 调用、Controller |
| Session | `gorilla/sessions` | Cookie Session 管理 |
| 日志 | `klog` | 结构化和分级日志 |

### 前端 (React/TypeScript)

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| 状态管理 | Redux 5 |
| 路由 | React Router 7 |
| UI 库 | PatternFly 6 |
| 构建 | Webpack 5 (Module Federation) |
| 测试 | Jest + Cypress |
| 国际化 | i18next |
| 监控客户端 | Prometheus API 客户端 |
| 终端 | XTerm.js |
| 编辑器 | Monaco Editor (YAML) |

---

## 配置体系

配置支持三种来源，优先级从高到低：

1. **命令行参数** — `--listen=http://0.0.0.0:9000`
2. **环境变量** — `BRIDGE_LISTEN=http://0.0.0.0:9000`
3. **YAML 配置文件** — `--config=/path/to/config.yaml`

详细配置项说明参见 `cmd/bridge/README.md`。

**示例配置**（`examples/config.yaml`）：
```yaml
apiVersion: console.kube-do.cn/v1
kind: ConsoleConfig
servingInfo:
  bindAddress: http://0.0.0.0:9000
clusterInfo:
  consoleBaseAddress: http://127.0.0.1:9000
  k8sModeOffClusterEndpoint: https://10.255.0.180:6443
  k8sMode: off-cluster
auth:
  clientID: kdo
  clientSecret: kubedo
  issuerURL: https://keycloak.example.com/realms/kdo
  userAuth: oidc
  oidcProvider: Keycloak
```

---

## 认证流程

### OIDC 认证（Keycloak）

```
1. 用户访问 Console
2. Console 重定向到 Keycloak 登录页
3. 用户登录成功后，Keycloak 返回 Authorization Code
4. Console 服务端用 Code 换取 ID Token + Access Token
5. Token 加密存储在 Cookie Session 中
6. 后续 API 请求从 Session 中提取 Token，注入到 K8s API 请求

登出流程：
1. 用户点击 Logout
2. Console 从 Session 清除 Token
3. 调用 Keycloak 的 end_session_endpoint 清除 Keycloak Session
```

---


### 生产部署

参考 `examples/deployment.yaml`，包含：
- **ConfigMap**：注入配置文件
- **Deployment**：运行 bridge 容器
- **Service**：NodePort 30080 暴露服务
- **Ingress**：nginx ingress 代理
- **RoleBinding**：授权认证用户

---

## 配置加载优先级

Console 配置按以下优先级加载（高优先级覆盖低优先级）：
1. **命令行参数**（最高优先级）
2. **环境变量**（以 `BRIDGE_` 为前缀，例如 `BRIDGE_LISTEN`）
3. **YAML 配置文件**（通过 `--config` 指定）

## 配置方式

### 方式一：YAML 配置文件

通过 `--config` 参数指定配置文件路径，例如：

```bash
./bridge --config=/path/to/config.yaml
```

### 方式二：命令行参数

所有配置项均可通过命令行参数传入，使用 `--help` 查看全部参数。

### 方式三：环境变量

将命令行参数名转换为大写，以 `BRIDGE_` 为前缀，将 `-` 替换为 `_`，例如：

```bash
export BRIDGE_LISTEN=http://0.0.0.0:9000
export BRIDGE_USER_AUTH_OIDC_ISSUER_URL=https://keycloak.example.com/realms/kdo
```

### 方式四：K8s ConfigMap（生产部署）

通过 ConfigMap 挂载配置文件到容器，使用 `--config` 参数指定，参见 `examples/deployment.yaml`。

---

## YAML 配置项详解

### 顶层字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `apiVersion` | string | 固定为 `console.kube-do.cn/v1` |
| `kind` | string | 固定为 `ConsoleConfig` |

---

### servingInfo — HTTP 服务配置

| 字段 | 类型 | 对应 CLI 参数 | 说明 |
|------|------|--------------|------|
| `bindAddress` | string | `--listen` | 监听地址，格式 `http://IP:PORT` 或 `https://IP:PORT`。示例：`http://0.0.0.0:9000` |
| `certFile` | string | `--tls-cert-file` | TLS 证书文件路径。当 `bindAddress` 使用 `https://` 时必填 |
| `keyFile` | string | `--tls-key-file` | TLS 证书密钥文件路径。当 `bindAddress` 使用 `https://` 时必填 |
| `redirectPort` | int | `--redirect-port` | 自定义主机名重定向监听端口。当用户通过不同主机名访问时，可以重定向到 console 的正确地址 |

**不支持字段**（配置后会报错）：`bindNetwork`、`clientCA`、`namedCertificates`、`minTLSVersion`、`cipherSuites`、`maxRequestsInFlight`、`requestTimeoutSeconds`

**示例**：
```yaml
servingInfo:
  bindAddress: http://0.0.0.0:9000
```

---

### clusterInfo — 集群信息

| 字段 | 类型 | 对应 CLI 参数 | 说明 |
|------|------|--------------|------|
| `consoleBaseAddress` | string | `--base-address` | Console 外部访问地址。格式 `http(s)://domainOrIP[:port]`。通过 Ingress 暴露时需要配置为 Ingress 域名 |
| `consoleBasePath` | string | `--base-path` | Console 基础路径，默认 `/`。必须以 `/` 开头和结尾 |
| `k8sMode` | string | `--k8s-mode` | Kubernetes 模式。`in-cluster`（集群内运行）或 `off-cluster`（集群外开发）。默认 `in-cluster` |
| `k8sModeOffClusterEndpoint` | string | `--k8s-mode-off-cluster-endpoint` | 集群外模式时，Kubernetes API Server 的访问地址。示例：`https://10.255.0.180:6443` |
| `k8sModeOffClusterSkipVerifyTls` | bool | `--k8s-mode-off-cluster-skip-verify-tls` | 开发模式。设为 `true` 跳过 K8s API Server 的 TLS 证书验证 |
| `publicDir` | string | `--public-dir` | 前端静态资源文件目录。默认 `./frontend/public/dist`。生产部署为 `/opt/bridge/static` |
| `masterPublicURL` | string | `--k8s-public-endpoint` | Kubernetes API Server 的公共端点，默认使用 `k8s-mode-off-cluster-endpoint` 的值 |
| `controlPlaneTopology` | string | `--control-plane-topology-mode` | 控制面拓扑模式。可选值：`External`、`HighlyAvailable`、`HighlyAvailableArbiter`、`DualReplica`、`SingleReplica` |
| `releaseVersion` | string | `--release-version` | 集群的 OpenShift 版本号 |
| `nodeArchitectures` | []string | `--node-architectures` | 节点架构列表，如 `amd64,arm64` |
| `nodeOperatingSystems` | []string | `--node-operating-systems` | 节点操作系统列表，如 `linux,windows` |
| `copiedCSVsDisabled` | bool | `--copied-csvs-disabled` | 是否禁用 OLM 复制（copied）的 ClusterServiceVersion |
| `techPreviewEnabled` | bool | `--tech-preview` | 是否启用 Technology Preview 功能 |

**示例**：
```yaml
clusterInfo:
  consoleBaseAddress: http://127.0.0.1:9000
  k8sModeOffClusterEndpoint: https://10.255.0.180:6443
  k8sMode: off-cluster
  publicDir: ./frontend/public/dist
```

---

### auth — 认证配置

| 字段 | 类型 | 对应 CLI 参数 | 说明 |
|------|------|--------------|------|
| `userAuth` | string | `--user-auth` | 用户认证方式。可选值：`disabled`（禁用）、`oidc`（OIDC 认证）、`openshift`（OpenShift OAuth）。默认 `openshift` |
| `k8sAuth` | string | `--k8s-auth` | K8s API 认证方式。当前仅支持 `oidc` |
| `clientID` | string | `--user-auth-oidc-client-id` | OIDC Client ID。**必须与 kube-apiserver 的 `--oidc-client-id` 参数一致** |
| `clientSecret` | string | `--user-auth-oidc-client-secret` | OIDC Client Secret。与 `clientSecretFile` 二选一 |
| `clientSecretFile` | string | `--user-auth-oidc-client-secret-file` | OIDC Client Secret 文件路径。与 `clientSecret` 二选一 |
| `issuerURL` | string | `--user-auth-oidc-issuer-url` | OIDC Issuer URL。**必须与 kube-apiserver 的 `--oidc-issuer-url` 参数一致**。当 `userAuth=oidc` 时必填 |
| `oidcIssuer` | string | → `user-auth-oidc-issuer-url` | OIDC Issuer URL（别名，与 `issuerURL` 功能相同） |
| `oidcExtraScopes` | []string | `--user-auth-oidc-token-scopes` | 额外的 OIDC scope 列表，将附加到默认的 `openid,email,profile,groups` 之后 |
| `oidcOCLoginCommand` | string | `--user-auth-oidc-oc-login-command` | 在 Console "复制登录命令" 对话框中显示的外部 OC 登录命令 |
| `oauthEndpointCAFile` | string | `--user-auth-oidc-ca-file` | OIDC/OAuth2 Issuer 的 CA 证书 PEM 文件路径 |
| `logoutRedirect` | string | `--user-auth-logout-redirect` | 退出登录后的重定向 URL，用于单点登录 (SSO) |
| `inactivityTimeoutSeconds` | int | `--inactivity-timeout` | 用户无操作超时登出时间（秒）。低于 300 秒（5 分钟）的值将被忽略 |
| `k8sAuthBearerToken` | string | `--k8s-auth-bearer-token` | **开发模式**。用户认证静态 Token，仅在 `userAuth=disabled` 时使用。为 ServiceAccount Token |
| `oidcProvider` | string | `--user-auth-oidc-provider` | OIDC 提供商类型。当前仅支持 `Keycloak` |
| `keycloakAdminURL` | string | - | Keycloak 管理 API 地址（仅在 oidcProvider=Keycloak 时使用） |
| `keycloakAdminPassword` | string | - | Keycloak 管理员密码（仅在 oidcProvider=Keycloak 时使用） |
| `authType` | string | - | 认证类型，与 `userAuth` 功能相同 |

**认证类型说明**：
- **openshift**：使用 OpenShift OAuth Server 进行认证，自动使用 K8s API Server 地址作为 OIDC Issuer，不需要额外配置 `issuerURL`
- **oidc**：使用外部 OIDC 提供商（如 Keycloak）进行认证，必须指定 `issuerURL`
- **disabled**：禁用认证（仅开发模式），需配合 `k8sAuthBearerToken` 使用

**示例**：
```yaml
auth:
  clientID: kdo
  clientSecret: kubedo
  issuerURL: https://keycloak.example.com:30443/realms/kdo
  userAuth: oidc
  k8sAuth: oidc
  oidcProvider: Keycloak
```

---

### monitoringInfo — 监控配置

| 字段 | 类型 | 对应 CLI 参数 | 说明 |
|------|------|--------------|------|
| `k8sModeOffClusterThanos` | string | `--k8s-mode-off-cluster-thanos` | 集群外模式时 Thanos 查询服务地址 |
| `k8sModeOffClusterAlertmanager` | string | `--k8s-mode-off-cluster-alertmanager` | 集群外模式时 AlertManager 服务地址 |
| `alertmanagerTenancyHost` | string | `--alermanager-tenancy-host` | 多租户 AlertManager 服务地址（集群内模式，默认 `alertmanager-main.monitoring.svc:9093`） |
| `alertmanagerUserWorkloadHost` | string | `--alermanager-user-workload-host` | 用户负载告警的 AlertManager 地址（默认 `alertmanager-main.monitoring.svc:9093`） |
| `alertmanagerPublicURL` | string | `--alermanager-public-url` | AlertManager 的公网访问 URL |
| `grafanaPublicURL` | string | `--grafana-public-url` | Grafana 的公网访问 URL |
| `prometheusPublicURL` | string | `--prometheus-public-url` | Prometheus 的公网访问 URL |
| `thanosPublicURL` | string | `--thanos-public-url` | Thanos 的公网访问 URL |

**集群内模式默认值**：
- Thanos: `prometheus-k8s.monitoring.svc:9090`
- AlertManager: `alertmanager-main.monitoring.svc:9093`

**示例**：
```yaml
monitoringInfo:
  k8sModeOffClusterAlertmanager: http://alertmanager.example.com
  k8sModeOffClusterThanos: http://thanos.example.com
```

---

### registry — 镜像仓库配置（KubeDo 扩展字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| `registryURL` | string | Harbor 镜像仓库 URL。内置环境会自动从 `harbor` 命名空间的 ConfigMap `harbor-core` 中读取 `EXT_ENDPOINT` 字段 |
| `registryPassword` | string | Harbor 管理员密码。内置环境自动从 `harbor` 命名空间的 Secret `harbor-core` 中读取 `HARBOR_ADMIN_PASSWORD` 字段。如果手动更改了密码，需同步更新 Secret |

---

### managedClusterConfigFile — 多集群配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `managedClusterConfigFile` | string | 托管集群配置文件的路径（YAML 格式），用于配置多集群环境 |

**托管集群配置项**（在配置文件中定义）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 托管集群名称 |
| `apiServer.url` | string | API Server 地址 |
| `apiServer.caFile` | string | API Server CA 证书文件 |
| `oauth.clientID` | string | OAuth Client ID |
| `oauth.clientSecret` | string | OAuth Client Secret |
| `oauth.caFile` | string | OAuth CA 证书文件 |
| `clusterAlertManagerURL` | string | AlertManager URL |
| `clusterThanosURL` | string | Thanos 监控地址 |
| `clusterGitOpsURL` | string | GitOps 服务地址 |
| `clusterLoggingURL` | string | 日志服务地址 |
| `cname` | string | 集群中文名称 |
| `apiServerURL` | string | API Server 访问地址 |
| `jaegerHost` | string | Jaeger 链路追踪地址 |
| `kialiHost` | string | Kiali 服务网格地址 |
| `defaultDomain` | string | Ingress 默认域名后缀 |
| `mainCluster` | bool | 是否为主管理集群 |
| `copiedCSVsDisabled` | bool | 是否禁用复制的 CSV |

---

## 部署配置说明（deployment.yaml）

`examples/deployment.yaml` 定义了 Console 的 K8s 部署清单，包含以下资源：

### ConfigMap (`console`)
存储 YAML 配置文件内容，通过 volumeMount 挂载到 `/opt/bridge/config.yaml`。

**注意参数**：
- `clusterInfo.consoleBaseAddress`：NodePort 方式默认 `http://${NODE_IP}:30080`；通过 Ingress 暴露时改为域名
- `clusterInfo.k8sModeOffClusterEndpoint`：K8s API Server 地址
- `clusterInfo.k8sMode`：集群内模式使用 `in-cluster`

### Deployment (`console`)
- 镜像：`registry.cn-shenzhen.aliyuncs.com/kubedo/console:v202607`
- 启动命令：`/opt/bridge/bin/bridge --config=/opt/bridge/config.yaml`
- 服务端口：9000
- 就绪检查：`/health` 路径
- ServiceAccount：`kdc-controller-manager`

### Service (`console`)
- 类型：NodePort，端口 9000 → NodePort 30080

### Ingress (`console`)
- 域名：`console.${DEFAULT_DOMAIN}`
- 使用 nginx ingress controller
- 开启了 CORS、Session Affinity（Cookie 亲和性）

### RoleBinding (`kubedo`)
- 将 `system:authenticated` 组绑定到 `kube-public` 命名空间的 `edit` ClusterRole
- 允许已认证用户查看公共信息
