---
title: 手动镜像应用
parent: 应用管理
nav_order: 5
---

1. TOC
{:toc}

## 介绍

**手动镜像应用**（Manual Image）适用于以下场景：

- ✅ 已有现成的容器镜像（Docker Image），无需从源码构建
- ✅ 使用的是公共镜像（如 Nginx、Redis、MySQL）或私有镜像仓库的镜像
- ✅ 快速部署测试环境或临时服务
- ✅ 迁移现有应用到 KDO 平台

与[镜像构建](/docs/dev/applications/builds/)不同，手动镜像直接使用预构建的镜像，省去 CI 流程，部署更快速。

---

## 前置条件

1. **镜像可用**
   - 镜像已存在于某个容器仓库（Docker Hub、Harbor、私有 Registry）
   - 镜像地址格式：`registry.example.com/namespace/image:tag`

2. **镜像仓库访问权限**（如使用私有仓库）
   - 预先在 KDO 平台配置镜像拉取 Secret（ImagePullSecret）
   - 或使用公开镜像无需认证

3. **端口暴露**
   - 镜像的 `Dockerfile` 必须使用 `EXPOSE` 声明端口
   - 你知道应用实际监听的是哪个端口（如 80、3306、6379）

4. **Kubernetes 命名空间**
   - 目标命名空间已存在且有部署权限

---

## 操作步骤

1. **进入应用管理**
   - 在 KDO 控制台左侧菜单选择 **应用管理 → 应用**
   - 点击右上角 **新建应用** 按钮

2. **选择类型**
   - 在应用创建向导中选择 **手动镜像**（或"容器镜像"）

3. **填写基本信息**

   | 字段 | 说明 | 示例 |
   |------|------|------|
   | 应用名称 | 唯一标识，英文小写，支持连字符 | `my-nginx` |
   | 镜像地址 | 完整镜像地址（含 registry、命名空间、标签） | `nginx:alpine` 或 `hub.kube-do.cn/library/nginx:1.25` |
   | 应用端口 | 容器监听的端口（需与 EXPOSE 一致） | `80` |
   | 副本数 | 初始 Pod 数量 | `2` |

4. **配置高级选项（可选）**

   - **镜像拉取策略**：`Always` / `IfNotPresent` / `Never`
     - 生产环境建议 `IfNotPresent` 避免每次拉取
   - **命令与参数**：覆盖 Dockerfile 中的 `CMD` 或 `ENTRYPOINT`
   - **环境变量**：注入容器配置，格式 `KEY=VALUE`，每行一个
   - **资源限制**：设置 CPU/Memory 的 Request 和 Limit
   - **数据持久化**：挂载 ConfigMap、Secret 或 PersistentVolumeClaim
   - **健康检查**：Liveness/Readiness Probe 配置

5. **部署配置**

   - **命名空间**：选择目标命名空间（如 `default`、`production`）
   - **节点选择**（可选）：指定调度到特定节点或节点组
   - **容忍与亲和性**：配置污点容忍和节点亲和性规则

6. **完成创建**
   - 点击 **添加** 按钮
   - 平台将直接创建 Deployment 和 Service（Ingress 可选）
   - 创建成功后可在应用列表看到状态

---

## 生成的 Kubernetes 资源

创建后，KDO 会在指定命名空间生成：

