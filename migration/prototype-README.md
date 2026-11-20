# KDO 文档站 v2 样板站（历史记录）

> 2026-11-20：样板站已提升为仓库根目录的 Docusaurus 工程。本文保留为设计验证记录；实际运行请在仓库根目录执行 `pnpm start`，内容目录为 `site-docs/`。

这是 Docusaurus 3 的样板站，用于验证目标信息架构、页面模板、中文搜索、Mermaid 和视频资源，不是生产站。

## 包含什么

- Docusaurus 3.10.2 + TypeScript
- `@easyops-cn/docusaurus-search-local` 中文搜索（jieba）
- Mermaid 图表
- 5 篇样板页：
  - 快速开始
  - 安装 KDO
  - 创建 Git 应用
  - 无状态应用（Deployment）
  - 监控与告警
- 目标 IA 的顶层栏目和占位页
- GIF → MP4 + poster 的资源治理示例
- 首页、导航、页脚、基础品牌样式

## 本地运行

```bash
pnpm install
pnpm start
```

打开 <http://localhost:3000>。

## 构建

```bash
pnpm build
pnpm serve
```

构建开启：

- `onBrokenLinks: 'throw'`
- `onBrokenMarkdownLinks: 'throw'`
- `onBrokenAnchors: 'throw'`
- `trailingSlash: true`
- `markdown.format: 'detect'`，降低 `.md` 中 `{}`/`<` 的 MDX 解析风险

## 5 篇样板页验证点

| 样板页 | 验证点 |
|---|---|
| 快速开始 | tutorial 模板、步骤、验证、下一步、站内链接 |
| 安装 KDO | how-to 模板、命令块、警告、故障排查 |
| 创建 Git 应用 | 对象关系图、表格、截图、自动部署说明 |
| 无状态应用 | explanation 模板、Mermaid、操作表、限制 |
| 监控与告警 | 架构图、GIF 转 MP4、Grafana 截图、告警流程 |

## 与生产迁移的关系

样板站已按方案提升为仓库根目录的 Docusaurus 工程：

1. `docs-v2/` 已移除，配置、`src/`、`static/` 移到根目录。
2. 全量迁移内容在 `site-docs/`，阶段 A 保持旧 URL 不变。
3. Jekyll 文件暂时保留，用于回滚；阶段 B 完成后再删除。
4. 阶段 B 把 `migration/redirects.csv` 转成 Vercel 301 规则。
5. 后续启用 frontmatter schema、链接检查、资源预算等 CI 门禁。

## 注意

- 这是样板站，只有 5 篇完整页面和若干占位页，不能直接替换线上站点。
- 所有图片放在 `static/img/docs/`，版本化时共享，不复制。
- 样板站使用 `onBrokenLinks: 'throw'`，新增页面时请同步补链接目标。
