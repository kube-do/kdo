# KDO 文档迁移资产

本目录存放 URL 映射、迁移脚本和校验工具，不是文档内容。

## 阶段 A 已落地

- `migrate-stage-a.mjs`：把 `docs/` 同构迁移到 `site-docs/`，保持 URL 不变。
- `optimize-assets.mjs`：资源治理，删除未引用图片、合并重复图片、GIF 转 MP4 + WebP poster、PNG 转 WebP。
- `check-url-parity.mjs`：构建后检查旧 URL 是否都有产物，410 页面是否已排除。
- `sync-downloads.mjs`：把根目录的 `kdo-developer.tar.gz` 与 `agent-setup*.sh` 复制到 `static/`，保证站点根路径可下载。
- 当前结果：110 个页面迁移，3 个 `docs/analysis/*` 页面 410，`/docs/` 入口页新增。
- 图片治理后：`site-docs/` 约 9 MB，`static/media/` 约 8 MB，构建产物约 38 MB。

```bash
pnpm migrate
pnpm build
node migration/check-url-parity.mjs
```

`pnpm migrate` 等价于：

```bash
node migration/migrate-stage-a.mjs
node migration/optimize-assets.mjs
node migration/sync-downloads.mjs
```

注意：迁移脚本会清空并重建 `site-docs/`，优化脚本会重建 `static/media/docs/`。不要直接手改这两个生成目录后重跑；源内容仍以 `docs/` 为准，阶段 B 切换后再反转。

## 文件

| 文件 | 说明 |
|---|---|
| `generate-url-map.mjs` | 从 `docs/` 和映射规则生成 113 条旧 URL 映射 |
| `url-map.csv` | 完整映射表，供脚本和 review 使用 |
| `url-map.md` | 可读版映射表，按栏目分组 |
| `redirects.csv` | 只包含 301/410 的重定向清单 |
| `migrate-stage-a.mjs` | Jekyll -> Docusaurus 同构迁移脚本 |
| `optimize-assets.mjs` | 图片去重、去未引用、GIF -> MP4、PNG -> WebP |
| `sync-downloads.mjs` | 同步根目录下载文件到 `static/` |
| `check-url-parity.mjs` | 构建产物 URL parity 检查 |
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

1. 用 `redirects.csv` 生成 `vercel.json` 的 `redirects`。
2. 用 `url-map.csv` 驱动 `migrate/links.ts` 重写站内链接。
3. 上线前跑 URL parity：旧 URL 全部 200 或 301 到预期新 URL。
4. 410 页面确认已从构建中排除，并评估 git 历史清理。

## 注意

- 映射表是“迁移后 URL”的约定，不代表页面内容已经迁移。
- 合并页（`merge-into`）需要确认新页面确实覆盖旧内容后再删除旧页。
- `redirects.csv` 中 410 记录的目标为空，Vercel 原生 redirects 不直接支持 410；正式上线时需要用中间页或边缘函数实现，或在构建层排除并返回 404/410。
