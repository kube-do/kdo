---
title: 持久卷声明(PVC)
parent: 网络与存储
nav_order: 3
---

## 介绍

**持久卷声明（PersistentVolumeClaim, PVC）** 是开发者申请持久化存储的核心资源。它允许你声明对存储空间的需求（大小、访问模式），而无需关心底层存储的具体实现。Kubernetes 会自动匹配可用的 PersistentVolume（PV）或动态创建。

### 为什么需要 PVC？

- **数据持久化**：容器删除后数据不丢失
- **应用状态保存**：数据库、文件存储
- **多 Pod 共享**：多个 Pod 挂载同一 PVC 读取相同数据
- **存储抽象**：无需了解底层是 NFS、Ceph 还是云硬盘

---

## 快速开始

### 创建 PVC

1. 进入 **开发者界面 → 网络存储 → 持久卷声明**
2. 点击 **添加存储**
3. 填写表单：

| 字段 | 说明 | 示例 |
|------|------|------|
| **名称** | PVC 标识，后续挂载时使用 | `myapp-data` |
| **存储类型** | 选择 StorageClass（默认 NFS） | `nfs-client` |
| **访问模式** | ReadWriteOnce / ReadOnlyMany / ReadWriteMany | `ReadWriteOnce` |
| **大小** | 存储容量 | `10Gi` |

4. 点击 **确定**

### 将 PVC 挂载到 Pod/Deployment

在创建应用或编辑工作负载时：

1. 进入 **存储** 配置部分
2. 点击 **添加存储**
3. 选择：
   - **使用现有 PVC**：从下拉列表选择刚创建的 `myapp-data`
   - **挂载路径**：容器内路径，如 `/data`
   - **读写模式**：默认 `ReadWriteOnce`
4. 保存后，Kubernetes 自动将 PVC 挂载到容器

---

## 详细说明

### 1. 存储类 (StorageClass)

PVC 必须指定 StorageClass，它决定了存储的提供方式：

| StorageClass | 描述 | 适用场景 |
|--------------|------|----------|
| `nfs-client`（默认） | KDO 内置 NFS 存储 | 开发、测试环境，成本低 |
| `csi-hostpath` | 节点本地存储 | 单节点测试，性能高但无高可用 |
| `managed-csi`（云） | 云平台托管存储（AWS EBS、阿里云 ESSD） | 生产环境，高可用 |

查看可用 StorageClass：
```bash
kubectl get storageclass
```

### 2. 访问模式

| 模式 | 说明 | 支持场景 |
|------|------|----------|
| **ReadWriteOnce (RWO)** | 单个节点读写 | 大多数单副本应用（MySQL、Redis 单节点） |
| **ReadOnlyMany (ROX)** | 多节点只读 | 配置文件、静态资源 |
| **ReadWriteMany (RWX)** | 多节点读写 | 多个副本同时读写（如共享日志） |

**注意：**
- NFS 支持 RWX，其他存储可能只支持 RWO
- 如果应用需要多副本同时写，必须选择支持 RWX 的 StorageClass

### 3. PVC 生命周期

```
创建 PVC → 绑定 PV → 挂载到 Pod → Pod 删除 PVC 保留 → 删除 PVC → PV 回收
```

**重要特性：**
- PVC 独立于 Pod 生命周期
- 即使 Pod 删除，PVC 和数据仍然存在
- 可以重新绑定到新 Pod
- 删除 PVC 后，PV 根据 `reclaimPolicy` 决定数据是否保留

---

## 常见操作

### 扩容 PVC

如果 StorageClass 支持 `allowVolumeExpansion`，可以扩容：

1. 进入 PVC 详情页
2. 点击 **编辑**
3. 修改 **大小**（如 `10Gi` → `20Gi`）
4. 保存后，Kubernetes 自动扩展底层存储
5. **注意**：需要在 Pod 内部执行文件系统扩容（如 `resize2fs`、`xfs_growfs`）

### 删除 PVC

