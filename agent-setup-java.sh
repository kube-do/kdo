#!/bin/bash
# 自动化部署脚本（幂等版）：安装 bun、opencode-ai，配置 agent swarm 技能包，
# 并配置 Java 开发环境（VS Code 扩展 + Maven 镜像）。
# 支持 Claude Code / Codex

set -e  # 遇到错误立即退出

# ---------- 全局变量 ----------
NPM_REGISTRY="https://registry.npmmirror.com"
BUN_INSTALL="$HOME/.bun"
BASHRC="$HOME/.bashrc"
AGENT_DIR="$HOME/.agents/skills"
SKILL_NAME="kdo-developer"
SKILL_URL="https://docs.kube-do.cn/kdo-developer.tar.gz"
SKILL_DIR="$AGENT_DIR/$SKILL_NAME"
CLAUDE_SKILLS="$HOME/.claude/skills"
M2_DIR="$HOME/.m2"
MAVEN_SETTINGS="$M2_DIR/settings.xml"
JAVA_EXTENSIONS=(
    redhat.java
    vscjava.vscode-java-debug
    vscjava.vscode-java-test
    vscjava.vscode-maven
    vscjava.vscode-java-dependency
)

# ---------- 日志函数 ----------
log()  { echo ">>> $*"; }
warn() { echo "警告：$*"; }
err()  { echo "错误：$*" >&2; }

# 1. 设置 npm 镜像源为国内镜像（幂等）
setup_npm_mirror() {
    log "设置 npm registry..."
    npm config set registry "$NPM_REGISTRY"
}

# 2. 全局安装 bun（仅在未安装时执行），并让当前 shell 立即可用
install_bun() {
    if command -v bun &> /dev/null; then
        log "bun 已安装，跳过安装"
    else
        log "安装 bun..."
        npm install -g bun
    fi
    export BUN_INSTALL
    export PATH="$BUN_INSTALL/bin:$PATH"
}

# 3. 使用 bun 全局安装 opencode-ai（仅在未安装时执行）
install_opencode() {
    if command -v opencode &> /dev/null; then
        log "opencode-ai 已安装，跳过安装"
    else
        log "安装 opencode-ai..."
        bun install -g opencode-ai
    fi
}

# 4. 配置环境变量（BUN_INSTALL 和 PATH）到 ~/.bashrc（幂等）
setup_shell_env() {
    if [ -f "$BASHRC" ]; then
        log "配置环境变量到 ~/.bashrc ..."
        grep -q 'export BUN_INSTALL=' "$BASHRC" || echo 'export BUN_INSTALL="$HOME/.bun"' >> "$BASHRC"
        grep -q 'export PATH.*BUN_INSTALL' "$BASHRC" || echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$BASHRC"
        log "环境变量已添加，当前 shell 请执行 'source ~/.bashrc' 生效"
    else
        warn "~/.bashrc 不存在，请手动添加以下环境变量："
        echo 'export BUN_INSTALL="$HOME/.bun"'
        echo 'export PATH="$BUN_INSTALL/bin:$PATH"'
    fi
}

# 5. 创建目录并下载解压集群 kdo-developer 技能包（仅当未存在时）
install_skill() {
    log "创建目录 $AGENT_DIR ..."
    mkdir -p "$AGENT_DIR"

    if [ -d "$SKILL_DIR" ]; then
        log "技能包已存在于 $SKILL_DIR，跳过下载和解压"
        return
    fi

    cd "$AGENT_DIR"
    log "下载 $SKILL_NAME.tar.gz ..."
    wget "$SKILL_URL"
    log "解压文件 ..."
    tar zxvf "$SKILL_NAME.tar.gz"

    # 解压后校验目录是否生成，若失败则退出
    if [ ! -d "$SKILL_DIR" ]; then
        err "解压后未找到 $SKILL_DIR，请检查下载文件"
        exit 1
    fi
    rm -rf "$SKILL_NAME.tar.gz"
}

# 6. 创建 .claude 目录并链接技能包（强制覆盖，幂等）
link_skill() {
    log "创建 $CLAUDE_SKILLS 目录 ..."
    mkdir -p "$CLAUDE_SKILLS"
    ln -sf "$SKILL_DIR" "$CLAUDE_SKILLS/$SKILL_NAME"
    log "已创建符号链接：$CLAUDE_SKILLS/$SKILL_NAME -> $SKILL_DIR"
}

# 7. 安装 VS Code Java 扩展（未检测到 code-oss 时跳过）
setup_java_extensions() {
    if ! command -v code-oss &> /dev/null; then
        warn "未找到 code-oss，跳过 Java 扩展安装"
        return
    fi

    log "安装 Java 扩展 ..."
    local ext
    for ext in "${JAVA_EXTENSIONS[@]}"; do
        code-oss --install-extension "$ext" || warn "扩展安装失败：$ext"
    done
}

# 8. 配置 Maven 阿里云镜像（已存在 settings.xml 时跳过，不覆盖）
setup_maven_mirror() {
    mkdir -p "$M2_DIR"

    if [ -f "$MAVEN_SETTINGS" ]; then
        log "已存在 $MAVEN_SETTINGS，跳过写入"
        return
    fi

    log "写入 Maven 阿里云镜像到 $MAVEN_SETTINGS ..."
    cat > "$MAVEN_SETTINGS" << 'EOF'
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                              https://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>aliyunmaven</id>
      <name>阿里云公共仓库</name>
      <url>https://maven.aliyun.com/repository/public</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
  </mirrors>
</settings>
EOF
}

main() {
    log "=== 开始执行自动化部署脚本 ==="

    setup_npm_mirror
    install_bun
    install_opencode
    setup_shell_env
    install_skill
    link_skill
    setup_java_extensions
    setup_maven_mirror

    log "=== 部署完成 ==="
    echo "现在可以使用 opencode-ai 和相关技能，也可以通过 bun 安装其他的 agent"
    echo "也可以安装 claude-code 或 codex："
    echo "  bun install -g @anthropic-ai/claude-code"
    echo "  bun install -g @openai/codex"
    echo "技能包已链接至 ~/.claude/skills/$SKILL_NAME，上述工具可自动识别。"
    echo "请记得执行 'source ~/.bashrc' 以在当前 shell 中使环境变量生效。"
}

main "$@"
