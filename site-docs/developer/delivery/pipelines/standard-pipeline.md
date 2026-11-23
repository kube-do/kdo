---
title: "标准流水线"
description: "标准流水线是 Kubernetes Pipeline 对象，适合在流水线页面直接维护 Task 与 PipelineRun 模板。"
sidebar_position: 2
doc_type: how-to
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

上级：[流水线](/docs/developer/delivery/pipelines/)

:::note

标准流水线就是一个Kubernetes的[Pipeline对象](../#pipeline)，下面有个例子：

:::

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: pipeline-git-clone-build-push-deploy
  namespace: cc-dev
spec:
  description: |
    该流水线提供了典型的 CI/CD 流程，流程包括：
      - 获取 git 存储库作为源
      - 使用buildah通过Dockerfile构建Docker镜像
      - 将构建的 Docker 镜像推送到所需的存储库
      - 将其部署到 Kubernetes 集群
  params:
    - description: 要从中克隆的git存储库URL
      name: repo-url
      type: string
    - description: 要克隆的git标签
      name: tag-name
      type: string
    - description: 'The image full path to host the built image, with version tag, e.g. image-registry.openshift-image-registry.svc:5000/tekton-pipelines/spring-boot-docker:v1.0.0.'
      name: image-full-path-with-tag
      type: string
    - description: 用于部署的清单文件.
      name: deployment-manifest
      type: string
  tasks:
    - name: fetch-repository
      params:
        - name: url
          value: $(params.repo-url)
        - name: revision
          value: $(params.tag-name)
        - name: deleteExisting
          value: 'true'
      taskRef:
        kind: Task
        name: git-clone
      workspaces:
        - name: output
          workspace: workspace
    - name: maven
      params:
        - name: GOALS
          value:
            - '-B'
            - '-DskipTests'
            - clean
            - package
      runAfter:
        - fetch-repository
      taskRef:
        kind: Task
        name: maven
      workspaces:
        - name: maven-settings
          workspace: maven-settings
        - name: source
          workspace: workspace
    - name: buildah
      params:
        - name: IMAGE
          value: $(params.image-full-path-with-tag)
      runAfter:
        - maven
      taskRef:
        kind: Task
        name: buildah
      workspaces:
        - name: source
          workspace: workspace
    - name: deploy
      params:
        - name: script
          value: |
            kubectl apply -f $(params.deployment-manifest)
            echo "----------"
            kubectl get deployment
      runAfter:
        - buildah
      taskRef:
        kind: Task
        name: kubernetes-actions
      workspaces:
        - name: kubeconfig-dir
          workspace: empty-dir
        - name: manifest-dir
          workspace: empty-dir
  workspaces:
    - name: workspace
    - name: maven-settings
    - name: empty-dir
```
