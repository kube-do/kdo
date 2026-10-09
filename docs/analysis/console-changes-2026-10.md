# Console 近一个月变更分析（2026-09-09 ~ 2026-10-08）

**生成时间**: 2026-10-09
**分析对象**: KDO Console（`gitee.com/kube-do/console`，OpenShift Console 的 KDO 定制分支）
**代码版本**: `main` @ `d741bdecfc`
**统计范围**: 最近一个月、非合并提交共 **188** 个（2026-09-09 16:43:50 → 2026-10-08 11:44:43 +0800）
**分析类型**: 产品功能 + 平台工程变更盘点

---

## 一、总览

本月的提交可分为三类：**KDO 定制的新功能/行为变更**、**上游同步与核心框架迁移（ConsoleDataView）**、**样式/i18n/后端健壮性修复**。面向最终用户、需要文档化的主要是第一类；后两类多为内部实现。

---

## 二、面向用户的功能变更

### 2.1 工作负载：OpenKruise 支持（新增）

- 新增 **CloneSet**（`clonesets.apps.kruise.io/v1alpha1`）与 **Kruise StatefulSet**（`statefulsets.apps.kruise.io/v1beta1`）控制台支持。
- 通过 `KRUISE` 特性标志按集群 API 发现自动启用：只有检测到 `apps.kruise.io` API 组（已安装 OpenKruise）时才显示入口，未安装时自动隐藏。
- 入口位于开发者/管理员界面的「工作负载」分区，排在 `StatefulSet` 之后；提供表单化新建/编辑与操作菜单。
- 相关提交：`a35176e8a1`、`9cba1b5209`。

### 2.2 云开发环境与终端

- **终端文件上传/下载**：独立终端页 `/terminal` 与底部 Cloud Shell 抽屉复用 Pod 文件传输能力（`PodFile`），在工具栏同一行提供上传/下载；文件传输跟随当前选中集群，统一多集群行为（`d4d919ae16`）。修复多集群参数、exec 崩溃、detached WS 泄漏，以及独立终端 tab 栏过高（`86d645e870`、`f5559a38b5`）。
- **kubeconfig 多集群下载**：支持为当前用户与 ServiceAccount 下载 kubeconfig，并通过 `X-Cluster` 头支持多集群目标；补充中文 i18n（`0883823bcc`）。入口：用户菜单、ServiceAccount 操作菜单。
- **顶栏入口**：右上角新增 **Open in Che**（访问云开发环境）图标；「Access Application」改名为 **Access Workload**（访问工作负载）（`7812906b3f`）。

### 2.3 应用与仓库（Git 应用 / Pipelines as Code）

- **开发信息级联**：仓库表单的开发语言/版本/模板改为级联选择，按语言→版本→框架过滤可用模板；切换时弹确认框，保存并重新初始化后自动重建生成文件（`devfile.yaml`、`docker/Dockerfile`、`kubernetes/deploy-*.yaml`）（`7c83776907`）。
- **开发语言下拉**仅显示 **kubedo 命名空间**中可用的语言（`893f78b0e1`）。
- **应用模板（Application Template）** 默认自动选中第一个模板；**Webhook 配置默认折叠**（`c4482674f6`）。
- **Gitee Webhook 支持**：Webhook 支持 Gitee；SSRF 校验仅对 GitLab 放开（`21342cee2f`）。
- **仓库初始化与 Webhook 解耦**：Webhook 创建/挂载失败不再阻断源码仓库初始化（`ad797ad51b`）。
- **Pipeline Source**：新增 `事件分支/默认分支` 选择，读写 `spec.settings.pipelinerun_provenance`；默认分支时流水线文件读写走默认分支（`6f86aad935`）。
- **分支流水线**：流水线文件写入对应分支并支持模板切换，标签统一为 **Branch Pipeline**（`8c2119d0d4`、`cb6bb6181f`）。
- **/import 自动填充**：根据 Git 仓库地址自动填充 `Name`/应用名（去尾部 `/` 与 `.git`，兼容 HTTPS/SSH，组件名不再追加 `-app`），自动填充 `Hostname`；仅在字段为空或仍为上次自动填充值时写入，不覆盖手动输入（`d3ee37f010`、`a5fb91f717`）。
- **Secure Route 默认不勾选**（`752892b087`）。
- **Repositories 列表新增 Che 入口**（`5fabff64c2`）；创建仓库时使用路由命名空间（`59ffd87d20`）。
- 其他：Git URL 校验、开发语言探测、分支配置区状态、prName 为空导致 PAC 准入失败等修复（`34ee805b15`、`b317b649e3`）。

