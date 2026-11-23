# KDO 文档迁移资产

本目录存放 URL 映射、迁移脚本和校验工具，不是文档内容。

## 当前状态

- `site-docs/` 是唯一内容源，共 **142 篇 Markdown**，9 个顶层栏目。
- 19 个 URL 保持、91 个旧 URL 配置 301、3 篇内部分析通过 410 下线。
- 资源治理后：`site-docs/` 约 8.6 MB，`static/media/` 约 4.9 MB，构建产物约 32 MB（gzip 约 14.5 MB）。

## 旧 Jekyll 归档

旧 Jekyll 内容已从 `main` 删除，归档在 tag：

```text
legacy-jekyll-archive-2026-11-23
```

需要从旧源重建或重新生成 URL 映射时，先 checkout 该 tag 获取 `docs/`。日常不要恢复旧目录，也不要在当前分支运行阶段 A/B 脚本。

## 日常命令

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

## 文件

| 文件 | 说明 |
|---|---|
| `generate-url-map.mjs` | 历史脚本：从归档的 `docs/` 生成 113 条旧 URL 映射 |
| `url-map.csv` | 完整映射表，供脚本和 review 使用 |
| `url-map.md` | 可读版映射表，按栏目分组 |
| `redirects.csv` | 只包含 301/410 的重定向清单 |
| `migrate-stage-a.mjs` | 历史脚本：Jekyll -> Docusaurus 同构迁移 |
| `migrate-stage-b.mjs` | 历史脚本：IA 移动、链接重写、分类重建、锚点兼容 |
| `optimize-assets.mjs` | 图片去重、去未引用、GIF -> MP4、PNG/JPG -> WebP |
| `sync-downloads.mjs` | 同步根目录下载文件到 `static/` |
| `generate-vercel-redirects.mjs` | 从 `redirects.csv` 生成 301 |
| `check-url-parity.mjs` | 构建产物 URL parity 与 redirects 一致性检查 |
| `check-frontmatter.mjs` | frontmatter、字段枚举、正文 H1 检查 |
| `check-search.mjs` | 高频中文搜索词回归检查 |
| `generate-crd-reference.py` | 从 KDC/PAC CRD 清单生成 `site-docs/reference/crd/` |
| `prototype-docs/` | 首批 5 篇样板页，保留作设计参考 |

## CRD 参考生成

需要本地存在 KDC 与 Pipelines as Code 仓库，并安装 PyYAML：

```bash
python3 -m pip install pyyaml
python3 migration/generate-crd-reference.py
```

脚本默认读取同级目录：

- `../kdc/config/crd/bases/*.yaml`
- `../pipelines-as-code/config/300-repositories.yaml`

如果仓库不在同级目录，可以用环境变量覆盖：

```bash
KDC_CRD_DIR=/path/to/kdc/config/crd/bases \
PAC_CRD=/path/to/pipelines-as-code/config/300-repositories.yaml \
python3 migration/generate-crd-reference.py
```

源目录或文件不存在时脚本会直接报错退出。

输出：

- `site-docs/reference/crd/index.md`
- `site-docs/reference/crd/kdc.md`
- `site-docs/reference/crd/pac.md`

CRD 升级后重新生成并运行 `pnpm verify`。

## 资源治理

`optimize-assets.mjs` 需要：

- `ffmpeg`（GIF -> MP4 + WebP poster）
- `sharp`（PNG/JPG -> WebP）

输出约定：

- 视频与 poster：`static/media/docs/<原相对路径>/`
- 页面引用：`/media/docs/...` 绝对路径
- 原 GIF/PNG 从 `site-docs/` 删除，源文件已归档在 tag 中

## URL 映射生成

仅在需要回溯旧站时使用：

```bash
git checkout legacy-jekyll-archive-2026-11-23
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
- `site-docs/` 是唯一内容源；旧 Jekyll 内容归档在 tag 中。
- 阶段 B 会重写绝对链接和相对链接；新增页面如果引用旧目录，仍需手动检查。
- `redirects.csv` 中 410 记录的目标为空；`vercel.json` 使用 `/docs/analysis/(.*)` -> `/api/gone/` rewrite，静态 `pnpm serve` 不会执行该函数。
