---
title: 告警配置
parent: 监控(Monitoring)
nav_order: 1
---



## 目录

- [功能概述](#功能概述)
- [访问入口](#访问入口)
- [核心概念与数据模型](#核心概念与数据模型)
  - [AlertmanagerConfig](#alertmanagerconfig)
  - [AlertmanagerRoute](#alertmanagerroute)
  - [AlertmanagerReceiver](#alertmanagerreceiver)
  - [InhibitRule](#inhibitrule)
  - [各接收器配置类型](#各接收器配置类型)
- [配置详情页（Details）](#配置详情页details)
  - [页面布局](#页面布局)
  - [告警路由（Alert Routing）](#告警路由alert-routing)
  - [全局配置（Global Configuration）](#全局配置global-configuration)
  - [模板（Templates）](#模板templates)
  - [抑制规则（Inhibit Rules）](#抑制规则inhibit-rules)
  - [接收器（Receivers）](#接收器receivers)
- [接收器管理](#接收器管理)
  - [创建/编辑接收器流程](#创建编辑接收器流程)
  - [接收器类型详解](#接收器类型详解)
  - [PagerDuty](#pagerduty)
  - [Webhook](#webhook)
  - [Email](#email)
  - [Slack](#slack)
  - [企业微信（WeChat Work）](#企业微信wechat-work)
  - [钉钉（DingTalk）](#钉钉dingtalk)
  - [路由标签编辑器](#路由标签编辑器)
  - [删除接收器](#删除接收器)
- [YAML 编辑器](#yaml-编辑器)
- [弹窗组件详解](#弹窗组件详解)
  - [AlertRoutingModal](#alertroutingmodal)
  - [GlobalConfigModal](#globalconfigmodal)
  - [InhibitRuleModal](#inhibitrulemodal)
- [数据持久化机制](#数据持久化机制)
  - [完整数据流](#完整数据流)
  - [代码实现](#代码实现)
  - [修改示例](#修改示例)
- [国际化（i18n）](#国际化i18n)
  - [字符串提取规则](#字符串提取规则)
  - [运行 i18n 提取](#运行-i18n-提取)
  - [添加中文翻译](#添加中文翻译)
- [组件架构](#组件架构)
  - [文件结构](#文件结构)
  - [组件层级关系](#组件层级关系)
  - [状态管理与数据流](#状态管理与数据流)
- [开发指南](#开发指南)
  - [常见开发任务](#常见开发任务)
  - [添加新的接收器类型](#添加新的接收器类型)
  - [修改全局配置字段](#修改全局配置字段)
  - [修改抑制规则表单](#修改抑制规则表单)
  - [修改路由编辑器](#修改路由编辑器)
  - [理解 DINGTALK 的特殊映射](#理解-dingtalk-的特殊映射)
  - [代码规范与注意事项](#代码规范与注意事项)

---

## 功能概述

Alertmanager 配置管理模块提供了一套完整的图形化界面，用于管理 OpenShift 集群中 Alertmanager 的配置。Alertmanager 的配置文件是一个 YAML 格式的文本，存储在 `monitoring` 命名空间下的 `alertmanager-main` Secret 中（标准 OpenShift 环境下为 `openshift-monitoring` 命名空间）。

该模块允许用户在不直接编辑 YAML 的情况下，通过表单完成以下配置管理任务：

| 功能 | 图形化入口 | 适用场景 |
|------|-----------|----------|
| **告警路由编辑** | Details → Alert Routing → Edit 弹窗 | 修改默认接收器、分组策略、重复间隔等 |
| **全局配置编辑** | Details → Global Configuration → Edit 弹窗 | 设置 IM 平台凭证、SMTP 服务器等全局参数 |
| **抑制规则管理** | Details → Inhibit Rules → Create/Edit/Delete | 配置告警抑制规则，减少告警风暴 |
| **接收器创建/编辑** | Details → Create Receiver / Kebab → Edit | 配置告警通知目的地 |
| **接收器删除** | 接收器 Kebab → Delete | 移除不再需要的接收器 |
| **YAML 编辑** | YAML 标签页 | 复杂配置场景、子路由编辑、模板路径修改 |

支持的接收器类型及对应 Alertmanager 原生字段：

| UI 显示名称 | YAML 配置键 | 原生支持 | 底层存储 |
|-------------|-------------|----------|----------|
| PagerDuty | `pagerduty_configs` | ✅ 原生 | `pagerduty_configs` |
| Webhook | `webhook_configs` | ✅ 原生 | `webhook_configs` |
| Email | `email_configs` | ✅ 原生 | `email_configs` |
| Slack | `slack_configs` | ✅ 原生 | `slack_configs` |
| 企业微信 | `wechat_configs` | ✅ 原生 | `wechat_configs` |
| 钉钉 | `dingtalk_configs` | ❌ 非原生 | `webhook_configs`（映射） |

---

## 访问入口

### 导航路径

1. 通过左侧导航菜单进入 **Administration → Cluster Settings → Configuration**
2. 在资源列表中点击 **Alertmanager** 条目
3. 进入 Alertmanager 配置页面

### URL 路由

| 路径 | 功能 | 组件入口 |
|------|------|----------|
| `/settings/cluster/alertmanagerconfig` | 配置详情页 | `AlertmanagerConfig` |
| `/settings/cluster/alertmanageryaml` | YAML 编辑器 | `AlertmanagerYAML` |
| `/settings/cluster/alertmanagerconfig/receivers/~new` | 创建接收器 | `CreateReceiver` |
| `/settings/cluster/alertmanagerconfig/receivers/:name/edit` | 编辑接收器 | `EditReceiver` |

### 历史兼容路由

旧版路由 `/monitoring/alertmanagerconfig` 和 `/monitoring/alertmanageryaml` 会自动重定向到 `/settings/cluster/` 路径。

---

## 核心概念与数据模型

### AlertmanagerConfig

对应 Alertmanager 完整 YAML 配置的 TypeScript 类型定义（`alertmanager-config.tsx`）：

```typescript
export type AlertmanagerConfig = {
  global?: { [key: string]: string };
  route?: AlertmanagerRoute;
  receivers?: AlertmanagerReceiver[];
  inhibit_rules?: InhibitRule[];
  templates?: string[];
};
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `global` | `object` | 全局配置（resolve_timeout、IM 凭证、SMTP 等） |
| `route` | `AlertmanagerRoute` | 路由配置（默认接收器、分组策略、匹配规则） |
| `receivers` | `AlertmanagerReceiver[]` | 接收器列表 |
| `inhibit_rules` | `InhibitRule[]` | 抑制规则列表 |
| `templates` | `string[]` | 模板文件路径列表 |

### AlertmanagerRoute

```typescript
export type AlertmanagerRoute = {
  receiver?: string;
  groupBy?: { [key: string]: string };
  groupWait?: string;
  groupInterval?: string;
  repeatInterval?: string;
  match?: labels[];
  match_re?: labels[];
  routes?: AlertmanagerRoute[];
  matchers?: string[];
};
```

| 字段 | 说明 |
|------|------|
| `receiver` | 默认接收器名称 |
| `groupBy` | 告警分组标签 |
| `groupWait` | 分组等待时间（如 `30s`） |
| `groupInterval` | 分组间隔时间（如 `5m`） |
| `repeatInterval` | 重复间隔时间（如 `3h`） |
| `match` / `match_re` | 旧版匹配语法（已弃用，自动转换为 matchers） |
| `matchers` | Prometheus 匹配器数组 |
| `routes` | 子路由（递归结构） |

### AlertmanagerReceiver

```typescript
export type AlertmanagerReceiver = {
  name: string;
  webhookConfigs?: WebhookConfig[];
  pagerdutyConfigs?: PagerDutyConfig[];
  wechat_configs?: WechatConfig[];
  dingtalk_configs?: DingtalkConfig[];
  email_configs?: EmailConfig[];
  slack_configs?: SlackConfig[];
};
```

接收器可以有零个或多个配置类型，每种类型是一个配置对象数组（通常只有一个元素）。

### InhibitRule

```typescript
export type InhibitRule = {
  source_match?: { [key: string]: string };
  source_match_re?: { [key: string]: string };
  target_match?: { [key: string]: string };
  target_match_re?: { [key: string]: string };
  equal?: string[];
};
```

抑制规则语义：当源告警（source）匹配 `source_match` 时，抑制目标告警（target）中匹配 `target_match` 的告警。`equal` 中列出的标签必须在源和目标之间相等。

### 各接收器配置类型

```typescript
type WebhookConfig = {
  url: string;
};

type PagerDutyConfig = {
  routingKey?: string;
  serviceKey?: string;
};

type WechatConfig = {
  send_resolved?: boolean;
  api_secret?: string;
  api_url?: string;
  corp_id?: string;
  agent_id?: string;
  to_user?: string;
  to_party?: string;
  to_tag?: string;
  message?: string;
};

type DingtalkConfig = {
  send_resolved?: boolean;
  url?: string;
};
```

注意：`DingtalkConfig` 是 UI 层概念，实际保存时映射为 `webhook_configs`。`WechatConfig` 则直接对应 Alertmanager 原生 `wechat_configs` 配置格式。

---

## 配置详情页（Details）

### 页面布局

详情页从上到下依次展示以下 5 个配置区块：

```
┌─────────────────────────────────────────┐
│ Alertmanager                             │
│  Details │ YAML                          │
├─────────────────────────────────────────┤
│ Alert routing                    [Edit]  │
│  Group by: namespace                     │
│  Group wait: 30s   Group interval: 5m    │
│  Repeat interval: 12h                    │
├─────────────────────────────────────────┤
│ Global configuration            [Edit]  │
│  Resolve timeout:  5m                    │
│  WeChat API URL:   https://...           │
│  WeChat Corp ID:   ww5aff790d58ffe139    │
├─────────────────────────────────────────┤
│ Templates                                │
│  • /etc/alertmanager/config/wechat.tmpl  │
├─────────────────────────────────────────┤
│ Inhibit rules          [Create Inhibit] │
│  Source           Target        Equal    │
│  severity=...  severity=~...  namespace  │
│                         [Edit] [Delete]  │
├─────────────────────────────────────────┤
│ Receivers               [Create ...]     │
│  Name │ Type │ Labels │ Actions          │
│  ─────┼──────┼────────┼───────           │
│  Def… │ Web… │ All    │ [⋮]             │
│  ...  │      │        │                  │
└─────────────────────────────────────────┘
```

### 告警路由（Alert Routing）

**展示内容：**

显示当前路由配置的 4 个核心参数：

| 参数 | 取值示例 | 对应 YAML 路径 |
|------|----------|----------------|
| Group by | `namespace` | `route.group_by` |
| Group wait | `30s` | `route.group_wait` |
| Group interval | `5m` | `route.group_interval` |
| Repeat interval | `12h` | `route.repeat_interval` |

**编辑弹窗字段（AlertRoutingModal）：**

| 字段 | 表单控件 | 说明 |
|------|----------|------|
| Default receiver | Select 下拉 | 从现有接收器列表中选择，可选"None" |
| Group by | TextInput | 逗号分隔的标签名，用于告警分组 |
| Group wait | TextInput | 首次告警发送前的等待时间（如 `30s`） |
| Group interval | TextInput | 同组告警的发送间隔（如 `5m`） |
| Repeat interval | TextInput | 告警重复发送的间隔（如 `3h`） |
| Matchers | TextInput | 接收器级匹配器（多行，每行一个 matcher） |

**提交逻辑（源码 `alert-routing-modal.tsx`）：**

```typescript
const updateAlertRoutingProperty = (config, propertyName, newValue, oldValue) => {
  if (!_.isEqual(newValue, oldValue)) {
    if (_.isEmpty(newValue)) {
      _.unset(config, ['route', propertyName]); // 空值移除，使用全局默认
    } else {
      _.set(config, ['route', propertyName], newValue);
    }
  }
};
```

关键行为：
- 空字符串或空数组 → 从配置中移除该字段（Alertmanager 将使用内置默认值）
- Group by 输入用逗号分割并 trim，空输入设为 `[]`
- Matchers 按换行符分割，过滤空行
- 仅在实际值发生变化时才修改配置

**组件链：**

```
AlertmanagerConfig (page)
  → AlertRouting (section)
    → LazyAlertRoutingModalOverlay (lazy)
      → AlertRoutingModalOverlay (modal wrapper)
        → AlertRoutingModal (form)
```

### 全局配置（Global Configuration）

**展示内容：**

列出所有已设置的全局配置 Key-Value，敏感字段（包含 secret、key、token 的字段）显示为 `••••••••`。

已设置的值显示在 DescriptionList 中。如果没有任何全局配置，展示提示文字"No global configuration set."，并提供"Add global configuration"链接。

**编辑弹窗字段（GlobalConfigModal）：**

| 分类 | 字段 | YAML Key | 类型 |
|------|------|----------|------|
| 时间 | Resolve timeout | `resolve_timeout` | text |
| 微信 | WeChat API URL | `wechat_api_url` | text |
| 微信 | WeChat API Secret | `wechat_api_secret` | password |
| 微信 | WeChat Corp ID | `wechat_api_corp_id` | text |
| SMTP | SMTP Smarthost | `smtp_smarthost` | text |
| SMTP | SMTP From | `smtp_from` | text |
| SMTP | SMTP Hello | `smtp_hello` | text |
| SMTP | SMTP Auth Username | `smtp_auth_username` | text |
| SMTP | SMTP Auth Password | `smtp_auth_password` | password |
| SMTP | SMTP Auth Identity | `smtp_auth_identity` | text |
| SMTP | SMTP Auth Secret | `smtp_auth_secret` | password |
| SMTP | SMTP Require TLS | `smtp_require_tls` | text |
| 其他 | Slack API URL | `slack_api_url` | password |
| 其他 | PagerDuty URL | `pagerduty_url` | text |
| 其他 | OpsGenie API URL | `opsgenie_api_url` | text |
| 其他 | OpsGenie API Key | `opsgenie_api_key` | password |
| 其他 | VictorOps API URL | `victorops_api_url` | text |
| 其他 | VictorOps API Key | `victorops_api_key` | password |
| 其他 | Telegram API URL | `telegram_api_url` | text |
| 其他 | Webex API URL | `webex_api_url` | text |

**提交逻辑：**

使用 `FormData` 获取所有表单值，与 `config.global` 中的旧值逐字段比较。仅变化的值才更新；空值从配置中 `_.unset`。

**组件链：**

```
GlobalConfig (section)
  → LazyGlobalConfigModalOverlay (lazy)
    → GlobalConfigModalOverlay (modal wrapper)
      → GlobalConfigModal (form)
```

### 模板（Templates）

当前为只读展示区块，显示 `config.templates` 数组内容。每个模板路径渲染为列表项。

如需修改模板路径，目前需要通过 YAML 编辑器操作。

### 抑制规则（Inhibit Rules）

**列表展示（InhibitRulesEditor）：**

每条抑制规则以三列网格展示：

| 列 | 内容 | 颜色 |
|----|------|------|
| Source | source_match / source_match_re 标签 | 蓝色标记 |
| Target | target_match / target_match_re 标签 | 橙色标记 |
| Equal | equal 标签名列表 | 纯文本 |

每条规则右侧有 **Edit** 和 **Delete** 按钮。

**Delete 流程：**

1. 点击 Delete 弹出确认对话框
2. 确认后从 `inhibit_rules` 数组中移除该规则
3. 如果数组为空，`_.unset` 移除整个 `inhibit_rules` 字段
4. 调用 `patchAlertmanagerConfig` 持久化

**编辑弹窗字段（InhibitRuleModal）：**

| 字段 | 输入控件 | 输入格式 | 对应 YAML |
|------|----------|----------|-----------|
| Source match | TextArea | 每行 `key=value` | `inhibit_rules[].source_match` |
| Source match regex | TextArea | 每行 `key=regex` | `inhibit_rules[].source_match_re` |
| Target match | TextArea | 每行 `key=value` | `inhibit_rules[].target_match` |
| Target match regex | TextArea | 每行 `key=regex` | `inhibit_rules[].target_match_re` |
| Equal | TextInput | 逗号分隔 | `inhibit_rules[].equal` |

**标签解析函数（源码 `inhibit-rule-modal.tsx`）：**

```typescript
const parseLabels = (text: string): { [key: string]: string } => {
  const result = {};
  _.each(text.split('\n'), (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      result[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  });
  return result;
};
```

**组件链：**

```
InhibitRulesEditor (section)
  → LazyInhibitRuleModalOverlay (lazy)
    → InhibitRuleModalOverlay (modal wrapper)
      → InhibitRuleModal (form, create/edit mode)
```

### 接收器（Receivers）

**列表展示（ReceiversTable）：**

使用 `ConsoleDataView` 组件渲染的响应式表格。

| 列 | 内容规则 |
|----|----------|
| Name | 接收器名称 |
| Integration type | 配置类型名（如 "pagerduty"），未配置时显示"Configure"链接 |
| Routing labels | 默认接收器显示"All (default receiver)"，其他显示路由标签 |
| Actions | Kebab 菜单（Edit / Delete） |

**初始化接收器检测：**

```typescript
export enum InitialReceivers {
  Critical = 'Critical',
  Default = 'Default',
  Watchdog = 'Watchdog',
}
```

当 Default 或 Critical 接收器存在但未配置集成类型时，页面顶部显示黄色 info Alert：
> "Incomplete alert receiver: Configure the receiver to ensure that you learn about important issues with your cluster."

**编辑/删除的权限逻辑：**

```typescript
const canUseEditForm =
  receiverHasSimpleRoute && hasSimpleReceiver(config, receiver, receiverIntegrationTypes);
const canDelete = !isDefaultReceiver && receiverHasSimpleRoute;
```

简单路由 = 无子路由；简单接收器 = 0 或 1 个已知类型的配置项。不符合条件的接收器编辑会跳转到 YAML 编辑器。

**组件链：**

```
Receivers (section)
  → ReceiversTable (ConsoleDataView)
    → getReceiverDataViewRows (rows builder)
  → CreateReceiver / EditReceiver (route)
    → ReceiverWrapper
      → ReceiverBaseForm (form)
```

---

## 接收器管理

### 创建/编辑接收器流程

**表单渲染流程：**

```
用户选择接收器类型
    ↓
subformFactory(type) 返回对应 Form 模块
    ↓
渲染 SubForm.Form 组件（类型特定字段）
    ↓
用户填写字段
    ↓
isFormInvalid 校验：
  - 接收器名称为空 → 不通过
  - 名称已存在 → 不通过，显示错误提示
  - 未选类型 → 不通过
  - 子表单验证失败 → 不通过
  - 路由标签有错误 → 不通过
    ↓
点击 Save
    ↓
createReceiver(defaultGlobals, formValues, createReceiverConfig, receiverToEdit)
    ↓
patchAlertmanagerConfig(secret, updateConfig) 持久化
```

**编辑模式（editReceiverNamed）的特殊处理：**

1. 从 `config.receivers` 中查找同名接收器
2. 自动检测接收器的配置类型（第一个 `_configs` 结尾的 key）
3. 加载对应子表单的 `getInitialValues` 预填字段
4. 查找接收器在路由中的关联标签，预填路由标签编辑器
5. 判断是否为默认接收器（`route.receiver === editReceiverNamed`）

**表单验证规则（`isFormInvalid`）：**

```typescript
const isFormInvalid =
  !formValues.receiverName ||             // 名称必填
  receiverNameAlreadyExist ||             // 名称唯一
  !formValues.receiverType ||             // 类型必选
  SubForm.isFormInvalid(formValues) ||    // 子表单验证
  !_.isEmpty(formValues.routeLabelFieldErrors) ||
  formValues.routeLabelDuplicateNamesError ||
  (!isDefaultReceiver &&                  // 非默认接收器至少需要一个路由标签
    formValues.routeLabels.length === 1 &&
    (formValues.routeLabels[0].name === '' || formValues.routeLabels[0].value === ''));
```

### 接收器类型详解

#### PagerDuty

对应 Alertmanager 配置格式：

```yaml
pagerduty_configs:
  - routing_key: <key>
    url: https://events.pagerduty.com/v2/enqueue
    send_resolved: true
```

| 字段 | formValues key | 必填 | 说明 |
|------|---------------|------|------|
| Integration type | `pagerdutyIntegrationType` | 是 | Events API v2 / Prometheus |
| Routing key | `pagerdutyRoutingKey` | 条件必填 | v2 类型使用 |
| Service key | `pagerdutyServiceKey` | 条件必填 | Prometheus 类型使用 |
| PagerDuty URL | `pagerdutyUrl` | 是 | API 地址 |
| PagerDuty description | `pagerdutyDescription` | 否 | 告警描述模板 |
| PagerDuty severity | `pagerdutySeverity` | 否 | 严重级别 |
| PagerDuty client | `pagerdutyClient` | 否 | 客户端名称模板 |
| PagerDuty client URL | `pagerdutyClientUrl` | 否 | 客户端 URL 模板 |
| Send resolved | `pagerdutySendResolved` | 否 | 已恢复通知 |

**验证逻辑：**

```typescript
export const isFormInvalid = (formValues) => {
  if (formValues.pagerdutyIntegrationType === PAGERDUTY_INTEGRATION_TYPE_V2) {
    return !formValues.pagerdutyRoutingKey;
  }
  return !formValues.pagerdutyServiceKey;
};
```

**全局配置交互：**
- "Save as default PagerDuty URL" 复选框：勾选时将 URL 写入 `config.global.pagerduty_url`
- 已保存的全局 URL 会从接收器配置中移除（避免重复）

**`createReceiverConfig` 核心逻辑：**

```typescript
export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  if (formValues.pagerdutyIntegrationType === PAGERDUTY_INTEGRATION_TYPE_V2) {
    _.set(receiverConfig, 'routing_key', formValues.pagerdutyRoutingKey);
    _.unset(receiverConfig, 'service_key');
  } else {
    _.set(receiverConfig, 'service_key', formValues.pagerdutyServiceKey);
    _.unset(receiverConfig, 'routing_key');
  }
  // URL 处理：比较全局值决定写入还是移除
  if (formValues.pagerdutySaveAsDefault) {
    // 将 URL 写入全局，从接收器配置移除
  } else if (formValues.pagerdutyUrl !== globals.pagerduty_url) {
    _.set(receiverConfig, 'url', formValues.pagerdutyUrl);
  }
  // send_resolved 处理：比较全局默认值
  if (formValues.pagerdutySendResolved !== globals.pagerduty_send_resolved) {
    _.set(receiverConfig, 'send_resolved', formValues.pagerdutySendResolved);
  } else {
    _.unset(receiverConfig, 'send_resolved');
  }
  // ... description, severity, client, client_url
};
```

#### Webhook

对应 Alertmanager 配置格式：

```yaml
webhook_configs:
  - url: https://hooks.example.com/alert
    send_resolved: true
```

| 字段 | formValues key | 必填 | 说明 |
|------|---------------|------|------|
| URL | `webhookUrl` | 是 | HTTP POST 端点 |
| Send resolved | `webhookSendResolved` | 否 | 已恢复通知 |

最简单的接收器类型。`createReceiverConfig` 仅处理 URL 和 send_resolved 两个字段。

#### Email

对应 Alertmanager 配置格式：

```yaml
email_configs:
  - to: admin@example.com
    from: alertmanager@example.com
    smarthost: smtp.example.com:587
    auth_username: user
    auth_password: pass
    require_tls: true
```

| 字段 | formValues key | 必填 | 说明 |
|------|---------------|------|------|
| To address | `emailTo` | 是 | 收件人 |
| From address | `emailFrom` | 是 | 发件人 |
| SMTP smarthost | `emailSmarthost` | 是 | SMTP 地址 |
| SMTP hello | `emailHello` | 是 | HELO |
| Auth username | `emailAuthUsername` | 否 | 认证用户 |
| Auth password | `emailAuthPassword` | 否 | 认证密码（password 输入） |
| Auth identity | `emailAuthIdentity` | 否 | 认证身份 |
| Auth secret | `emailAuthSecret` | 否 | 认证密钥（password 输入） |
| Require TLS | `emailRequireTls` | 否 | 需要 TLS |
| Email HTML body | `emailHtml` | 否 | HTML 模板（TextArea） |
| Send resolved | `emailSendResolved` | 否 | 已恢复通知 |

**"Save as default SMTP" 逻辑：**

勾选时，将 smarthost / from / hello / auth_username / auth_password / auth_identity / auth_secret / require_tls 全部写入 `config.global`，同时在接收器配置中移除这些字段（使用全局值）。

**`createReceiverConfig` 比较策略：**

每个字段与 `globals` 中对应的 SMTP 全局值比较：
- 不等 → 写入接收器配置
- 相等 → 从接收器配置中移除（使用全局默认）
- 全局没有该值 → 写入接收器配置

#### Slack

对应 Alertmanager 配置格式：

{% raw %}
```yaml
slack_configs:
  - api_url: https://hooks.slack.com/services/...
    channel: '#alerts'
    username: Alertmanager
    icon_emoji: ':alert:'
    title: '{{ template "slack.default.title" . }}'
    text: '{{ template "slack.default.text" . }}'
```
{% endraw %}

| 字段 | formValues key | 必填 | 说明 |
|------|---------------|------|------|
| Slack API URL | `slackApiUrl` | 是 | Webhook URL（password 输入） |
| Channel | `slackChannel` | 是 | 频道名 |
| Username | `slackUsername` | 是 | 发送者名称 |
| Icon Emoji | `slackIconEmoji` | 否 | Emoji 图标 |
| Icon URL | `slackIconUrl` | 否 | 图片图标 URL |
| Link names | `slackLinkNames` | 否 | 链接用户名 |
| Title | `slackTitle` | 否 | 消息标题模板 |
| Text | `slackText` | 否 | 消息正文模板 |
| Send resolved | `slackSendResolved` | 否 | 已恢复通知 |

**图标二选一验证：**

```typescript
if (formValues.slackIconEmoji && formValues.slackIconUrl) {
  // 提示用户只选一个（验证在 isFormInvalid 中处理）
}
```

**"Save as default Slack API URL" 逻辑：**

与 PagerDuty URL 机制相同。

#### 企业微信（WeChat Work）

对应 Alertmanager 原生配置格式：

{% raw %}
```yaml
wechat_configs:
  - send_resolved: true
    corp_id: 'ww5aff790d58ffe139'
    to_user: 'JiangZhiYong'
    agent_id: '1000045'
    api_secret: 'yKonv68_iFzIERrcXbzRxzMwaOzt80VRfhTEme4EgHc'
    message: '{{ template "wechat.default.message" . }}'
    api_url: 'https://qyapi.weixin.qq.com/cgi-bin/'
```
{% endraw %}

| 字段 | formValues key | 必填 | 说明 |
|------|---------------|------|------|
| Corp ID | `wechatCorpId` | 是 | 企业微信企业 ID |
| Agent ID | `wechatAgentId` | 是 | 应用 AgentId |
| API Secret | `wechatApiSecret` | 是 | 应用 Secret（password 输入） |
| To User | `wechatToUser` | 否 | 成员 ID，默认 @all |
| To Party | `wechatToParty` | 否 | 部门 ID |
| To Tag | `wechatToTag` | 否 | 标签 ID（高级配置） |
| Message template | `wechatMessage` | 否 | 消息模板 TextArea（高级配置） |
| API URL | `wechatApiUrl` | 否 | 自定义 API URL（高级配置） |
| Send resolved | `wechatSendResolved` | 否 | 已恢复通知（高级配置） |

**与全局配置的协作机制：**

全局配置中的 `wechat_api_url`、`wechat_api_secret`、`wechat_api_corp_id` 作为默认值。接收器级别设置的字段值优先。

**`createReceiverConfig` 构建策略：**

```typescript
export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  _.set(receiverConfig, 'corp_id', formValues.wechatCorpId);
  _.set(receiverConfig, 'agent_id', formValues.wechatAgentId);
  _.set(receiverConfig, 'api_secret', formValues.wechatApiSecret);

  if (formValues.wechatToUser)     _.set(receiverConfig, 'to_user', formValues.wechatToUser);
  if (formValues.wechatToParty)    _.set(receiverConfig, 'to_party', formValues.wechatToParty);
  if (formValues.wechatToTag)      _.set(receiverConfig, 'to_tag', formValues.wechatToTag);
  if (formValues.wechatMessage)    _.set(receiverConfig, 'message', formValues.wechatMessage);
  if (formValues.wechatApiUrl)     _.set(receiverConfig, 'api_url', formValues.wechatApiUrl);
  // send_resolved 比较全局值
};
```

**验证逻辑：**

```typescript
export const isFormInvalid = (formValues) => {
  return !formValues.wechatCorpId || !formValues.wechatAgentId || !formValues.wechatApiSecret;
};
```

#### 钉钉（DingTalk）

> ⚠️ 重要说明：Alertmanager **不原生支持** DingTalk。DingTalk 类型在 UI 层面呈现为独立的接收器类型，但底层存储为 `webhook_configs`，URL 指向钉钉机器人地址。

```yaml
# 实际存储的配置格式（webhook_configs）：
webhook_configs:
  - url: https://oapi.dingtalk.com/robot/send?access_token=xxx
    send_resolved: true
```

| 字段 | formValues key | 必填 | 说明 |
|------|---------------|------|------|
| Access Token | `dingtalkAccessToken` | 是 | 钉钉机器人 access_token |
| Secret | `dingtalkSecret` | 否 | 加签密钥（password 输入） |
| Custom Webhook URL | `dingtalkCustomUrl` | 否 | 自定义地址（高级配置） |
| Send resolved | `dingtalkSendResolved` | 否 | 已恢复通知（高级配置） |

**URL 构建规则（源码 `dingtalk-receiver-form.tsx`）：**

```typescript
const DINGTALK_WEBHOOK_URL = 'https://oapi.dingtalk.com/robot/send';

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  let webhookUrl: string;
  if (formValues.dingtalkCustomUrl) {
    webhookUrl = formValues.dingtalkCustomUrl;           // 优先使用自定义地址
  } else {
    webhookUrl = `${DINGTALK_WEBHOOK_URL}?access_token=${formValues.dingtalkAccessToken}`;  // 标准钉钉地址
  }
  _.set(receiverConfig, 'url', webhookUrl);
  // send_resolved 处理
};
```

**类型映射机制（源码 `alert-manager-receiver-forms.tsx`）：**

```typescript
const getEffectiveReceiverType = (receiverType: string): string => {
  return receiverType === 'dingtalk_configs' ? 'webhook_configs' : receiverType;
};
```

此函数在 `createReceiver` 中被调用，将虚拟的 `dingtalk_configs` 映射为实际的 `webhook_configs`。

**编辑时的注意事项：**

由于 DingTalk 接收器在存储时是 `webhook_configs`，编辑时会自动识别为 Webhook 类型，显示 Webhook 表单而非 DingTalk 表单。用户可以在 Webhook 表单中编辑 URL。

### 路由标签编辑器

路由标签决定哪些告警被路由到特定接收器。

**组件：** `RoutingLabelEditor`

**显示规则：**

- **默认接收器**：显示为禁用状态的输入框 `All (default receiver)`，不允许编辑
- **非默认接收器**：显示可编辑的标签输入列表
  - 初始时（新建接收器且无路由标签）显示一个空输入框
  - 编辑时加载已有标签
  - 可动态添加/删除标签行

**标签格式：**

每个标签使用 Prometheus matcher 语法，支持 4 种运算符：

| 运算符 | 含义 | 示例 |
|--------|------|------|
| `=` | 精确匹配 | `severity = critical` |
| `!=` | 不匹配 | `alertname != Watchdog` |
| `=~` | 正则匹配 | `namespace =~ production` |
| `!~` | 正则不匹配 | `severity !~ info` |

**兼容性处理：**

```typescript
const convertDeprecatedReceiverRoutesMatchesToMatchers = (receiverRoutes): string[] => {
  const matches = _.map(receiverRoutes?.match || {}, (v, k) => `${k} = ${v}`);
  const regexMatches = _.map(receiverRoutes?.match_re || {}, (v, k) => `${k} =~ ${v}`);
  return [...matches, ...regexMatches];
};
```

自动将旧的 `match`/`match_re` 对象语法转为 matcher 字符串数组。

**校验：**

标签名称在同一接收器内必须唯一，否则显示错误提示 `Routing label names must be unique.`

### 删除接收器

```typescript
const deleteReceiver = (secret, config, receiverName, navigate) => {
  const updatedConfig = _.cloneDeep(config);
  // 1. 移除路由
  _.update(updatedConfig, 'route.routes', (routes) => {
    _.remove(routes, (route) => route.receiver === receiverName);
    return routes;
  });
  // 2. 移除接收器
  _.update(updatedConfig, 'receivers', (receivers) => {
    _.remove(receivers, (receiver) => receiver.name === receiverName);
    return receivers;
  });
  // 3. 持久化并跳转
  return patchAlertmanagerConfig(secret, updatedConfig).then(() => {
    navigate('/settings/cluster/alertmanagerconfig');
  });
};
```

不可删除的场景：
1. **默认接收器**（`route.receiver` 引用的接收器）
2. **包含子路由的接收器**（`route.routes[].routes` 非空）

---

## YAML 编辑器

**位置：** `alertmanager-yaml-editor.tsx`

**适用场景：**

- 需要编辑 `route.routes` 的多级子路由结构
- 需要修改 `templates` 路径
- 需要添加 UI 表单不支持的字段（如 `mute_time_intervals`、`time_intervals`）
- 批量编辑操作
- 故障排查时直接修改 YAML

**技术实现：**

```typescript
const EditAlertmanagerYAML = (props) => (
  <AsyncComponent
    {...props}
    loader={() => import('../../edit-yaml').then((c) => c.EditYAML)}
    create={false}
    genericYAML
  />
);
```

通过 `AsyncComponent` 动态加载 `EditYAML` 组件，支持：
- YAML 语法高亮和行号
- 代码折叠
- 保存前校验

**保存校验：**

```typescript
const save = (yaml: string) => {
  if (_.isEmpty(yaml)) {
    setErrorMsg('Alertmanager configuration cannot be empty.');
    return;
  }
  try {
    safeLoad(yaml); // YAML 合法性校验
  } catch (e) {
    setErrorMsg(`Error parsing Alertmanager YAML: ${e}`);
    return;
  }
  patchAlertmanagerConfig(secret, yaml); // 直接保存字符串
};
```

---

## 弹窗组件详解

### AlertRoutingModal

**代码位置：** `frontend/public/components/modals/alert-routing-modal.tsx`

**Props 类型：**

```typescript
type AlertRoutingModalProps = {
  config: AlertmanagerConfig;
  secret: K8sResourceKind;
} & ModalComponentProps;
```

**Overlay 组件：** `AlertRoutingModalOverlay`

使用 `OverlayComponent` 类型，通过 `useOverlay()` hook 触发：

```typescript
const launchModal = useOverlay();
launchModal(LazyAlertRoutingModalOverlay, { config, secret });
```

**组件生命周期：**

```
useOverlay() → 创建 overlay
  → LazyAlertRoutingModalOverlay (React.lazy)
    → AlertRoutingModalOverlay (state: isOpen)
      → AlertRoutingModal (form, state: inProgress, errorMessage)
        → submit
          → patchAlertmanagerConfig
            → close (success) / setError (failure)
```

### GlobalConfigModal

**代码位置：** `frontend/public/components/monitoring/global-config/global-config-modal.tsx`

**字段生成机制：**

使用 `useGetGlobalFields(t)` hook 在运行时构建字段列表，确保每个 label 都是静态的 `t()` 调用，i18n 解析器可提取：

```typescript
const useGetGlobalFields = (t: any) =>
  useMemo(
    () => [
      { key: 'resolve_timeout', label: t('public~Resolve timeout'), placeholder: '5m' },
      { key: 'wechat_api_url', label: t('public~WeChat API URL'), placeholder: 'https://...' },
      // ... 20 个字段
    ],
    [t],
  );
```

**安全处理：**

`type: 'password'` 的字段在 UI 中使用 `<TextInput type="password" />`。敏感字段在详情页展示时显示为 `••••••••`。

### InhibitRuleModal

**代码位置：** `frontend/public/components/monitoring/inhibit-rules/inhibit-rule-modal.tsx`

**两种模式：**

| 模式 | 判断条件 | 行为 |
|------|----------|------|
| 创建 | `rule` prop 为 undefined | 弹窗标题"Create inhibit rule"；提交时 push 到数组 |
| 编辑 | `rule` prop 为 InhibitRule 对象 | 弹窗标题"Edit inhibit rule"；预填字段；提交时替换数组中的原对象 |

**标签格式化函数：**

```typescript
const formatLabels = (labels: { [key: string]: string }): string => {
  return _.map(labels, (v, k) => `${k}=${v}`).join('\n');
};
```

---

## 数据持久化机制

### 完整数据流

```
                        ┌──────────────────────────────┐
                        │  alertmanager-main Secret      │
                        │  (monitoring namespace)        │
                        │  data.alertmanager.yaml        │
                        └──────────┬───────────────────┘
                                   │ k8sWatchResource
                                   ▼
                    ┌──────────────────────────────┐
                    │  Base64.decode                │
                    │  YAML safeLoad                │
                    │  → AlertmanagerConfig object  │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │  UI 操作修改对象              │
                    │  （路由弹窗 / 抑制规则 /      │
                    │   接收器表单 / 全局配置）      │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │  _.cloneDeep(config)          │
                    │  → 修改克隆对象               │
                    │  → 比较新旧值，仅写入变更      │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │  YAML safeDump(config)        │
                    │  Base64.encode(yamlString)    │
                    │  JSON Patch:                 │
                    │    [{op: 'replace',           │
                    │      path: '/data/alertmanager.yaml',
                    │      value: encodedString}]   │
                    │  → k8sPatch(SecretModel, ...) │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    Alertmanager 热加载新配置
```

### 代码实现

核心工具函数（`alertmanager-utils.tsx`）：

```typescript
// 读取：从 Secret 解码并解析
export const getAlertmanagerConfig = (secret: K8sResourceKind) => {
  const raw = Base64.decode(secret.data['alertmanager.yaml']);
  const config = safeLoad(raw);
  return { config, errorMessage };
};

// 写入：序列化、编码、Patch
export const patchAlertmanagerConfig = (secret, yaml: object | string) => {
  const yamlString = _.isObject(yaml) ? safeDump(yaml) : yaml;
  const encoded = Base64.encode(yamlString);
  const patch = [{ op: 'replace', path: '/data/alertmanager.yaml', value: encoded }];
  return k8sPatch(SecretModel, secret, patch);
};
```

### 修改示例

以一个路由编辑为例的完整数据流：

```typescript
// 1. 用户点击 Save
const submit = (event) => {
  event.preventDefault();

  // 2. 读取表单值
  const groupByNew = event.target.elements['input-group-by'].value.replace(/\s+/g, '');

  // 3. 深拷贝配置
  const updatedConfig = _.cloneDeep(config);

  // 4. 仅在值变化时修改
  if (groupByNew !== _.get(config, ['route', 'group_by'], []).join(', ')) {
    if (groupByNew === '') {
      _.unset(updatedConfig, ['route', 'group_by']);  // 空值移除
    } else {
      _.set(updatedConfig, ['route', 'group_by'], groupByNew.split(','));
    }
  }

  // 5. 持久化
  setInProgress(true);
  patchAlertmanagerConfig(secret, updatedConfig).then(
    () => { close(); },
    (err) => { setErrorMessage(err.message); setInProgress(false); },
  );
};
```

---

## 国际化（i18n）

### 字符串提取规则

本模块所有用户可见字符串使用 `react-i18next` + `t()` 函数。

**命名空间规则：**

| 文件位置 | 命名空间 | 调用方式 |
|----------|----------|----------|
| `public/components/monitoring/` | `public` | `t('public~Some text')` |
| `public/components/modals/` | `public` | `t('public~Some text')` |

**解析器提取规则（`i18next-parser.config.js`）：**

```javascript
{
  keySeparator: false,           // 不分割 key
  namespaceSeparator: '~',       // 命名空间分隔符
  defaultNamespace: 'public',
  locales: ['en'],               // 仅为英文生成
}
```

**支持的语法：**

{% raw %}
```typescript
t('public~Static text')                       // ✅ 静态字符串
t('public~Hello {{name}}')                    // ✅ 插值变量
t('public~{{count}} item', { count: 5 })      // ✅ 复数（自动添加 _one / _other 后缀）
```
{% endraw %}

**不支持的语法（解析器无法提取）：**

```typescript
t(`public~${dynamicKey}`)                     // ❌ 模板字面量
t('public~' + variable)                       // ❌ 字符串拼接
t(someVariable)                               // ❌ 变量作为 key
```

### 运行 i18n 提取

```bash
cd frontend
yarn i18n
```

该命令会：
1. 扫描所有 `.ts` / `.tsx` / `.js` / `.jsx` / `.json` 文件
2. 提取 `t('...')` 中的静态字符串
3. 更新 `public/locales/en/public.json`
4. 合并多包中同 namespace 的 key
5. 填充英文默认值（key 本身作为 value）

### 添加中文翻译

编辑 `frontend/public/locales/zh/public.json`，添加对应的中文翻译：

```json
{
  "Inhibit rules": "抑制规则",
  "Create Inhibit Rule": "创建抑制规则",
  "Global configuration": "全局配置",
  "WeChat Work": "企业微信",
  "DingTalk": "钉钉"
}
```

---

## 组件架构

### 文件结构

```
frontend/public/components/
├── monitoring/
│   ├── alertmanager/
│   │   ├── alertmanager-config.tsx           # 详情页主视图 + 所有类型定义
│   │   ├── alertmanager-utils.tsx            # YAML 编解码 + Secret 读写
│   │   └── alertmanager-yaml-editor.tsx      # YAML 编辑器视图
│   ├── global-config/
│   │   └── global-config-modal.tsx           # 全局配置弹窗
│   ├── inhibit-rules/
│   │   ├── inhibit-rule-modal.tsx            # 抑制规则弹窗
│   │   └── inhibit-rules-editor.tsx          # 抑制规则列表
│   ├── receiver-forms/
│   │   ├── alert-manager-receiver-forms.tsx  # 接收器表单主控
│   │   ├── advanced-configuration.tsx        # 可折叠面板
│   │   ├── dingtalk-receiver-form.tsx        # 钉钉表单
│   │   ├── email-receiver-form.tsx           # 邮件表单
│   │   ├── pagerduty-receiver-form.tsx       # PagerDuty 表单
│   │   ├── receiver-form-props.ts            # 表单组件类型
│   │   ├── routing-labels-editor.tsx         # 路由标签编辑器
│   │   ├── save-as-default-checkbox.tsx      # 保存为默认值
│   │   ├── send-resolved-alerts-checkbox.tsx # 已恢复通知
│   │   ├── slack-receiver-form.tsx           # Slack 表单
│   │   ├── webhook-receiver-form.tsx         # Webhook 表单
│   │   └── wechat-receiver-form.tsx          # 企业微信表单
│   ├── format.tsx                            # 数值格式化工具
│   ├── poll-interval-dropdown.tsx            # 轮询间隔控件
│   ├── types.ts                              # 通用类型定义
│   ├── utils.ts                              # 通用工具函数
│   ├── hooks/useBoolean.ts                   # 布尔状态 hook
│   ├── _monitoring.scss                      # 样式
│   └── README.md                             # 本文档
└── modals/
    ├── index.ts                              # 所有懒加载弹窗注册中心
    └── alert-routing-modal.tsx               # 告警路由编辑弹窗
```

### 组件层级关系

```
AlertmanagerConfig（页面级，监听 Secret）
├── NavBar（Details / YAML 标签）
├── StatusBox（加载状态）
│
├── [Details 标签]
│   ├── AlertRouting（路由区块）
│   │   └── LazyAlertRoutingModalOverlay
│   │       └── AlertRoutingModal
│   ├── GlobalConfig（全局配置区块）
│   │   └── LazyGlobalConfigModalOverlay
│   │       └── GlobalConfigModal
│   ├── TemplatesSection（模板区块）
│   ├── InhibitRulesEditor（抑制规则区块）
│   │   ├── InhibitRuleRow × N
│   │   └── LazyInhibitRuleModalOverlay
│   │       └── InhibitRuleModal
│   └── Receivers（接收器区块）
│       └── ReceiversTable（ConsoleDataView）
│
├── [YAML 标签]
│   ├── AlertmanagerYAMLEditor
│   │   └── EditAlertmanagerYAML（动态加载 EditYAML）
│
├── [路由级]
│   ├── CreateReceiver
│   │   └── ReceiverWrapper → ReceiverBaseForm
│   │       ├── SubForm（按类型动态选择）
│   │       │   ├── PagerDutyForm.Form
│   │       │   ├── WebhookForm.Form
│   │       │   ├── EmailForm.Form
│   │       │   ├── SlackForm.Form
│   │       │   ├── WechatForm.Form
│   │       │   └── DingtalkForm.Form
│   │       └── RoutingLabelEditor
│   └── EditReceiver
│       └── ReceiverWrapper → ReceiverBaseForm（同上）
```

### 状态管理与数据流

**数据获取：**

```typescript
// alertmanager-config.tsx
const [secret, loaded, loadError] = useK8sWatchResource<K8sResourceKind>({
  kind: 'Secret',
  name: 'alertmanager-main',
  namespace: 'monitoring',
  isList: false,
});
```

**全局默认值获取：**

```typescript
// alert-manager-receiver-forms.tsx (ReceiverWrapper)
useEffect(() => {
  coFetchJSON(`${alertManagerBaseURL}/api/v2/status/`)
    .then((data) => {
      const { global } = safeLoad(data?.config?.original);
      setAlertmanagerGlobals(global);
    });
}, [alertManagerBaseURL]);
```

**组件间通信模式：**

- **父→子**：Props（secret、config、formValues）
- **弹窗**：`useOverlay()` hook + OverlayComponent 模式，通过 Props 传递 config 和 secret
- **表单**：`useReducer(formReducer, INITIAL_STATE)` 管理局部状态
- **保存**：所有修改最终调用 `patchAlertmanagerConfig()`

---

## 开发指南

### 常见开发任务

| 任务 | 涉及文件 | 修改要点 |
|------|----------|----------|
| 新增全局配置字段 | `global-config-modal.tsx` | 在 `useGetGlobalFields` 数组添加条目 |
| 新增接收器类型 | 见下方详细教程 | 6 步完成 |
| 修改抑制规则字段 | `inhibit-rule-modal.tsx` | 修改表单 JSX + `submit` 函数 |
| 修改路由编辑器 | `alert-routing-modal.tsx` | 添加/修改 FormGroup + submit 逻辑 |
| 修改接收器表单验证 | 对应 `{type}-receiver-form.tsx` | 修改 `isFormInvalid` 函数 |
| 添加中文翻译 | `public/locales/zh/public.json` | 添加 key-value 对 |
| 更新 i18n key | 全局 | 运行 `yarn i18n` |

### 添加新的接收器类型

以添加"钉钉"为例说明完整流程：

**步骤 1：创建表单文件**

`receiver-forms/dingtalk-receiver-form.tsx`，必须导出 5 个接口：

```typescript
export const Form: FC<FormProps>           // 表单 UI（JSX）
export const getInitialValues              // 初始化值函数
export const isFormInvalid                 // 验证函数 → boolean
export const updateGlobals                 // 全局配置更新（通常返回空对象）
export const createReceiverConfig          // 构建 YAML 配置对象
```

**步骤 2：注册到 receiverTypes**

`alertmanager-utils.tsx`：

```typescript
// t('public~DingTalk')
export const receiverTypes = Object.freeze({
  ...
  dingtalk_configs: 'DingTalk',
});
```

`t()` 注释为 i18n parser 提供提取线索。

**步骤 3：注册到 subformFactory**

`alert-manager-receiver-forms.tsx`：

```typescript
import * as DingtalkForm from './dingtalk-receiver-form';

const subformFactory = (receiverType) => {
  switch (receiverType) {
    ...
    case 'dingtalk_configs': return DingtalkForm;
  }
};

const INITIAL_STATE = {
  ...
  ...DingtalkForm.getInitialValues(defaultGlobals, null),
};

const advancedConfigGlobals = {
  ...
  ['dingtalk_send_resolved']: true,
};
```

**步骤 4：处理非原生类型的映射**

Alertmanager 不原生支持的接收器类型需要映射：

```typescript
const getEffectiveReceiverType = (receiverType) => {
  return receiverType === 'dingtalk_configs' ? 'webhook_configs' : receiverType;
};
```

**步骤 5：i18n 提取**

```bash
cd frontend && yarn i18n
```

**步骤 6：添加中文翻译**

```json
{
  "DingTalk": "钉钉",
  "Access Token": "访问令牌"
}
```

### 修改全局配置字段

1. 打开 `global-config-modal.tsx`
2. 在 `useGetGlobalFields` 数组中添加新字段条目：

```typescript
{
  key: 'new_field_name',              // 对应 config.global 中的 key
  label: t('public~Display Label'),   // 显示名称（用 t() 包裹）
  placeholder: 'default value',       // 占位符
  type: 'password',                   // 可选，敏感字段用 password
}
```

3. 不需要修改 submit 函数，字段自动通过 `FormData` 处理
4. 运行 `yarn i18n` 提取新 key

### 修改抑制规则表单

1. 打开 `inhibit-rule-modal.tsx`
2. 在 `<Form>` 中添加/修改 `<FormGroup>`
3. 在 `submit` 函数中从 `formData` 读取新字段
4. 根据创建/编辑模式分别处理
5. 运行 `yarn i18n`

### 修改路由编辑器

1. 打开 `alert-routing-modal.tsx`
2. 添加新的 `<FormGroup>` 字段
3. 在 `submit` 函数中读取表单值
4. 使用 `updateAlertRoutingProperty` 或直接操作 config 对象
5. 运行 `yarn i18n`

### 理解 DingTalk 的特殊映射

DingTalk 的处理是整个系统中唯一的特殊情况。理解这个映射对维护非常重要：

```
用户选择 "DingTalk" 类型
    ↓ UI 层显示 DingTalk 表单
    ↓
receiverType = 'dingtalk_configs'
    ↓
getEffectiveReceiverType → 'webhook_configs'
    ↓
dingtalk-receiver-form.createReceiverConfig
  → 构建 { url: 'https://oapi.dingtalk.com/robot/send?access_token=xxx' }
    ↓
保存为：{ name: '...', webhook_configs: [{ url: '...' }] }
```

这意味着：
- 查看已保存的 YAML 时，DingTalk 接收器显示为 `webhook_configs`
- 编辑已保存的 DingTalk 接收器时，表单自动使用 Webhook 类型
- 如需在编辑时自动识别为 DingTalk 类型，需要检测 URL 模式（开发中可能的功能）

### 代码规范与注意事项

**通用规则：**

1. **深拷贝优先**：修改配置前始终调用 `_.cloneDeep(config)`，避免直接修改原始对象
2. **空值清理**：用户清空字段时应从配置中移除（`_.unset`），让 Alertmanager 使用默认值
3. **按需保存**：比较新旧值，仅在实际变更时才调用 `patchAlertmanagerConfig`
4. **表单验证**：`isFormInvalid` 返回 `true` 时 `Save` 按钮禁用，需确保验证逻辑完整
5. **i18n 静态调用**：`t()` 中禁止使用模板字面量或变量拼接
6. **类型安全**：新接收器类型需在 `AlertmanagerReceiver` 和 `AlertmanagerConfig` 类型中添加对应字段

**常见错误：**

| 错误 | 后果 | 解决方法 |
|------|------|----------|
| `t(\`public~${var}\`)` | i18n 无法提取 key | 改为静态 `t('public~text')` |
| 直接修改 `config` | 脏数据写入 | 使用 `_.cloneDeep` |
| 未处理空值 | 配置中有空字符串字段 | 使用 `_.unset` 移除空值 |
| 忘记注册 subformFactory | 选择类型后表单空白 | 在 switch 中添加 case |

**Elint 规范：**

```bash
# 检查单个文件
yarn eslint path/to/file.tsx

# 自动修复
yarn eslint --fix path/to/file.tsx

# 检查所有监控文件
yarn eslint public/components/monitoring/
```
