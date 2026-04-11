#!/usr/bin/env python3
"""
批量修复文档中的相对路径链接，转换为 Jekyll 绝对路径格式。
规则：
- 将 [text](../relative/path) 转换为 [text](/docs/target/path)
- 自动计算正确的目标路径（处理多级 ../）
"""

import os
import re
from pathlib import Path

DOCS_DIR = Path("/home/kubedo/.openclaw/workspace/kdo/docs")

def get_absolute_path(md_file: Path, relative_link: str) -> str:
    """根据相对路径计算绝对路径"""
    # 移除锚点
    if '#' in relative_link:
        relative_path, anchor = relative_link.split('#', 1)
        anchor = '#' + anchor
    else:
        relative_path = relative_link
        anchor = ''

    # 计算目标路径
    current_dir = md_file.parent
    target_path = (current_dir / relative_path).resolve()

    # 确保目标在 docs 目录内
    try:
        target_path.relative_to(DOCS_DIR)
    except ValueError:
        print(f"警告: {md_file} -> {relative_link} 指向 docs 之外，跳过")
        return None

    # 转换为 Jekyll 绝对路径格式
    rel_to_docs = target_path.relative_to(DOCS_DIR)
    # 移除 .md 扩展名，保留目录结构
    if rel_to_docs.suffix == '.md':
        jekyll_path = '/' + str(rel_to_docs.with_suffix('')) + '/'
    else:
        jekyll_path = '/' + str(rel_to_docs) + '/'

    return jekyll_path + anchor

def fix_file(md_file: Path):
    """修复单个文件中的链接"""
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 匹配 Markdown 链接: [text](../relative/path) 或 [text](../relative/path#anchor)
    # 注意：不匹配已经有 /docs/ 或 http:// 的链接
    pattern = r'\[([^\]]+)\]\((\.\./([^)\s]+))\)'

    def replace_match(match):
        link_text = match.group(1)
        relative_link = match.group(2)
        # 跳过已经是绝对路径的
        if relative_link.startswith('/docs/') or relative_link.startswith('http'):
            return match.group(0)
        abs_path = get_absolute_path(md_file, relative_link)
        if abs_path:
            return f'[{link_text}]({abs_path})'
        return match.group(0)

    new_content = re.sub(pattern, replace_match, content)

    if new_content != content:
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✓ 修复: {md_file.relative_to(DOCS_DIR)}")
        return True
    return False

def main():
    print("开始批量修复文档链接...\n")
    count = 0
    for root, dirs, files in os.walk(DOCS_DIR):
        for file in files:
            if file.endswith('.md'):
                md_file = Path(root) / file
                if fix_file(md_file):
                    count += 1
    print(f"\n完成！共修复 {count} 个文件。")

if __name__ == '__main__':
    main()
