# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

这是 **KDO智能云原生平台**的官方文档站点源码，使用 Jekyll 静态站点生成器构建。
在线访问：https://docs.kube-do.cn

## Build & preview

```bash
# 安装 Ruby 依赖（首次或 Gemfile 变更后）
bundle install

# 启动本地开发服务器（http://localhost:4000）
bundle exec jekyll serve

# 生产构建（输出到 _site/）
bundle exec jekyll build
```

## Tech stack

- **Jekyll** ~> 4.3.4（静态站点生成器）
- **Just the Docs** 0.10.0（文档主题，固定在 0.10.0 版本）
- **Ruby** 3.3（CI 使用的版本）
- **部署**: GitHub Pages（`pages.yml`）和 Vercel（`vercel.json`，启用 trailing slash）

## Directory structure

```
docs/                          # 所有文档内容（Markdown + 图片）
├── quick-start/               # 快速开始
├── install/                   # 安装指南 (kdo, kubernetes, keycloak, config)
├── architecture/              # 系统架构
├── dev/                       # 开发者指南
│   ├── applications/          # 应用管理（仓库、Helm、构建、流水线）
│   ├── workloads/             # 工作负载（Deployments, StatefulSets, Jobs, CronJobs, Pods, HPA, Topology）
│   ├── configurations/        # ConfigMaps, Secrets
│   ├── network-storage/       # Services, Ingresses, PVC
│   └── observe/               # 观测平台入口页（指向顶层 observability）
├── admin/                     # 管理员手册
│   ├── management/            # 集群资源管理（节点、命名空间、CRD、配额等）
│   ├── workloads/             # DaemonSets, ReplicaSet
│   ├── user-management/       # 用户管理（含 Keycloak 用户管理）
│   └── observe/               # 观测平台入口页（指向顶层 observability）
├── workload-actions/          # 工作负载操作（扩缩容、HPA、资源限制、健康检查、存储、更新策略、PDB）
├── observability/             # 可观测性专题（监控、日志、事件、大屏、指标）
├── rbac/                      # 权限管理
├── terminal/                  # CloudShell / LocalShell
├── ide/                       # 云开发环境（Eclipse Che）
├── devops/                    # DevOps 实践（语言部署示例、持续交付、多环境）
├── storage/                   # 存储
├── aiops/                     # 智能运维
└── analysis/                  # 平台分析报告
index.md                       # 文档站首页
_config.yml                    # Jekyll 全局配置（搜索、导航、Mermaid、callouts 等）
```

## Content authoring conventions

- 所有文档使用**简体中文**编写
- 每个文档目录下的 `index.md` 是该 section 的首页
- 图片放在各自目录下的 `imgs/` 子目录中
- Jekyll frontmatter 约定：
  - `title`: 页面标题（必填）
  - `layout`: 通常为 `default`，首页使用 `home`
  - `nav_order`: 控制左侧导航栏排序
  - `last_modified_date`: 最后修改日期（格式 `YYYY-MM-DD`），配合 `last_edit_timestamp: true` 显示
- Mermaid 图表支持（版本 9.1.6），通过 `mermaid` 代码块使用
- Callouts 可用：`{: .note }`、`{: .highlight }`、`{: .important }`、`{: .warning }`

## CI / deployment

- **CI** (`ci.yml`): push 到 `main` 或 PR 时触发，执行 `bundle exec jekyll build` 验证构建
- **Deploy** (`pages.yml`): push 到 `main` 时自动部署到 GitHub Pages（JEKYLL_ENV=production）
- Vercel 也配置了部署（`vercel.json` 仅设置 `trailingSlash: true`）

## Configuration notes

- `_config.yml` 的 `baseurl` 为 `"/"`，`url` 为 `"https://docs.kube-do.cn"`
- 搜索已启用，快捷键 `Ctrl+K`
- 导航排序为 `case_sensitive`
- 代码块复制按钮已启用
- `liquid.error_mode: strict` —— 模板语法错误会导致构建失败