1. 确保 PVC 未被任何 Pod 挂载
2. 进入 PVC 列表，点击 **删除**
3. 确认删除

**风险提示：**
- 如果 PV 的 `reclaimPolicy` 是 `Delete`，删除 PVC 会同时删除底层存储和数据
- 如果 `Retain`，PV 和数据保留，需要手动清理

### 备份 PVC 数据

常见方案：

1. **快照**：如果 StorageClass 支持 VolumeSnapshot
   ```bash
   kubectl create volumesnapshot myapp-snap --source pvc=myapp-data
   ```
2. **rsync 拷贝**：使用 Job 复制到另一个 PVC 或对象存储
3. **应用层备份**：数据库导出到对象存储

---

## 最佳实践

### 存储选择

- 🎯 **匹配业务需求**：数据库（RWO）、共享缓存（RWX）、只读配置（ROX）
- 🎯 **环境差异化**：开发用 NFS（便宜），生产用云存储（高可用）
- 🎯 **大小预估**：预留 30% 缓冲空间，避免频繁扩容
- 🎯 **性能测试**：IOPS、吞吐量满足应用要求

### 安全性

- 🔒 **访问控制**：通过 RBAC 限制 PVC 的创建和绑定权限
- 🔒 **命名空间隔离**：PVC 只在本命名空间可见，避免跨项目访问
- 🔒 **Secret 挂载**：如果存储需要认证（如云存储密钥），使用 Secret

### 运维管理

- 📊 **监控使用率**：设置告警，PVC 使用 >80% 时扩容
- 📊 **定期清理**：删除不再使用的 PVC，释放资源
- 📊 **命名规范**：PVC 命名体现用途，如 `mysql-data`、`app-logs`
- 📊 **版本控制**：PVC 配置纳入 GitOps，便于恢复

---

## 常见问题

### Q: PVC 一直处于 `Pending` 状态？

可能原因：

1. **没有可用 PV**：所有 PV 已被绑定，或没有动态供应器
   - 检查：`kubectl get pv`
   - 解决：等待其他 PVC 释放，或使用支持动态供应的 StorageClass
2. **StorageClass 不存在**：名称拼写错误或未安装 CSI 驱动
   - 检查：`kubectl get storageclass`
   - 解决：联系管理员创建合适的 StorageClass
3. **请求大小超过管理员限制**：PVC 请求的存储超过集群配额
   - 检查：`kubectl describe pvc <name>` 查看事件
   - 解决：减小请求大小或申请提高配额
4. **访问模式不匹配**：PV 的访问模式与 PVC 不兼容

### Q: PVC 无法挂载到 Pod？

- 检查 Pod spec 中的 `volumeClaimTemplates` 或 `volumes.claimRef` 是否正确引用 PVC
- 确认 PVC 状态是 `Bound`
- 检查 Pod 调度是否失败（节点没有对应 StorageClass 的 PV）

### Q: 如何查看 PVC 实际使用的存储？

```bash
# 查看 PVC 绑定的 PV
kubectl get pvc <name> -o jsonpath='{.spec.volumeName}'

# 查看 PV 详情
kubectl get pv <pv-name> -o wide

# 查看 PV 对应的底层存储（取决于后端）
# 对于 NFS：检查 NFS 服务器目录
# 对于云存储：访问云控制台查看磁盘
```

### Q: 扩容后 Pod 内部容量没变？

PVC 扩容只扩展了底层存储卷，**容器内部文件系统需要手动扩容**：

**For ext4/XFS：**
```bash
# 进入 Pod
kubectl exec -it <pod> -- /bin/sh

# 查看磁盘
df -h

# 扩容（根据文件系统类型）
resize2fs /dev/sdx  # ext4
xfs_growfs /mount/path  # xfs
```

---

## 相关链接

- [Kubernetes PVC 官方文档](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Kubernetes StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [开发者网络存储首页](/dev/network-stroage/)
- [管理员存储管理](/admin/storage/)
