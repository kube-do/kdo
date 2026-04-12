---
title: 添加存储
parent: 工作负载操作
---

## 介绍

为工作负载（Deployment、StatefulSet 等）挂载持久化存储，使应用数据在 Pod 重启或迁移后不丢失。KDO 支持从现有 PVC 或新建 PVC 两种方式添加存储。

---

## 快速开始

### 使用现有 PVC

1. 进入目标工作负载（如 Deployment）详情页
2. 点击 **存储** Tab → **添加存储**
3. 选择：
   - **使用现有持久卷声明**：从下拉列表选择 PVC
   - **挂载路径**：容器内路径，如 `/data`
   - **读写模式**：`ReadWriteOnce`（默认）或 `ReadOnlyMany`
4. 点击 **确定**

### 创建新 PVC 并挂载

1. 在 **添加存储** 弹窗中，选择 **创建新的持久卷声明**
2. 填写 PVC 配置：
   - **名称**：自动生成（可修改）
   - **存储类型**：选择 StorageClass（如 `nfs-client`）
   - **访问模式**：`ReadWriteOnce` / `ReadOnlyMany` / `ReadWriteMany`
   - **大小**：如 `10Gi`
3. 点击 **创建并挂载**

---

## 详细说明

### 挂载原理

KDO 在后台生成类似以下的 Kubernetes 配置：

```yaml
spec:
  containers:
  - name: myapp
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: myapp-data-pvc  # 引用的 PVC
```

### 多容器挂载

如果 Pod 有多个容器，可以为每个容器单独选择是否挂载该 PVC，以及挂载路径。

### 子路径挂载

当只需要挂载 PVC 中的某个子目录时，可以在**挂载路径**下方设置 **子路径**：

- **挂载路径**：`/data`
- **子路径**：`logs`（实际挂载的是 PVC 的 `/data/logs`）

适用于：

- 一个 PVC 被多个容器以不同路径挂载
- 避免容器内目录冲突

---

## 存储类选择

| StorageClass | 适合场景 | 性能 | 成本 |
|--------------|----------|------|------|
| `nfs-client`（默认） | 开发、测试 | 中 | 低 |
| `csi-hostpath` | 单节点高性能 | 高 | 低（本地磁盘）|
| `managed-csi`（云） | 生产高可用 | 高 | 高 |

如果不确定，联系管理员获取 StorageClass 列表和说明。

---

## 最佳实践

### 存储设计

- 🎯 **按需申请**：不要过度申请存储，避免资源浪费
- 🎯 **预留缓冲**：预计未来 6-12 个月的增长，预留 30% 空间
- 🎯 **访问模式匹配**：多副本同时写需 `RWX`，确认 StorageClass 支持
- 🎯 **命名清晰**：PVC 命名体现用途，如 `mysql-data`、`app-logs`

### 数据安全

- 🔒 **备份策略**：重要数据配置定期快照或应用层备份
- 🔒 **敏感数据**：不要用 PVC 存敏感信息（如密钥），用 Secret
- 🔒 **权限隔离**：PVC 仅限本命名空间访问，避免跨项目

### 运维建议

- 📊 **监控使用率**：PVC 使用率 >80% 时告警
- 📊 **及时清理**：应用删除时同时删除 PVC（避免残留）
- 📊 **版本控制**：PVC 定义纳入 GitOps
- 📊 **测试扩容**：生产前在不同环境测试存储扩容流程

---

## 常见问题

### Q: 添加存储后 Pod 无法启动？

- 检查 PVC 是否处于 `Bound` 状态
- 检查 PVC 的 `accessModes` 是否与 Pod 挂载要求冲突
- 查看 Pod 事件：`kubectl describe pod <name>`，看是否有 Volume 相关错误

### Q: 如何扩容 PVC？

1. 进入 PVC 详情页（或在存储管理页面）
2. 点击 **编辑**
3. 修改 **大小**（如 `10Gi` → `20Gi`）
4. 保存

**注意：** Pod 内部的 filesystem 需要手动扩容（如 `resize2fs`），KDO 暂不自动处理。

### Q: 删除工作负载会删除 PVC 吗？

**默认不会。** 删除 Deployment/StatefulSet 仅删除 Pod，PVC 保留。

如需同时删除 PVC，需要在删除工作负载后**手动删除 PVC**，或使用**级联删除**选项（如果 UI 提供）。

### Q: 一个 Pod 可以挂载多个 PVC 吗？

可以。在存储配置中多次添加存储即可，每个挂载点使用不同的 `volumeMounts`。

### Q: PVC 状态为 `Lost` 怎么办？

PV 状态 `Lost` 表示底层存储不可用（如 NFS 服务器宕机）。需要管理员介入：

- 检查存储后端健康
- 尝试恢复 PV 或手动删除

---

## 相关链接

- [Kubernetes Volumes 官方文档](https://kubernetes.io/docs/concepts/storage/volumes/)
- [Kubernetes PVC 官方文档](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Kubernetes StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [开发者网络存储首页](/dev/network-stroage/)
