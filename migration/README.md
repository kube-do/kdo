# KDO 文档迁移资产

本目录存放 URL 映射、迁移脚本和校验工具，不是文档内容。

## 阶段 A / B 已完成

- `migrate-stage-a.mjs`：把 `docs/` 同构迁移到 `site-docs/`，保持旧 URL。
- `migrate-stage-b.mjs`：按 `url-map.csv` 调整 IA，移动页面与资源、重写绝对/相对链接、重建分类、兼容旧锚点。
- `optimize-assets.mjs`：资源治理，删除未引用图片、合并重复图片、GIF 转 MP4 + WebP poster、PNG/JPG 转 WebP。
- `sync-downloads.mjs`：把根目录的 `kdo-developer.tar.gz` 与 `agent-setup*.sh` 复制到 `static/`，保证站点根路径可下载。
- `generate-vercel-redirects.mjs`：从 `redirects.csv` 生成 `vercel.json` 的 301 重定向；410 由 `api/gone.js` + rewrite 处理。
- `check-url-parity.mjs`：构建后检查 200/301/410 与 `vercel.json` 重定向是否一致。
- `check-frontmatter.mjs`：检查 `site-docs` 的 frontmatter 必填字段、枚举、日期和正文 H1。
- `check-search.mjs`：读取 `build/search-index.json`，校验 50 个高频中文查询。
- 当前结果：`site-docs/` 共 138 篇 Markdown，9 个顶层栏目；19 个保持页、91 个 301、3 个 410。
- 资源治理后：`site-docs/` 约 8.6 MB，`static/media/` 约 4.9 MB，构建产物约 32 MB（gzip 约 14.5 MB）。

**`site-docs/` 现在是唯一内容源，日常直接编辑。**

```bash
pnpm migrate          # 资源治理 + 下载同步 + redirects 生成
pnpm build
pnpm check:content
pnpm check:search
pnpm check:urls
```

`pnpm migrate` 等价于：

```bash
node migration/optimize-assets.mjs
node migration/sync-downloads.mjs
node migration/generate-vercel-redirects.mjs
```

`docs/` 是旧 Jekyll 内容归档，只用于回溯。需要从旧源重建时使用：

```bash
pnpm migrate:legacy
```

`migrate:legacy` 会重新执行阶段 A/B 并**覆盖** `site-docs/`，日常不要运行。

## 文件

| 文件 | 说明 |
|---|---|
| `generate-url-map.mjs` | 从 `docs/` 和映射规则生成 113 条旧 URL 映射 |
| `url-map.csv` | 完整映射表，供脚本和 review 使用 |
| `url-map.md` | 可读版映射表，按栏目分组 |
| `redirects.csv` | 只包含 301/410 的重定向清单 |
| `migrate-stage-a.mjs` | Jekyll -> Docusaurus 同构迁移脚本 |
| `migrate-stage-b.mjs` | IA 移动、链接重写、分类重建、锚点兼容 |
| `optimize-assets.mjs` | 图片去重、去未引用、GIF -> MP4、PNG -> WebP |
| `sync-downloads.mjs` | 同步根目录下载文件到 `static/` |
| `generate-vercel-redirects.mjs` | 从 `redirects.csv` 生成 301 |
| `check-url-parity.mjs` | 构建产物 URL parity 与 redirects 一致性检查 |
| `check-frontmatter.mjs` | frontmatter、字段枚举、正文 H1 检查 |
| `check-search.mjs` | 高频中文搜索词回归检查 |
| `prototype-docs/` | 首批 5 篇样板页，保留作设计参考 |

## 资源治理

`optimize-assets.mjs` 需要：

- `ffmpeg`（GIF -> MP4 + WebP poster）
- `sharp`（PNG/JPG -> WebP）

输出约定：

- 视频与 poster：`static/media/docs/<原相对路径>/`
- 页面引用：`/media/docs/...` 绝对路径
- 原 GIF/PNG 从 `site-docs/` 删除，源文件仍保留在 `docs/`

## 生成

```bash
node migration/generate-url-map.mjs
```

脚本会校验：

- `docs/` 下每个 Markdown 都有映射。
- 映射指向的旧文件存在。
- 输出 113 条记录。

## 状态与动作

| 字段 | 取值 | 说明 |
|---|---|---|
| `status` | `200` | URL 不变 |
| `status` | `301` | 页面迁移或合并到新 URL |
| `status` | `410` | 页面下线，不发布 |
| `action` | `keep` | 保留原位置 |
| `action` | `move` | 移动到新位置 |
| `action` | `merge-into` | 合并到另一个页面 |
| `action` | `internal` | 移出公开站点 |

## 后续

1. 内容 PR 继续补充高频页和新增主题；`merge-into` 正文合并已完成。
2. 410 页面已从构建中排除，并由 `api/gone.js` 在 Vercel 返回 410；git 历史清理需单独评估。
3. 上线前跑 `pnpm verify`：构建、frontmatter、搜索、URL parity 全部通过。
4. 构建原始体积约 32 MB，gzip 约 14.5 MB；如继续压缩，优先处理搜索索引和视频码率。

## 注意

- 映射表是“迁移后 URL”的约定，用于 301/410 和回归检查。
- `site-docs/` 已是唯一内容源，`docs/` 只读；不要运行 `migrate:legacy`，除非需要从旧源重建。
- 阶段 B 会重写绝对链接和相对链接；新增页面如果引用旧目录，仍需手动检查。
- `redirects.csv` 中 410 记录的目标为空；`vercel.json` 使用 `/docs/analysis/(.*)` -> `/api/gone/` rewrite，静态 `pnpm serve` 不会执行该函数。
