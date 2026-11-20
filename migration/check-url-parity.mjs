#!/usr/bin/env node
/**
 * 阶段 A URL parity 检查：旧站 200/301 页面必须在新构建中存在。
 * 410 页面必须没有产物。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BUILD = path.join(ROOT, 'build');
const MAP = path.join(ROOT, 'migration/url-map.csv');

if (!fs.existsSync(BUILD)) {
  console.error('缺少 build/，请先执行 pnpm build');
  process.exit(1);
}

const rows = fs
  .readFileSync(MAP, 'utf8')
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [oldPath, oldUrl, title, newPath, newUrl, status] = line.split(',');
    return {oldPath, oldUrl, title, newPath, newUrl, status};
  });

const missing = [];
let checked = 0;
let skipped = 0;

for (const row of rows) {
  if (row.status === '410') {
    skipped++;
    const legacyPath = path.join(BUILD, row.oldUrl, 'index.html');
    if (fs.existsSync(legacyPath)) {
      missing.push(`410 页面仍有产物：${row.oldUrl}`);
    }
    continue;
  }

  checked++;
  const output = path.join(BUILD, row.oldUrl, 'index.html');
  if (!fs.existsSync(output)) missing.push(`${row.status} 缺少产物：${row.oldUrl}`);
}

const docsIndex = path.join(BUILD, 'docs/index.html');
if (!fs.existsSync(docsIndex)) missing.push('缺少 /docs/ 入口页');

const searchIndex = path.join(BUILD, 'search-index.json');
if (!fs.existsSync(searchIndex)) missing.push('缺少搜索索引 search-index.json');

if (missing.length) {
  console.error(`URL parity 失败：${missing.length} 项`);
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`URL parity 通过：${checked}/${rows.length - skipped} 个页面存在，${skipped} 个 410 页面已排除。`);
