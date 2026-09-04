bash
#!/bin/bash
# 自动化部署脚本：安装 bun、opencode-ai，并配置集群 agent swarm 技能包
# 同时创建 .claude 目录并链接技能包，支持 Claude Code / Codex

set -e  # 遇到错误立即退出

echo "=== 开始执行自动化部署脚本 ==="

# 1. 设置 npm 镜像源为国内镜像
echo ">>> 设置 npm registry..."
npm config set registry https://registry.npmmirror.com

# 2. 全局安装 bun
echo ">>> 安装 bun..."
npm install -g bun

# 3. 使用 bun 全局安装 opencode-ai
echo ">>> 安装 opencode-ai..."
bun install -g opencode-ai

# 4. 配置环境变量（BUN_INSTALL 和 PATH）
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

# 5. 创建目录并下载解压集群 kdo-developer 技能包
AGENT_DIR="$HOME/.agents/skills"
echo ">>> 创建目录 $AGENT_DIR ..."
mkdir -p "$AGENT_DIR"

cd "$AGENT_DIR"
echo ">>> 下载 kdo-developer.tar.gz ..."
wget https://docs.kube-do.cn/kdo-developer.tar.gz

echo ">>> 解压文件 ..."
tar zxvf kdo-developer.tar.gz

# 6. 创建 .claude 目录并链接技能包，供 Claude Code / Codex 使用
CLAUDE_SKILLS="$HOME/.claude/skills"
echo ">>> 创建 $CLAUDE_SKILLS 目录 ..."
mkdir -p "$CLAUDE_SKILLS"

# 使用绝对路径创建符号链接，若已存在则强制覆盖
TARGET_DIR="$AGENT_DIR/kdo-developer"
LINK_PATH="$CLAUDE_SKILLS/kdo-developer"
ln -sf "$TARGET_DIR" "$LINK_PATH"
echo ">>> 已创建符号链接：$LINK_PATH -> $TARGET_DIR"

echo ">>> 执行 source ~/.bashrc 更新环境变量（当前 shell 可能仍需要手动 source）"
source ~/.bashrc

echo "=== 部署完成 ==="
echo "现在可以使用 opencode-ai 和相关技能，也可以通过 bun 安装其他的 agent"
echo "也可以安装 claude-code 或 codex："
echo "  bun install -g @anthropic-ai/claude-code"
echo "  bun install -g @openai/codex"
echo "技能包已链接至 ~/.claude/skills/kdo-developer，上述工具可自动识别。"