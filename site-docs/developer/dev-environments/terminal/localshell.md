---
title: "LocalShell 模式与本地运维"
description: "使用 LocalShell 在本地机器登录 KDO 集群，配置 kubeconfig、多集群切换、代理和 IDE 集成。"
sidebar_position: 12
doc_type: how-to
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

上级：[命令行模式](/docs/developer/dev-environments/terminal/)

LocalShell主要用于促进本地环境与KDO平台之间的交互操作。例如，它允许用户通过kubectl在本地对平台进行操作，以及实现本地IDE与KDO平台之间的无缝连接。
这样的设置旨在提高开发效率和灵活性，使得开发者可以在熟悉的本地工具环境中高效工作，同时充分利用KDO平台的强大功能。

## 打开localshell
LocalShell集成在KDO的管理控制台中，访问KDO页面右上角用户菜单，点击`复制登录命令`
![打开 LocalShell](img/open-local-shell.png)


## 下载命令行工具
![local-shell.png](img/local-shell.webp)
打开页面，里面`Windows`、`Linux`、`Mac`各种操作系统的命令行工具，访问对应操作系统的链接，下载对应的命令行工具`oc`。
确保有可执行的权限(linux/mac通过`chmod +x oc`设置，windows右键属性里设置`解除锁定`)，放置到对应的目录（注意：这里需要用到管理员的权限）
比如:Windows是`C:\Windows\System32\`，Linux和Mac是 `/usr/bin/` 。
![解除 Windows 文件锁定](img/windows-unlock.webp)

## oc 与 kubectl 对比

:::note

`oc` 是 Kubernetes 官方 CLI 工具 `kubectl` 的超集，在完全兼容 `kubectl` 的基础上，额外提供了 OpenShift/KDO 平台特有的功能。

:::

| 功能 | `oc` | `kubectl` |
|------|------|-----------|
| 基础资源操作（get/delete/apply） | 支持 | 支持 |
| 集群登录（`oc login`） | 支持 | 不支持 |
| 项目切换（`oc project`） | 支持 | 不支持 |
| 应用创建向导（`oc new-app`） | 支持 | 不支持 |
| 路由管理（`oc expose`） | 支持 | 不支持 |
| 所有 kubectl 子命令 | 完全兼容 | 原生支持 |

:::info

登录 KDO 平台后，`oc` 和 `kubectl` 可以互换使用。例如 `oc get pods` 和 `kubectl get pod` 效果完全相同。推荐使用 `oc` 以获得更完整的平台管理体验。

:::

## 登录方式

### Token 登录

1. 登录 KDO 平台 Web 控制台
2. 点击右上角用户菜单，选择 `复制登录命令`
3. 在本地终端粘贴并执行该命令

```shell
# 登录命令示例
oc login --token=sha256~xxxxx --server=https://api.cluster.example.com:6443
```


执行后浏览器会自动打开，完成 OAuth 授权后终端将自动登录成功。

## 多集群管理

:::note

当需要管理多个 Kubernetes 集群时，`oc`/`kubectl` 通过上下文（context）机制进行切换。

:::

### 查看当前上下文

```shell
# 查看当前使用的上下文
oc config current-context

# 列出所有可用的上下文
oc config get-contexts
```

### 切换集群上下文

```shell
# 切换到指定上下文
oc config use-context <context-name>

# 示例：切换到生产集群
oc config use-context production-cluster
```

### 查看和管理 kubeconfig

```shell
# 查看完整的 kubeconfig 配置
oc config view

# 合并多个 kubeconfig 文件
export KUBECONFIG=~/.kube/config:~/.kube/config-production
oc config view --merge --flatten > merged-config.yaml
```

## 下载 kubeconfig

:::note

除了 `oc login` 之外，KDO 控制台还提供 **下载 kubeconfig** 的能力，方便把集群访问凭据交给本地工具（`kubectl`、`oc`、IDE 等）：

:::

| 入口 | 位置 | 说明 |
|------|------|------|
| 用户 kubeconfig | 右上角**用户菜单 → 下载 kubeconfig** | 导出当前登录用户的 kubeconfig，内嵌当前会话 Token |
| 服务账号 kubeconfig | **服务账号(ServiceAccount) → 操作 → 下载 kubeconfig** | 为指定服务账号签发绑定 Token 并生成 kubeconfig（需相应权限） |

:::info

在多集群环境下，下载的 kubeconfig 默认指向**当前所在集群**；后端通过 `X-Cluster` 头区分目标集群。下载文件名会自动带上命名空间/服务账号等标识，避免不同资源的文件相互覆盖。

:::

## 代理设置

如果本地环境需要通过代理访问集群，可以配置以下环境变量：

```bash
# HTTP 代理
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# 不代理的地址（集群内部地址）
export NO_PROXY=.cluster.local,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

将以上配置写入 `~/.bashrc` 或 `~/.bash_profile` 以持久化。

## IDE 集成

### VS Code 集成

1. 安装 VS Code 扩展 **Kubernetes**（ms-kubernetes-tools.vscode-kubernetes-tools）
2. 配置 `kubeconfig` 路径指向 `oc` 登录后生成的配置文件
3. 在 VS Code 中直接浏览集群资源、查看日志、编辑 YAML

```json
// settings.json
{
  "vscode-kubernetes.kubectl-path": "/usr/bin/kubectl",
  "vscode-kubernetes.kubeconfig": "~/.kube/config"
}
```

### JetBrains IDE 集成

1. 安装 **Kubernetes** 插件
2. 在 `Settings → Kubernetes` 中配置 kubeconfig 路径
3. 可在 IDE 内直接管理集群资源

