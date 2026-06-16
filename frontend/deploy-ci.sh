#!/bin/bash
# JSON Utils CI/CD 自动化部署脚本
# 支持 Web 应用和 Electron 桌面应用的多平台部署

set -e  # 遇错立即退出
set -u  # 使用未定义变量时报错

# ================== 配置区 ==================
PROJECT_NAME="json-helper-ai-fix"
PRODUCT_NAME="JSONUtils - 专业版"
VERSION=${VERSION:-"0.0.0"}
BRANCH=${BRANCH:-"main"}
NODE_ENV=${NODE_ENV:-"production"}

# 构建输出目录
DIST_DIR="./dist"
BUILD_DIR="./build"
RELEASES_DIR="./releases"

# 平台配置
PLATFORMS=${PLATFORMS:-"all"}  # all, web, electron, mac, win, linux

# ============================================

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查依赖项
check_dependencies() {
    log_info "检查系统依赖项..."
    
    local missing_deps=()
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少必要的依赖项: ${missing_deps[*]}"
        exit 1
    fi
    
    log_success "Node.js $(node --version) 和 npm $(npm --version) 已安装"
}

# 清理构建目录
clean_build() {
    log_info "清理构建目录..."
    rm -rf "$DIST_DIR" "$BUILD_DIR" "$RELEASES_DIR"
    mkdir -p "$RELEASES_DIR"
    log_success "构建目录已清理"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    npm ci
    log_success "依赖安装完成"
}

# 构建 Web 应用
build_web() {
    log_info "构建 Web 应用..."
    
    # 设置构建环境变量
    export NODE_ENV="$NODE_ENV"
    
    npm run build
    npm run check:preloads
    
    # 验证构建结果
    if [ -f "$DIST_DIR/index.html" ]; then
        log_success "Web 应用构建完成"
        # 复制到发布目录
        cp -r "$DIST_DIR" "$RELEASES_DIR/web"
    else
        log_error "Web 应用构建失败"
        exit 1
    fi
}

# 构建 Electron 应用
build_electron() {
    log_info "构建 Electron 桌面应用..."
    
    # 检查是否有 electron-builder
    if ! npm list electron-builder &> /dev/null; then
        log_warning "未安装 electron-builder，跳过 Electron 构建"
        return 0
    fi
    
    # 构建 Electron
    npm run electron:build
    
    # 检查构建结果
    if [ -d "$BUILD_DIR" ]; then
        # 为不同平台创建发布包
        local platforms=("darwin" "win32" "linux")
        
        for platform in "${platforms[@]}"; do
            local platform_dir="$BUILD_DIR/${platform}-*"
            if [ -d $platform_dir ]; then
                cp -r $platform_dir "$RELEASES_DIR/electron-${platform}"
                log_success "Electron $platform 版本构建完成"
            fi
        done
    else
        log_error "Electron 应用构建失败"
        exit 1
    fi
}

# 构建特定平台
build_platform() {
    local platform=$1
    
    case $platform in
        "web")
            build_web
            ;;
        "electron")
            build_electron
            ;;
        "mac")
            build_electron_mac
            ;;
        "win")
            build_electron_win
            ;;
        "linux")
            build_electron_linux
            ;;
        *)
            log_error "不支持的平台: $platform"
            exit 1
            ;;
    esac
}

# 生成版本信息
generate_version_info() {
    log_info "生成版本信息..."
    
    cat > "$RELEASES_DIR/version.json" << EOF
{
    "project": "$PROJECT_NAME",
    "product": "$PRODUCT_NAME",
    "version": "$VERSION",
    "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo "unknown")",
    "node_version": "$(node --version)",
    "npm_version": "$(npm --version)"
}
EOF
    
    log_success "版本信息已生成"
}

