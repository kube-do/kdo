# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Repository overview

这是 **KDO 智能云原生平台** 的官方文档站，使用 **Docusaurus 3.10** 构建，默认语言为简体中文，生产部署在 Vercel：https://docs.kube-do.cn

## Build & preview

```bash
pnpm install
pnpm start          # http://localhost:3000
pnpm build          # 输出到 build/
pnpm serve          # 本地预览生产构建
```

首次安装如果 pnpm 提示忽略构建脚本：

```bash
pnpm approve-builds --all
```

## Verification

```bash
pnpm check:content  # frontmatter、必填字段、正文 H1
pnpm check:search   # 搜索索引高频词回归
pnpm check:urls     # 旧 URL 301/410 与构建产物一致性
pnpm verify         # build + 上述三项
```

## Tech stack

- **Docusaurus** 3.10.2（React 19、TypeScript）
- **Mermaid**：`@docusaurus/theme-mermaid`
- **搜索**：`@easyops-cn/docusaurus-search-local`，中文分词
- **部署**：Vercel（`vercel.json`，`trailingSlash: true`）
- **包管理**：pnpm 12，Node.js 22.x

## Directory structure

```text
site-docs/                     # 唯一内容源（Markdown + 图片）
├── quick-start/               # 快速开始
├── install/                   # 安装、升级、离线安装
├── developer/                 # 开发指南
│   ├── overview/              # 开发者主页、环境、全局搜索
│   ├── applications/          # Git、Helm、镜像构建、语言模板
│   ├── projects/              # 项目与环境
│   ├── workloads/             # Pod、Deployment、StatefulSet、Job、CronJob
│   ├── workload-operations/   # 扩缩容、HPA、资源限制、健康检查、PDB
│   ├── configuration/         # ConfigMap、Secret
│   ├── network-storage/       # Service、Ingress、PVC
│   ├── delivery/              # 流水线、Pipelines as Code
│   ├── dev-environments/      # CloudShell、LocalShell、Che、令牌
│   ├── best-practices/        # 持续交付、多环境、Git 分支策略
│   └── ai-assistant/          # AI 助手
├── admin/                     # 管理指南
│   ├── clusters/              # 集群与节点
│   ├── namespaces/            # Namespace、Quota、LimitRange、AppProject、CRD
│   ├── workloads/             # DaemonSet、ReplicaSet
│   ├── networking/            # NetworkPolicy
│   ├── storage/               # PV、PVC、StorageClass、快照
│   ├── access-control/        # RBAC、用户、Keycloak
│   ├── notifications/         # 通知中心
│   ├── platform-config/       # Console 平台配置
│   ├── operators/             # Operator 管理
│   └── maintenance/           # 证书、升级、备份、安全
├── observability/             # 监控、仪表盘、告警、日志、事件
├── reference/                 # 参考手册、术语、兼容性、排障、任务索引
├── architecture/              # 整体架构
├── release-notes/             # 发布说明
└── contributing/              # 贡献指南

migration/                     # 迁移、资源治理、URL 校验脚本
static/                        # 静态资源、下载文件、演示视频
src/                           # 首页、404、样式
docs/                          # 旧 Jekyll 内容，只读归档，不参与构建
```

## Content authoring conventions

- 所有文档使用**简体中文**编写。
- 每个目录的 `index.md` 是该 section 的入口页。
- 图片放在页面同目录的 `imgs/`；演示视频放 `static/media/docs/...`，页面用 `/media/docs/...` 绝对路径。
- 每页 frontmatter 必填：
  - `title`
  - `description`
  - `sidebar_position`
  - `doc_type`：`tutorial`、`how-to`、`explanation`、`reference`
  - `audience`
  - `owner`
  - `last_reviewed`
  - `status`：`draft`、`migrated`、`stable`
- 正文从 `##` 开始，页面标题由 frontmatter 渲染，不写正文 H1。
- 长页优先拆分为任务页，不要继续堆叠。
- 站内链接使用 `/docs/.../` 绝对路径，保留末尾斜杠。
- 修改标题时保留旧锚点：显式写 `{#id}` 或 `<a id="旧锚点"></a>`。
- 图片使用 WebP；GIF 转为 MP4 + WebP poster。
- 不写内部实现细节、前端组件名、i18n key 和开发调试过程。

## Asset pipeline

`site-docs/` 和 `static/media/` 是提交到仓库的构建输入。Vercel 只执行 `pnpm build`，不会在云端执行迁移。

```bash
pnpm optimize       # 去重、删除未引用图片、PNG/JPG→WebP、GIF→MP4（仅处理 site-docs/static/media）
pnpm migrate        # optimize + sync-downloads + generate-vercel-redirects
```

`pnpm migrate:legacy` 会从 `docs/` 重新生成 `site-docs/`，会覆盖现有内容，日常不要运行。

## CI / deployment

- **CI** (`.github/workflows/ci.yml`)：Node 22 + pnpm 12，依次执行 `pnpm install --frozen-lockfile`、`pnpm check:content`、`pnpm build`、`pnpm check:search`、`pnpm check:urls`。
- **生产**：Vercel，`framework: docusaurus`、`buildCommand: pnpm build`、`outputDirectory: build`。
- **410**：`api/gone.js` + `vercel.json` rewrite，处理已下线的 `/docs/analysis/*`。
- GitHub Pages 已停用，旧 Jekyll 文件已删除。

## Configuration notes

- `docusaurus.config.ts`：`baseUrl: '/'`、`trailingSlash: true`、`onBrokenLinks: 'throw'`、`onBrokenAnchors: 'throw'`。
- 搜索插件索引 `/docs`，中文分词；搜索回归见 `migration/check-search.mjs`。
- Mermaid 使用 `neutral`/`dark` 主题。
- `site-docs/` 是唯一内容源，`docs/` 仅作历史归档。
