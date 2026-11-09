# Console 近一个月变更分析（2026-10-09 ~ 2026-11-09）

**生成时间**: 2026-11-09
**分析对象**: KDO Console（`gitee.com/kube-do/console`，OpenShift Console 的 KDO 定制分支）
**代码版本**: `main` @ `a3ea541094`
**统计范围**: 最近一个月、非合并提交共 **83** 个（2026-10-09 → 2026-11-09 +0800）
**分析类型**: 产品功能 + 平台工程变更盘点

---

## 一、总览

本月的变更可分为三类：**KDO 定制的新功能**、**面向用户的行为与界面改进**、**上游同步与内部工程变更**。其中前两类需要同步到产品文档，第三类多为框架升级、性能与测试基建。

本月最值得关注的新增能力：

| 能力 | 入口 | 说明 |
|------|------|------|
| 多集群全局资源搜索 | 顶栏搜索框 / `/kdo-search` | 按名称、IP、命名空间、标签、应用跨集群搜索资源 |
| 通知中心 | 管理员界面 → Notifications | 通知渠道、事件类型、平台公告、通知记录与用户偏好 |
| 应用项目概览 | 项目列表 → 项目名 | 8 个标签页统一查看项目应用、环境、资源、成员、监控与通知 |
| 平台配置编辑器 | 管理员界面 → Platform configuration | 图形化编辑 Console/KDC 配置，支持预览、校验与分别重启 |
| Codeup 代码源 | 新建应用 / 从 Git 导入 | 支持阿里云 Codeup 仓库、流水线与 Webhook |
| 发布历史增强 | 应用 → 分支流水线 → 发布历史 | 展示构建提交、支持按版本回滚并触发部署 |

---

## 二、面向用户的功能变更

### 2.1 多集群全局资源搜索（新增）

- 顶栏新增全局搜索框，支持 `Ctrl/Cmd + K` 唤起；结果页为 `/kdo-search`。
- 支持资源：Pod、Service、Deployment、StatefulSet、DaemonSet、Ingress、Node、Namespace，以及 KDO 的 AppProject、AppEnv、Repository。
- 搜索维度：名称/模糊匹配、IP 与 CIDR、命名空间、标签、应用、状态，支持 `-` 负向条件与引号短语。
- 支持跨集群扇出、结果按匹配度排序、集群状态展示、深链跳转、限流与短时缓存。
- 标准 Kubernetes/OpenShift 集群（无 KDO CRD）同样可用；KDO 专属资源类型会自动隐藏，后端对缺失 CRD 优雅跳过。
- 权限始终按当前用户 Token 做 RBAC 过滤，不会返回用户无权访问的资源。
- 相关提交：`6caf118ef7`。

详见 [全局资源搜索](/docs/dev/global-search/)。

### 2.2 通知中心与用户通知偏好（新增）

- 新增管理员页面 `/notification-admin`（Notifications），包含四个标签页：
  - **Notification channels**：通知渠道，支持企业微信、钉钉、飞书、Webhook；按 Provider 展示不同凭据字段；可发送测试、设为默认、编辑、删除；Secret 状态显示 Ready/Missing。
  - **Event types**：通知服务提供的事件类型只读视图。
  - **Platform announcements**：平台公告。
  - **Notification records**：通知记录，可按项目、类别、类型、状态筛选与搜索；支持重新入队（Resend）与详情抽屉（渠道、投递、失败原因、跳过原因）。
- 用户菜单/编辑用户弹窗新增 **Notification settings**：
  - 绑定 IM 账号（企业微信/钉钉/飞书等）并查看绑定状态。
  - 选择接收的事件类别、事件类型、渠道类型、严重级别阈值。
  - 配置静默时段（Quiet hours），静默期内只记录不推送。
  - 选择汇总方式：实时、不汇总、每日、每周；支持发送测试。
- 项目详情页新增通知标签，可查看项目默认通知规则、24 小时投递与失败情况。
- 相关提交：`7db69c6b0e`、`d7d6c7c58c`、`3d730d13c6`。

详见 [通知中心](/docs/admin/notifications/)。

### 2.3 应用项目概览与多集群环境（新增）

