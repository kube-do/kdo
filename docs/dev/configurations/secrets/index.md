---
title: 保密字典(Secret)
parent: 配置管理
nav_order: 2
---

## 介绍

**Secret** 用于存储和管理敏感信息，如数据库密码、API 密钥、TLS 证书等。与 ConfigMap 不同，Secret 提供 base64 编码（注意：非加密），并应配合 Kubernetes RBAC 和加密配置使用。

### 为什么用 Secret？

- ✅ **安全分离**：敏感数据不硬编码在 Dockerfile 或 YAML 中
- ✅ **细粒度权限**：通过 RBAC 控制哪些应用可以读取 Secret
- ✅ **动态更新**：Secret 更新后可选择是否重启 Pod 生效
- ✅ **多种使用方式**：环境变量、文件挂载、镜像拉取密钥

---

## 快速开始

### 创建 Secret

支持三种方式：

#### 方式 1：通过 UI 表单（推荐新手）

1. 进入 **开发者界面 → 配置管理 → 保密字典**
2. 点击 **新建 Secret**
3. 选择数据类型：
   - **键值对**：简单字段，如 `password=xxx`
   - **文件**：上传文件内容（如 TLS 证书）
4. 填写字段，点击 **添加**

#### 方式 2：通过 kubectl（命令行）

```bash
# 创建字面量 Secret
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password='S3cr3t!'

# 从文件创建 Secret（如 TLS）
kubectl create secret generic tls-secret \
  --from-file=tls.crt=/path/to/cert.crt \
  --from-file=tls.key=/path/to/key.key
```

#### 方式 3：通过 YAML（高级用户）

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
data:
  # base64 编码值
  username: YWRtaW4=
  password: UzNjcjN0IQ==
```

### 使用 Secret

Secret 有三种使用方式：

#### 作为环境变量

1. 在 Deployment 的容器配置中添加：
   ```yaml
   env:
     - name: DB_PASSWORD
       valueFrom:
         secretKeyRef:
           name: db-secret
           key: password
   ```
2. 在 KDO UI 的**环境变量**部分选择 **从 Secret 添加**

#### 作为文件挂载

1. 在 Deployment 的 `volumeMounts` 中挂载：
   ```yaml
   volumeMounts:
     - name: secrets
       mountPath: /etc/secrets
       readOnly: true
   volumes:
     - name: secrets
       secret:
         secretName: db-secret
   ```
2. KDO UI **存储** → **添加存储** → 选择 Secret

#### 作为镜像拉取密钥 (imagePullSecret)

创建类型为 `kubernetes.io/dockerconfigjson` 的 Secret：
```bash
kubectl create secret docker-registry regcred \
  --docker-server=harbor.example.com \
  --docker-username=admin \
  --docker-password='password'
```

在 ServiceAccount 或 Deployment 中引用：
```yaml
imagePullSecrets:
  - name: regcred
```

---

## 详细说明

### Secret 类型

KDO 支持多种 Secret 类型：

| 类型 | 用途 | 自动创建 |
|------|------|----------|
| `Opaque`（默认） | 通用键值对 Secret | ❌ |
| `kubernetes.io/service-account-token` | ServiceAccount Token | ✅（自动） |
| `kubernetes.io/tls` | TLS 证书（crt/key） | ✅（cert-manager） |
| `kubernetes.io/dockerconfigjson` | 镜像仓库认证 | ❌（需手动） |
| `kubernetes.io/basic-auth` | 基础认证（用户名/密码） | ❌ |
| `kubernetes.io/ssh-auth` | SSH 密钥 | ❌ |

### 数据编码

Secret 的 `data` 字段值必须是 **base64 编码**：

```bash
echo -n "my-password" | base64
# 输出：bXktcGFzc3dvcmQ=
```

KDO UI 会自动处理编码，无需手动操作。

---

## 常见操作

### 查看 Secret

1. 列表：**配置管理 → 保密字典**
2. 详情：点击 Secret 名称，查看：
   - 键值对内容（部分隐藏）
   - 使用的命名空间
   - 被哪些 Pod 引用

**命令行：**
```bash
kubectl get secrets -n <namespace>
kubectl describe secret <name> -n <namespace>
```

### 编辑 Secret

1. 进入 Secret 详情页
2. 点击 **编辑**
3. 修改键值或添加新字段
4. 保存

**注意：**
- 更新 Secret 后，已运行的 Pod **不会自动更新**环境变量
- 文件挂载的 Secret 会定期同步（默认 1 分钟）
- 如需应用立即生效，需重启 Pod

### 删除 Secret

1. 列表页勾选 Secret → **删除**
2. 或命令行：`kubectl delete secret <name> -n <namespace>`

**风险：** 正在使用该 Secret 的 Pod 可能因无法读取配置而启动失败。

### 恢复/导出 Secret

```bash
# 导出到 YAML
kubectl get secret my-secret -o yaml > my-secret.yaml

