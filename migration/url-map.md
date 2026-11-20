# KDO 文档站旧 URL 映射表（113 条）

> 由 `migration/generate-url-map.mjs` 生成，请勿手改。

## 汇总

- 旧页面：113
- 保持 200：19
- 301 迁移/合并：91
- 410 下线：3

## 快速开始与安装

| 旧 URL | 新 URL | 状态 | 动作 | 负责人 | 备注 |
|---|---|---:|---|---|---|
| `/docs/install/` | `/docs/install/` | 200 | keep | docs-install |  |
| `/docs/install/config/` | `/docs/install/config/` | 200 | keep | docs-install |  |
| `/docs/install/config/console/` | `/docs/admin/platform-config/` | 301 | merge-into | docs-admin | 操作与配置参考拆分 |
| `/docs/install/kdo/` | `/docs/install/kdo/` | 200 | keep | docs-install | 核心样板页之一 |
| `/docs/install/keycloak/` | `/docs/install/keycloak/` | 200 | keep | docs-install |  |
| `/docs/install/kubernetes/` | `/docs/install/kubernetes/` | 200 | keep | docs-install |  |
| `/docs/quick-start/` | `/docs/quick-start/` | 200 | keep | docs-dev | 核心样板页之一 |

## 开发指南

| 旧 URL | 新 URL | 状态 | 动作 | 负责人 | 备注 |
|---|---|---:|---|---|---|
| `/docs/aiops/` | `/docs/developer/ai-assistant/` | 301 | move | docs-dev |  |
| `/docs/dev/` | `/docs/developer/` | 301 | move | docs-dev |  |
| `/docs/dev/applications/` | `/docs/developer/applications/` | 301 | move | docs-dev |  |
| `/docs/dev/applications/add/` | `/docs/developer/applications/manual-image/` | 301 | move | docs-dev |  |
| `/docs/dev/applications/builds/` | `/docs/developer/applications/image-builds/` | 301 | move | docs-dev |  |
| `/docs/dev/applications/helm/` | `/docs/developer/applications/helm/` | 301 | move | docs-dev |  |
| `/docs/dev/applications/pipelines-as-code/` | `/docs/developer/delivery/pac/` | 301 | move | docs-dev | PAC 5 页后续收敛为 3 页 |
| `/docs/dev/applications/pipelines-as-code/git-integration/` | `/docs/developer/delivery/pac/git-integration/` | 301 | move | docs-dev | 后续拆分通用/GitHub/GitLab/Gitee/Codeup |
| `/docs/dev/applications/pipelines-as-code/install/` | `/docs/developer/delivery/pac/install/` | 301 | move | docs-dev |  |
| `/docs/dev/applications/pipelines-as-code/manage-and-reference/` | `/docs/developer/delivery/pac/manage/` | 301 | move | docs-dev | 后续拆分运行管理/命令参考 |
| `/docs/dev/applications/pipelines-as-code/repository-and-pipelinerun/` | `/docs/developer/delivery/pac/repository-and-pipelinerun/` | 301 | move | docs-dev | 后续拆分 Repository/PipelineRun/分支环境 |
| `/docs/dev/applications/pipelines/` | `/docs/developer/delivery/pipelines/` | 301 | move | docs-dev |  |
| `/docs/dev/applications/repository/` | `/docs/developer/applications/git/` | 301 | move | docs-dev | 核心样板页之一 |
| `/docs/dev/configurations/` | `/docs/developer/configuration/` | 301 | move | docs-dev |  |
| `/docs/dev/configurations/configmaps/` | `/docs/developer/configuration/configmaps/` | 301 | move | docs-dev |  |
| `/docs/dev/configurations/secrets/` | `/docs/developer/configuration/secrets/` | 301 | move | docs-dev |  |
| `/docs/dev/global-search/` | `/docs/developer/overview/global-search/` | 301 | move | docs-dev |  |
| `/docs/dev/home/` | `/docs/developer/overview/` | 301 | move | docs-dev |  |
| `/docs/dev/home/env/` | `/docs/developer/overview/environments/` | 301 | move | docs-dev |  |
| `/docs/dev/network-storage/` | `/docs/developer/network-storage/` | 301 | move | docs-dev |  |
| `/docs/dev/network-storage/ingresses/` | `/docs/developer/network-storage/ingress/` | 301 | move | docs-dev |  |
| `/docs/dev/network-storage/persistent-volume-claims/` | `/docs/developer/network-storage/pvc/` | 301 | move | docs-dev |  |
| `/docs/dev/network-storage/services/` | `/docs/developer/network-storage/service/` | 301 | move | docs-dev |  |
| `/docs/dev/observe/` | `/docs/observability/` | 301 | merge-into | docs-observability | 删除重复入口 |
| `/docs/dev/workloads/` | `/docs/developer/workloads/` | 301 | move | docs-dev |  |
| `/docs/dev/workloads/cronjobs/` | `/docs/developer/workloads/cronjobs/` | 301 | move | docs-dev |  |
| `/docs/dev/workloads/deployments/` | `/docs/developer/workloads/deployments/` | 301 | move | docs-dev | 核心样板页之一 |
| `/docs/dev/workloads/hpa/` | `/docs/developer/workload-operations/hpa/` | 301 | merge-into | docs-dev | 与 workload-actions/hpa 合并 |
| `/docs/dev/workloads/jobs/` | `/docs/developer/workloads/jobs/` | 301 | move | docs-dev |  |
| `/docs/dev/workloads/kruise/` | `/docs/developer/workloads/kruise/` | 301 | move | docs-dev |  |
| `/docs/dev/workloads/pods/` | `/docs/developer/workloads/pods/` | 301 | move | docs-dev |  |
| `/docs/dev/workloads/statefulsets/` | `/docs/developer/workloads/statefulsets/` | 301 | move | docs-dev |  |
| `/docs/dev/workloads/topology/` | `/docs/developer/workloads/topology/` | 301 | move | docs-dev |  |
| `/docs/devops/` | `/docs/developer/` | 301 | merge-into | docs-dev | DevOps 入口并入开发指南 |
| `/docs/devops/app-deploy/` | `/docs/developer/applications/languages/` | 301 | move | docs-dev | 9 个语言页后续合并去重 |
| `/docs/devops/app-deploy/dockerfile/` | `/docs/developer/applications/languages/dockerfile/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/donet/` | `/docs/developer/applications/languages/dotnet/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/golang/` | `/docs/developer/applications/languages/golang/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/html/` | `/docs/developer/applications/languages/static-html/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/java/` | `/docs/developer/applications/languages/java/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/nodejs/` | `/docs/developer/applications/languages/nodejs/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/php/` | `/docs/developer/applications/languages/php/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/python/` | `/docs/developer/applications/languages/python/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/sonarqube/` | `/docs/developer/applications/quality/sonarqube/` | 301 | move | docs-dev |  |
| `/docs/devops/app-deploy/thirdparty/` | `/docs/developer/applications/third-party/` | 301 | move | docs-dev |  |
| `/docs/devops/continuous/` | `/docs/developer/best-practices/continuous-delivery/` | 301 | move | docs-dev |  |
| `/docs/devops/continuous/multi-env/` | `/docs/developer/best-practices/continuous-delivery/multi-env/` | 301 | move | docs-dev |  |
| `/docs/devops/continuous/ram/` | `/docs/developer/best-practices/continuous-delivery/application-templates/` | 301 | move | docs-dev |  |
| `/docs/devops/continuous/source-code/` | `/docs/developer/best-practices/continuous-delivery/source-code/` | 301 | move | docs-dev |  |
| `/docs/devops/gitflow/` | `/docs/developer/best-practices/gitflow/` | 301 | move | docs-dev | 后续拆分概念/操作/示例 |
| `/docs/devops/introduce/` | `/docs/developer/overview/devops/` | 301 | move | docs-dev |  |
| `/docs/devops/project-manage/` | `/docs/developer/projects/` | 301 | move | docs-dev |  |
| `/docs/ide/` | `/docs/developer/dev-environments/che/` | 301 | move | docs-dev |  |
| `/docs/ide/backup-and-restore/` | `/docs/developer/dev-environments/che/backup-restore/` | 301 | move | docs-dev |  |
| `/docs/ide/create-workspace/` | `/docs/developer/dev-environments/che/create-workspace/` | 301 | move | docs-dev |  |
| `/docs/ide/ide-loader/` | `/docs/developer/dev-environments/che/ide-loader/` | 301 | move | docs-dev |  |
| `/docs/ide/personal-access-tokens/` | `/docs/developer/dev-environments/tokens/` | 301 | move | docs-dev |  |
| `/docs/ide/user-preferences/` | `/docs/developer/dev-environments/che/user-preferences/` | 301 | move | docs-dev |  |
| `/docs/ide/workspace-management/` | `/docs/developer/dev-environments/che/workspace-management/` | 301 | move | docs-dev |  |
| `/docs/terminal/` | `/docs/developer/dev-environments/terminal/` | 301 | move | docs-dev | 529 行，后续拆分 CloudShell/LocalShell/文件传输/排障 |
| `/docs/workload-actions/` | `/docs/developer/workload-operations/` | 301 | move | docs-dev |  |
| `/docs/workload-actions/add-storage/` | `/docs/developer/workload-operations/add-storage/` | 301 | move | docs-dev |  |
| `/docs/workload-actions/edit-health-checks/` | `/docs/developer/workload-operations/health-checks/` | 301 | move | docs-dev |  |
| `/docs/workload-actions/edit-pod-count/` | `/docs/developer/workload-operations/scale/` | 301 | move | docs-dev |  |
| `/docs/workload-actions/edit-resource-limits/` | `/docs/developer/workload-operations/resource-limits/` | 301 | move | docs-dev |  |
| `/docs/workload-actions/edit-update-strategy/` | `/docs/developer/workload-operations/update-strategy/` | 301 | move | docs-dev |  |
| `/docs/workload-actions/hpa/` | `/docs/developer/workload-operations/hpa/` | 301 | merge-into | docs-dev | 与 dev/workloads/hpa 合并 |
| `/docs/workload-actions/pdb/` | `/docs/developer/workload-operations/pdb/` | 301 | move | docs-dev |  |

