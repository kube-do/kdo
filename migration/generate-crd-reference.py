#!/usr/bin/env python3
"""Generate CRD reference pages from the KDC and PAC CRD manifests.

The generated Markdown is committed so the docs build does not depend on the
source repositories. Re-run this script after upgrading KDC or PAC:

    python3 migration/generate-crd-reference.py

Requires PyYAML (`python3 -m pip install pyyaml`).
"""

from __future__ import annotations

import os
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
REPO_PARENT = ROOT.parent


def sibling_repo(name: str) -> Path:
    """Locate a sibling checkout under common kube-do workspace layouts."""
    workspace = REPO_PARENT.parent.parent
    candidates = [
        REPO_PARENT / name,
        workspace / "gitee.com" / "kube-do" / name,
        workspace / "github.com" / "kube-do" / name,
    ]
    for candidate in candidates:
        if candidate.is_dir():
            return candidate
    return candidates[0]


KDC_DIR = Path(
    os.environ.get(
        "KDC_CRD_DIR",
        str(sibling_repo("kdc") / "config" / "crd" / "bases"),
    )
)
PAC_CRD = Path(
    os.environ.get(
        "PAC_CRD",
        str(sibling_repo("pipelines-as-code") / "config" / "300-repositories.yaml"),
    )
)
OUT = ROOT / "site-docs" / "reference" / "crd"

if not KDC_DIR.is_dir():
    raise SystemExit(
        f"KDC CRD 目录不存在：{KDC_DIR}\n"
        "请把 KDC 仓库放在本仓库同级目录，或设置 KDC_CRD_DIR。"
    )
if not PAC_CRD.is_file():
    raise SystemExit(
        f"PAC CRD 文件不存在：{PAC_CRD}\n"
        "请把 pipelines-as-code 仓库放在本仓库同级目录，或设置 PAC_CRD。"
    )

INTERNAL_PREFIXES = ("Image", "ImageStream")

KIND_DESCRIPTIONS = {
    "AppEnv": "项目环境，定义环境类型、目标集群以及删除时是否清理命名空间。",
    "AppProject": "应用项目，定义项目成员以及删除时是否清理命名空间。",
    "Cluster": "纳管集群的连接、默认域名、监控日志地址、镜像仓库与 OIDC 配置。",
    "Group": "用户组，映射 IdP 的 groups claim，并作为 RBAC 授权主体。",
    "User": "平台用户，保存 OIDC 身份、联系方式与启用状态。",
    "KdcCertificate": "证书分发对象，按域名和集群把 TLS Secret 分发到目标命名空间。",
    "Notification": "通知事件与投递记录，由通知控制器创建和维护。",
    "NotificationChannel": "可复用的通知渠道，定义提供商、凭据、限流和可见范围。",
    "NotificationPreference": "用户级通知偏好，定义渠道、类型、静默时段和摘要策略。",
    "NotificationRule": "项目级通知路由规则，按事件匹配接收人、渠道和静默时段。",
    "Repository": "Pipelines as Code 的代码仓库配置，定义 Git 提供商、分支环境、事件和流水线参数。",
    "Image": "容器镜像的不可变快照，包含镜像元数据与摘要。",
    "ImageSignature": "镜像签名，用于验证镜像来源与完整性。",
    "ImageStream": "镜像流，维护 tag 到镜像的映射，可跟踪镜像版本变化。",
    "ImageStreamImage": "通过 digest 定位 ImageStream 中的某个具体镜像。",
    "ImageStreamImport": "镜像导入请求，创建时把外部镜像导入 ImageStream。",
    "ImageStreamLayers": "ImageStream 中镜像的层索引，记录镜像由哪些 blob 组成。",
    "ImageStreamMapping": "把单个 tag 映射到指定容器镜像的请求对象。",
    "ImageStreamTag": "ImageStream 中的标签及其对应镜像。",
    "ImageTag": "镜像标签，记录 tag、历史与当前引用的镜像。",
}


