---
title: "配置 Pipelines as Code 日志"
description: "通过 TektonConfig 或命名空间分割配置 Pipelines as Code 控制器日志。"
sidebar_position: 42
doc_type: reference
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

## 通过 TektonConfig CR 配置

编辑 `TektonConfig` CR 中的 `pac-config-logging` ConfigMap：

```yaml
apiVersion: operator.tekton.dev/v1alpha1
kind: TektonConfig
metadata:
  name: config
spec:
  platforms:
    openshift:
      pipelinesAsCode:
        options:
          configMaps:
            pac-config-logging:
              data:
                loglevel.pac-watcher: warn
                loglevel.pipelines-as-code-webhook: warn
                loglevel.pipelinesascode: warn
                zap-logger-config: |
                  {
                    "level": "info",
                    "development": false,
                    "sampling": {
                      "initial": 100,
                      "thereafter": 100
                    },
                    "outputPaths": ["stdout"],
                    "errorOutputPaths": ["stderr"],
                    "encoding": "json",
                    "encoderConfig": {
                      "timeKey": "ts",
                      "levelKey": "level",
                      "nameKey": "logger",
                      "callerKey": "caller",
                      "messageKey": "msg",
                      "stacktraceKey": "stacktrace",
                      "timeEncoder": "iso8601"
                    }
                  }
```

**日志级别组件**：

| 字段 | 组件 |
|---|---|
| `loglevel.pac-watcher` | pipelines-as-code-watcher |
| `loglevel.pipelines-as-code-webhook` | pipelines-as-code-webhook |
| `loglevel.pipelinesascode` | pipelines-as-code-controller |

**使用自定义 ConfigMap**：

通过 `options.deployments` 字段为每个组件设置环境变量 `CONFIG_LOGGING_NAME`：

```yaml
spec:
  platforms:
    openshift:
      pipelinesAsCode:
        options:
          configMaps:
            custom-pac-config-logging:
              data:
                loglevel.pac-watcher: warn
                loglevel.pipelines-as-code-webhook: warn
                loglevel.pipelinesascode: warn
          deployments:
            pipelines-as-code-controller:
              spec:
                template:
                  spec:
                    containers:
                      - name: pac-controller
                        env:
                          - name: CONFIG_LOGGING_NAME
                            value: custom-pac-config-logging
            pipelines-as-code-watcher:
              spec:
                template:
                  spec:
                    containers:
                      - name: pac-watcher
                        env:
                          - name: CONFIG_LOGGING_NAME
                            value: custom-pac-config-logging
            pipelines-as-code-webhook:
              spec:
                template:
                  spec:
                    containers:
                      - name: pac-webhook
                        env:
                          - name: CONFIG_LOGGING_NAME
                            value: custom-pac-config-logging
```

## 按命名空间分割日志

Pipelines as Code 日志包含命名空间信息，可以用 `grep` 过滤特定命名空间的日志：

```bash
kubectl logs pipelines-as-code-controller-<unique_id> -n pipelines-as-code | grep mynamespace
```

---
