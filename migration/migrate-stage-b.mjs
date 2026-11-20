#!/usr/bin/env node
/**
 * 阶段 B：按 url-map.csv 调整信息架构。
 *
 * - move：移动页面及其 imgs/img 资源
 * - merge-into：目标不存在时移过去；目标已存在时先移除旧页，正文合并留给后续 PR
 * - 410：确保旧页不进入构建
 * - 重写站内 /docs/... 链接
 * - 重建 _category_.json
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE = path.join(ROOT, "site-docs");
const MAP = path.join(ROOT, "migration/url-map.csv");

if (!fs.existsSync(SITE)) {
  console.error("缺少 site-docs/，请先执行 pnpm migrate 的阶段 A。");
  process.exit(1);
}

const rows = fs
  .readFileSync(MAP, "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [oldPath, oldUrl, title, newPath, newUrl, status, action] =
      line.split(",");
    return { oldPath, oldUrl, title, newPath, newUrl, status, action };
  });

const siteFile = (file) =>
  path.join(ROOT, file.replace(/^docs\//, "site-docs/"));
const siteDir = (file) => path.dirname(siteFile(file));
const exists = (file) => fs.existsSync(file);
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

function walkDirs(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = path.join(dir, entry.name);
    callback(child);
    walkDirs(child, callback);
  }
}

function walkMarkdown(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(child, callback);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      callback(child);
    }
  }
}

function mergeDirectory(from, to) {
  if (!exists(from)) return;
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      mergeDirectory(src, dest);
    } else if (!exists(dest)) {
      fs.copyFileSync(src, dest);
    } else if (!fs.readFileSync(src).equals(fs.readFileSync(dest))) {
      console.warn(`资源同名但内容不同，保留目标文件：${dest}`);
    }
  }
  fs.rmSync(from, { recursive: true, force: true });
}

function moveAssets(oldFile, newFile) {
  const oldDir = path.dirname(oldFile);
  const newDir = path.dirname(newFile);
  for (const name of ["imgs", "img"]) {
    mergeDirectory(path.join(oldDir, name), path.join(newDir, name));
  }
}

function movePage(row) {
  const oldFile = siteFile(row.oldPath);
  const newFile = siteFile(row.newPath);

  if (!exists(oldFile)) {
    if (exists(newFile)) {
      console.log(`已迁移，跳过：${row.oldUrl}`);
      return;
    }
    throw new Error(`源页面不存在：${row.oldPath}`);
  }

  if (exists(newFile)) {
    console.warn(`目标已存在，跳过移动：${row.oldPath} -> ${row.newPath}`);
    return;
  }

  ensureDir(path.dirname(newFile));
  moveAssets(oldFile, newFile);
  fs.renameSync(oldFile, newFile);
  console.log(`移动：${row.oldUrl} -> ${row.newUrl}`);
}

function mergePage(row) {
  const oldFile = siteFile(row.oldPath);
  const newFile = siteFile(row.newPath);

  if (!exists(oldFile)) {
    console.log(`已合并/已移动，跳过：${row.oldUrl}`);
    return;
  }

  if (!exists(newFile)) {
    movePage(row);
    return;
  }

  // 目标页已经存在：先完成 URL 合并，正文合并留给内容 PR，避免自动拼接造成语义错乱。
  // 旧页面的资源也一并清理，源图仍保留在 docs/，后续内容 PR 需要时再取。
  for (const name of ["imgs", "img"]) {
    fs.rmSync(path.join(path.dirname(oldFile), name), {
      recursive: true,
      force: true,
    });
  }
  fs.rmSync(oldFile, { force: true });
  console.log(`合并跳转（正文待后续 PR）：${row.oldUrl} -> ${row.newUrl}`);
}

for (const row of rows) {
  if (row.status === "301" && row.action === "move") movePage(row);
}
for (const row of rows) {
  if (row.status === "301" && row.action === "merge-into") mergePage(row);
}
for (const row of rows) {
  if (row.status === "410") {
    const oldFile = siteFile(row.oldPath);
    if (exists(oldFile)) fs.rmSync(oldFile, { force: true });
  }
}

// 删除旧分类文件，后面按新目录重建。
walkDirs(SITE, (dir) => {
  const category = path.join(dir, "_category_.json");
  if (exists(category)) fs.rmSync(category, { force: true });
});

// 新增顶层栏目入口；内容后续 PR 继续补充。
const newPages = {
  "reference/index.md": `---
title: 参考手册
description: KDO 的 CRD、配置项、CLI 与 API 参考。
sidebar_position: 1
doc_type: reference
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-20
status: draft
---

## 参考范围

- CRD 与自定义资源字段
- Console、PAC、KDC 的配置项
- 命令行与 API
- 版本兼容矩阵

## 说明

参考内容将优先从代码和 schema 生成，避免与产品实现漂移。
`,
  "release-notes/index.md": `---
title: 发布说明
description: KDO 平台各版本的变更、升级注意事项与已知问题。
sidebar_position: 1
doc_type: reference
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-20
status: draft
---

## 版本记录

发布说明按版本记录新增能力、行为变更、升级步骤和已知问题。

## 升级前检查

升级前请先阅读对应版本的兼容性说明，并完成备份与回滚演练。
`,
  "contributing/index.md": `---
title: 贡献指南
description: 如何参与 KDO 文档与示例的编写、评审和发布。
sidebar_position: 1
doc_type: how-to
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-20
status: draft
---

## 本地开发

\`\`\`bash
pnpm install
pnpm start
\`\`\`

## 文档约定

- 使用简体中文。
- 每页补齐 frontmatter。
- 标题使用显式英文锚点，避免中文锚点变化导致外链失效。
- 截图放在页面同目录的 \`imgs/\` 下。

## 提交前检查

\`\`\`bash
pnpm build
node migration/check-url-parity.mjs
\`\`\`
`,
};

for (const [relative, content] of Object.entries(newPages)) {
  const file = path.join(SITE, relative);
  if (!exists(file)) {
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }
}

// 根入口页由阶段 B 重写，避免阶段 A 生成的旧 IA 链接残留。
fs.writeFileSync(
  path.join(SITE, "index.md"),
  `---
title: KDO 文档
description: KDO（Kubernetes DevOps Platform）官方文档入口。
sidebar_position: 0
doc_type: explanation
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-20
status: migrated
---

KDO 是面向云原生应用开发与运维的一站式平台。

## 按角色进入

- [我是开发者](/docs/developer/)：创建应用、构建镜像、部署与运维工作负载。
- [我是管理员](/docs/admin/)：管理集群、命名空间、权限、通知与平台配置。
- [我要安装 KDO](/docs/install/)：在 Linux 上安装 Kubernetes 与 KDO 平台。

## 按主题浏览

- [快速开始](/docs/quick-start/)
- [工作负载](/docs/developer/workloads/)
- [应用管理](/docs/developer/applications/)
- [可观测性](/docs/observability/)
- [架构与原理](/docs/architecture/)
- [参考手册](/docs/reference/)
- [发布说明](/docs/release-notes/)
- [贡献指南](/docs/contributing/)
`
);

// 重写站内链接。
const linkMap = new Map();
for (const row of rows) {
  if (row.status === "301") linkMap.set(row.oldUrl, row.newUrl);
  if (row.status === "410") linkMap.set(row.oldUrl, "/docs/");
}

const linkEntries = [...linkMap.entries()]
  .flatMap(([from, to]) =>
    from.endsWith("/")
      ? [
          [from, to],
          [from.slice(0, -1), to],
        ]
      : [[from, to]]
  )
  .sort((a, b) => b[0].length - a[0].length);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function rewriteLinks(text) {
  for (const [from, to] of linkEntries) {
    const re = new RegExp(
      `${escapeRegExp(from)}(?=[#?)\\]}"'\\s.,;:]|$)`,
      "g"
    );
    text = text.replace(re, to);
  }
  return text;
}

// 相对链接重写：页面/资源被移动到新目录后，旧的 ../sibling 相对路径可能已经失效。
const pageMap = new Map();
const dirMap = new Map();
for (const row of rows) {
  if (row.status !== "301") continue;
  pageMap.set(row.oldPath, row.newPath);
  const oldDir = path.posix.dirname(row.oldPath);
  const newDir = path.posix.dirname(row.newPath);
  if (!dirMap.has(oldDir)) dirMap.set(oldDir, newDir);
}
const reversePageMap = new Map(
  [...pageMap.entries()].map(([oldPath, newPath]) => [newPath, oldPath])
);
const sortedDirEntries = [...dirMap.entries()].sort(
  (a, b) => b[0].length - a[0].length
);

function mapOldTarget(oldTarget) {
  if (pageMap.has(oldTarget)) return pageMap.get(oldTarget);
  if (pageMap.has(`${oldTarget}/index.md`)) {
    return pageMap.get(`${oldTarget}/index.md`);
  }

  for (const [oldDir, newDir] of sortedDirEntries) {
    if (oldTarget === oldDir || oldTarget.startsWith(`${oldDir}/`)) {
      const suffix = oldTarget.slice(oldDir.length).replace(/^\//, "");
      return suffix ? path.posix.join(newDir, suffix) : newDir;
    }
  }
  return null;
}

function rewriteRelativeTarget(target, oldFile, newFile) {
  if (
    !target ||
    target.startsWith("/") ||
    target.startsWith("#") ||
    /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)
  ) {
    return target;
  }

  const match = target.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!match) return target;
  const [, targetPath, query = "", hash = ""] = match;
  if (!targetPath) return target;

  const oldTarget = path.posix.normalize(
    path.posix.join(path.posix.dirname(oldFile), targetPath)
  );
  const newTarget = mapOldTarget(oldTarget);
  if (!newTarget) return target;

  const newRelative = path.posix.relative(
    path.posix.dirname(newFile.replace(/^site-docs\//, "")),
    newTarget.replace(/^docs\//, "")
  );
  const trailingSlash = targetPath.endsWith("/") ? "/" : "";
  const result = `${newRelative}${trailingSlash}${query}${hash}`;
  return result === target ? target : result;
}

function rewriteRelativeLinks(text, oldFile, newFile) {
  const markdown = text.replace(
    /(\]\(\s*)([^)\s]+)([^)]*\))/g,
    (whole, prefix, target, suffix) =>
      `${prefix}${rewriteRelativeTarget(target, oldFile, newFile)}${suffix}`
  );
  return markdown.replace(
    /^(\s*\[[^\]]+\]:\s*)(\S+)/gm,
    (whole, prefix, target) =>
      `${prefix}${rewriteRelativeTarget(target, oldFile, newFile)}`
  );
}

let rewritten = 0;
walkMarkdown(SITE, (file) => {
  const before = fs.readFileSync(file, "utf8");
  const siteRelative = path.relative(ROOT, file).split(path.sep).join("/");
  const oldFile =
    reversePageMap.get(`docs/${siteRelative.replace(/^site-docs\//, "")}`) ||
    `docs/${siteRelative.replace(/^site-docs\//, "")}`;
  const after = rewriteRelativeLinks(
    rewriteLinks(before),
    oldFile,
    siteRelative
  );
  if (after !== before) {
    fs.writeFileSync(file, after);
    rewritten++;
  }
});

// 空目录清理。
function prune(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) prune(path.join(dir, entry.name));
  }
  if (dir !== SITE && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}
prune(SITE);

// 重建分类。
const TOP = {
  "quick-start": { label: "快速开始", position: 1 },
  install: { label: "安装与升级", position: 2 },
  developer: { label: "开发指南", position: 3 },
  admin: { label: "管理指南", position: 4 },
  observability: { label: "可观测性", position: 5 },
  reference: { label: "参考手册", position: 6 },
  architecture: { label: "架构", position: 7 },
  "release-notes": { label: "发布说明", position: 8 },
  contributing: { label: "贡献指南", position: 9 },
};

const FALLBACK_LABELS = {
  "developer/delivery": "交付与流水线",
  "developer/best-practices": "最佳实践",
  "developer/dev-environments": "开发环境",
  "developer/applications/quality": "代码质量",
  "admin/maintenance": "运维与证书",
};

function frontmatterTitle(file) {
  const content = fs.readFileSync(file, "utf8");
  const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return null;
  const line = block[1].match(/^title:\s*(.+)$/m);
  return line ? line[1].trim().replace(/^["']|["']$/g, "") : null;
}

function sidebarPosition(file) {
  const content = fs.readFileSync(file, "utf8");
  const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return 999;
  const line = block[1].match(/^sidebar_position:\s*(\d+)$/m);
  return line ? Number(line[1]) : 999;
}

function hasMarkdown(dir) {
  if (!exists(dir)) return false;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) return true;
    if (entry.isDirectory() && hasMarkdown(path.join(dir, entry.name))) {
      return true;
    }
  }
  return false;
}

function buildCategories(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) buildCategories(path.join(dir, entry.name));
  }

  if (dir === SITE) return;

  const relative = path.relative(SITE, dir).split(path.sep).join("/");
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const markdown = files
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);
  const subdirs = files
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name))
    .filter(hasMarkdown);

  const isTop = Boolean(TOP[relative]);
  const hasIndex = markdown.includes("index.md");
  const needsCategory =
    isTop || subdirs.length > 0 || markdown.filter((file) => file !== "index.md").length > 0;

  if (!needsCategory) return;

  const indexFile = path.join(dir, "index.md");
  const label =
    TOP[relative]?.label ||
    (exists(indexFile) ? frontmatterTitle(indexFile) : null) ||
    FALLBACK_LABELS[relative] ||
    relative.split("/").pop();

  const category = {
    label,
    position: TOP[relative]?.position || (exists(indexFile) ? sidebarPosition(indexFile) : 999),
    collapsed: false,
  };

  if (exists(indexFile)) {
    category.link = { type: "doc", id: `${relative}/index` };
  }

  fs.writeFileSync(
    path.join(dir, "_category_.json"),
    `${JSON.stringify(category, null, 2)}\n`
  );
}

buildCategories(SITE);

// 合并页面后保留旧锚点：旧 /docs/storage/#存储概念 现在落到 /docs/admin/storage/。
const storageIndex = path.join(SITE, "admin/storage/index.md");
if (fs.existsSync(storageIndex)) {
  const before = fs.readFileSync(storageIndex, "utf8");
  if (!before.includes('id="存储概念"')) {
    const after = before.replace(
      /^## 核心概念$/m,
      '<a id="存储概念"></a>\n\n## 核心概念'
    );
    if (after !== before) fs.writeFileSync(storageIndex, after);
  }
}

console.log(`阶段 B 完成：重写 ${rewritten} 个页面的站内链接。`);
