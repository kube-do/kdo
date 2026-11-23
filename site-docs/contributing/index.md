---
title: "贡献指南"
description: "如何参与 KDO 文档与示例的编写、评审和发布。"
sidebar_position: 1
doc_type: how-to
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

本指南面向所有参与 KDO 文档建设的人：产品、研发、测试、运维，以及愿意提交修正的外部贡献者。

## 适用范围

适合以下改动：

- 修正错误、补充缺失步骤、更新截图。
- 新增操作指南、参考页或排障说明。
- 调整导航、锚点、链接和搜索关键词。
- 改进示例 YAML、命令和代码片段。

涉及产品行为的改动，请先在对应产品仓库确认实现，再更新文档。

## 内容源与目录

- `site-docs/` 是**唯一内容源**，日常直接编辑。
- `docs/` 是旧 Jekyll 归档，只用于回溯，不再作为内容源。
- `static/media/` 存放视频和 poster。
- `migration/` 存放迁移、资源治理、URL 校验脚本。

旧 Jekyll 构建配置和 GitHub Pages 工作流已移除，生产只使用 Vercel。不要运行 `pnpm migrate:legacy`，它会从 `docs/` 重建并覆盖 `site-docs/`。

## 本地开发

```bash
pnpm install
pnpm start
```

默认访问 `http://localhost:3000`。首次安装如果 pnpm 提示忽略构建脚本，执行：

```bash
pnpm approve-builds --all
```

常用命令：

| 命令 | 用途 |
|---|---|
| `pnpm start` | 本地开发服务器 |
| `pnpm build` | 生产构建，断链/断锚点会直接失败 |
| `pnpm migrate` | 资源治理、下载同步、生成 301 |
| `node migration/check-url-parity.mjs` | 校验 200/301/410 与 `vercel.json` |
| `pnpm serve` | 预览生产构建 |

## 文件与路由

- 每个栏目用目录组织，入口页为 `index.md`。
- 页面 URL 由目录和文件名决定，默认带尾斜杠。
- 新增页面前先确认是否已有同主题页面，优先补充而不是复制。
- 需要拆分长页时，父页保留概览和入口，子页使用扁平文件名。
- 不要随意改已有页面的路径；确需移动时同步更新 `migration/url-map.csv` 和 301。

## Frontmatter

每篇文档必须包含：

```yaml
---
title: "页面标题"
description: "一句话说明页面解决什么问题，建议 60–160 字。"
sidebar_position: 10
doc_type: how-to
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---
```

字段约定：

| 字段 | 取值 |
|---|---|
| `doc_type` | `tutorial`、`how-to`、`reference`、`explanation` |
| `audience` | `developer`、`admin`，可多选 |
| `owner` | `docs-dev`、`docs-admin`、`docs-ops`、`docs-team` |
| `status` | `draft`、`stable`、`deprecated` |
| `last_reviewed` | 最近一次实质复核日期，格式 `YYYY-MM-DD` |

## 写作约定

- 使用简体中文，术语首次出现时保留英文，例如“无状态应用（Deployment）”。
- 操作步骤用祈使句，一步只做一件事。
- 先写前置条件，再写步骤，最后写验证和常见问题。
- 命令、文件名、字段名使用行内代码。
- 示例 YAML 必须能直接复制，避免省略关键字段。
- 不写内部实现细节、前端组件名、i18n key 和开发调试过程。
- 不承诺未经验证的行为；不确定的内容标注“以实际环境为准”。

### 标题与锚点

- 正文只使用 `##` 及以下标题，页面标题由 frontmatter 渲染。
- 标题尽量短，避免在标题里写版本号和“点击这里”。
- 需要长期稳定的锚点，使用显式 ID：

```md
## 配置接收器 {#receivers}
```

- 修改已有标题时，先搜索站内是否有人链接该锚点；必要时保留旧 ID 作为兼容锚点。

### 链接

- 站内链接使用绝对路径，例如 `/docs/developer/workloads/deployments/`。
- 链接到锚点时同时写清页面路径，例如 `/docs/observability/alerting/#receivers`。
- 不链接到旧 Jekyll 路径；旧路径由 Vercel 301 处理。
- 外部链接优先使用官方文档。

### 图片与视频

- 截图放在当前页面目录的 `imgs/` 下，使用相对路径引用。
- 优先使用 WebP；GIF 统一转 MP4，并在 `static/media/docs/` 下生成 poster。
- 截图要包含必要的上下文，避免只截一个按钮。
- 为图片写 alt 文本；装饰性图片使用空 alt。
- 不提交超过 1 MB 的单张图片；大图先压缩。

## 评审与提交

1. 从 `main` 创建分支，分支名建议 `docs/<主题>`。
2. 提交前本地执行：

   ```bash
   pnpm build
   node migration/check-url-parity.mjs
   ```

3. PR 描述写清：改了什么、为什么改、影响哪些页面、是否涉及 URL/锚点。
4. 至少一位 owner 或同领域 reviewer 批准后合并。
5. 合并后确认 Vercel Preview/生产页面、搜索和旧链接跳转正常。

提交信息建议使用：

```text
docs: add upgrade and rollback guide
docs: split pac git integration guide
fix: correct deployment anchor
```

## 负责人和复核节奏

每个页面都必须有 `owner`。`owner` 对内容的准确性负责，`docs-team` 负责流程、构建和发布。

| 范围 | owner | 复核重点 |
| --- | --- | --- |
| 快速开始、开发指南、应用、工作负载、网络存储 | `docs-dev` | 操作步骤、截图、示例 YAML |
| 安装、管理、权限、命名空间、存储、平台配置 | `docs-admin` | 安装/升级命令、权限边界、资源约束 |
| 可观测性、告警、日志、仪表盘、事件 | `docs-ops` | 指标/日志查询、通知渠道、排障路径 |
| 架构、参考、术语表、发布说明、贡献指南 | `docs-team` | 对象模型、字段口径、版本兼容性 |

复核节奏：

- **常规页面**：每季度至少复核一次，更新 `last_reviewed`。
- **安装、升级、权限、参考**：产品大版本发布后 2 周内复核。
- **连续两个版本未复核**：把 `status` 改为 `draft`，并在 PR 中安排负责人。
- **截图或命令过期**：优先修复，不要只改文字描述。
- **PR 响应**：owner 或同领域 reviewer 在 3 个工作日内给出首次反馈。
- **争议处理**：由 `docs-team` 组织产品、研发和运维确认口径后再合并。

发现断链、错别字或过期命令，可以直接提 PR，不需要先开 issue。
