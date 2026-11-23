---
title: "阿里云 Codeup 集成"
description: "为 Pipelines as Code 配置阿里云 Codeup 仓库、个人访问令牌与 Webhook。"
sidebar_position: 25
doc_type: how-to
audience: [admin]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

阿里云 Codeup 通过个人访问令牌和 Webhook 与 Pipelines as Code 集成。KDO 控制台会自动识别 `codeup.aliyun.com` 仓库，并代理创建 Webhook。

**先决条件**：

- 集群已安装 Pipelines as Code
- 使用 Codeup 公有云仓库（`codeup.aliyun.com`）
- 已创建 Codeup 个人访问令牌，具备仓库读写和 Webhook 管理权限
- 已确定流水线运行的目标命名空间

## 支持范围

| 项目 | 说明 |
|---|---|
| 代码托管平台 | 阿里云 Codeup 公有云 |
| 仓库地址 | `https://codeup.aliyun.com/<组织>/<仓库>` |
| 认证方式 | 个人访问令牌（PAT） |
| Webhook 事件 | 推送、Tag 推送、合并请求、评论 |
| 流水线状态 | 通过 Codeup 原生提交状态上报 |
| 私有化 Codeup | 当前未支持/未验证 |

:::note

Codeup OpenAPI 不允许浏览器直接跨域调用，因此控制台通过后端代理创建 Webhook。不要在前端页面或浏览器脚本中直接调用 Codeup Webhook 接口。

:::

## 认证与 Secret

创建包含访问令牌和 Webhook 密钥的 Secret：

```bash
kubectl -n <target-namespace> create secret generic codeup-webhook-config \
  --from-literal provider.token="<CODEUP_PERSONAL_ACCESS_TOKEN>" \
  --from-literal webhook.secret="<WEBHOOK_SECRET>"
```

- `provider.token`：Codeup 个人访问令牌，Pipelines as Code 使用 `x-yunxiao-token` 请求头访问 Codeup OpenAPI。
- `webhook.secret`：自定义 Webhook 密钥，Codeup 通过 `X-Codeup-Token` 请求头明文发送，不是 HMAC 签名。

建议为令牌设置有效期并定期轮换；轮换后同步更新 Secret。

## 通过控制台创建（推荐）

1. 进入 **开发者界面 → +添加 → 从 Git 导入**，或创建 Git 应用。
2. 填写 `https://codeup.aliyun.com/<组织>/<仓库>` 形式的仓库地址。
3. 控制台自动识别为 Codeup，填写个人访问令牌。
4. 选择目标项目、环境、分支和构建方式。
5. 提交后，控制台后端代理创建 Codeup Webhook，不需要在 Codeup 控制台手工配置。
6. 向仓库推送提交或创建合并请求，确认流水线自动触发。

:::warning

Webhook 创建失败不会阻断仓库初始化。若创建应用时提示 Webhook 失败，可以在应用创建完成后重新挂载 Webhook，或按下面的手动方式配置。

:::

## 手动配置 Repository

如果仓库不是通过控制台创建，或需要把已有仓库接入 Pipelines as Code，可以创建 Repository CR：

```yaml
apiVersion: pipelinesascode.tekton.dev/v1alpha1
kind: Repository
metadata:
  name: codeup-repo
  namespace: <target-namespace>
spec:
  url: "https://codeup.aliyun.com/<组织>/<仓库>.git"
  git_provider:
    type: codeup
    secret:
      name: codeup-webhook-config
      key: provider.token
    webhook_secret:
      name: codeup-webhook-config
      key: webhook.secret
```

应用配置：

```bash
kubectl apply -f repository.yaml
kubectl -n <target-namespace> get repository
```

## 手动配置 Webhook

如果未使用控制台自动创建，需要在 Codeup 仓库中手动添加 Webhook。

1. 获取 Pipelines as Code 控制器地址：

```bash
echo https://$(kubectl get ingress -n pipelines-as-code pipelines-as-code-controller -o jsonpath='{.spec.host}')
```

2. 在 Codeup 仓库的 **设置 → Webhook** 中新建 Webhook：

   - **URL**：Pipelines as Code 控制器地址
   - **Secret**：与 Secret 中的 `webhook.secret` 一致
   - **事件**：推送、Tag 推送、合并请求、评论
   - **SSL 校验**：按集群证书情况选择

3. 保存后，Codeup 会在事件发生时向控制器发送请求，请求头包含：

   - `Codeup-Event`：事件类型，如 `Push Hook`、`Merge Request Hook`
   - `X-Codeup-Token`：配置的 Webhook 密钥

## 验证

1. 确认 Repository 已就绪：

```bash
kubectl -n <target-namespace> get repository codeup-repo
```

2. 向仓库推送一次提交，或创建合并请求。
3. 查看 PipelineRun：

```bash
kubectl -n <target-namespace> get pipelinerun
```

4. 在 Codeup 提交或合并请求页面确认流水线状态。
5. 如需使用评论触发重试等操作，在合并请求中发送评论，确认 Pipelines as Code 能收到 `Note Hook`。

## 限制与注意事项

- 当前仅支持 Codeup 公有云；私有化 Codeup 需要额外配置 API 入口，尚未验证。
- Codeup PAT 需要仓库读写和 Webhook 管理权限；权限不足时会出现 401/403。
- Webhook 密钥是明文共享密钥，不是 HMAC 签名；不要与其他系统复用。
- Codeup 使用组织/仓库全路径标识仓库，支持嵌套命名空间。
- 控制台创建 Webhook 依赖后端代理；浏览器直接调用 Codeup OpenAPI 会被 CORS 拦截。
- Codeup 没有 GitHub Checks 等能力，流水线状态以 Codeup 原生提交状态和评论展示。

## 常见问题

### Webhook 没有触发流水线

- 确认 Repository 的 `spec.url` 与 Codeup 仓库地址一致。
- 在 Codeup Webhook 记录中确认请求返回 2xx。
- 检查事件类型是否包含推送、合并请求或评论。
- 查看 Pipelines as Code 控制器日志。

### 返回 401 或 403

- 确认 PAT 未过期。
- 确认令牌具备仓库读写和 Webhook 管理权限。
- 确认 Secret 中的 key 是 `provider.token`，且 Repository 引用正确。

### 状态没有回写到 Codeup

- 确认 Codeup 仓库与 PAT 属于同一组织。
- 检查控制器是否能访问 Codeup OpenAPI。
- 查看 PipelineRun 事件和控制器日志中的状态上报错误。

### 私有化 Codeup 能否使用

当前文档只覆盖 Codeup 公有云。私有化部署需要自定义 API 入口，尚未纳入支持范围。

## 相关文档

- [Git 仓库托管服务集成](/docs/developer/delivery/pac/git-integration/)
- [创建 Git 应用](/docs/developer/applications/git/)
- [Repository 配置](/docs/developer/delivery/pac/repository-and-pipelinerun/repository/)
- [PipelineRun 配置](/docs/developer/delivery/pac/repository-and-pipelinerun/pipelinerun/)
- [Pipelines as Code 排障](/docs/developer/delivery/pac/manage/troubleshooting/)