## 管理指南

| 旧 URL | 新 URL | 状态 | 动作 | 负责人 | 备注 |
|---|---|---:|---|---|---|
| `/docs/admin/` | `/docs/admin/` | 200 | keep | docs-admin |  |
| `/docs/admin/application-management/` | `/docs/admin/operators/` | 301 | merge-into | docs-admin | 合并到管理员 Operator 入口 |
| `/docs/admin/application-management/operator-hub/` | `/docs/admin/operators/operator-hub/` | 301 | move | docs-admin |  |
| `/docs/admin/application-management/operators/` | `/docs/admin/operators/installed/` | 301 | move | docs-admin |  |
| `/docs/admin/home/` | `/docs/admin/overview/` | 301 | move | docs-admin | 管理员主页并入概览 |
| `/docs/admin/management/` | `/docs/admin/overview/` | 301 | merge-into | docs-admin | 管理入口拆分到 clusters/namespaces |
| `/docs/admin/management/appprojects/` | `/docs/admin/namespaces/appprojects/` | 301 | move | docs-admin |  |
| `/docs/admin/management/clusters/` | `/docs/admin/clusters/` | 301 | move | docs-admin |  |
| `/docs/admin/management/customresourcedefinitions/` | `/docs/admin/namespaces/crd/` | 301 | move | docs-admin |  |
| `/docs/admin/management/kdccertificates/` | `/docs/admin/maintenance/certificates/` | 301 | move | docs-admin |  |
| `/docs/admin/management/limitranges/` | `/docs/admin/namespaces/limit-ranges/` | 301 | move | docs-admin |  |
| `/docs/admin/management/namespaces/` | `/docs/admin/namespaces/` | 301 | move | docs-admin |  |
| `/docs/admin/management/nodes/` | `/docs/admin/clusters/nodes/` | 301 | move | docs-admin |  |
| `/docs/admin/management/resourcequotas/` | `/docs/admin/namespaces/resource-quotas/` | 301 | move | docs-admin |  |
| `/docs/admin/networking/` | `/docs/admin/networking/` | 200 | keep | docs-admin |  |
| `/docs/admin/networking/networkpolicies/` | `/docs/admin/networking/network-policies/` | 301 | move | docs-admin | 英文 slug 统一 |
| `/docs/admin/notifications/` | `/docs/admin/notifications/` | 200 | keep | docs-admin |  |
| `/docs/admin/observe/` | `/docs/observability/` | 301 | merge-into | docs-observability | 删除重复入口 |
| `/docs/admin/pipeline/` | `/docs/developer/delivery/pipelines/` | 301 | merge-into | docs-dev | 管理员流水线并入交付域 |
| `/docs/admin/platform-config/` | `/docs/admin/platform-config/` | 200 | keep | docs-admin |  |
| `/docs/admin/storage/` | `/docs/admin/storage/` | 200 | keep | docs-admin |  |
| `/docs/admin/user-management/` | `/docs/admin/access-control/` | 301 | merge-into | docs-admin | 与 RBAC 合并 |
| `/docs/admin/user-management/keycloak/` | `/docs/admin/access-control/keycloak/` | 301 | move | docs-admin |  |
| `/docs/admin/workloads/` | `/docs/admin/workloads/` | 200 | keep | docs-admin | 仅保留系统级工作负载 |
| `/docs/admin/workloads/daemonsets/` | `/docs/admin/workloads/daemonsets/` | 200 | keep | docs-admin |  |
| `/docs/admin/workloads/replicaset/` | `/docs/admin/workloads/replicaset/` | 200 | keep | docs-admin |  |
| `/docs/rbac/` | `/docs/admin/access-control/rbac/` | 301 | move | docs-admin | 与用户管理合并 |
| `/docs/storage/` | `/docs/admin/storage/` | 301 | merge-into | docs-admin | PVC 归开发者，后端归管理员 |