### 2.4 节点与集群

- **节点排空（Drain）**：节点操作菜单完善排空能力并修正调度标记 Patch 路径（`d7b98991bd`）。
- **集群管理**：新增集群管理页面与后端接口，支持多集群动态管理（`eb80008386`，已在《集群管理(Cluster)》文档覆盖）。
- **集群检测**：纯 Kubernetes 集群不再被误判为 OpenShift 5，并跳过 OpenShift 专属探测/节点资源（`7953d4e4c0`、`03c51728bc`、`087694825d`）。

### 2.5 其他界面行为

- **镜像构建（Shipwright Builds）** 由多标签页改为**单页资源列表**，旧 `/builds` 路径自动重定向（`f1ce1c1e23`）。
- **开发者视图菜单顺序**调整（`73c8e7d638`）。
- **日志**：logging-view-plugin 移植上游展示层与样式，保留多集群数据层（`3de67ccf07`、`633bc181c2`）。
- **监控**：删除 dev-monitoring 中失效的 Loki 告警标签页并修复标签导航（`5071540e0f`）。
- **Helm**：全命名空间视图下以集群范围列出项目 Helm 仓库，修复 `#ALL_NS#` 404（`6e550489ca`）。

---

## 三、核心平台与内部变更（不涉及用户界面）

- **ConsoleDataView 迁移**：CONSOLE-5544/5541/5542/5539/5540/5131 等，多资源列表统一到 DataView 组件。
- **PatternFly 6.6 适配**：修复失效的类名、工具类、组件变量覆写与列可见性样式；补充细粒度宽度工具类。
- **后端健壮性**：修复并发 map 读写与越界 panic、vet 失败、登录指标用户名回退、降低断开日志噪声；补充后端测试。
- **i18n**：多处补齐 zh/en 文案，修复模板字符串无法提取 key 的问题。
- **插件 SDK**：`consoleFetchJSON/consoleFetchText` 补充 `cluster` 参数说明；`useTranslationExt` 避免动态命名空间列表；`Add ConsoleRemotePlugin option baseDir`（上游 #17002）。
- **Lightspeed** 插件样式与对话框修复（玻璃主题背景、头像可见性等）。

---

## 四、对应文档更新

本次已同步更新/新增 kdo 产品文档：

| 文档 | 变更 |
|------|------|
| `docs/dev/workloads/kruise/index.md` | **新增** OpenKruise 工作负载（CloneSet / Kruise StatefulSet） |
| `docs/dev/workloads/index.md` | 支持类型表格补充 CloneSet / Kruise StatefulSet |
| `docs/dev/applications/repository/index.md` | 新增创建应用表单说明、Webhook、/import 自动填充、Che 入口 |
| `docs/terminal/index.md` | 新增终端文件上传/下载、下载 kubeconfig |
| `docs/dev/home/index.md` | 新增顶栏快捷入口说明 |
| `docs/dev/applications/builds/index.md` | 补充镜像构建单页资源列表界面说明 |

---

## 五、统计

| 维度 | 数值 |
|------|------|
| 非合并提交 | 188 |
| 时间跨度 | 2026-09-09 ~ 2026-10-08 |
| 新增文档 | 2（OpenKruise、本变更分析） |
| 修改文档 | 5 |

---

*本报告由对 console 仓库最近一个月 git 历史的分析生成，用于同步 KDO 产品文档。*
