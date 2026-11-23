---
title: "Pipelines as Code Repository CRD"
description: "Pipelines as Code Repository 自定义资源的字段参考。"
sidebar_position: 8
doc_type: reference
audience: [admin, developer]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

本页由 CRD 清单生成。字段以对应版本的 OpenAPI schema 为准；`metadata` 等标准字段不再重复。

## Repository {#repository}

Pipelines as Code 的代码仓库配置，定义 Git 提供商、分支环境、事件和流水线参数。

| 项目 | 值 |
|---|---|
| Group | `pipelinesascode.tekton.dev` |
| Version | `v1alpha1` |
| Scope | `Namespaced` |
| Plural | `repositories` |

`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。

### Spec

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `branchEnvs` | `array<object>` | 否 | BranchEnvs 分支流水线运行的环境 |
| `concurrency_limit` | `integer` | 否 | ConcurrencyLimit defines the maximum number of concurrent pipelineruns that can run for this repository. This helps prevent resource exhaustion when many events trigger pipelines simultaneously. |
| `devInfo` | `object` | 否 | DevInfo 相关的开发信息 |
| `git_provider` | `object` | 否 | GitProvider details specific to a git provider configuration. Contains authentication, API endpoints, and provider type information needed to interact with the Git service. |
| `incoming` | `array<object>` | 否 | Incomings defines incoming webhook configurations. Each configuration specifies how to handle external webhook requests that don't come directly from the primary Git provider. |
| `params` | `array<object>` | 否 | Params defines repository level parameters that can be referenced in PipelineRuns. These parameters can be used as default values or configured for specific events. |
| `settings` | `object` | 否 | Settings contains the configuration settings for the repository, including authorization policies, provider-specific configuration, and provenance settings. |
| `url` | `string` | 否 | URL of the repository we are building. Must be a valid HTTP/HTTPS Git repository URL that PAC will use to clone and fetch pipeline definitions from. |

### branchEnvs 字段 {#repository-branch-envs}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `appEnv` | `string` | 是 | AppEnv is the target environment name, typically corresponding to a namespace within the cluster. 目标环境名，通常对应集群中的一个命名空间。 |
| `autoTrigger` | `boolean` | 否 | AutoTrigger The pipeline auto-triggers based on events. 流水线是否会根据事件被自动触发 |
| `branchName` | `string` | 是 | BranchName is the git branch name that this configuration applies to. 触发流水线的分支名称。 |
| `cluster` | `string` | 是 | Cluster is the target cluster for deployment. Defaults to the current cluster in single-cluster setups. 目标部署集群名，用于多集群场景，默认是当前集群。 |
| `onEvent` | `array<string>` | 否 | OnEvent lists the events that trigger the pipeline for this branch (e.g., "push", "merge"). 触发流水线的事件类型列表，例如: push, merge。 |
| `prName` | `string` | 否 | PrName is the generated PipelineRun name. Default format: &lt;app&gt;-&lt;env&gt;-&lt;branch&gt;, e.g., "app1-dev-feature". Note: "Pr" stands for "PipelineRun", NOT "Pull Request". PipelineRun 的名称，默认格式为：应用名-环境名-分支名。 |
| `prTemplate` | `string` | 是 | PrTemplate is the PipelineRun template name (e.g., "go-pipeline", "nodejs-pipeline"). Note: "Pr" stands for "PipelineRun", NOT "Pull Request". PipelineRun 的模板名称，用于选择对应的 CI/CD 流水线模板。 |


### devInfo 字段 {#repository-dev-info}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `devFramework` | `string` | 否 | DevFramework is the development framework (e.g., "gin", "spring-boot"). 应用的开发框架，用于更精确地选择流水线模板。 |
| `devLanguage` | `string` | 是 | DevLanguage is the primary programming language used by the application (e.g., "go", "java", "python"). Used to select the appropriate PipelineRun template. 应用的主开发语言，用于匹配合适的流水线模板。 |
| `devTemplate` | `string` | 是 | DevTemplate selects the application development template, which determines the Dockerfile, Kubernetes deployment YAML, and other build artifacts used by the pipeline. 应用开发模板标识，用于选择对应的 Dockerfile、K8s 部署 YAML 等构建资源。 |
| `devVersion` | `string` | 否 | DevVersion is the version of the development language or its runtime/base image (e.g., "8", "11", "17", "21" for Java). Used together with DevLanguage to select the matching development template. 开发语言或其运行时/基础镜像的版本，配合 DevLanguage 匹配合适的开发模板。 |
| `port` | `string` | 否 | Port is the port the application listens on at runtime (e.g., "8080"). 应用运行时监听的主端口。 |


### git_provider 字段 {#repository-git-provider}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `secret` | `object` | 否 | Secret reference for authentication with the Git provider. Contains the token, password, or private key used to authenticate requests to the Git provider API. |
| `type` | `string` | 否 | Type of git provider. Determines which Git provider API and authentication flow to use. Supported values: - 'gitee': Gitee.com or Gitee Enterprise - 'github': GitHub.com or GitHub Enterprise - 'gitlab': GitLab.com or self-hosted GitLab - 'bitbucket-datacenter': Bitbucket Data Ce… |
| `url` | `string` | 否 | URL of the git provider API endpoint. This is the base URL for API requests to the Git provider (e.g., '`https://api.github.com'` for GitHub or a custom GitLab instance URL). |
| `user` | `string` | 否 | User of the git provider. Username to use for authentication when using basic auth or token-based authentication methods. Not used for GitHub Apps authentication. |
| `webhook_secret` | `object` | 否 | WebhookSecret reference for webhook validation. Contains the shared secret used to validate that incoming webhooks are legitimate and coming from the Git provider. |


