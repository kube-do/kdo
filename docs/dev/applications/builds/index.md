---
title: 镜像构建
parent: 应用管理
nav_order: 3
---

1. TOC
{:toc}

## 介绍

**镜像构建** 是一种从源代码自动构建容器镜像并部署到 Kubernetes 的应用创建方式。与标准应用（Pipelines as Code）相比，它提供了更轻量级的 CI/CD 流程，适合以下场景：

- ✅ 有源码但不需要复杂的多分支流水线
- ✅ 只需简单的构建（Dockerfile）和部署
- ✅ 快速原型验证
- ✅ 内部工具或临时服务

 differs from [手动镜像](/docs/dev/applications/add/) 的关键区别：

| 特性 | 镜像构建 | 手动镜像 |
|------|----------|----------|
| 源码管理 | ✅ 需提供 Git 仓库 | ❌ 无需源码 |
| 构建过程 | ✅ 自动执行 `docker build` | ❌ 使用预构建镜像 |
| 镜像推送 | ✅ 构建后自动推送到内置仓库 | ✅ 手动指定镜像地址 |
| CI/CD 集成 | ⚠️ 基本支持（每次构建可触发部署） | ❌ 无 |
| 适用阶段 | 开发、测试 | 生产、快速测试 |

---

## 创建镜像构建应用

### 前置条件

1. 源代码已上传到 Git 仓库（GitHub/GitLab/Gitee/Gitea）
2. 仓库根目录包含 `Dockerfile`
3. 可选：包含 `kubernetes/` 目录的部署清单（Deployment、Service 等）

### 操作步骤

1. 进入 **应用管理 → 应用**，点击 **新建应用**
2. 选择 **镜像构建** 类型
3. 填写基本信息：
   - **应用名称**：唯一标识，如 `myapp-build`
   - **Git 仓库地址**：代码源（支持 HTTPS/SSH）
   - **Git Token**：具有代码只读权限的 Token
   - **开发语言**：选择对应的构建模板（Java/Go/Python/Node.js 等）
   - **应用端口**：容器暴露的端口（用于 Service 生成）

4. 配置构建参数（高级选项）：
   - **Dockerfile 路径**：默认 `Dockerfile`，可指定子目录如 `docker/Dockerfile`
   - **构建上下文**：默认 `.`（Dockerfile 所在目录）
   - **基础镜像仓库**：如果使用私有基础镜像，配置认证 secret
   - **构建参数**：`--build-arg KEY=VALUE` 形式，每行一个

5. 配置部署参数：
   - **命名空间**：部署到哪个 K8s 命名空间（需存在且有权限）
   - **副本数**：初始 Pod 副本数量
   - **资源限制**：CPU/Memory 请求和限制（可选）
   - **环境变量**：注入到容器的环境变量，格式 `KEY=VALUE`

6. 点击 **添加**，平台开始：
   - 克隆代码仓库
   - 执行 `docker build` 生成镜像
   - 推送镜像到内置 Harbor 仓库
   - 应用 `kubernetes/` 中的资源配置到集群

---

## 生成的资源

应用创建后，会在指定命名空间中创建以下 Kubernetes 对象：

```yaml
# Deployment (由应用配置生成)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-build
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp-build
  template:
    metadata:
      labels:
        app: myapp-build
    spec:
      containers:
        - name: myapp-build
          image: hub-k8s.kube-do.cn/<namespace>/myapp-build:<tag>
          ports:
            - containerPort: 8080
          env:
            - name: ENV_MODE
              value: "production"
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"

# Service (自动生成，暴露端口)
apiVersion: v1
kind: Service
metadata:
  name: myapp-build
spec:
  selector:
    app: myapp-build
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```

---

## Dockerfile 要求

KDO 平台对 Dockerfile 的要求：

1. **基础镜像**：建议使用公共镜像（Alpine、Ubuntu、OpenJDK 等），私有镜像需提前配置拉取 secret
2. **端口暴露**：必须使用 `EXPOSE <port>`，端口号需与应用配置的"应用端口"一致
3. **启动命令**：使用 `CMD` 或 `ENTRYPOINT` 指定容器启动命令，确保前台运行
4. **工作目录**：建议使用 `WORKDIR /app` 统一路径
5. **多阶段构建**：支持，确保最终阶段包含运行所需的所有文件

### 示例 Dockerfile（Java Spring Boot）