## 操作localshell
点击下面`复制登录命令`，到终端运行后，就可以通过`oc`命令行工具访问KDO平台(如果本机有`kubectl`，通过`oc`登录后用`kubectl`也是一样)。
<video class="doc-video" controls muted loop autoplay playsinline preload="metadata" poster="/media/docs/developer/dev-environments/terminal/img/localshell-operation-poster.webp" aria-label="localshell-operation.gif"><source src="/media/docs/developer/dev-environments/terminal/img/localshell-operation.mp4" type="video/mp4" /></video>

:::note

`oc` 是一个与 `kubectl` 兼容的命令行工具，它特别之处在于提供了 `kubectl` 所不具备的登录功能，使用户能够通过 `oc` 登录到集群。
一旦完成登录，您不仅可以使用 `oc` 命令执行各种操作，还可以无缝地使用 `kubectl` 的命令集。
例如，`oc get pod` 和 `kubectl get pod` 实现了相同的功能，即获取集群中Pod的列表信息。
实际上，除了提供登录功能外，`oc` 支持所有 `kubectl` 命令，使得用户在进行集群管理和应用部署时拥有更大的灵活性和便利性。

:::


## 常用操作示例

:::note

以下为 CloudShell 和 LocalShell 中常用的 Kubernetes 操作命令速查表。

:::

### 资源查看

```shell
# 查看所有命名空间的 Pod
kubectl get pods -A

# 查看 Pod 详细信息
kubectl get pods -o wide

# 以 YAML 格式输出资源
kubectl get deployment <name> -o yaml

# 查看资源描述
kubectl describe pod <pod-name>

# 查看所有命名空间
kubectl get ns

# 查看所有服务
kubectl get svc -A
```

### 资源管理

```shell
# 创建/更新资源
kubectl apply -f <file>.yaml

# 删除资源
kubectl delete -f <file>.yaml

# 扩缩容
kubectl scale deployment <name> --replicas=3

# 查看 Pod 日志
kubectl logs -f <pod-name>

# 查看多容器 Pod 日志
kubectl logs <pod-name> -c <container-name>

# 进入 Pod 终端
kubectl exec -it <pod-name> -- /bin/bash
```

### 调试排查

```shell
# 查看 Pod 事件
kubectl describe pod <pod-name> | grep -A 10 Events

# 查看资源使用情况
kubectl top pods
kubectl top nodes

# 端口转发（本地调试）
kubectl port-forward svc/<service-name> 8080:80

# 查看日志中的错误
kubectl logs <pod-name> | grep -i error
```

### Helm 操作

```shell
# 查看已安装的 Helm Release
helm list

# 安装 Helm Chart
helm install <release-name> <chart> -n <namespace>

# 升级 Helm Release
helm upgrade <release-name> <chart> -n <namespace>

# 卸载 Helm Release
helm uninstall <release-name> -n <namespace>

# 查看 Helm Release 状态
helm status <release-name> -n <namespace>
```


## FAQ / 故障排查 {#faq}

### CloudShell 相关

#### Q: CloudShell 打开后显示 "Connection refused" 或无法连接

**原因：** CloudShell Pod 可能尚未完全就绪，或命名空间配额不足。

**解决方法：**
1. 等待 10-30 秒后重试
2. 检查命名空间配额是否已满：`kubectl get resourcequota -n kubernetes-terminal`
3. 如持续无法连接，刷新页面重新打开 CloudShell

#### Q: CloudShell 中执行命令提示 "Permission denied"

**原因：** CloudShell Pod 以非 root 用户运行，部分系统目录无写入权限。

**解决方法：**
- 将文件写入 `/home/user` 目录（具有持久化存储和写入权限）
- 使用 `sudo` 执行需要 root 权限的命令（如可用）

#### Q: CloudShell 中工具版本较旧

**解决方法：** CloudShell 工具版本随平台更新，如发现版本较旧，联系平台管理员确认是否需要更新平台版本。

### LocalShell 相关

#### Q: 执行 `oc login` 后报 "certificate signed by unknown authority"

**原因：** 集群使用了自签名证书。

**解决方法：**
```shell
# 跳过 TLS 证书验证（仅开发环境）
oc login --token=<token> --server=https://api.cluster.example.com:6443 --insecure-skip-tls-verify=true
```

:::warning

生产环境不建议跳过证书验证，应配置正确的 CA 证书。

:::

#### Q: `oc` 命令执行后报 "not found" 或无法识别

**原因：** `oc` 未添加到系统 PATH，或没有执行权限。

**解决方法：**
```shell
# Linux/Mac - 添加执行权限
chmod +x oc
sudo mv oc /usr/bin/

# 验证安装
oc version
```

#### Q: 登录后 `kubectl` 无法连接集群

**原因：** `kubectl` 未使用正确的 kubeconfig。

**解决方法：**
```shell
# 确认 kubeconfig 路径
kubectl config view

# 手动指定 kubeconfig
kubectl --kubeconfig=~/.kube/config get pods

# 或设置环境变量
export KUBECONFIG=~/.kube/config
```

#### Q: 多集群切换后命令返回其他集群的数据

**原因：** 上下文切换未生效。

**解决方法：**
```shell
# 确认当前上下文
oc config current-context

# 重新切换
oc config use-context <正确的上下文名称>

# 验证
oc whoami
```

### 网络相关

#### Q: CloudShell 中无法访问集群外部地址

**原因：** 集群网络策略限制了出站流量。

**解决方法：** 联系平台管理员检查出口网络策略（EgressNetworkPolicy）配置，确认是否允许 CloudShell 命名空间的出站访问。

#### Q: 本地 `oc` 连接集群超时

**原因：** 网络不通、代理未配置或 API Server 地址错误。

**解决方法：**
1. 检查网络连通性：`ping api.cluster.example.com`
2. 如需代理，配置 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量
3. 确认 kubeconfig 中的 server 地址正确
