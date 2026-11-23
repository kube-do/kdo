#!/usr/bin/env node
/**
 * 检查 site-docs 的 frontmatter 和基础内容约定。
 * 不引入 YAML 依赖，只解析顶层 key；复杂 YAML 仍由 Docusaurus 构建校验。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "site-docs");
const REQUIRED = [
  "title",
  "description",
  "doc_type",
  "audience",
  "owner",
  "last_reviewed",
  "status",
];
const DOC_TYPES = new Set(["tutorial", "how-to", "reference", "explanation"]);
const STATUS = new Set(["draft", "stable", "migrated", "deprecated"]);
const AUDIENCE = new Set(["developer", "admin", "ops", "user"]);

const problems = [];
let checked = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith(".md")) {
      check(full);
    }
  }
}

function check(file) {
  checked++;
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    problems.push(`${rel}: 缺少 frontmatter`);
    return;
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }

  for (const key of REQUIRED) {
    if (!fields[key]) problems.push(`${rel}: 缺少 ${key}`);
  }

  if (fields.doc_type && !DOC_TYPES.has(fields.doc_type.replace(/^["']|["']$/g, ""))) {
    problems.push(`${rel}: doc_type 非法：${fields.doc_type}`);
  }
  if (fields.status && !STATUS.has(fields.status.replace(/^["']|["']$/g, ""))) {
    problems.push(`${rel}: status 非法：${fields.status}`);
  }
  if (fields.last_reviewed && !/^\d{4}-\d{2}-\d{2}$/.test(fields.last_reviewed)) {
    problems.push(`${rel}: last_reviewed 不是 YYYY-MM-DD：${fields.last_reviewed}`);
  }
  if (fields.audience) {
    const values = fields.audience.replace(/^\[|\]$/g, "").split(",");
    for (const value of values) {
      const role = value.trim().replace(/^["']|["']$/g, "");
      if (role && !AUDIENCE.has(role)) {
        problems.push(`${rel}: audience 包含未知角色：${role}`);
      }
    }
  }

  const body = text.slice(match[0].length).replace(/```[\s\S]*?```/g, "");
  if (/^#\s+/m.test(body)) {
    problems.push(`${rel}: 正文包含 H1，请使用 frontmatter title`);
  }
}

walk(DOCS);

if (problems.length) {
  console.error(`Frontmatter 检查失败：${problems.length} 项`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`Frontmatter 检查通过：${checked} 个页面。`);