- 项目列表进入项目后，打开新的 **AppProject Overview** 页面（`/app-projects/:project`），页头展示项目状态（Healthy/Degraded/Failed）、失败构建、环境数、应用数。
- 8 个标签页：
  - **Overview**：应用数、环境数、成员数、命名空间数；应用健康表；环境列表；最近活动。
  - **Applications**：项目下应用与映射环境。
  - **Environments**：环境卡片与「应用 × 环境」部署矩阵。
  - **Resources**：资源汇总、按环境资源、ResourceQuota、PVC、存储。
  - **Access**：项目成员、管理员、角色与环境权限矩阵；RoleBinding 诊断。
  - **Monitoring**：集群指标、Firing alerts、按环境指标。
  - **Activity**：最近构建与 Kubernetes 事件。
  - **Notifications**：项目通知健康度与通知规则/记录。
- 支持 AppEnv 跨集群打开，自动切换到环境所在集群并保持当前页面。
- 相关提交：`a73f61b2fb`。

详见 [项目管理](/docs/devops/project-manage/) 中的「项目概览」小节。

### 2.4 图形化平台配置编辑器（新增）

- 管理员界面新增 **Platform configuration**（`/platform-config`），用于图形化编辑 Console 与 KDC 的平台配置。
- 分为七个分区：基本设置、身份认证、镜像仓库、监控与证书、界面定制、扩展与代理、高级 YAML。
- 支持表单/YAML 双模式、变更预览、校验结果（error/warning/info）、保存后同步状态（Synced/等待重启/滚动中/失败/未知）。
- Console 与 KDC 可分别重启；YAML 模式保留未知字段。
- 需要 `kubedo-system/console` ConfigMap 的 update 权限。
- 相关提交：`849d60ac82`、`5843e98876`、`2364044852`。

详见 [平台配置编辑器](/docs/admin/platform-config/)。

### 2.5 Codeup 代码源（新增）

- 新建应用与 `/import` 支持阿里云 **Codeup** 仓库：填写 Codeup Git 地址后自动识别提供商，无需额外选择。
- 支持 Codeup 的分支、流水线与 Webhook。
- 由于 Codeup 拒绝浏览器直连，Webhook 由 Console 后端代理创建；表单提示使用 Codeup 个人访问令牌（需仓库读写与 Webhook 管理权限，建议 30 天过期）。
- 相关提交：`ea0314cda4`、`a6747950e2`。

详见 [Git 应用](/docs/dev/applications/repository/)。

### 2.6 发布历史与回滚增强

- 发布历史抽屉按清单提交展示版本，新增 **Commit** 列，展示触发构建的源码提交标题，并附源码提交与写回提交的短 SHA。
- 支持选择任意历史版本回滚，或手动指定 Image tag；回滚提交清单后自动触发部署流水线。
- 修复发布历史当前版本标记、回滚错误提示，以及按分支行区分抽屉状态的问题。
- 相关提交：`5598e5ee4e`、`9e08dd0bae`、`2ee9260cda`。

详见 [Git 应用](/docs/dev/applications/repository/) 中的「发布历史与回滚」小节。

### 2.7 用户身份与成员展示

- 统一用户身份标识：用户/组展示优先使用显示名与统一 ID，避免同一用户在成员、审计、通知等处显示不一致。
- 编辑用户弹窗新增通知设置入口。
- 修复 OIDC 登录后短暂显示 `anonymous` 用户的问题。
- 支持 Casdoor OIDC 登录并泛化用户名推导。
- 相关提交：`2142f4ce65`、`d7d6c7c58c`、`a6d1bc4fd6`、`b7d0793cc2`。

### 2.8 集群切换与特权模式保持当前页面

- 切换集群时只更新 URL 中的 `cluster` 参数，保留当前路径、命名空间、筛选与分页，不再跳回列表页。
- 进入/退出特权模式（impersonate）同样保持当前页面与 URL。
- 切换集群后资源视图会重新挂载并加载新集群数据，RBAC 缓存按集群隔离。
- 相关提交：`c7d98cbfa9`、`36c5b15e9e`。

### 2.9 命名空间行为调整

- `kubedo`、`kubedo-*` 与 `kube-*`、`openshift-*`、`kubernetes-*` 一并视为系统命名空间，默认在命名空间下拉中隐藏。
- 移除默认命名空间（default）的安全提示：SCC 是 OpenShift 概念，在标准 Kubernetes 上不适用，避免误导。
- 相关提交：`308533001c`。

### 2.10 其他用户可见修复

