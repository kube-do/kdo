# KDO 文档迁移资产

本目录存放 URL 映射、迁移脚本和校验工具，不是文档内容。

## 阶段 A / B 已完成

- `migrate-stage-a.mjs`：把 `docs/` 同构迁移到 `site-docs/`，保持旧 URL。
- `migrate-stage-b.mjs`：按 `url-map.csv` 调整 IA，移动页面与资源、重写绝对/相对链接、重建分类、兼容旧锚点。
- `optimize-assets.mjs`：资源治理，删除未引用图片、合并重复图片、GIF 转 MP4 + WebP poster、PNG 转 WebP。
- `sync-downloads.mjs`：把根目录的 `kdo-developer.tar.gz` 与 `agent-setup*.sh` 复制到 `static/`，保证站点根路径可下载。
- `generate-vercel-redirects.mjs`：从 `redirects.csv` 生成 `vercel.json` 的 301 重定向。
- `check-url-parity.mjs`：构建后检查 200/301/410 与 `vercel.json` 重定向是否一致。
- 当前结果：`site-docs/` 共 106 篇 Markdown，9 个顶层栏目；19 个保持页、91 个 301、3 个 410。
- 图片治理后：`site-docs/` 约 11 MB，`static/media/` 约 8 MB，构建产物约 38 MB。

**`site-docs/` 现在是唯一内容源，日常直接编辑。**

```bash
pnpm migrate          # 资源治理 + 下载同步 + redirects 生成
pnpm build
node migration/check-url-parity.mjs
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
| `prototype-docs/` | 首批 5 篇样板页，保留作设计参考 |

## 资源治理

`optimize-assets.mjs` 需要：

- `ffmpeg`（GIF -> MP4 + WebP poster）
- `sharp`（PNG -> WebP）

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

1. 内容 PR 继续合并 `merge-into` 页面正文，当前阶段 B 只做跳转，未做正文合并。
2. 410 页面确认已从构建中排除，并评估 git 历史清理。
3. 上线前跑 URL parity：旧 URL 全部 301 到预期新 URL，新 URL 全部 200。
4. 继续把构建体积压到 30 MB 以内。

## 注意

- 映射表是“迁移后 URL”的约定，不代表页面内容已经合并完成。
- 合并页（`merge-into`）需要确认新页面确实覆盖旧内容后再删除旧页。
- 阶段 B 会重写绝对链接和相对链接；新增页面如果引用旧目录，仍需手动检查。
- `redirects.csv` 中 410 记录的目标为空，Vercel 原生 redirects 不直接支持 410；正式上线时需要用中间页或边缘函数实现，或在构建层排除并返回 404/410。
