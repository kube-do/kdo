# 图片资源缺失报告

**生成日期：** 2026-04-11
**扫描范围：** `docs/` 所有 Markdown 文件
**统计方式：** 统计 `![](imgs/xxx)` 和 `![alt](imgs/xxx)` 引用

---

## 📊 总体情况

| 指标 | 数值 |
|------|------|
| 文档中引用的图片总数 | 109 张 |
| `imgs/` 目录实际存在的文件 | 1 张 (`kdo.png`) |
| 缺失图片数量 | 108 张 |
| 缺失率 | 99.1% |

---

## 🚨 影响说明

缺失图片会导致：
- ❌ 文档页面出现 **broken image icon**（损坏图片图标）
- ❌ 部分操作步骤缺少可视化引导
- ❌ 降低文档专业度和用户体验
- ❌ 关键流程（如创建应用、配置流水线）难以理解

---

## 📸 缺失图片分类

以下按出现的文档页面分类（按频率排序）：

### 1. 应用管理 (`docs/dev/applications/`)

| 图片 | 预期用途 | 优先级 |
|------|----------|--------|
| `createApplication.gif` | 创建应用流程动画 | 🔴 高 |
| `repository.png` / `basic-devops.jpg` | 应用仓库类型说明 | 🟡 中 |
| `pipeline-architecture.png` / `pipeline-as-code.png` | 流水线架构图 | 🔴 高 |
| `branch-main-repo-files.png` | 主分支文件结构 | 🟡 中 |
| `branch-develop-repo-files.png` | 开发分支文件结构 | 🟡 中 |
| `manageBranch.gif` | 管理分支操作 | 🟡 中 |
| `create-repo.png` | 创建仓库界面 | 🟢 低 |
| `pipelinerun.gif` | 流水线运行动画 | 🟡 中 |
| `edit-pipelinerun.png` | 编辑流水线运行 | 🟡 中 |
| `repo-info.png` / `repo-detail.png` | 仓库详情页截图 | 🟢 低 |
| `manageHelm.gif` | 管理 Helm 应用 | 🟡 中 |
| `createHelm.gif` | 创建 Helm 应用 | 🟡 中 |
| `helm-chart.png` | Helm Chart 结构 | 🟡 中 |
| `create-ingress.gif` | 创建 Ingress | 🟢 低 |
| `edit-ingress.png` | 编辑 Ingress | 🟢 低 |

### 2. 开发者工作负载 (`docs/dev/workloads/`)

| 图片 | 预期用途 | 优先级 |
|------|----------|--------|
| `pods.png` / `deployments.png` / `statefulsets.png` | 工作负载列表页 | 🟡 中 |
| `pod.gif` | Pod 创建动画 | 🟡 中 |
| `deployment.png` | Deployment 详情 | 🟡 中 |
| `daemonsets.png` / `jobs.png` / `cronjob.png` | 其他类型截图 | 🟢 低 |
| `topology.gif` | 拓扑图可视化 | 🟡 中 |

### 3. 配置管理 (`docs/dev/configurations/`)

| 图片 | 预期用途 | 优先级 |
|------|----------|--------|
| `configmaps.png` / `secrets.png` | 配置列表页 | 🟡 中 |
| `configmap.png` | ConfigMap 详情 | 🟡 中 |
| `add-configmap-to-workload.png` | 将配置添加到工作负载 | 🔴 高 |
| `edit-configmap.png` | 编辑 ConfigMap | 🟡 中 |

### 4. 流水线 (`docs/dev/applications/pipelines/`)

| 图片 | 预期用途 | 优先级 |
|------|----------|--------|
| `create-pvc.gif` / `debug-pod-1.png` / `debug-pod-2.png` | 流水线任务示例 | 🟡 中 |
| `edit-tasks.gif` | 编辑任务流 | 🟡 中 |
| `pipelinerun-info.png` | 流水线运行详情 | 🟡 中 |

### 5. 存储 (`docs/dev/network-stroage/`)

| 图片 | 预期用途 | 优先级 |
|------|----------|--------|
| `storage.png` / `pvcs.png` / `pvc-type.png` | 存储列表和类型 | 🟡 中 |
| `expansion-pvc.gif` / `delete-pvc.gif` / `restore-snapshot.gif` | 存储操作动画 | 🟡 中 |
| `create-pvc.gif` | 创建 PVC 动画 | 🟡 中 |

### 6. 可观测性 (`docs/observability/`)

| 图片 | 预期用途 | 优先级 |
|------|----------|--------|
| `prometheus-architecture.gif` | Prometheus 架构 | 🟡 中 |
| `loki.webp` | Loki 日志界面 | 🟡 中 |
| `dashboards.gif` | 仪表板展示 | 🟢 低 |
| `events.png` / `deployment-events.png` | 事件监控 | 🟡 中 |
| `dev-events.png` | 开发者事件视图 | 🟢 低 |
| `pod-log.gif` / `node-terminal.gif` | 日志和终端 | 🟡 中 |

### 7. 管理员 (`docs/admin/`)