# 创建部署清单
create_deployment_manifest() {
    log_info "创建部署清单..."
    
    cat > "$RELEASES_DIR/deploy-manifest.json" << EOF
{
    "builds": [
        {
            "type": "web",
            "path": "web",
            "files": ["index.html", "assets/"]
        }
EOF
    
    # 添加 Electron 构建信息（如果存在）
    if [ -d "$RELEASES_DIR/electron-darwin" ]; then
        cat >> "$RELEASES_DIR/deploy-manifest.json" << EOF
        ,{
            "type": "electron",
            "platform": "darwin",
            "path": "electron-darwin",
            "files": ["$PRODUCT_NAME.app/"]
        }
EOF
    fi
    
    if [ -d "$RELEASES_DIR/electron-win32" ]; then
        cat >> "$RELEASES_DIR/deploy-manifest.json" << EOF
        ,{
            "type": "electron",
            "platform": "win32",
            "path": "electron-win32",
            "files": ["$PRODUCT_NAME Setup.exe"]
        }
EOF
    fi
    
    if [ -d "$RELEASES_DIR/electron-linux" ]; then
        cat >> "$RELEASES_DIR/deploy-manifest.json" << EOF
        ,{
            "type": "electron",
            "platform": "linux",
            "path": "electron-linux",
            "files": ["$PRODUCT_NAME.AppImage"]
        }
EOF
    fi
    
    cat >> "$RELEASES_DIR/deploy-manifest.json" << EOF
    ]
}
EOF
    
    log_success "部署清单已创建"
}

# 显示构建摘要
show_build_summary() {
    log_info "=== 构建完成 ==="
    echo "项目: $PRODUCT_NAME"
    echo "版本: $VERSION"
    echo "构建时间: $(date)"
    echo "构建目录: $RELEASES_DIR"
    echo ""
    
    # 列出所有构建产物
    if [ -d "$RELEASES_DIR/web" ]; then
        echo "📱 Web 应用:"
        echo "  - $RELEASES_DIR/web/index.html"
        echo ""
    fi
    
    local electron_builds=$(find "$RELEASES_DIR" -name "electron-*" -type d 2>/dev/null | wc -l)
    if [ "$electron_builds" -gt 0 ]; then
        echo "💻 Electron 桌面应用:"
        for platform_dir in "$RELEASES_DIR"/electron-*; do
            if [ -d "$platform_dir" ]; then
                local platform=$(basename "$platform_dir" | sed 's/electron-//')
                echo "  - $platform_dir (${platform})"
            fi
        done
        echo ""
    fi
    
    echo "📊 版本信息: $RELEASES_DIR/version.json"
    echo "📋 部署清单: $RELEASES_DIR/deploy-manifest.json"
}

# 主构建函数
main_build() {
    log_info "开始构建 $PRODUCT_NAME v$VERSION"
    
    # 检查依赖
    check_dependencies
    
    # 清理构建目录
    clean_build
    
    # 安装依赖
    install_dependencies
    
    # 根据平台参数构建
    case $PLATFORMS in
        "all")
            build_web
            build_electron
            ;;
        "web")
            build_web
            ;;
        "electron")
            build_electron
            ;;
        *)
            build_platform "$PLATFORMS"
            ;;
    esac
    
    # 生成版本信息
    generate_version_info
    
    # 创建部署清单
    create_deployment_manifest
    
    # 显示构建摘要
    show_build_summary
    
    log_success "✅ 所有构建任务完成！"
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $0 [选项]

选项:
    -p, --platform PLATFORM    指定构建平台 (all, web, electron, mac, win, linux)
    -v, --version VERSION      指定构建版本 (默认: 0.0.0)
    -b, --branch BRANCH        指定Git分支 (默认: main)
    -e, --env ENV              指定环境 (development, production, 默认: production)
    -h, --help                 显示此帮助信息

示例:
    $0                          # 构建所有平台
    $0 -p web                   # 仅构建Web应用
    $0 -p electron              # 仅构建Electron应用
    $0 -v 1.0.0 -p all          # 构建版本1.0.0的所有平台

环境变量:
    PLATFORMS   构建平台
    VERSION     构建版本
    BRANCH      Git分支
    NODE_ENV    环境变量
EOF
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORMS="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -e|--env)
            NODE_ENV="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主构建流程
main_build