### incoming 字段 {#repository-incoming}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `params` | `array<string>` | 否 | Params defines parameter names to extract from the webhook payload. These parameters will be made available to the PipelineRuns triggered by this webhook. |
| `secret` | `object` | 是 | Secret for the incoming webhook authentication. This secret is used to validate that webhook requests are coming from authorized sources. |
| `targets` | `array<string>` | 否 | Targets defines target branches for this webhook. When specified, only webhook events targeting these branches will trigger PipelineRuns. |
| `type` | `string` | 是 | Type of the incoming webhook. Currently only 'webhook-url' is supported, which allows external systems to trigger PipelineRuns via generic webhook requests. |


### params 字段 {#repository-params}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `filter` | `string` | 否 | Filter defines when this parameter applies. It can be used to conditionally apply parameters based on the event type, branch name, or other attributes. |
| `name` | `string` | 是 | Name of the parameter. This is the key that will be used to reference this parameter in PipelineRun definitions through via the &#123;&#123; name &#125;&#125; syntax. |
| `secret_ref` | `object` | 否 | SecretRef references a secret for the parameter value. Use this when the parameter contains sensitive information that should not be stored directly in the Repository CR. This field is mutually exclusive with Value. |
| `value` | `string` | 否 | Value of the parameter. The literal value to be provided to the PipelineRun. This field is mutually exclusive with SecretRef. |


### settings 字段 {#repository-settings}

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `ai` | `object` | 否 | AIAnalysis contains AI/LLM analysis configuration for automated CI/CD pipeline analysis. |
| `codeup` | `object` | 否 | Codeup contains Codeup-specific settings for repositories hosted on Alibaba Cloud Codeup (codeup.aliyun.com). |
| `forgejo` | `object` | 否 | Forgejo contains Forgejo/Gitea-specific settings. |
| `gitee` | `object` | 否 | Gitee contains Gitee-specific settings for repositories hosted on Gitee.com. |
| `github` | `object` | 否 | — |
| `github_app_token_scope_repos` | `array<string>` | 否 | GithubAppTokenScopeRepos lists repositories that can access the GitHub App token when using the GitHub App authentication method. This allows specific repositories to use tokens generated for the GitHub App installation, useful for cross-repository access. |
| `gitlab` | `object` | 否 | Gitlab contains GitLab-specific settings for repositories hosted on GitLab. |
| `gitops` | `object` | 否 | GitOpsSettings configures the deploy PipelineRun that the controller creates once a build has committed an image. Manifest writeback itself is always on: it is a property of the build template, not something a repository opts into. |
| `gitops_command_prefix` | `string` | 否 | GitOpsCommandPrefix configures the prefix for the GitOps command. This is used to identify the GitOps command in the PipelineRun. |
| `pipelinerun_provenance` | `string` | 否 | PipelineRunProvenance configures how PipelineRun definitions are fetched. Options: - 'source': Fetch definitions from the event source branch/SHA (default) - 'default_branch': Fetch definitions from the repository default branch |
| `policy` | `object` | 否 | Policy defines authorization policies for the repository, controlling who can trigger PipelineRuns under different conditions. |
| `status_checks` | `object` | 否 | StatusChecks configures the status checks for the repository. |


### Status

该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。
