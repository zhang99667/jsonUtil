#!/bin/bash
# deploy.sh - 前端项目自动化部署脚本（Git + Vite + 宝塔）
# 支持安全拉取、可选依赖安装、绕过宝塔保护文件

set -e  # 遇错立即退出

# ================== 配置区 ==================
REPO_DIR="/home/markz/code/jsonUtil"
FRONTEND_DIR="$REPO_DIR/frontend"
SITE_DIR="/www/wwwroot/json-helper"

BRANCH="main"
WEB_USER="www"

# 是否自动重装依赖？设为 false 可避免 electron 等卡住（推荐 false）
INSTALL_DEPS=false
# ============================================

echo "🚀 开始部署前端项目..."

cd "$REPO_DIR"

# 检查工作区是否干净
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  工作区有未提交的更改，建议先清理。继续部署可能覆盖本地修改。"
    exit 1
fi

# 拉取最新代码
echo "📥 正在拉取最新代码（分支: $BRANCH）..."
git fetch origin
git reset --hard "origin/$BRANCH"

cd "$FRONTEND_DIR"

# 可选：安装依赖（默认跳过，避免网络卡死）
if [ "$INSTALL_DEPS" = true ]; then
    echo "📦 安装依赖（使用 npm ci）..."
    npm ci --omit=optional  # 跳过 optional 依赖（如 electron）
else
    echo "⏭️  跳过依赖安装（假设 node_modules 已就绪）"
fi

# 构建项目
echo "🔨 正在构建生产版本..."
npm run build

# 部署到网站目录，排除宝塔保护文件
echo "📤 部署到网站目录: $SITE_DIR"
sudo rsync -av --delete \
  --exclude='.user.ini' \
  --exclude='.htaccess' \
  --chown="$WEB_USER:$WEB_USER" \
  dist/ "$SITE_DIR/"

echo "✅ 部署成功！访问你的网站查看效果。"
