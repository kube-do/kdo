#!/usr/bin/env node
/**
 * 中文搜索回归：确认高频查询词仍出现在构建后的搜索索引中。
 * 这是最小回归，不替代浏览器端搜索结果排序验证。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INDEX = path.join(ROOT, "build/search-index.json");

if (!fs.existsSync(INDEX)) {
  console.error("缺少 build/search-index.json，请先执行 pnpm build");
  process.exit(1);
}

const queries = [
  "安装",
  "升级",
  "回滚",
  "备份",
  "恢复",
  "命名空间",
  "工作负载",
  "容器组",
  "无状态",
  "有状态",
  "服务",
  "路由",
  "存储",
  "持久卷",
  "配额",
  "权限",
  "用户",
  "密钥",
  "流水线",
  "构建",
  "镜像",
  "仓库",
  "应用",
  "环境",
  "项目",
  "监控",
  "告警",
  "日志",
  "事件",
  "仪表盘",
  "通知",
  "证书",
  "集群",
  "节点",
  "终端",
  "云开发",
  "AI",
  "助手",
  "术语",
  "兼容",
  "排障",
  "安全",
  "离线",
  "贡献",
  "发布",
  "参考",
  "任务",
  "全局搜索",
  "审批",
  "审计",
];

const raw = fs.readFileSync(INDEX, "utf8");
const missing = queries.filter((query) => !raw.includes(query));

if (missing.length) {
  console.error(`搜索回归失败：${missing.length} 个查询词未索引`);
  for (const query of missing) console.error(`- ${query}`);
  process.exit(1);
}

console.log(`搜索回归通过：${queries.length} 个高频查询词均已索引。`);