# 恢复
kubectl apply -f my-secret.yaml
```

建议将生产环境 Secret 备份到安全的位置（如加密的 Git 仓库或 Vault）。

---

## 最佳实践

### 安全性

- 🔒 **最小权限**：仅授予应用必要的 Secret 访问权限（通过 RoleBinding）
- 🔒 **定期轮转**：尤其是密码类 Secret，定期更换
- 🔒 **加密存储**：配置 Kubernetes EncryptionConfiguration，对 etcd 中的 Secret 加密
- 🔒 **外部 Secret 管理**：生产环境集成 HashiCorp Vault、AWS Secrets Manager 等
- 🔒 **避免明文**：不要在代码或文档中记录 Secret 值

### 运维管理

- 📝 **命名规范**：`<app>-<env>-<type>`，如 `mysql-prod-password`
- 📝 **版本控制**：将 Secret 定义（不含值）纳入 Git，实际值通过 CI/CD 注入
- 📝 **审计日志**：开启 Kubernetes Audit Log，记录 Secret 的访问和修改
- 📝 **Secret 大小**：单个 Secret 不超过 1MB（etcd 限制）
- 📝 **使用环境**：区分 dev/test/prod 的 Secret，避免混用

---

## 常见问题

### Q: Secret 和 ConfigMap 如何选择？

| 维度 | Secret | ConfigMap |
|------|--------|-----------|
| **用途** | 敏感信息（密码、密钥、令牌） | 非敏感配置（参数、配置文件） |
| **存储形式** | base64 编码（可配置加密） | 明文 |
| **RBAC** | 可单独配置访问权限 | 可单独配置访问权限 |
| **性能** | 无差别 | 无差别 |

**原则：** 任何敏感数据都应使用 Secret，即使是非敏感数据也不强制用 ConfigMap。

### Q: Secret 安全吗？

Base64 只是编码，不是加密。默认情况下 Secret 以明文存储在 etcd 中。安全性依赖：

1. **RBAC**：限制用户/应用对 Secret 的 `get`、`list` 权限
2. **网络传输**：API Server 通信使用 TLS
3. **静态加密**：配置 `EncryptionConfiguration` 对 etcd 加密（推荐）
4. **外部 Secret Store**：生产环境使用 Vault 等专业工具

### Q: 更新 Secret 后 Pod 没反应？

- **环境变量**：不会自动更新，需要重启 Pod
- **文件挂载**：Kubelet 默认每分钟检查更新，自动刷新文件
  - 如果应用不感知文件变化（如配置文件已加载到内存），需重启应用
- **解决方案**：
  - 使用 Reloader 工具监听 Secret 变更并自动重启 Pod
  - 应用设计支持热重载（如 Nginx `nginx -s reload`）

### Q: Secret 大小有限制吗？

- 单个 Secret 不超过 **1 MB**（etcd 限制）
- 一个命名空间所有 Secret 总和不超过集群 etcd 容量
- 对于大文件（如证书链），建议使用 Volume 挂载外部 Secret 或 ConfigMap

### Q: 如何查看 Secret 的值？

```bash
# 查看所有字段（base64 解码）
kubectl get secret my-secret -o jsonpath='{.data}'
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 --decode

# 以 YAML 输出
kubectl get secret my-secret -o yaml
```

**权限要求：** 用户必须有 `get` 权限，且能访问该 Secret 所在命名空间。

---

## 相关链接

- [Kubernetes Secret 官方文档](https://kubernetes.io/docs/concepts/configuration/secret/)
- [ConfigMap 使用指南](/dev/configurations/configmaps/)
- [Kubernetes Encryption at Rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)
- [HashiCorp Vault 集成](https://www.vaultproject.io/docs/platform/k8s)