def load(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def version_of(spec: dict) -> dict:
    versions = spec.get("versions", [])
    for version in versions:
        if version.get("storage"):
            return version
    return versions[0]


def root_schema(spec: dict) -> dict:
    version = version_of(spec)
    return version.get("schema", {}).get("openAPIV3Schema", {})


def version_name(spec: dict) -> str:
    return version_of(spec).get("name", "")


def type_name(schema: dict) -> str:
    if not schema:
        return "object"
    if "x-kubernetes-int-or-string" in schema:
        return "int-or-string"
    kind = schema.get("type")
    if kind == "array":
        return f"array<{type_name(schema.get('items', {}))}>"
    if kind == "object":
        if schema.get("additionalProperties"):
            return "map"
        if schema.get("x-kubernetes-preserve-unknown-fields"):
            return "object（任意结构）"
        return "object"
    return kind or "object"


URL_RE = re.compile(r"https?://[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+")


def normalize(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def truncate(text: str | None, limit: int) -> str:
    text = normalize(text)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def md(text: str | None) -> str:
    """Escape a schema description for a Markdown table cell inside MDX."""
    text = normalize(text)
    text = text.replace("`", "'")
    text = text.replace("|", "\\|")
    text = text.replace("<", "&lt;").replace(">", "&gt;")
    text = text.replace("{", "&#123;").replace("}", "&#125;")
    text = URL_RE.sub(lambda m: f"`{m.group(0)}`", text)
    return text


def field_table(properties: dict, required: list[str]) -> str:
    if not properties:
        return "该层级没有可展示的字段。\n"
    rows = ["| 字段 | 类型 | 必填 | 说明 |", "|---|---|---|---|"]
    required_set = set(required or [])
    for name in sorted(properties):
        field = properties[name] or {}
        desc = md(truncate(field.get("description") or "—", 280))
        rows.append(
            f"| `{name}` | `{type_name(field)}` | "
            f"{'是' if name in required_set else '否'} | {desc} |"
        )
    return "\n".join(rows) + "\n"


def slug(value: str) -> str:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value)
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "field"


def nested_sections(kind: str, properties: dict, level: int = 1) -> list[str]:
    """Render one level of object fields for the user-facing CRDs."""
    if level > 1:
        return []
    out: list[str] = []
    for name in sorted(properties):
        field = properties[name] or {}
        schema = field
        if field.get("type") == "array":
            schema = field.get("items", {}) or {}
        if schema.get("type") != "object":
            continue
        children = schema.get("properties") or {}
        if not children:
            continue
        anchor = f"{slug(kind)}-{slug(name)}"
        out.append(f"### {name} 字段 {{#{anchor}}}")
        out.append("")
        out.append(field_table(children, schema.get("required", [])))
        out.append("")
        out.extend(nested_sections(kind, children, level + 1))
    return out


def render_crd(crd: dict) -> tuple[str, dict]:
    spec = crd["spec"]
    names = spec["names"]
    kind = names["kind"]
    root = root_schema(spec)
    props = root.get("properties", {})
    spec_schema = props.get("spec", {}) or {}
    status_schema = props.get("status", {}) or {}
    description_raw = KIND_DESCRIPTIONS.get(kind) or normalize(
        root.get("description") or spec_schema.get("description")
    ) or f"{kind} 自定义资源。"
    description = md(description_raw)

    lines = [
        f"## {kind} {{#{slug(kind)}}}",
        "",
        description,
        "",
        "| 项目 | 值 |",
        "|---|---|",
        f"| Group | `{spec['group']}` |",
        f"| Version | `{version_name(spec)}` |",
        f"| Scope | `{spec.get('scope', 'Namespaced')}` |",
        f"| Plural | `{names.get('plural', '')}` |",
        "",
        "`metadata` 为标准 Kubernetes 字段，下表只列出 `spec` 与 `status`。",
        "",
        "### Spec",
        "",
    ]
    lines.append(field_table(spec_schema.get("properties", {}), spec_schema.get("required", [])))
    lines.extend(nested_sections(kind, spec_schema.get("properties", {})))

    lines.extend(["### Status", ""])
    status_props = status_schema.get("properties", {})
    if status_props:
        lines.append(field_table(status_props, status_schema.get("required", [])))
    else:
        lines.append("该 CRD 未定义 `status` 字段，或状态由控制器以其他资源记录。\n")

    return "\n".join(lines).rstrip() + "\n", {
        "kind": kind,
        "group": spec["group"],
        "version": version_name(spec),
        "scope": spec.get("scope", "Namespaced"),
        "description": description_raw,
        "fields": len(spec_schema.get("properties", {})),
        "internal": kind.startswith(INTERNAL_PREFIXES),
    }


def write_index(rows: list[dict]) -> None:
    lines = [
        "---",
        'title: "CRD 参考"',
        'description: "KDO 平台、通知、证书、镜像与 Pipelines as Code 自定义资源的字段参考。"',
        "sidebar_position: 6",
        "doc_type: reference",
        "audience: [admin, developer]",
        "owner: docs-team",
        "last_reviewed: 2026-11-23",
        "status: stable",
        "---",
        "",
        "本页由 CRD 清单生成，字段以对应版本的 OpenAPI schema 为准。升级 KDC 或 PAC 后应重新生成。",
        "",
        "## 用户与平台资源",
        "",
        "| CRD | Group / Version | Scope | Spec 字段 | 说明 |",
        "|---|---|---|---|---|",
    ]
    for row in rows:
        if row["internal"]:
            continue
        anchor = f"./kdc.md#{slug(row['kind'])}" if row["group"] == "kube-do.cn" else f"./pac.md#{slug(row['kind'])}"
        desc = md(truncate(row["description"], 90))
        lines.append(
            f"| [{row['kind']}]({anchor}) | `{row['group']}/{row['version']}` | "
            f"{row['scope']} | {row['fields']} | {desc} |"
        )

    lines += [
        "",
        "## 镜像相关内部资源",
        "",
        "以下 CRD 由 KDC 管理镜像、镜像流和签名，通常不需要手工创建或编辑。",
        "",
        "| CRD | Group / Version | Scope | 说明 |",
        "|---|---|---|---|",
    ]
    for row in rows:
        if not row["internal"]:
            continue
        anchor = f"./kdc.md#{slug(row['kind'])}"
        desc = md(truncate(row["description"], 100))
        lines.append(
            f"| [{row['kind']}]({anchor}) | `{row['group']}/{row['version']}` | "
            f"{row['scope']} | {desc} |"
        )

    lines += [
        "",
        "## 字段约定",
        "",
        "- `metadata`、`apiVersion`、`kind` 为标准 Kubernetes 字段，不在每个 CRD 下重复。",
        "- `spec` 是期望状态，`status` 由控制器写入；修改 `status` 不会改变实际资源。",
        "- 必填表示 schema 中的 `required`，不代表所有场景都必须显式填写。",
        "- 对象字段只展开一层；更深层的字段以源码中的 OpenAPI schema 为准。",
        "",
        "## 详细参考",
        "",
        "- [KDO 平台 CRD](./kdc.md)",
        "- [Pipelines as Code Repository](./pac.md)",
        "- [参考手册](/docs/reference/)",
        "",
    ]
    (OUT / "index.md").write_text("\n".join(lines), encoding="utf-8")


def write_group_page(filename: str, title: str, description: str, position: int, items: list[dict]) -> None:
    lines = [
        "---",
        f'title: "{title}"',
        f'description: "{description}"',
        f"sidebar_position: {position}",
        "doc_type: reference",
        "audience: [admin, developer]",
        "owner: docs-team",
        "last_reviewed: 2026-11-23",
        "status: stable",
        "---",
        "",
        "本页由 CRD 清单生成。字段以对应版本的 OpenAPI schema 为准；`metadata` 等标准字段不再重复。",
        "",
    ]
    for item in items:
        lines.append(item["markdown"])
        lines.append("")
    (OUT / filename).write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    kdc_files = sorted(KDC_DIR.glob("*.yaml"))
    if not kdc_files:
        raise SystemExit(f"no CRD manifests found in {KDC_DIR}")

    rows: list[dict] = []
    kdc_pages: list[dict] = []
    for path in kdc_files:
        crd = load(path)
        if crd.get("kind") != "CustomResourceDefinition":
            continue
        markdown, row = render_crd(crd)
        rows.append(row)
        kdc_pages.append({"markdown": markdown})

    if not PAC_CRD.exists():
        raise SystemExit(f"PAC CRD not found: {PAC_CRD}")
    pac_crd = load(PAC_CRD)
    pac_markdown, pac_row = render_crd(pac_crd)
    rows.append(pac_row)

    rows.sort(key=lambda item: (item["group"] != "kube-do.cn", item["internal"], item["kind"]))
    write_index(rows)
    write_group_page(
        "kdc.md",
        "KDO 平台 CRD",
        "KDO 平台、项目、集群、身份、通知、证书与镜像相关自定义资源的字段参考。",
        7,
        kdc_pages,
    )
    write_group_page(
        "pac.md",
        "Pipelines as Code Repository CRD",
        "Pipelines as Code Repository 自定义资源的字段参考。",
        8,
        [{"markdown": pac_markdown}],
    )

    print(f"generated {len(rows)} CRDs -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