- **OpenKruise 工作负载**：修复拓扑与伸缩入口，按模型引用正确解析 CRD 工作负载（`9cf8c72d95`）。
- **调试终端**：按部署环境选择镜像，修复 Pod 创建时机（`f10c7ef647`）。
- **监控**：告警描述中的 Kruise 资源生成正确跳转链接（`46fbbde024`）；修复规则组展开、静默过期对话框无法关闭（`3fa534d2c2`）。
- **命名空间角色绑定**：默认只显示命名空间级绑定（`3bfa0ead8a`）。
- **AppProject/AppEnv 切换**：修复刷新循环与重复权限检查（`f44f83d6e5`）。
- **侧边栏收藏**：修复收藏分组无法展开或收起（`492acd5d68`）。
- **Helm**：支持查看 `values.yaml` 原文；切换 Chart 版本时保留用户覆盖值与注释（`e2ba642cc3`、`61ca9c7989`）。
- **OLMv1 卸载**：明确级联删除的影响提示（`9bfc57d085`）。
- **日志**：修复错误提示中 `<p>` 内嵌块级元素的嵌套告警（`5a7bec6b18`）。
- **表单**：修复表单重置回调导致的栈溢出（`13cb0c4296`）。

---

## 三、核心平台与内部变更（不涉及用户界面）

- **上游同步**：pipelines-plugin 同步至 `6abc9d21`；monitoring-plugin 同步至 `d7bce2f8`；主题命名由 theme 调整为 colour scheme（CONSOLE-5565）；ConsoleDataView 持续迁移（CONSOLE-5564）。
- **安全**：Bridge 增加安全响应头；支持可配置的 CSP header 模式，并完善插件路由的 CSP 违规归因。
- **Codeup Webhook 代理**：新增 `pkg/devconsole/webhooks`，由后端代理创建 Codeup Webhook，避免浏览器 CORS 限制。
- **手动触发鉴权**：手动运行 PipelineRun 改由用户 Token 鉴权，并透传至 Pipelines as Code。
- **用户指标**：用户指标 RoleBinding 改从 `kube-public` 读取，兼容默认部署。
- **性能与测试**：新增前端性能基准、DataView 列表/筛选热路径优化、全路由 JS 错误扫描与 K8s 路由健康检查 E2E。
- **构建**：依赖与 vendor 更新、Helm loader 暴露原始 `values.yaml`、PatternFly 版本对齐。

---

## 四、对应文档更新

本次已同步更新/新增 kdo 产品文档：

| 文档 | 变更 |
|------|------|
| `docs/analysis/console-changes-2026-11.md` | **新增** 本变更分析 |
| `docs/dev/global-search/index.md` | **新增** 多集群全局资源搜索 |
| `docs/admin/notifications/index.md` | **新增** 通知中心与用户通知偏好 |
| `docs/admin/platform-config/index.md` | **新增** 平台配置编辑器 |
| `docs/devops/project-manage/index.md` | 新增「项目概览（AppProject Overview）」与多集群环境说明 |
| `docs/dev/home/index.md` | 资源搜索改为全局搜索入口；项目概览补充新页面 |
| `docs/dev/applications/repository/index.md` | 新增 Codeup 代码源、发布历史与回滚 |
| `docs/admin/management/namespaces/index.md` | 系统命名空间规则、移除默认命名空间安全提示 |
| `docs/admin/management/clusters/index.md` | 切换集群保持当前页面与 URL |
| `docs/admin/user-management/index.md` | 用户身份统一展示、通知设置入口 |
| `docs/install/config/console/index.md` | 补充全局搜索与平台配置编辑器能力 |

---

## 五、统计

| 维度 | 数值 |
|------|------|
| 非合并提交 | 83 |
| 时间跨度 | 2026-10-09 ~ 2026-11-09 |
| 新增文档 | 4（全局搜索、通知中心、平台配置、本变更分析） |
| 修改文档 | 7 |
| 主要新增功能 | 6（全局搜索、通知中心、项目概览、平台配置、Codeup、发布历史增强） |

---

## 六、兼容性与升级说明

- **标准 Kubernetes 支持**：全局搜索不再依赖 KDO 的 `Cluster`/`AppProject`/`AppEnv`/`Repository` CRD；缺少 `Cluster` CRD 时 Console 会回退为本地集群配置，可正常启动。
- **功能开关**：通知中心、平台配置编辑器、项目概览等 KDO 专属入口继续受 `KUBEDO_ENABLED` 等特性标志控制；全局搜索入口不再受该标志限制。
- **权限**：平台配置编辑器需要 `kubedo-system/console` ConfigMap 的 update 权限；通知渠道与规则需要对应项目的管理权限；全局搜索完全遵循 Kubernetes RBAC。
- **行为变化**：`kubedo*` 命名空间默认从下拉中隐藏；切换集群/特权模式不再回到列表页；默认命名空间不再显示 SCC 安全提示。

---

*本报告由对 console 仓库最近一个月 git 历史的分析生成，用于同步 KDO 产品文档。*
