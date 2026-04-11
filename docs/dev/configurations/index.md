---
title: 配置管理
parent: 开发者界面
nav_order: 4
---

## 介绍

Kubernetes 提供了两种核心的配置资源：**ConfigMap** 和 **Secret**，用于将应用配置与镜像解耦。KDO 平台提供了友好的界面来管理这些配置，开发者可以轻松创建、编辑和应用配置到工作负载中。

### 配置类型对比

| 特性 | ConfigMap | Secret |
|------|-----------|--------|
| **用途** | 存储非敏感配置数据（如配置文件、命令行参数） | 存储敏感信息（密码、令牌、密钥） |
| **存储形式** | Key-Value 对或配置文件 | Base64 编码的 Key-Value（注意：非加密，仅编码） |
| **大小限制** | 1 MB（etcd 限制） | 1 MB |
| **安全性** | 对所有有权限的用户可见 | 可配置 RBAC，建议加密存储 (SealedSecret) |
| **使用方式** | 环境变量、文件挂载、命令行参数 | 环境变量、文件挂载 |

---

## 快速开始

### 创建 ConfigMap

1. 进入 **开发者界面 → 配置管理**
2. 点击 **新建 ConfigMap**
3. 填写：
   - **名称**：`app-config`
   - **数据类型**：Key-Value 或配置文件
   - **内容**：
     ```
     key1=value1
     key2=value2
     ```
4. 点击 **添加**

### 使用 ConfigMap

创建 Deployment 时，在 **配置** 部分添加：

- **环境变量**：选择 ConfigMap 和对应的 Key，注入为容器环境变量
- **文件挂载**：选择 ConfigMap 和 Key，挂载到容器指定路径

示例（环境变量）：
```yaml
env:
  - name: APP_ENV
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: environment
```

示例（文件挂载）：
```yaml
volumeMounts:
  - name: config
    mountPath: /etc/app
    readOnly: true
volumes:
  - name: config
    configMap:
      name: app-config
```

---

## Secret 使用指南

### 创建 Secret

```bash
# 通过 kubectl 创建
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password='S3cr3t!'

# 或使用 KDO 控制台图形界面
```

**注意：**
- Secret 值会自动 base64 编码，但**不是加密**的
- 强烈建议启用 Kubernetes 的加密配置（Encryption at Rest）
- 或使用第三方工具如 [SealedSecret](https://github.com/bitnami-labs/sealed-secrets)

### 使用 Secret 到 Deployment

- **环境变量**：
  ```yaml
  env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
  ```
- **文件挂载**：
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

---

## 高级话题

### ConfigMap 热更新

当 ConfigMap 内容更新后：

- **环境变量**：不会自动更新，需要重启 Pod 才能生效
- **文件挂载**：Kubelet 会定期检查（默认 1 分钟），自动更新挂载的文件内容（具体行为取决于容器运行时）

**最佳实践：**
- 配置文件通过文件挂载方式使用，便于热更新
- 敏感配置仍使用 Secret + 滚动更新

### 多环境配置管理

建议策略：

1. **按环境隔离 Namespace**：`dev`、`test`、`prod`
2. **每个环境创建独立的 ConfigMap/Secret**（同名不同内容）
3. 使用 `kustomize` 或 `helm` 管理差异
4. 或使用 KDO 的**环境变量覆盖**功能

### 配置大小限制

- ConfigMap 和 Secret 大小总和不能超过 1 MB（etcd 限制）
- 大配置文件考虑：
  - 拆分多个 ConfigMap
  - 使用外部配置中心（如 Consul、Apollo）
  - 使用 GitOps 管理 ConfigMap 清单

---

## 常见问题

### Q: ConfigMap 和 Environment Variables 的区别？

环境变量（Environment Variables）是直接写在 Deployment YAML 中的静态值；ConfigMap 是独立资源，可以被多个应用共享和动态更新。

**选择建议：**
- 不同应用共享的配置 → ConfigMap
- 应用私有且不常变动的配置 → 环境变量
- 需要动态更新的配置 → ConfigMap + 文件挂载

### Q: Secret 安全吗？

Base64 编码是可逆的，**不是加密**。任何有权限 `get` Secret 的用户都能看到原文。安全措施：

1. **RBAC**：限制 Secret 的访问权限
2. **加密存储**：配置 `EncryptionConfiguration` 对 etcd 加密
3. **Secret 轮转**：定期更换敏感值
4. **外部 Secret 管理**：使用 Vault、AWS Secrets Manager 等

### Q: ConfigMap 更新后应用没反应？

- 如果是环境变量引用，需要重启 Pod
- 如果是文件挂载，检查容器是否支持 `inotify` 事件通知
- 确认挂载的文件路径和文件名正确

### Q: 如何备份 ConfigMap/Secret？

```bash
# 导出所有
kubectl get configmaps,secrets --all-namespaces -o yaml > config-backup.yaml

# 恢复
kubectl apply -f config-backup.yaml
```

建议结合 GitOps 将配置清单存储到 Git 仓库，实现版本化管理。

---

## 操作示例

### 批量更新 Secret 密码

```bash
kubectl create secret generic db-secret \
  --from-literal=password='NewPass123' \
  -o yaml --dry-run=client | kubectl apply -f -
```

触发相关 Deployment 滚动更新：
```bash
kubectl rollout restart deployment/myapp
```

### 查看 ConfigMap 内容

```bash
# 查看所有字段
kubectl get configmap app-config -o yaml

# 查看特定 key
kubectl get configmap app-config -o jsonpath='{.data.key1}'
```

---

## 相关链接

- [Kubernetes ConfigMap 官方文档](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Kubernetes Secret 官方文档](https://kubernetes.io/docs/concepts/configuration/secret/)
- [工作负载操作](/workload-actions/) - 如何将配置应用到应用
- [存储管理](/dev/network-stroage/) - 持久化配置存储
