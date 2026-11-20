#!/usr/bin/env node
/**
 * 阶段 A：Jekyll -> Docusaurus 同构迁移。
 *
 * 输入：docs/（现有 Jekyll 内容，URL 为 /docs/...）
 * 输出：site-docs/（Docusaurus 内容，保持相同目录层级与 URL）
 *
 * 只做语法与元数据转换，不改 IA、不改正文结构：
 * - 清理 Jekyll frontmatter（parent/nav_order/has_children）
 * - 补 Docusaurus 内容模型字段
 * - 转换 callout、TOC、按钮标记
 * - 去掉正文重复 H1
 * - 复制图片等非 Markdown 资源
 * - 生成 _category_.json
 *
 * 不处理的页面：docs/analysis/*（计划 410 下线）。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, 'site-docs');
const SKIP_DIRS = new Set(['analysis']);

const TOP_LEVEL_POSITION = {
  'quick-start': 1,
  dev: 2,
  admin: 3,
  devops: 4,
  observability: 5,
  'workload-actions': 6,
  install: 7,
  rbac: 8,
  storage: 9,
  terminal: 10,
  ide: 11,
  aiops: 12,
  architecture: 13,
};

const CATEGORY_LABELS = {
  'application-management': '应用管理',
  management: '管理',
  networking: '网络',
  'user-management': '用户管理',
  workloads: '工作负载',
  applications: '应用管理',
  configurations: '配置管理',
  'network-storage': '网络与存储',
  home: '开发者主页',
  observe: '观测平台',
  'app-deploy': '部署应用',
  continuous: '持续交付',
  'operator-hub': 'OperatorHub',
  operators: '安装的 Operators',
  'pipelines-as-code': 'Pipelines as Code',
  'persistent-volume-claims': '持久卷声明',
  'workload-actions': '工作负载操作',
  'monitoring': '监控',
};

const CALLOUT_RE = /^\s*\{:\s*\.(note|warning|important|highlight)\s*\}\s*$/;
const TOC_LINE_RE = /^\s*(?:\*|1\.)\s*TOC\s*$/i;

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) return [];
      return walk(full);
    }
    return [full];
  });
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {data: {}, body: text};

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const index = line.indexOf(':');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (/^\d+$/.test(value)) value = Number(value);
    data[key] = value;
  }

  return {data, body: text.slice(match[0].length)};
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function stripToc(body) {
  const lines = body.split(/\r?\n/);
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    if (TOC_LINE_RE.test(lines[i]) && /^\s*\{:\s*toc\s*\}\s*$/.test(lines[i + 1] ?? '')) {
      i++;
      continue;
    }
    if (/^\s*\{:\s*toc\s*\}\s*$/.test(lines[i])) continue;
    result.push(lines[i]);
  }
  return result.join('\n');
}

function convertCallouts(body) {
  const lines = body.split(/\r?\n/);
  const out = [];
  const typeMap = {
    note: 'note',
    warning: 'warning',
    important: 'info',
    highlight: 'tip',
  };

  const ensureBlankBefore = () => {
    if (out.length > 0 && out[out.length - 1].trim() !== '') out.push('');
  };

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(CALLOUT_RE);
    if (!match) {
      out.push(lines[i]);
      continue;
    }

    const type = typeMap[match[1]];
    const isAfter = i > 0 && lines[i - 1].trim() !== '';

    if (isAfter) {
      // Jekyll 允许把 {: .note } 放在段落之后，作用于上一个块。
      let start = out.length - 1;
      while (start > 0 && out[start - 1].trim() !== '') start--;
      const block = out.splice(start);
      ensureBlankBefore();
      out.push(`:::${type}`, '', ...block, '', ':::');
      continue;
    }

    // 放在块之前：只包裹紧随其后的第一个块，避免把后面的图片/表格吞进提示框。
    let start = i + 1;
    while (start < lines.length && lines[start].trim() === '') start++;
    if (start >= lines.length) continue;

    let end = start;
    if (lines[start].trimStart().startsWith('```')) {
      const fence = lines[start].trimStart().slice(0, 3);
      end = start + 1;
      while (end < lines.length && !lines[end].trimStart().startsWith(fence)) end++;
      if (end < lines.length) end++;
    } else {
      while (end < lines.length && lines[end].trim() !== '') end++;
    }

    ensureBlankBefore();
    out.push(`:::${type}`, '', ...lines.slice(start, end), '', ':::');
    i = end - 1;
  }

  return out.join('\n');
}

function convertButtons(body) {
  return body.replace(/\[([^\]]+)\]\(\)\{:\s*\.btn[^}]*\}/g, '**$1**');
}

function rewriteKnownAnchors(body, rel) {
  let result = body;

  if (rel === 'dev/applications/repository/index.md') {
    result = result.replace(
      '## 创建应用表单说明',
      '## 创建应用表单说明 {#create-application}',
    );
  }

  if (rel === 'install/index.md') {
    result = result.replace(
      '## 根据 OIDC 平台设置 Kubernetes',
      '## 根据 OIDC 平台设置 Kubernetes {#configure-kubernetes-oidc}',
    );
  }

  return result
    .replace(/\/docs\/dev\/applications\/repository\/#创建应用/g, '/docs/dev/applications/repository/#create-application')
    .replace(/\/docs\/dev\/applications\/repository#创建应用/g, '/docs/dev/applications/repository/#create-application')
    .replace(/\/docs\/install\/#根据oidc平台设置kubernetes/g, '/docs/install/#configure-kubernetes-oidc')
    .replace(/#根据oidc平台设置kubernetes/g, '#configure-kubernetes-oidc');
}

function removeLeadingH1(body) {
  const lines = body.split(/\r?\n/);
  let index = 0;
  while (index < lines.length && lines[index].trim() === '') index++;
  if (index < lines.length && /^#\s+/.test(lines[index])) {
    lines.splice(index, 1);
    if (lines[index] !== undefined && lines[index].trim() === '') lines.splice(index, 1);
  }
  return lines.join('\n');
}

function plainText(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/```[\s\S]*$/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{:[^}]*\}/g, ' ')
    .replace(/^:::.*$/gm, ' ')
    .replace(/[#>*_`|~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDescription(body) {
  const lines = body.split(/\r?\n/);
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line) continue;
    if (
      line.startsWith('#') ||
      line.startsWith('|') ||
      line.startsWith('![') ||
      line.startsWith('>') ||
      line.startsWith(':::') ||
      line.startsWith('{:') ||
      line.startsWith('- ') ||
      line.startsWith('* ') ||
      /^\d+\.\s/.test(line)
    ) {
      continue;
    }

    const paragraph = [line];
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (
        !next ||
        next.startsWith('#') ||
        next.startsWith('|') ||
        next.startsWith('![') ||
        next.startsWith('>') ||
        next.startsWith(':::') ||
        next.startsWith('{:') ||
        next.startsWith('- ') ||
        next.startsWith('* ') ||
        /^\d+\.\s/.test(next)
      ) {
        break;
      }
      paragraph.push(next);
    }

    const text = plainText(paragraph.join(' '));
    if (text) return text.slice(0, 160);
  }

  return '';
}

function inferDocType(rel) {
  if (rel.startsWith('quick-start/')) return 'tutorial';
  if (rel.endsWith('/index.md') || rel === 'index.md') return 'explanation';
  if (rel.startsWith('architecture/')) return 'explanation';
  return 'how-to';
}

function inferAudience(rel) {
  if (rel.startsWith('admin/') || rel.startsWith('install/') || rel.startsWith('rbac/')) {
    return ['admin'];
  }
  if (rel.startsWith('observability/')) return ['admin', 'developer'];
  if (
    rel.startsWith('dev/') ||
    rel.startsWith('devops/') ||
    rel.startsWith('ide/') ||
    rel.startsWith('terminal/') ||
    rel.startsWith('workload-actions/')
  ) {
    return ['developer'];
  }
  return ['developer', 'admin'];
}

function inferOwner(rel) {
  if (rel.startsWith('admin/') || rel.startsWith('install/') || rel.startsWith('rbac/')) {
    return 'docs-admin';
  }
  if (rel.startsWith('observability/') || rel.startsWith('devops/')) return 'docs-ops';
  if (
    rel.startsWith('dev/') ||
    rel.startsWith('ide/') ||
    rel.startsWith('terminal/') ||
    rel.startsWith('workload-actions/')
  ) {
    return 'docs-dev';
  }
  return 'docs-team';
}

function buildFrontmatter({rel, data, title, body, descriptionSource, existingDescription}) {
  const topLevel = rel.split('/')[0];
  const isTopIndex = rel === `${topLevel}/index.md`;
  const position =
    (isTopIndex && TOP_LEVEL_POSITION[topLevel]) ||
    (Number.isFinite(data.nav_order) ? data.nav_order : undefined);

  const description =
    existingDescription ||
    extractDescription(descriptionSource ?? body) ||
    `${title} - KDO 官方文档`;

  const lines = [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
  ];

  if (data.keywords) lines.push(`keywords: ${yamlString(data.keywords)}`);
  if (position !== undefined) lines.push(`sidebar_position: ${position}`);

  lines.push(
    `doc_type: ${inferDocType(rel)}`,
    `audience: [${inferAudience(rel).join(', ')}]`,
    `owner: ${inferOwner(rel)}`,
    'last_reviewed: 2026-11-20',
    'status: migrated',
    '---',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function copyAssets() {
  fs.cpSync(SRC, OUT, {
    recursive: true,
    filter(source) {
      const rel = path.relative(SRC, source);
      if (rel.split(path.sep).some((part) => SKIP_DIRS.has(part))) return false;
      if (source.endsWith('.md')) return false;
      return true;
    },
  });
}

function parseGeneratedFrontmatter(file) {
  if (!fs.existsSync(file)) return {};
  const {data} = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  return data;
}

function hasMarkdown(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).some((entry) => {
    if (entry.isFile()) return entry.name.endsWith('.md');
    if (entry.isDirectory()) return hasMarkdown(path.join(dir, entry.name));
    return false;
  });
}

function generateCategories() {
  const dirs = [];

  function collect(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      dirs.push(full);
      collect(full);
    }
  }

  // 先清掉旧结果，避免 leaf 目录残留 category。
  const removeCategoryFiles = (dir) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) removeCategoryFiles(full);
      else if (entry.name === '_category_.json') fs.rmSync(full);
    }
  };
  removeCategoryFiles(OUT);

  collect(OUT);

  for (const dir of dirs.sort((a, b) => b.length - a.length)) {
    const relDir = path.relative(OUT, dir).split(path.sep).join('/');
    const entries = fs.readdirSync(dir, {withFileTypes: true});
    const indexFile = path.join(dir, 'index.md');
    const childDirs = entries.filter(
      (entry) => entry.isDirectory() && hasMarkdown(path.join(dir, entry.name)),
    );
    const childDocs = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md',
    );

    if (!childDirs.length && !childDocs.length) continue;

    const indexData = parseGeneratedFrontmatter(indexFile);
    const basename = path.basename(dir);
    let label = indexData.title || CATEGORY_LABELS[basename] || basename;

    if (!indexData.title) {
      const parents = childDocs
        .map((entry) => parseGeneratedFrontmatter(path.join(dir, entry.name)).parent)
        .filter(Boolean);
      if (parents.length && new Set(parents).size === 1) label = parents[0];
    }

    const topLevel = relDir.split('/')[0];
    let position = Number(indexData.sidebar_position);
    if (!Number.isFinite(position)) {
      const positions = [...childDirs, ...childDocs]
        .map((entry) => {
          if (entry.isDirectory()) {
            return parseGeneratedFrontmatter(path.join(dir, entry.name, 'index.md')).sidebar_position;
          }
          return parseGeneratedFrontmatter(path.join(dir, entry.name)).sidebar_position;
        })
        .map(Number)
        .filter(Number.isFinite);
      position = positions.length ? Math.min(...positions) : 100;
    }
    if (relDir === topLevel && TOP_LEVEL_POSITION[topLevel]) {
      position = TOP_LEVEL_POSITION[topLevel];
    }

    const category = {
      label,
      position,
      collapsed: false,
    };

    if (fs.existsSync(indexFile)) {
      category.link = {type: 'doc', id: `${relDir}/index`};
    }

    fs.writeFileSync(path.join(dir, '_category_.json'), `${JSON.stringify(category, null, 2)}\n`);
  }
}

function main() {
  if (!fs.existsSync(SRC)) throw new Error(`缺少源目录：${SRC}`);
  fs.rmSync(OUT, {recursive: true, force: true});
  fs.mkdirSync(OUT, {recursive: true});

  copyAssets();

  const files = walk(SRC).filter((file) => file.endsWith('.md'));
  let migrated = 0;

  for (const file of files) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    const {data, body: rawBody} = parseFrontmatter(fs.readFileSync(file, 'utf8'));

    const bodyWithoutToc = stripToc(rawBody);
    let body = convertCallouts(bodyWithoutToc);
    body = convertButtons(body);
    body = rewriteKnownAnchors(body, rel);
    body = removeLeadingH1(body).replace(/^\s*\n/, '');

    const firstH1 = rawBody.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const title = data.title || firstH1 || path.basename(file, '.md');
    const frontmatter = buildFrontmatter({
      rel,
      data,
      title,
      body,
      descriptionSource: bodyWithoutToc,
      existingDescription: data.description,
    });

    const target = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, `${frontmatter}${body.trimEnd()}\n`);
    migrated++;
  }

  // /docs/ 入口页（旧站没有 docs/index.md）。
  fs.writeFileSync(
    path.join(OUT, 'index.md'),
    `---\ntitle: KDO 文档\ndescription: KDO（Kubernetes DevOps Platform）官方文档入口。\nsidebar_position: 0\ndoc_type: explanation\naudience: [developer, admin]\nowner: docs-team\nlast_reviewed: 2026-11-20\nstatus: migrated\n---\n\n# KDO 文档\n\nKDO 是面向云原生应用开发与运维的一站式平台。\n\n## 按角色进入\n\n- [我是开发者](/docs/dev/)：创建应用、构建镜像、部署与运维工作负载。\n- [我是管理员](/docs/admin/)：管理集群、命名空间、权限、通知与平台配置。\n- [我要安装 KDO](/docs/install/)：在 Linux 上安装 Kubernetes 与 KDO 平台。\n\n## 按主题浏览\n\n- [快速开始](/docs/quick-start/)\n- [工作负载](/docs/dev/workloads/)\n- [应用管理](/docs/dev/applications/)\n- [可观测性](/docs/observability/)\n- [架构与原理](/docs/architecture/)\n`,
  );

  generateCategories();

  console.log(`迁移完成：${migrated} 个 Markdown -> ${path.relative(ROOT, OUT)}/`);
}

main();
