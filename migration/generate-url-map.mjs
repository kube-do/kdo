#!/usr/bin/env node
/**
 * 生成 KDO 文档站 113 条旧 URL 映射表。
 *
 * 用法：
 *   node migration/generate-url-map.mjs
 *
 * 输出：
 *   migration/url-map.csv
 *   migration/url-map.md
 *   migration/redirects.csv
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const docsRoot = path.join(repoRoot, 'docs');

/**
 * 目标信息架构映射。
 * newPath 为 '' 表示不发布（410）。
 */
const mapping = {
  'admin/application-management/index.md': ['admin/operators/index.md', 'merge-into', 301, 'docs-admin', 'P1', '合并到管理员 Operator 入口'],
  'admin/application-management/operator-hub/index.md': ['admin/operators/operator-hub/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/application-management/operators/index.md': ['admin/operators/installed/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/home/index.md': ['admin/overview/index.md', 'move', 301, 'docs-admin', 'P1', '管理员主页并入概览'],
  'admin/index.md': ['admin/index.md', 'keep', 200, 'docs-admin', 'P1', ''],
  'admin/management/appprojects/index.md': ['admin/namespaces/appprojects/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/management/clusters/index.md': ['admin/clusters/index.md', 'move', 301, 'docs-admin', 'P0', ''],
  'admin/management/customresourcedefinitions/index.md': ['admin/namespaces/crd/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/management/index.md': ['admin/overview/index.md', 'merge-into', 301, 'docs-admin', 'P1', '管理入口拆分到 clusters/namespaces'],
  'admin/management/kdccertificates/index.md': ['admin/maintenance/certificates/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/management/limitranges/index.md': ['admin/namespaces/limit-ranges/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/management/namespaces/index.md': ['admin/namespaces/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/management/nodes/index.md': ['admin/clusters/nodes/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/management/resourcequotas/index.md': ['admin/namespaces/resource-quotas/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/networking/index.md': ['admin/networking/index.md', 'keep', 200, 'docs-admin', 'P1', ''],
  'admin/networking/networkpolicies/index.md': ['admin/networking/network-policies/index.md', 'move', 301, 'docs-admin', 'P1', '英文 slug 统一'],
  'admin/notifications/index.md': ['admin/notifications/index.md', 'keep', 200, 'docs-admin', 'P1', ''],
  'admin/observe/index.md': ['observability/index.md', 'merge-into', 301, 'docs-observability', 'P1', '删除重复入口'],
  'admin/pipeline/index.md': ['developer/delivery/pipelines/index.md', 'merge-into', 301, 'docs-dev', 'P1', '管理员流水线并入交付域'],
  'admin/platform-config/index.md': ['admin/platform-config/index.md', 'keep', 200, 'docs-admin', 'P1', ''],
  'admin/storage/index.md': ['admin/storage/index.md', 'keep', 200, 'docs-admin', 'P1', ''],
  'admin/user-management/index.md': ['admin/access-control/index.md', 'merge-into', 301, 'docs-admin', 'P0', '与 RBAC 合并'],
  'admin/user-management/keycloak/index.md': ['admin/access-control/keycloak/index.md', 'move', 301, 'docs-admin', 'P1', ''],
  'admin/workloads/daemonsets/index.md': ['admin/workloads/daemonsets/index.md', 'keep', 200, 'docs-admin', 'P1', ''],
  'admin/workloads/index.md': ['admin/workloads/index.md', 'keep', 200, 'docs-admin', 'P1', '仅保留系统级工作负载'],
  'admin/workloads/replicaset/index.md': ['admin/workloads/replicaset/index.md', 'keep', 200, 'docs-admin', 'P1', ''],
  'aiops/index.md': ['developer/ai-assistant/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'analysis/console-changes-2026-10.md': ['', 'internal', 410, 'docs-platform', 'P2', '内部分析移出公开站点'],
  'analysis/console-changes-2026-11.md': ['', 'internal', 410, 'docs-platform', 'P2', '内部分析移出公开站点'],
  'analysis/kdo-comprehensive-analysis-2026-05-21.md': ['', 'internal', 410, 'docs-platform', 'P2', '内部分析移出公开站点'],
  'architecture/index.md': ['architecture/index.md', 'keep', 200, 'docs-arch', 'P2', ''],
  'dev/applications/add/index.md': ['developer/applications/manual-image/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/applications/builds/index.md': ['developer/applications/image-builds/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/applications/helm/index.md': ['developer/applications/helm/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/applications/index.md': ['developer/applications/index.md', 'move', 301, 'docs-dev', 'P0', ''],
  'dev/applications/pipelines-as-code/git-integration.md': ['developer/delivery/pac/git-integration/index.md', 'move', 301, 'docs-dev', 'P1', '后续拆分通用/GitHub/GitLab/Gitee/Codeup'],
  'dev/applications/pipelines-as-code/index.md': ['developer/delivery/pac/index.md', 'move', 301, 'docs-dev', 'P0', 'PAC 5 页后续收敛为 3 页'],
  'dev/applications/pipelines-as-code/install.md': ['developer/delivery/pac/install/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/applications/pipelines-as-code/manage-and-reference.md': ['developer/delivery/pac/manage/index.md', 'move', 301, 'docs-dev', 'P1', '后续拆分运行管理/命令参考'],
  'dev/applications/pipelines-as-code/repository-and-pipelinerun.md': ['developer/delivery/pac/repository-and-pipelinerun/index.md', 'move', 301, 'docs-dev', 'P1', '后续拆分 Repository/PipelineRun/分支环境'],
  'dev/applications/pipelines/index.md': ['developer/delivery/pipelines/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/applications/repository/index.md': ['developer/applications/git/index.md', 'move', 301, 'docs-dev', 'P0', '核心样板页之一'],
  'dev/configurations/configmaps/index.md': ['developer/configuration/configmaps/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/configurations/index.md': ['developer/configuration/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/configurations/secrets/index.md': ['developer/configuration/secrets/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/global-search/index.md': ['developer/overview/global-search/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/home/env/index.md': ['developer/overview/environments/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/home/index.md': ['developer/overview/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/index.md': ['developer/index.md', 'move', 301, 'docs-dev', 'P0', ''],
  'dev/network-storage/index.md': ['developer/network-storage/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/network-storage/ingresses/index.md': ['developer/network-storage/ingress/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/network-storage/persistent-volume-claims/index.md': ['developer/network-storage/pvc/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/network-storage/services/index.md': ['developer/network-storage/service/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/observe/index.md': ['observability/index.md', 'merge-into', 301, 'docs-observability', 'P1', '删除重复入口'],
  'devops/app-deploy/dockerfile.md': ['developer/applications/languages/dockerfile/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/donet/index.md': ['developer/applications/languages/dotnet/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/golang/index.md': ['developer/applications/languages/golang/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/html.md': ['developer/applications/languages/static-html/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/index.md': ['developer/applications/languages/index.md', 'move', 301, 'docs-dev', 'P2', '9 个语言页后续合并去重'],
  'devops/app-deploy/java/index.md': ['developer/applications/languages/java/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/nodejs/index.md': ['developer/applications/languages/nodejs/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/php/index.md': ['developer/applications/languages/php/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/python/index.md': ['developer/applications/languages/python/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/sonarqube.md': ['developer/applications/quality/sonarqube/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/app-deploy/thirdparty.md': ['developer/applications/third-party/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'devops/continuous/index.md': ['developer/best-practices/continuous-delivery/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'devops/continuous/multi-env/index.md': ['developer/best-practices/continuous-delivery/multi-env/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'devops/continuous/ram/index.md': ['developer/best-practices/continuous-delivery/application-templates/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'devops/continuous/source-code/index.md': ['developer/best-practices/continuous-delivery/source-code/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'devops/gitflow/index.md': ['developer/best-practices/gitflow/index.md', 'move', 301, 'docs-dev', 'P1', '后续拆分概念/操作/示例'],
  'devops/index.md': ['developer/index.md', 'merge-into', 301, 'docs-dev', 'P1', 'DevOps 入口并入开发指南'],
  'devops/introduce/index.md': ['developer/overview/devops/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'devops/project-manage/index.md': ['developer/projects/index.md', 'move', 301, 'docs-dev', 'P0', ''],
  'dev/workloads/cronjobs/index.md': ['developer/workloads/cronjobs/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/workloads/deployments/index.md': ['developer/workloads/deployments/index.md', 'move', 301, 'docs-dev', 'P0', '核心样板页之一'],
  'dev/workloads/hpa/index.md': ['developer/workload-operations/hpa/index.md', 'merge-into', 301, 'docs-dev', 'P1', '与 workload-actions/hpa 合并'],
  'dev/workloads/index.md': ['developer/workloads/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/workloads/jobs/index.md': ['developer/workloads/jobs/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/workloads/kruise/index.md': ['developer/workloads/kruise/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/workloads/pods/index.md': ['developer/workloads/pods/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/workloads/statefulsets/index.md': ['developer/workloads/statefulsets/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'dev/workloads/topology/index.md': ['developer/workloads/topology/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'ide/backup-and-restore/index.md': ['developer/dev-environments/che/backup-restore/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'ide/create-workspace/index.md': ['developer/dev-environments/che/create-workspace/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'ide/ide-loader/index.md': ['developer/dev-environments/che/ide-loader/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'ide/index.md': ['developer/dev-environments/che/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'ide/personal-access-tokens/index.md': ['developer/dev-environments/tokens/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'ide/user-preferences/index.md': ['developer/dev-environments/che/user-preferences/index.md', 'move', 301, 'docs-dev', 'P2', ''],
  'ide/workspace-management/index.md': ['developer/dev-environments/che/workspace-management/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'install/config/console/index.md': ['admin/platform-config/index.md', 'merge-into', 301, 'docs-admin', 'P1', '操作与配置参考拆分'],
  'install/config/index.md': ['install/config/index.md', 'keep', 200, 'docs-install', 'P1', ''],
  'install/index.md': ['install/index.md', 'keep', 200, 'docs-install', 'P0', ''],
  'install/kdo/index.md': ['install/kdo/index.md', 'keep', 200, 'docs-install', 'P0', '核心样板页之一'],
  'install/keycloak/index.md': ['install/keycloak/index.md', 'keep', 200, 'docs-install', 'P0', ''],
  'install/kubernetes/index.md': ['install/kubernetes/index.md', 'keep', 200, 'docs-install', 'P0', ''],
  'observability/events/index.md': ['observability/events/index.md', 'keep', 200, 'docs-observability', 'P1', ''],
  'observability/index.md': ['observability/index.md', 'keep', 200, 'docs-observability', 'P1', ''],
  'observability/logging/index.md': ['observability/logging/index.md', 'keep', 200, 'docs-observability', 'P1', ''],
  'observability/monitoring/alertmanager/index.md': ['observability/alerting/index.md', 'move', 301, 'docs-observability', 'P0', '1499 行，后续拆分告警配置/规则参考/通知渠道/排障'],
  'observability/monitoring/dashboards/index.md': ['observability/dashboards/index.md', 'move', 301, 'docs-observability', 'P1', ''],
  'observability/monitoring/index.md': ['observability/monitoring/index.md', 'keep', 200, 'docs-observability', 'P0', '核心样板页之一'],
  'quick-start/index.md': ['quick-start/index.md', 'keep', 200, 'docs-dev', 'P0', '核心样板页之一'],
  'rbac/index.md': ['admin/access-control/rbac/index.md', 'move', 301, 'docs-admin', 'P0', '与用户管理合并'],
  'storage/index.md': ['admin/storage/index.md', 'merge-into', 301, 'docs-admin', 'P1', 'PVC 归开发者，后端归管理员'],
  'terminal/index.md': ['developer/dev-environments/terminal/index.md', 'move', 301, 'docs-dev', 'P1', '529 行，后续拆分 CloudShell/LocalShell/文件传输/排障'],
  'workload-actions/add-storage/index.md': ['developer/workload-operations/add-storage/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'workload-actions/edit-health-checks/index.md': ['developer/workload-operations/health-checks/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'workload-actions/edit-pod-count/index.md': ['developer/workload-operations/scale/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'workload-actions/edit-resource-limits/index.md': ['developer/workload-operations/resource-limits/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'workload-actions/edit-update-strategy/index.md': ['developer/workload-operations/update-strategy/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'workload-actions/hpa/index.md': ['developer/workload-operations/hpa/index.md', 'merge-into', 301, 'docs-dev', 'P1', '与 dev/workloads/hpa 合并'],
  'workload-actions/index.md': ['developer/workload-operations/index.md', 'move', 301, 'docs-dev', 'P1', ''],
  'workload-actions/pdb/index.md': ['developer/workload-operations/pdb/index.md', 'move', 301, 'docs-dev', 'P1', ''],
};

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const readTitle = async (file) => {
  const text = await readFile(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return '';
  const title = match[1].match(/^title:\s*(.+)$/m);
  return title ? title[1].trim().replace(/^['"]|['"]$/g, '') : '';
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
};

const toUrl = (docPath) => {
  const normalized = docPath.replaceAll(path.sep, '/');
  const withoutIndex = normalized.replace(/\/index\.md$/, '');
  const withoutExt = withoutIndex.endsWith('.md') ? withoutIndex.slice(0, -3) : withoutIndex;
  return `/docs/${withoutExt}/`.replaceAll('//', '/');
};

const files = (await walk(docsRoot)).sort();
const relativeFiles = files.map((file) => path.relative(docsRoot, file).replaceAll(path.sep, '/'));

const missing = relativeFiles.filter((file) => !mapping[file]);
const stale = Object.keys(mapping).filter((file) => !existsSync(path.join(docsRoot, file)));
if (missing.length || stale.length) {
  console.error('URL 映射不完整：');
  for (const file of missing) console.error(`  缺少映射: docs/${file}`);
  for (const file of stale) console.error(`  映射指向不存在的文件: docs/${file}`);
  process.exit(1);
}

const rows = [];
for (const file of relativeFiles) {
  const [newPath, action, status, owner, priority, notes] = mapping[file];
  rows.push({
    old_path: `docs/${file}`,
    old_url: toUrl(file),
    title: await readTitle(path.join(docsRoot, file)),
    new_path: newPath ? `docs/${newPath}` : '',
    new_url: newPath ? toUrl(newPath) : '',
    status,
    action,
    owner,
    priority,
    notes,
  });
}

rows.sort((a, b) => a.old_url.localeCompare(b.old_url, 'zh-CN'));

const headers = ['old_path', 'old_url', 'title', 'new_path', 'new_url', 'status', 'action', 'owner', 'priority', 'notes'];
const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','))].join('\n') + '\n';
await writeFile(path.join(here, 'url-map.csv'), csv);

const redirects = rows.filter((row) => row.status === 301 || row.status === 410);
const redirectCsv = [
  'source,destination,status',
  ...redirects.map((row) => [row.old_url, row.new_url, row.status].map(csvEscape).join(',')),
].join('\n') + '\n';
await writeFile(path.join(here, 'redirects.csv'), redirectCsv);

const sections = [
  ['快速开始与安装', (row) => row.old_url.startsWith('/docs/quick-start/') || row.old_url.startsWith('/docs/install/')],
  ['开发指南', (row) => row.old_url.startsWith('/docs/dev/') || row.old_url.startsWith('/docs/devops/') || row.old_url.startsWith('/docs/workload-actions/') || row.old_url.startsWith('/docs/ide/') || row.old_url.startsWith('/docs/terminal/') || row.old_url.startsWith('/docs/aiops/')],
  ['管理指南', (row) => row.old_url.startsWith('/docs/admin/') || row.old_url.startsWith('/docs/rbac/') || row.old_url.startsWith('/docs/storage/')],
  ['可观测性', (row) => row.old_url.startsWith('/docs/observability/')],
  ['架构、参考与其他', (row) => true],
];

const md = [];
md.push('# KDO 文档站旧 URL 映射表（113 条）');
md.push('');
md.push('> 由 `migration/generate-url-map.mjs` 生成，请勿手改。');
md.push('');
md.push('## 汇总');
md.push('');
md.push(`- 旧页面：${rows.length}`);
md.push(`- 保持 200：${rows.filter((row) => row.status === 200).length}`);
md.push(`- 301 迁移/合并：${rows.filter((row) => row.status === 301).length}`);
md.push(`- 410 下线：${rows.filter((row) => row.status === 410).length}`);
md.push('');
const seen = new Set();
for (const [name, predicate] of sections) {
  const sectionRows = rows.filter((row) => !seen.has(row.old_url) && predicate(row));
  if (!sectionRows.length) continue;
  for (const row of sectionRows) seen.add(row.old_url);
  md.push(`## ${name}`);
  md.push('');
  md.push('| 旧 URL | 新 URL | 状态 | 动作 | 负责人 | 备注 |');
  md.push('|---|---|---:|---|---|---|');
  for (const row of sectionRows) {
    md.push(`| \`${row.old_url}\` | ${row.new_url ? `\`${row.new_url}\`` : '—'} | ${row.status} | ${row.action} | ${row.owner} | ${row.notes} |`);
  }
  md.push('');
}
await writeFile(path.join(here, 'url-map.md'), md.join('\n'));

console.log(`已生成 ${rows.length} 条映射：`);
console.log(`  migration/url-map.csv`);
console.log(`  migration/url-map.md`);
console.log(`  migration/redirects.csv (${redirects.length} 条 301/410)`);