```dockerfile
# 构建阶段
FROM maven:3.8-openjdk-11 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# 运行阶段
FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 示例 Dockerfile（Go）

```dockerfile
FROM golang:1.20-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=build /app/main .
EXPOSE 8080
CMD ["./main"]
```

---

## 构建日志与调试

构建过程在 KDO 平台的 **流水线运行** 页面可以看到详细日志：

1. 进入应用详情 → **流水线运行**
2. 找到最新的运行记录（状态为 `Running` 或 `Failed`）
3. 点击查看 **日志**，按任务查看输出

常见构建失败原因：

| 错误信息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `cloning repository failed` | Git Token 无效/仓库不存在 | 检查 Token 权限、仓库地址 |
| `Dockerfile not found` | 路径错误 | 确认 Dockerfile 路径配置正确 |
| `expose port conflict` | EXPOSE 端口与应用配置不一致 | 修改 Dockerfile 或应用配置 |
| `image push failed` | 镜像仓库认证失败 | 配置正确的 registry secret |
| `build timeout` | 构建时间过长（默认 30 分钟） | 优化 Dockerfile（多阶段、缓存） |

---

## 与 Pipelines as Code 的对比

| 维度 | 镜像构建 | Pipelines as Code (标准应用) |
|------|----------|---------------------------|
| 配置复杂度 | ⭐⭐ (简单) | ⭐⭐⭐⭐ (较复杂) |
| 灵活性 | ⭐⭐⭐ (有限) | ⭐⭐⭐⭐⭐ (高度灵活) |
| 多分支支持 | ⚠️ 有限（需手动配置） | ✅ 自动支持 |
| 自定义阶段 | ❌ 不支持 | ✅ 支持（编辑 Pipeline） |
| 适用场景 | MVP、快速验证 | 生产级 CI/CD |

**建议**：对于长期维护的生产应用，优先使用 [标准应用](/docs/dev/applications/repository/) 方式，以获得完整的流水线控制能力。

---

## 管理镜像构建应用

创建完成后，你可以：

- **查看构建状态**：在 **流水线运行** 页面查看历史构建记录
- **手动触发构建**：在分支流水线中点击"运行"
- **更新配置**：修改应用端口、资源限制、环境变量
- **回滚**：选择历史流水线运行记录进行回滚
- **删除应用**：清理 Deployment、Service 及关联资源

详细操作请参考：

- [分支流水线管理](/docs/dev/applications/pipelines/#编辑嵌入流水线)
- [流水线运行管理](/docs/dev/applications/repository/#管理流水线运行)

---

## 最佳实践

1. ✅ **使用 .dockerignore**：排除构建上下文中的无关文件（`.git`、`node_modules`、日志等），加速构建
2. ✅ **利用构建缓存**：将不经常变动的指令（`COPY requirements.txt`、`go mod download`）放在 Dockerfile 前面
3. ✅ **多阶段构建**：减小最终镜像体积，提升安全性
4. ✅ **镜像标签策略**：建议使用 `分支名-提交哈希` 或 `语义化版本`，避免过度使用 `latest`
5. ✅ **资源限制**：为容器设置合理的 CPU/Memory 请求和限制，避免资源争抢
6. ✅ **健康检查**：在 `kubernetes/` 目录的配置中添加 `livenessProbe` 和 `readinessProbe`

---

## 常见问题

### Q: 镜像构建失败后如何重试？

在 **流水线运行** 页面找到失败的运行记录，点击"重新运行"即可。如果问题出在代码层面，先修复 Git 仓库后重新触发。

### Q: 如何更新应用的 Dockerfile？

直接修改 Git 仓库中的 Dockerfile，推送后平台会检测到变更并自动触发新的构建（如果已启用自动触发）。

### Q: 可以同时使用多个 Dockerfile 吗？

可以。在创建应用时指定一个路径。如果需要多架构镜像（amd64/arm64），建议使用 Buildx 并在 Dockerfile 中配置 `--platform`。

### Q: 构建的镜像存储在哪里？

镜像推送到 KDO 平台内置的 **Harbor 仓库**，地址通常为 `hub-k8s.kube-do.cn/<namespace>/<app-name>:<tag>`。该仓库支持拉取/推送认证。

### Q: 镜像构建和标准应用有什么区别？

主要区别在于 **流水线配置**：
- 镜像构建：使用平台预定义的"嵌入流水线"，基于模板自动生成，不可完全自定义
- 标准应用：基于 Pipelines as Code，`.tekton/` 目录中的 YAML 完全由你控制

如需更高级的 CI/CD 流程（如单元测试、集成测试、灰度发布），请使用标准应用。

---

## 下一步

- 探索 [Helm 应用](/docs/dev/applications/helm/) 部署复杂组件
- 学习 [流水线自定义](/docs/dev/applications/pipelines/)
- 掌握 [工作负载操作](/docs/dev/workloads/)
- 配置 [监控告警](/docs/observability/)