| 图片 | 预期用途 | 优先级 |
|------|----------|--------|
| `admin-start.gif` / `dev-start.gif` | 控制台启动引导 | 🟡 中 |
| `login.png` | 登录界面 | 🟡 中 |
| `users.png` / `groups.png` | 用户和组管理 | 🟡 中 |
| `namespaces.png` / `namespace.jpg` | 命名空间管理 | 🟡 中 |
| `nodes.png` / `node.png` | 节点管理 | 🟢 低 |
| `operator-hub.png` / `install-operator.gif` | OperatorHub 操作 | 🟡 中 |
| `network-policy-arch.png` | 网络策略架构 | 🟡 中 |
| `crd.png` / `crds.png` | 自定义资源 | 🟢 低 |
| `resource-quotas.png` / `limit-range.png` | 资源配额 | 🟡 中 |
| `namespace-topology.png` | 命名空间拓扑 | 🟢 低 |
| `setup-oidc.png` | OIDC 配置 | 🟡 中 |
| `update-client-scopes.gif` | 更新客户端范围 | 🟢 低 |

### 8. 其他

| 图片 | 预期用途 | 优先级 |
|------|----------|--------|
| `kubernetes-aac.webp` / `kubernetes-namespaces.png` | Kubernetes 概念图 | 🟡 中 |
| `statefulset-architecture.webp` | StatefulSet 架构 | 🟡 中 |
| `tekton.jpg` | Tekton 流水线 | 🟡 中 |
| `logo.jpeg` | 品牌 Logo | 🟢 低 |

---

## 🎯 建议修复方案

### 方案 A: 补充真实截图（推荐）

1. 逐页访问文档站点
2. 对关键操作流程进行截图或录屏
3. 命名规范：`{页面拼音或英文}-{操作}.{png|gif|jpg}`（如 `create-application.gif`）
4. 保存到 `imgs/` 目录
5. 更新 Markdown 中的图片引用（如果需要重命名）

**预期工作量：** 50-100 小时（取决于截图质量要求）

### 方案 B: 使用占位符（临时方案）

1. 创建一个通用的占位图片 `imgs/placeholder.png`
2. 批量替换所有缺失图片引用：
   ```bash
   for file in $(find docs -name "*.md"); do
     sed -i 's/!\[\([^]]*\)\](imgs\/[^)]*)/![📷 截图待补充](imgs\/placeholder.png)/g' "$file"
   done
   ```
3. 在 `MISSING_IMAGES.md` 中标记待补充列表

**优点：** 快速消除 broken image 图标
**缺点：** 所有图片位置显示同样占位符，无法区分

### 方案 C: 移除非必要图片

部分文档可能不需要图片（如纯粹的 API 参考）：
1. 识别哪些页面图片是**必需**的（操作步骤、架构图）
2. 识别哪些页面图片是**可有可无**的（装饰性、示意图）
3. 删除非必要图片的引用，或替换为文字说明

---

## 📋 行动计划建议

1. **P0 - 立即执行：方案 B（占位符）**
   - 耗时：30 分钟
   - 效果：界面整洁，无 broken icon
   - 后续：逐步补充真实截图

2. **P1 - 短期（1-2 周）：补充关键页面截图**
   优先级顺序：
   - 应用管理创建流程（`createApplication.gif`、`create-repo.png`）
   - 流水线配置（`pipeline-architecture.png`）
   - 工作负载操作（`deployment.png`、`add-configmap-to-workload.png`）
   - 可观测性仪表板（`prometheus-architecture.gif`）
   - 管理员界面（`login.png`、`users.png`）

3. **P2 - 中期（1 个月）：全量补全**
   剩余截图全部补充，形成完整视觉引导

---

## 🔧 工具支持

建议创建脚本自动化以下任务：

- `scripts/generate-placeholder.sh` - 生成占位图（带文件名标注）
- `scripts/check-images.sh` - 定时检查图片完整性
- `scripts/download-screenshots.sh` - 从设计稿自动下载（如有）

---

## ❓ 常见问题

### Q: 这些图片原来是从哪里来的？

推测：
- 来自原始 KDO 平台的 UI 截图
- 来自设计稿（Figma/Sketch导出）
- 部分可能是概念架构图

目前 `imgs/` 下仅 `kdo.png` 一张，说明其他图片在历史迁移过程中丢失。

### Q: 可以完全删除图片引用吗？

- **必需截图**（操作流程、架构）：需要补充
- **装饰性图片**：可删除，但需确认不影响理解

建议按本报告分类处理，保留高优先级截图。

### Q: 如何快速判断哪些图片是必需的？

检查 Markdown 文件：
- 如果图片紧接在"点击此处"或"如下图所示"等文字之后，说明是**必需**
- 如果图片是单独的块，且周围没有描述性文字，可能是**可有可无**

---

## 📞 下一步

1. 决定采用哪种方案（A/B/C）
2. 如果是方案 B，我现在可以批量替换为占位符
3. 如果是方案 A，请提供截图或安排截图任务
4. 确认哪些页面可以删除图片引用

请告知你的选择。
