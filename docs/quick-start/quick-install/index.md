---
title: 快速安装
parent: 快速开始
nav_order: 1
---

## 前置条件

在安装 KDO 平台之前，请确保满足以下环境要求：

### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Linux (Ubuntu 20.04+, CentOS 7+, RHEL 8+) | Ubuntu 22.04 LTS |
| CPU | 4 核 | 8 核或以上 |
| 内存 | 8 GB | 16 GB 或以上 |
| 磁盘 | 50 GB 可用空间 | 100 GB+ SSD |
| 网络 | 能够访问互联网（下载依赖） | 配置本地镜像源可离线安装 |

### 软件要求

- **Docker** （如果使用 Docker 作为容器运行时）
  - 版本：20.10+
  - 或 **Containerd**：1.6+
- **Kubernetes 集群**（可选，如果已有则跳过集群安装）
  - 版本：v1.24 - v1.28
  - 可以使用 `kubeadm`、K3s、RKE2 等发行版
  - 至少 1 个 Master 节点和 2 个 Worker 节点
- ** kubectl**：用于集群管理（KDO 安装时会自动配置 context）
- ** Helm**：v3.12+（平台组件使用 Helm 部署）

### 权限要求

- `root` 或 `sudo` 权限执行安装脚本
- 能够访问 Kubernetes API Server
- 如果使用私有镜像仓库，需提前配置镜像拉取 Secret

---

## 安装模式选择

KDO 平台支持两种安装模式：

| 模式 | 描述 | 适用场景 |
|------|------|----------|
| **完整安装** | 自动安装 Kubernetes 集群 + KDO 平台 | 从零开始搭建全新环境 |
| **仅安装 KDO** | 跳过集群安装，直接部署到现有集群 | 已有 Kubernetes 集群 |

---

## 安装步骤

### 模式一：完整安装（推荐新环境）

#### 1. 下载安装脚本

```bash
curl -sfL https://get.kube-do.cn/kdo-install.sh -o kdo-install.sh
chmod +x kdo-install.sh
```

或从 GitHub Release 页面下载：https://github.com/kube-do/kdo/releases

#### 2. 执行安装脚本

```bash
# 基本用法（交互式）
sudo ./kdo-install.sh

# 非交互式（使用环境变量）
sudo ./kdo-install.sh \
  -e K8S_VERSION=v1.27.4 \
  -e POD_NETWORK=calico \
  -e KDO_VERSION=v1.2.0 \
  -e DOMAIN=kube-do.cn
```

#### 3. 安装过程自动化

脚本将依次执行：

1. **系统环境检查** - 验证操作系统、内存、磁盘、端口
2. **Docker/Containerd 安装** - 配置容器运行时
3. **Kubernetes 集群部署** - 使用 `kubeadm` 初始化 Master，加入 Worker
4. **网络插件安装** - 默认 Calico（支持 Flannel、Cilium）
5. **存储类配置** - 创建默认 `storageclass`（local-path-provisioner）
6. **Helm 安装** - 配置 Helm 3 和 Repo
7. **KDO 平台部署** - 通过 Helm 安装所有 KDO 组件（gateway、console、插件等）
8. **Keycloak 配置** - 设置 OIDC 认证服务
9. ** ingress 配置** - Nginx Ingress Controller（如需）
10. **验证安装** - 输出管理界面地址和初始账号

#### 4. 获取访问信息

安装完成后，脚本会输出：

```
✅ KDO 平台安装成功！

📱 控制台地址：https://kdo.kube-do.cn
🔑 初始管理员账号：admin@kube-do.cn
🔐 初始密码：kubedo123（请首次登录后修改）
📖 文档：https://docs.kube-do.cn
```

---

### 模式二：仅安装 KDO（已有集群）

#### 1. 确保集群就绪

```bash
# 检查节点状态
kubectl get nodes

# 检查核心组件
kubectl get pods -n kube-system
```

确保所有节点状态为 `Ready`，`kube-system` 下核心组件正常运行。

#### 2. 安装 Helm（如未安装）

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

#### 3. 添加 KDO Helm Repository

```bash
helm repo add kube-do https://charts.kube-do.cn
helm repo update
```

#### 4. 创建 KDO 命名空间

```bash
kubectl create namespace kdo-system
```

#### 5. 自定义 values.yaml（可选）

复制默认配置并修改：

```bash
helm show values kube-do/kdo > values.yaml

# 编辑 values.yaml，至少修改：
# - gateway.domain: 你的域名
# - keycloak.adminPassword: 设置密码
# - image.registry: 镜像仓库地址
```

#### 6. 安装 KDO

```bash
# 使用默认配置
helm install kdo kube-do/kdo -n kdo-system --wait

# 或使用自定义配置
helm install kdo kube-do/kdo -n kdo-system -f values.yaml --wait
```

