#!/usr/bin/env node
/**
 * 阶段 B URL parity 检查：
 * - 200：旧 URL 仍是新 URL，页面产物必须存在
 * - 301：新 URL 产物必须存在，旧 URL 产物必须已移除，vercel.json 重定向必须一致
 * - 410：旧 URL 不能有产物
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BUILD = path.join(ROOT, "build");
const MAP = path.join(ROOT, "migration/url-map.csv");
const VERCEL = path.join(ROOT, "vercel.json");

if (!fs.existsSync(BUILD)) {
  console.error("缺少 build/，请先执行 pnpm build");
  process.exit(1);
}

const rows = fs
  .readFileSync(MAP, "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [oldPath, oldUrl, title, newPath, newUrl, status] = line.split(",");
    return { oldPath, oldUrl, title, newPath, newUrl, status };
  });

const outputFor = (url) => path.join(BUILD, url, "index.html");
const exists = (file) => fs.existsSync(file);

const problems = [];
let kept = 0;
let redirected = 0;
let gone = 0;

for (const row of rows) {
  if (row.status === "200") {
    kept++;
    if (!exists(outputFor(row.newUrl))) {
      problems.push(`200 缺少产物：${row.newUrl}`);
    }
    continue;
  }

  if (row.status === "301") {
    redirected++;
    if (!exists(outputFor(row.newUrl))) {
      problems.push(`301 目标缺少产物：${row.newUrl}（来自 ${row.oldUrl}）`);
    }
    if (exists(outputFor(row.oldUrl))) {
      problems.push(`301 旧地址仍有产物：${row.oldUrl}`);
    }
    continue;
  }

  if (row.status === "410") {
    gone++;
    if (exists(outputFor(row.oldUrl))) {
      problems.push(`410 页面仍有产物：${row.oldUrl}`);
    }
  }
}

const config = JSON.parse(fs.readFileSync(VERCEL, "utf8"));
const redirects = new Map(
  (config.redirects || []).map((redirect) => [redirect.source, redirect])
);

for (const row of rows) {
  if (row.status !== "301") continue;
  const redirect = redirects.get(row.oldUrl);
  if (!redirect) {
    problems.push(`vercel.json 缺少重定向：${row.oldUrl}`);
    continue;
  }
  if (redirect.destination !== row.newUrl) {
    problems.push(
      `重定向目标不一致：${row.oldUrl} -> ${redirect.destination}，应为 ${row.newUrl}`
    );
  }
  if (redirect.statusCode !== 301) {
    problems.push(
      `重定向状态码不是 301：${row.oldUrl} -> ${redirect.statusCode}`
    );
  }
}

for (const source of redirects.keys()) {
  if (!rows.some((row) => row.status === "301" && row.oldUrl === source)) {
    problems.push(`vercel.json 存在映射表之外的重定向：${source}`);
  }
}

if (rows.some((row) => row.status === "410")) {
  const goneRewrite = (config.rewrites || []).find(
    (rewrite) =>
      rewrite.source === "/docs/analysis/:path*" &&
      rewrite.destination === "/api/gone/"
  );
  if (!goneRewrite) {
    problems.push("vercel.json 缺少 /docs/analysis/* 到 /api/gone 的 rewrite");
  }
  if (!fs.existsSync(path.join(ROOT, "api/gone.js"))) {
    problems.push("缺少 api/gone.js，410 页面无法返回 Gone");
  }
}

if (!exists(path.join(BUILD, "docs/index.html"))) {
  problems.push("缺少 /docs/ 入口页");
}

if (!exists(path.join(BUILD, "search-index.json"))) {
  problems.push("缺少搜索索引 search-index.json");
}

if (problems.length) {
  console.error(`URL parity 失败：${problems.length} 项`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(
  `URL parity 通过：${kept} 个保持页、${redirected} 个 301 目标、${gone} 个 410 页面，vercel.json 重定向一致。`
);
