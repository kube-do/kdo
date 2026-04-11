---
title: 网络与存储
parent: 开发者界面
nav_order: 5
---

## 介绍

在 KDO 平台，**网络**和**存储**是应用部署的两个核心基础设施。开发者界面集成了这两类资源的可视化管理能力，让你无需编写复杂的 YAML 即可配置服务的网络访问和持久化数据存储。

### 主要功能

| 功能类别 | 描述 | 入口 |
|----------|------|------|
| **服务 (Services)** | 定义 Pod 的访问入口，提供集群内服务发现和负载均衡 | [服务](/dev/network-stroage/services/) |
| **路由 (Ingresses)** | 配置外部访问规则，将 HTTP/HTTPS 请求路由到集群内服务 | [路由](/dev/network-stroage/ingresses/) |
| **持久卷声明 (PVC)** | 申请持久化存储空间，用于数据库、文件等需要保存的数据 | [持久卷声明](/dev/network-stroage/persistent-volume-claims/) |

---

## 快速开始

### 暴露应用端口（创建 Service）

1. 进入 **开发者界面 → 网络存储**
2. 点击 **新建服务**
3. 选择：
   - **名称**：`myapp-svc`
   - **选择器**：`app=myapp`（匹配 Deployment 的标签）
   - **端口**：`80:8080`（外部端口:容器端口）
4. 点击 **添加**

### 配置外部访问（创建 Ingress）

1. 在 **网络存储** 页面选择 **路由**
2. 点击 **新建路由**
3. 填写：
   - **主机名**：`myapp.example.com`
   - **路径**：`/`（或 `/api`）
   - **目标服务**：`myapp-svc`
   - **端口**：`80`
4. 点击 **添加**

### 添加持久化存储（创建 PVC）

1. 在 **网络存储** 页面选择 **持久卷声明**
2. 点击 **添加存储**
3. 配置：
   - **名称**：`myapp-data`
   - **存储类型**：`NFS`（默认）或其他可用 StorageClass
   - **访问模式**：`ReadWriteOnce`
   - **大小**：`10Gi`
4. 点击 **确定**

---

## 功能说明

### 服务 (Service)

Service 为 Pod 提供稳定的网络端点：

- **ClusterIP**（默认）：集群内访问，虚拟 IP
- **NodePort**：在每个节点上开放端口，外部可通过 `节点IP:端口` 访问
- **LoadBalancer**：云平台自动创建外部负载均衡器
- **ExternalName**：将服务映射到外部 DNS 名称

**常用场景：**
- 后端微服务间通信 → ClusterIP
- 临时外部访问 → NodePort
- 生产环境外部访问 → LoadBalancer（需云平台支持）

### 路由 (Ingress)

Ingress 管理 HTTP/HTTPS 流量的路由规则：

- **主机名路由**：基于域名将请求分发到不同后端服务
- **路径路由**：基于 URL 路径分发（如 `/api` → api 服务，`/static` → 前端）
- **TLS 终止**：配置 HTTPS，支持自动证书管理（cert-manager）
- **负载均衡**：Ingress Controller（如 Nginx、Traefik）实现

**典型配置：**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
spec:
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp-svc
            port:
              number: 80
```

### 持久卷声明 (PVC)

PVC 申请持久化存储，数据独立于 Pod 生命周期：

- **动态供应**：通过 StorageClass 自动创建 PV
- **存储类型**：NFS（默认）、CephFS、Local、云存储等
- **访问模式**：
  - `ReadWriteOnce`：单节点读写（最常见）
  - `ReadOnlyMany`：多节点只读
  - `ReadWriteMany`：多节点读写（NFS 支持）
- **扩容**：支持在线扩展（需 StorageClass 允许）

**生命周期：**
1. 创建 PVC → 系统自动绑定 PV
2. 将 PVC 挂载到 Pod 的 `volumeMounts`
3. Pod 删除后，PVC 和数据**仍然保留**
4. 可重复绑定到新 Pod

---

## 最佳实践

### 网络

- ✅ **服务命名**：使用有意义的名称，符合 DNS 标签规范（小写字母、数字、连字符）
- ✅ **标签选择器**：确保 Service 的 selector 与 Pod 的 labels 匹配
- ✅ **外部访问**：生产环境使用 LoadBalancer 或 Ingress，避免直接用 NodePort
- ✅ **Ingress 注解**：根据 Ingress Controller 类型添加合适的注解（如重写规则、超时等）

### 存储

- ✅ **存储类选择**：了解不同 StorageClass 的性能、成本和 SLA
- ✅ **大小合理**：申请足够空间但避免浪费，考虑后续扩容能力
- ✅ **备份策略**：重要数据配置定期快照或外部备份
- ✅ **权限控制**：限制 PVC 的访问权限，避免跨命名空间滥用

---

## 常见问题

### Q: Service 无法访问 Pod？

- 检查 Pod 的 labels 是否匹配 Service 的 selector
- 确认 Pod 处于 `Running` 状态
- 检查 Pod 容器端口是否与 Service targetPort 一致
- 使用 `kubectl describe service <name>` 查看 endpoints

### Q: Ingress 不生效？

- 确认 Ingress Controller 已安装并运行（如 `nginx-ingress-controller`）
- 检查 Ingress 资源是否有 `address` 字段（表示已分配外部 IP）
- 确认 DNS 解析指向 Ingress 的 IP/LB 地址
- 查看 Ingress Controller 的日志

### Q: PVC 一直处于 `Pending` 状态？

- 没有可用的 StorageClass 或 PV
- 请求的存储大小超过管理员设置的上限
- 访问模式与可用 PV 不匹配
- 资源配额不足（检查 ResourceQuota）

### Q: 如何删除 PVC 及其数据？

- 先确保 PVC 未被任何 Pod 挂载
- 删除 PVC 后，PV 的回收策略决定数据如何处理：
  - `Delete`：自动删除底层存储
  - `Retain`：PV 和数据保留，需手动清理

---

## 相关链接

- [存储概念详解](/storage/) - 深入了解 PV、PVC、StorageClass
- [网络策略（管理员）](/admin/networking/networkpolicies/) - Pod 间访问控制
- [Kubernetes Service 官方文档](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes Ingress 官方文档](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Kubernetes 存储官方文档](https://kubernetes.io/docs/concepts/storage/)
