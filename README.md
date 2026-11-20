# KDO Platform Documentation

这是 **KDO（Kubedo DevOps）** 平台的官方文档站点。

**在线访问：** https://docs.kube-do.cn

---

## 技术栈

- **静态站点生成器：** [Docusaurus 3](https://docusaurus.io/)
- **内容格式：** Markdown / MDX
- **搜索：** `@easyops-cn/docusaurus-search-local`（中文分词）
- **图表：** Mermaid
- **运行时：** Node.js 22+、pnpm 12
- **部署：** Vercel

---

## 本地开发

```bash
pnpm install
pnpm start
```

打开 http://localhost:3000。

生产构建与本地预览：

```bash
pnpm build
pnpm serve
```

重新生成内容与优化资源：

```bash
pnpm migrate
```

`site-docs/` 是当前唯一内容源，日常直接编辑。`pnpm migrate` 只做资源治理和构建辅助：
- `migration/optimize-assets.mjs`：GIF 转 MP4 + WebP poster，PNG 转 WebP，删除未引用图片并合并重复图片
- `migration/sync-downloads.mjs`：把根目录的 `kdo-developer.tar.gz` 和 `agent-setup*.sh` 同步到 `static/`
- `migration/generate-vercel-redirects.mjs`：从 `redirects.csv` 生成 `vercel.json` 的 301

`docs/` 是旧 Jekyll 内容归档，仅用于回溯；`pnpm migrate:legacy` 会从 `docs/` 重新生成 `site-docs/`，会覆盖当前内容，日常不要运行。

`pnpm start`、`pnpm build` 也会先执行 `sync:downloads`。`kdo-developer.tar.gz` 和 `agent-setup*.sh` 仍以仓库根目录为唯一源文件，`static/` 下的副本是构建产物，不提交。

构建门禁：

- `onBrokenLinks: throw`
- `onBrokenAnchors: throw`
- 构建后运行 `node migration/check-url-parity.mjs`

---

## 目录结构

```text
.
├── site-docs/               # Docusaurus 文档内容（URL 前缀 /docs/）
│   ├── quick-start/         # 快速开始
│   ├── install/             # 安装与升级
│   ├── developer/           # 开发者指南
│   ├── admin/               # 管理员指南
│   ├── observability/       # 可观测性
│   ├── architecture/        # 架构与原理
│   ├── reference/           # 参考手册
│   ├── release-notes/       # 发布说明
│   └── contributing/        # 贡献指南
├── migration/               # URL 映射、迁移脚本、parity 检查
├── docs/                    # 旧 Jekyll 内容归档（只读，不再作为内容源）
├── src/                     # 首页、样式
├── static/                  # 静态资源
├── docusaurus.config.ts
├── sidebars.ts
└── vercel.json
```

---

## 迁移状态

当前已完成 **阶段 A：同构迁移** 和 **阶段 B：IA 重构 + 301**。

- 旧站 113 个页面已全部登记在 `migration/url-map.csv`。
- `site-docs/` 共 106 篇 Markdown，顶层收敛为 9 个栏目：`quick-start`、`install`、`developer`、`admin`、`observability`、`architecture`、`reference`、`release-notes`、`contributing`。
- 19 个 URL 保持不变，91 个旧 URL 已配置 301，3 篇 `docs/analysis/*` 内部分析不进入构建。
- `vercel.json` 的 91 条重定向由 `migration/redirects.csv` 生成。
- 旧 Jekyll 内容保留在 `docs/`，GitHub Pages 工作流改为手动回滚入口。
- 图片治理后构建产物约 **38 MB**：`site-docs/` 约 11 MB，`static/media/` 约 8 MB。
- 3 篇内部分析的 410 仍需在 Vercel 侧用中间页或边缘函数实现。

> `site-docs/` 和 `static/media/` 是提交到仓库的构建输入。Vercel 只执行 `pnpm build`，不会在云端运行 `pnpm migrate`；修改 `docs/` 后请在本地执行 `pnpm migrate`，并提交生成结果。`static/` 下的 `kdo-developer.tar.gz` 和 `agent-setup*.sh` 是 `pnpm build` 自动生成的副本，不提交。

---

## 文档约定

- 页面使用简体中文。
- 每页 frontmatter 至少包含：

```yaml
---
title: 页面标题
description: 一句话说明
doc_type: how-to
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-20
status: migrated
---
```

- 提示块使用 Docusaurus admonition：

```markdown
:::note
说明文字
:::
```

- 标题锚点优先使用显式英文 ID，避免中文锚点在跳转时失效：

```markdown
## 创建应用 {#create-application}
```

- 图片放在页面同目录的 `imgs/` 下；`pnpm migrate` 会把 GIF 转成 MP4 + WebP poster，并把 PNG 转成 WebP。
- 视频放在 `static/media/`，页面中使用 `/media/docs/...` 绝对路径，避免 Docusaurus 把视频误判为文档路由。
- 不再使用 Jekyll 的 `{: .note }`、`{:toc}`、`parent`、`nav_order`。

---

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建分支：`git checkout -b docs/your-topic`
3. 本地运行 `pnpm start` 预览
4. 提交前执行 `pnpm build && node migration/check-url-parity.mjs`
5. 开启 Pull Request

---

## 许可证

本项目文档采用 [MIT License](LICENSE) 许可证。