## 可观测性

| 旧 URL | 新 URL | 状态 | 动作 | 负责人 | 备注 |
|---|---|---:|---|---|---|
| `/docs/observability/` | `/docs/observability/` | 200 | keep | docs-observability |  |
| `/docs/observability/events/` | `/docs/observability/events/` | 200 | keep | docs-observability |  |
| `/docs/observability/logging/` | `/docs/observability/logging/` | 200 | keep | docs-observability |  |
| `/docs/observability/monitoring/` | `/docs/observability/monitoring/` | 200 | keep | docs-observability | 核心样板页之一 |
| `/docs/observability/monitoring/alertmanager/` | `/docs/observability/alerting/` | 301 | move | docs-observability | 1499 行，后续拆分告警配置/规则参考/通知渠道/排障 |
| `/docs/observability/monitoring/dashboards/` | `/docs/observability/dashboards/` | 301 | move | docs-observability |  |

## 架构、参考与其他

| 旧 URL | 新 URL | 状态 | 动作 | 负责人 | 备注 |
|---|---|---:|---|---|---|
| `/docs/analysis/console-changes-2026-10/` | — | 410 | internal | docs-platform | 内部分析移出公开站点 |
| `/docs/analysis/console-changes-2026-11/` | — | 410 | internal | docs-platform | 内部分析移出公开站点 |
| `/docs/analysis/kdo-comprehensive-analysis-2026-05-21/` | — | 410 | internal | docs-platform | 内部分析移出公开站点 |
| `/docs/architecture/` | `/docs/architecture/` | 200 | keep | docs-arch |  |
