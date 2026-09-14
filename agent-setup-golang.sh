#!/bin/bash
# 自动化部署脚本（幂等版）：安装 bun、opencode-ai，配置 agent swarm 技能包，
# 并配置 Go 开发环境（VS Code 扩展 + Go 模块镜像）。
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
GO_GOPROXY="https://goproxy.cn,direct"
GO_GOSUMDB="sum.golang.google.cn"
GO_EXTENSIONS=(
    golang.go
)
VSCODE_GALLERY_SERVICE_URL="https://vscode.bj.bcebos.com/_apis/public/gallery"

# ---------- 日志函数 ----------
log()  { echo ">>> $*"; }
warn() { echo "警告：$*"; }
err()  { echo "错误：$*" >&2; }

# 1. 设置 npm 镜像源为国内镜像（幂等）
setup_npm_mirror() {
    if ! command -v npm &> /dev/null; then
        warn "未找到 npm，跳过 npm 镜像配置"
        return
    fi
    log "设置 npm registry..."
    npm config set registry "$NPM_REGISTRY"
}

# 2. 全局安装 bun（仅在未安装时执行），并让当前 shell 立即可用
install_bun() {
    export BUN_INSTALL
    export PATH="$BUN_INSTALL/bin:$PATH"

    if command -v bun &> /dev/null; then
        log "bun 已安装，跳过安装"
    else
        log "安装 bun 到 $BUN_INSTALL ..."
        npm install -g bun --prefix "$BUN_INSTALL"
    fi
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

# ---------- VS Code / Eclipse Che 扩展安装辅助 ----------
CHE_RUNTIME_DIR=""
CHE_NODE=""
CHE_SERVER=""
CHE_LD_LIBRARY_PATH=""
CHE_EXTENSIONS_DIR="/checode/remote/extensions"
CHE_USER_DATA_DIR="/checode/remote/data"
CHE_DETECTED="" # 探测结果缓存："" 未探测，1 是 Che，0 否

# 探测 Eclipse Che 内置的 che-code 运行时（不依赖环境变量，基于文件系统，结果缓存）
# 注意：镜像内可能有多个候选运行时（如 ubi8/ubi9/musl），需逐个验证 node 是否可用
detect_che() {
    if [ "$CHE_DETECTED" = "1" ]; then
        return 0
    elif [ "$CHE_DETECTED" = "0" ]; then
        return 1
    fi

    [ -d /checode ] || {
        CHE_DETECTED=0
        return 1
    }

    local dir libpath
    for dir in /checode/checode-linux-* /checode/checode-linux-*/*; do
        [ -f "$dir/out/server-main.js" ] && [ -x "$dir/node" ] || continue

        libpath="$dir/ld_libs:$dir/ld_libs/core:$dir/ld_libs/openssl"
        if LD_LIBRARY_PATH="$libpath" "$dir/node" --version > /dev/null 2>&1; then
            CHE_RUNTIME_DIR="$dir"
            CHE_NODE="$dir/node"
            CHE_SERVER="$dir/out/server-main.js"
            CHE_LD_LIBRARY_PATH="$libpath"
            CHE_DETECTED=1
            return 0
        fi
    done

    CHE_DETECTED=0
    return 1
}

# 安装 VS Code 扩展：优先 code-oss，其次 Eclipse Che 内置 che-code（已安装的自动跳过）
install_vscode_extensions() {
    local ext installed changed=""

    if command -v code-oss &> /dev/null; then
        log "使用 code-oss 安装扩展 ..."
        installed="$(code-oss --list-extensions 2> /dev/null || true)"
        for ext in "$@"; do
            if printf '%s\n' "$installed" | grep -qixF "$ext"; then
                log "扩展已安装，跳过：$ext"
                continue
            fi
            code-oss --install-extension "$ext" && changed=1 || warn "扩展安装失败：$ext"
        done
        return 0
    fi

    if detect_che; then
        log "检测到 Eclipse Che 环境（$CHE_RUNTIME_DIR），安装扩展 ..."
        installed="$(LD_LIBRARY_PATH="$CHE_LD_LIBRARY_PATH" \
            VSCODE_AGENT_FOLDER=/checode/remote \
            "$CHE_NODE" "$CHE_SERVER" --list-extensions \
            --extensions-dir "$CHE_EXTENSIONS_DIR" \
            --user-data-dir "$CHE_USER_DATA_DIR" \
            --builtin-extensions-dir "$CHE_RUNTIME_DIR/extensions" 2> /dev/null || true)"
        for ext in "$@"; do
            if printf '%s\n' "$installed" | grep -qixF "$ext"; then
                log "扩展已安装，跳过：$ext"
                continue
            fi
            LD_LIBRARY_PATH="$CHE_LD_LIBRARY_PATH" \
                VSCODE_AGENT_FOLDER=/checode/remote \
                "$CHE_NODE" "$CHE_SERVER" --install-extension "$ext" \
                --extensions-dir "$CHE_EXTENSIONS_DIR" \
                --user-data-dir "$CHE_USER_DATA_DIR" \
                --builtin-extensions-dir "$CHE_RUNTIME_DIR/extensions" \
                && changed=1 || warn "扩展安装失败：$ext"
        done
        if [ -n "$changed" ]; then
            log "提示：Eclipse Che 需重载窗口/刷新页面后新扩展才会生效"
        fi
        return 0
    fi

    warn "未找到 code-oss，且非 Eclipse Che 环境，跳过扩展安装"
}

# 7. 配置 VS Code 扩展市场为百度 BOS 镜像（写 settings.json + 导出环境变量；Che 环境跳过）
setup_vscode_mirror() {
    if detect_che; then
        log "检测到 Eclipse Che 环境，扩展市场为 Open VSX，跳过镜像配置"
        return
    fi

    export VSCODE_GALLERY_SERVICE_URL

    local config_dir settings
    if command -v code-oss &> /dev/null; then
        config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/Code - OSS"
    elif command -v code &> /dev/null; then
        config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/Code"
    else
        warn "未找到 code-oss/code，跳过扩展市场镜像配置"
        return
    fi

    settings="$config_dir/User/settings.json"
    mkdir -p "$(dirname "$settings")"

    if ! command -v jq &> /dev/null; then
        if [ -f "$settings" ]; then
            warn "未找到 jq，无法合并 $settings，请手动配置 extensions.gallery.serviceUrl"
            return
        fi
        printf '{ "extensions.gallery.serviceUrl": "%s" }\n' "$VSCODE_GALLERY_SERVICE_URL" > "$settings"
    elif [ -f "$settings" ]; then
        [ -f "$settings.bak" ] || cp "$settings" "$settings.bak"
        if jq --arg url "$VSCODE_GALLERY_SERVICE_URL" \
            '. + {"extensions.gallery.serviceUrl": $url}' \
            "$settings" > "$settings.tmp"; then
            mv "$settings.tmp" "$settings"
        else
            rm -f "$settings.tmp"
            warn "合并 $settings 失败，请手动配置 extensions.gallery.serviceUrl"
        fi
    else
        jq -n --arg url "$VSCODE_GALLERY_SERVICE_URL" \
            '{"extensions.gallery.serviceUrl": $url}' > "$settings"
    fi

    log "已配置扩展市场镜像：$VSCODE_GALLERY_SERVICE_URL（$settings）"
}

# 8. 安装 VS Code Go 扩展（code-oss 或 Eclipse Che 环境）
setup_go_extensions() {
    install_vscode_extensions "${GO_EXTENSIONS[@]}"
}

# 9. 配置 Go 模块镜像（未检测到 go 时跳过，已为期望值时跳过）
setup_go_mirror() {
    if ! command -v go &> /dev/null; then
        warn "未找到 go，跳过 Go 模块镜像配置"
        return
    fi

    if [ "$(go env GOPROXY)" = "$GO_GOPROXY" ]; then
        log "GOPROXY 已是 $GO_GOPROXY，跳过"
    else
        log "设置 GOPROXY=$GO_GOPROXY ..."
        go env -w "GOPROXY=$GO_GOPROXY"
    fi

    if [ "$(go env GOSUMDB)" = "$GO_GOSUMDB" ]; then
        log "GOSUMDB 已是 $GO_GOSUMDB，跳过"
    else
        log "设置 GOSUMDB=$GO_GOSUMDB ..."
        go env -w "GOSUMDB=$GO_GOSUMDB"
    fi
}

main() {
    log "=== 开始执行自动化部署脚本 ==="

    setup_npm_mirror
    install_bun
    install_opencode
    setup_shell_env
    install_skill
    link_skill
    setup_vscode_mirror
    setup_go_extensions
    setup_go_mirror

    log "=== 部署完成 ==="
    echo "现在可以使用 opencode-ai 和相关技能，也可以通过 bun 安装其他的 agent"
    echo "也可以安装 claude-code 或 codex："
    echo "  bun install -g @anthropic-ai/claude-code"
    echo "  bun install -g @openai/codex"
    echo "技能包已链接至 ~/.claude/skills/$SKILL_NAME，上述工具可自动识别。"
    echo "请记得执行 'source ~/.bashrc' 以在当前 shell 中使环境变量生效。"
}

main "$@"