#### 7. 等待 Pod 就绪

```bash
kubectl get pods -n kdo-system -w
```

所有 Pod 状态变为 `Running` 后即可访问。

---

## 安装验证

### 检查 KDO 组件

```bash
# 查看所有 KDO 相关 Pod
kubectl get pods -n kdo-system

# 查看 Services
kubectl get svc -n kdo-system

# 查看 Ingress（如配置了域名）
kubectl get ingress -n kdo-system
```

### 访问控制台

1. 获取 Gateway 地址：
   ```bash
   kubectl get svc -n kdo-system gateway
   ```
   查看 `EXTERNAL-IP` 或 `PORT`（NodePort 模式）

2. 在浏览器打开：`https://<gateway-address>`

3. 使用初始账号登录：
   - 邮箱：`admin@kube-do.cn`
   - 密码：`kubedo123`（首次登录需修改）

4. 登录后检查平台状态：
   - 集群连接是否正常
   - 节点是否显示
   - 可以创建测试应用

---

## 常见问题

### Q1: 安装脚本执行到某一步卡住或失败？

**检查日志：**
```bash
# 查看脚本输出的最后几行
sudo journalctl -u kdo-install -n 50
```

**常见原因：**
- 网络不通，无法下载镜像或包
- 主机名未解析，导致证书错误
- 端口被占用（如 80、443、6443）

**解决：**
- 确保服务器可以访问 `docker.io`、`k8s.gcr.io`、`ghcr.io`
- 配置 `/etc/hosts` 添加主机名解析
- 关闭占用端口的服务

### Q2: Pod 处于 `Pending` 或 `ContainerCreating`？

```bash
# 查看事件
kubectl describe pod <pod-name> -n kdo-system

# 常见原因：镜像拉取失败
# 解决方案：配置镜像仓库 Secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass \
  -n kdo-system
```

在 `values.yaml` 中指定：
```yaml
imagePullSecrets:
  - name: regcred
```

### Q3: 无法访问控制台（连接拒绝/超时）？

1. **检查 Service 类型**：
   ```bash
   kubectl get svc -n kdo-system gateway
   ```
   - 如果是 `ClusterIP`，需要通过端口转发：
     ```bash
     kubectl port-forward svc/gateway 8443:443 -n kdo-system
     ```
     访问 `https://localhost:8443`
   - 如果是 `NodePort`，查看 `NODE-PORT` 列，用 `<node-ip>:<node-port>` 访问
   - 如果是 `LoadBalancer`，等待云厂商分配 External IP

2. **检查 Ingress 配置**（如果使用域名）：
   ```bash
   kubectl get ingress -n kdo-system
   ```

3. **防火墙**：确保 443/8443 端口开放

### Q4: 登录失败（密码错误）？

初始密码在安装脚本输出中。如果丢失：

```bash
# 重置 Keycloak 管理员密码
kubectl exec -it deployment/keycloak -n kdo-system -- \
  /opt/keycloak/bin/kc.sh start --http-enabled=false --https-protected
```

或卸载重装（注意会丢失数据）。

### Q5: 存储类（StorageClass）缺失？

某些环境（如 baremetal）可能没有默认 StorageClass：

```bash
kubectl get storageclass
```

如果没有，安装 `local-path-provisioner`：

```bash
helm install local-path-provisioner \
  https://github.com/rancher/local-path-provisioner/releases/download/v0.0.28/local-path-provisioner-0.0.28.tgz
```

---

## 卸载

如需卸载 KDO 平台：

```bash
# Helm 安装的
helm uninstall kdo -n kdo-system

# 删除命名空间
kubectl delete namespace kdo-system
```

完整安装（包含 K8s）时，K8s 需要单独移除：
```bash
kubeadm reset
# 删除 CNI、kubelet 等（参考 kubeadm 文档）
```

---

## 下一步

安装成功后，建议：

1. 🎯 **完成初始配置**
   - 修改管理员密码
   - 配置邮箱、LDAP 等认证源（可选）
   - 设置集群标签和区域

2. 👥 **创建用户和团队**
   - 添加团队成员
   - 分配项目和环境权限

3. 🚀 **创建第一个应用**
   - 参考 [快速创建应用](/docs/dev/applications/repository/)
   - 或使用 [应用市场](/docs/dev/applications/helm/)

4. 📊 **配置可观测性**
   - 查看 [监控](/docs/observability/monitoring/) 配置
   - 设置告警规则

5. 🔒 **安全加固**
   - 阅读 [RBAC 权限管理](/docs/rbac/)
   - 配置网络策略

祝你使用愉快！如有问题请查阅文档或提交 [Issue](https://github.com/kube-do/kdo/issues)。
