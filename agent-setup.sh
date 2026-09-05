#!/bin/bash
# 自动化部署脚本（幂等版）：安装 bun、opencode-ai，并配置集群 agent swarm 技能包
# 同时创建 .claude 目录并链接技能包，支持 Claude Code / Codex

set -e  # 遇到错误立即退出

echo "=== 开始执行自动化部署脚本（幂等模式） ==="

# 1. 设置 npm 镜像源为国内镜像（幂等）
echo ">>> 设置 npm registry..."
npm config set registry https://registry.npmmirror.com

# 2. 全局安装 bun（仅在未安装时执行）
if command -v bun &> /dev/null; then
    echo ">>> bun 已安装，跳过安装"
else
    echo ">>> 安装 bun..."
    npm install -g bun
fi

# 3. 使用 bun 全局安装 opencode-ai（仅在未安装时执行）
if command -v opencode &> /dev/null; then
    echo ">>> opencode-ai 已安装，跳过安装"
else
    echo ">>> 安装 opencode-ai..."
    bun install -g opencode-ai
fi

# 4. 配置环境变量（BUN_INSTALL 和 PATH）到 ~/.bashrc（幂等）
BASHRC="$HOME/.bashrc"
if [ -f "$BASHRC" ]; then
    echo ">>> 配置环境变量到 ~/.bashrc ..."
    grep -q 'export BUN_INSTALL=' "$BASHRC" || echo 'export BUN_INSTALL="$HOME/.bun"' >> "$BASHRC"
    grep -q 'export PATH.*BUN_INSTALL' "$BASHRC" || echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$BASHRC"
    echo "环境变量已添加，但当前 shell 未生效。请执行 'source ~/.bashrc' 或重新登录后使用。"
else
    echo "警告：~/.bashrc 不存在，请手动添加以下环境变量："
    echo 'export BUN_INSTALL="$HOME/.bun"'
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"'
fi

# 5. 创建目录并下载解压集群 kdo-developer 技能包（仅当未存在时）
AGENT_DIR="$HOME/.agents/skills"
SKILL_DIR="$AGENT_DIR/kdo-developer"
echo ">>> 创建目录 $AGENT_DIR ..."
mkdir -p "$AGENT_DIR"

if [ -d "$SKILL_DIR" ]; then
    echo ">>> 技能包已存在于 $SKILL_DIR，跳过下载和解压"
else
    cd "$AGENT_DIR"
    echo ">>> 下载 kdo-developer.tar.gz ..."
    wget https://docs.kube-do.cn/kdo-developer.tar.gz
    echo ">>> 解压文件 ..."
    tar zxvf kdo-developer.tar.gz
    # 解压后校验目录是否生成，若失败则退出
    if [ ! -d "$SKILL_DIR" ]; then
        echo "错误：解压后未找到 $SKILL_DIR，请检查下载文件"
        exit 1
    fi
fi

# 6. 创建 .claude 目录并链接技能包（强制覆盖，幂等）
CLAUDE_SKILLS="$HOME/.claude/skills"
echo ">>> 创建 $CLAUDE_SKILLS 目录 ..."
mkdir -p "$CLAUDE_SKILLS"

TARGET_DIR="$SKILL_DIR"
LINK_PATH="$CLAUDE_SKILLS/kdo-developer"
ln -sf "$TARGET_DIR" "$LINK_PATH"
echo ">>> 已创建符号链接：$LINK_PATH -> $TARGET_DIR"

echo "=== 部署完成 ==="
echo "现在可以使用 opencode-ai 和相关技能，也可以通过 bun 安装其他的 agent"
echo "也可以安装 claude-code 或 codex："
echo "  bun install -g @anthropic-ai/claude-code"
echo "  bun install -g @openai/codex"
echo "技能包已链接至 ~/.claude/skills/kdo-developer，上述工具可自动识别。"
echo "请记得执行 'source ~/.bashrc' 以在当前 shell 中使环境变量生效。"