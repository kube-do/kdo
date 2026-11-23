#!/usr/bin/env node
/**
 * 从 migration/redirects.csv 生成 vercel.json 的 redirects。
 *
 * 只生成 301；410 页面由 vercel.json 的 rewrite 转发到 /api/gone/ 返回。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CSV = path.join(ROOT, "migration/redirects.csv");
const VERCEL = path.join(ROOT, "vercel.json");

const rows = fs
  .readFileSync(CSV, "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [source, destination, status] = line.split(",");
    return { source, destination, status };
  });

const redirects = rows
  .filter((row) => row.status === "301")
  .map((row) => ({
    source: row.source,
    destination: row.destination,
    statusCode: 301,
  }));

const seen = new Set();
for (const redirect of redirects) {
  const key = `${redirect.source}->${redirect.destination}`;
  if (seen.has(key)) {
    throw new Error(`重复重定向：${key}`);
  }
  seen.add(key);
}

const config = JSON.parse(fs.readFileSync(VERCEL, "utf8"));
config.redirects = redirects;

fs.writeFileSync(VERCEL, `${JSON.stringify(config, null, 2)}\n`);

const skipped = rows.length - redirects.length;
console.log(
  `已生成 ${redirects.length} 条 301 重定向到 vercel.json；${skipped} 条 410 由 /docs/analysis/* rewrite 返回。`
);
