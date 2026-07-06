# KDO Platform Documentation

这是 **KDO (Kubedo DevOps)** 平台的官方文档站点。

**在线访问：** https://docs.kube-do.cn

---

## 🚀 快速导航

### 开发者
- [📖 开发者指南](/docs/dev/) - 应用创建、流水线、工作负载管理
- [🏠 开发者控制台](/docs/dev/home/) - 平台界面导览
- [🔧 应用管理](/docs/dev/applications/) - Git应用、Helm、镜像构建
- [🔄 CI/CD 流水线](/docs/dev/applications/pipelines/) - Tekton 配置与使用
- [📊 可观测性](/docs/observability/) - 监控、日志、告警

### 管理员
- [⚙️ 管理员手册](/docs/admin/) - 集群管理、用户权限
- [🔐 RBAC 权限](/docs/rbac/) - 基于角色的访问控制
- [📦 安装指南](/docs/install/) - KDO 平台部署步骤
- [🔌 终端访问](/docs/terminal/) - CloudShell 与 LocalShell

### 概念与参考
- [🏗️ 系统架构](/docs/architecture/) - 核心组件与技术栈
- [🎯 核心概念](/docs/concepts/) - 云原生基础概念
- [📚 参考文档](/docs/reference/) - API、配置参数

---

## 🏗️ 项目结构

```
kdo/
├── docs/                    # 文档源码 (Markdown)
│   ├── admin/              # 管理员指南
│   ├── dev/                # 开发者中心
│   ├── install/            # 安装部署
│   ├── observability/      # 可观测性
│   ├── rbac/               # 权限管理
│   └── ...
├── _config.yml             # Jekyll 配置
├── index.md                # 文档站首页
├── Gemfile                 # Ruby 依赖
└── vercel.json             # Vercel 部署配置
```

---

## 🖥️ 本地预览

在本地构建和预览文档站点：

```bash
# 1. 安装依赖
bundle install

# 2. 启动开发服务器
bundle exec jekyll serve

# 3. 访问 http://localhost:4000
```

---

## 📦 技术栈

- **静态站点生成器：** [Jekyll](https://jekyllrb.com/)
- **文档主题：** [Just the Docs](https://just-the-docs.github.io/)
- **包管理：** Bundler
- **部署：** GitHub Pages / Vercel

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进文档！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目文档采用 [MIT License](LICENSE) 许可证。

---

## 📞 支持

- 查看 [常见问题](/docs/admin/) 获取帮助
- 提交 [Issue](https://github.com/kube-do/kdo/issues) 反馈问题
- 联系 KDO 平台运维团队

---

**KDO Platform** - 让云原生应用管理更简单 ✨