```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-nginx
  template:
    metadata:
      labels:
        app: my-nginx
    spec:
      containers:
        - name: my-nginx
          image: nginx:alpine
          ports:
            - containerPort: 80
          env:
            - name: NGINX_ENV
              value: "production"
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"

# Service (ClusterIP)
apiVersion: v1
kind: Service
metadata:
  name: my-nginx
spec:
  selector:
    app: my-nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

如需外部访问，可额外创建 Ingress 或 LoadBalancer Service。

---

## 参数详解

### 镜像地址

支持的格式：

| 格式 | 说明 | 示例 |
|------|------|------|
| `image:tag` | Docker Hub 官方镜像（自动加 `library/` 前缀） | `nginx:alpine` |
| `namespace/image:tag` | Docker Hub 用户镜像 | `myuser/myapp:v1.0` |
| `registry/namespace/image:tag` | 私有仓库完整地址 | `hub.kube-do.cn/dev/myapp:latest` |

**注意：**
- 如果不指定 `tag`，默认使用 `latest`
- 私有仓库需提前配置 [镜像仓库配置](/docs/admin/container-registry/) 和 Secret

### 镜像拉取策略

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| `Always` | 每次启动都拉取最新镜像 | 开发测试、频繁更新 |
| `IfNotPresent` | 本地有缓存则使用，没有则拉取 | 生产环境（默认推荐） |
| `Never` | 仅使用本地镜像，禁止拉取 | 离线环境、镜像已预置 |

### 资源限制

建议始终设置资源限制以避免资源争抢：

- **CPU Request**：容器保证获得的最小 CPU 核数（如 `500m` = 0.5 核）
- **CPU Limit**：容器能使用的最大 CPU（如 `2000m` = 2 核）
- **Memory Request**：保证的最小内存（如 `256Mi`）
- **Memory Limit**：最大内存，超过可能被 OOM Kill

### 健康检查

如果镜像自带健康端点，建议配置：

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 与镜像构建的对比

| 维度 | 手动镜像 | 镜像构建 |
|------|----------|----------|
| 源码需求 | ❌ 不需要 | ✅ 需要 Git 仓库 |
| Dockerfile | ❌ 不需要 | ✅ 需要 |
| 构建时间 | ⚡ 即时部署 | ⏳ 需要几分钟到几十分钟 |
| 镜像来源 | 预构建镜像 | 平台自动构建并推送到 Harbor |
| 自动化程度 | 手动触发 | 支持代码变更自动触发构建 |
| 适用场景 | 验证、临时、迁移 | 持续交付、自动化 CI/CD |

**何时用手动镜像？**
- 快速验证一个镜像是否能在集群运行
- 部署成熟应用，无需每次构建
- 使用第三方镜像（Redis、MySQL 等）

**何时用镜像构建？**
- 有源码需要频繁迭代
- 希望自动化 CI/CD 流程
- 需要代码到镜像的完整可追溯性

---

## 最佳实践

1. ✅ **使用语义化版本标签**：避免 `latest`，使用 `v1.2.3` 或 `commit-hash`
2. ✅ **镜像仓库就近**：将私有仓库部署在集群同地域，加速拉取
3. ✅ **设置资源限制**：防止单个应用耗尽集群资源
4. ✅ **配置健康检查**：确保应用启动后才能接收流量
5. ✅ **使用 ConfigMap/Secret 管理配置**：避免镜像内硬编码配置
6. ✅ **限制副本数**：测试环境设低副本（1-2），生产按需扩缩
7. ✅ **命名规范**：应用名使用小写字母、连字符（`my-app`），避免大写和下划线

---

## 常见问题

### Q: 创建后 Pod 处于 `ImagePullBackOff` 状态？

**原因：**
- 镜像地址错误
- 私有仓库未配置 Secret
- 网络不通，无法访问镜像仓库

**解决：**
```bash
# 查看事件
kubectl describe pod <pod-name> -n <namespace>

# 检查 Secret
kubectl get secret <imagepullsecret> -n <namespace>
```

### Q: 如何更新镜像版本？

1. 进入应用详情页
2. 点击 **编辑** 或 **更新镜像**
3. 修改镜像地址（如 `myapp:v1.1` → `myapp:v1.2`）
4. 保存后触发滚动更新

### Q: 端口不匹配怎么办？

确保：
- 镜像 `Dockerfile` 使用 `EXPOSE <port>` 声明
- 应用配置的"应用端口"与 `EXPOSE` 一致
- 应用实际监听的端口正确（不是映射的主机端口）

### Q: 如何为应用添加 Ingress？

手动镜像应用创建后默认只有 Service。如需 HTTP 访问：

1. 在 **网络管理** 或应用 **更多操作** 中选择 **创建 Ingress**
2. 填写域名、路径、TLS 配置
3. 或直接使用 kubectl 创建 Ingress 资源

### Q: 可以绑定多个容器吗？

当前单个应用默认创建一个主容器。如需多容器：
- 编辑 Deployment，手动添加 sidecar 容器
- 或使用[Helm 应用](/docs/dev/applications/helm/)方式，提供多容器 chart

---

## 下一步

- 学习 [Helm 应用部署](/docs/dev/applications/helm/) - 管理复杂多组件应用
- 了解 [工作负载操作](/docs/dev/workload-actions/) - 启动、停止、扩缩容
- 配置 [监控告警](/docs/observability/monitoring/) - 保障应用稳定性
