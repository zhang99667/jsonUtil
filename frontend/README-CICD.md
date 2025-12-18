# JSON Utils CI/CD 文档

## 概述

本项目已经配置了完整的 CI/CD 自动化流程，支持 Web 应用和 Electron 桌面应用的自动化构建、测试和部署。

## 新增的文件

### 1. 部署脚本

- `deploy-ci.sh` - 完整的 CI/CD 构建脚本，支持多平台构建
- `deploy-web.sh` - 专门用于 Web 部署的脚本（替代旧的 CICD.sh）

### 2. GitHub Actions 工作流

- `.github/workflows/ci-cd.yml` - 自动化 CI/CD 工作流配置

### 3. 新增的 npm 脚本

在 `package.json` 中新增了多个便利的构建脚本：

```json
{
  "electron:build:mac": "npm run build && electron-builder --mac",
  "electron:build:win": "npm run build && electron-builder --win", 
  "electron:build:linux": "npm run build && electron-builder --linux",
  "build:all": "./deploy-ci.sh -p all",
  "build:web": "./deploy-ci.sh -p web",
  "build:electron": "./deploy-ci.sh -p electron",
  "deploy:web": "./deploy-web.sh",
  "ci:test": "./deploy-ci.sh -p web -v \"ci-$(date +%Y%m%d)\"",
  "ci:release": "./deploy-ci.sh -p all -v \"$(git describe --tags --abbrev=0 2>/dev/null || echo '0.0.0')\""
}
```

## 使用指南

### 本地构建

#### 构建 Web 应用
```bash
# 方法1：使用 npm 脚本
npm run build:web

# 方法2：直接运行脚本
./deploy-ci.sh -p web

# 方法3：传统方式
npm run build
```

#### 构建 Electron 桌面应用
```bash
# 构建所有平台
npm run build:electron

# 构建特定平台
npm run electron:build:mac    # macOS
npm run electron:build:win    # Windows  
npm run electron:build:linux  # Linux

# 使用脚本构建
./deploy-ci.sh -p electron
```

#### 构建所有平台
```bash
npm run build:all
./deploy-ci.sh -p all
```

### 部署 Web 应用

```bash
# 使用自动化部署脚本
npm run deploy:web

# 或直接运行
./deploy-web.sh

# 自定义配置部署
./deploy-web.sh -d /var/www/json-utils -b develop -i
```

### CI/CD 测试

```bash
# CI 测试构建
npm run ci:test

# 发布构建测试
npm run ci:release
```

## 环境变量配置

### deploy-ci.sh 环境变量
```bash
export PLATFORMS="web"           # 构建平台：all, web, electron
export VERSION="1.0.0"          # 构建版本
export BRANCH="main"            # Git 分支
export NODE_ENV="production"    # 环境变量
```

### deploy-web.sh 环境变量  
```bash
export TARGET_DIR="/www/wwwroot/json-helper"  # 部署目录
export BRANCH="main"                          # Git 分支
export NODE_ENV="production"                  # 环境变量
export WEB_USER="www"                         # Web 用户
export INSTALL_DEPS="true"                    # 是否安装依赖
```

## GitHub Actions 工作流

### 触发条件
- **push** 到 main/develop 分支：执行质量检查和构建测试
- **pull_request** 到 main 分支：执行代码检查
- **release** 发布：执行完整发布流程

### 工作流程步骤

1. **Quality Check** - 代码质量检查
   - TypeScript 类型检查
   - ESLint 代码规范检查

2. **Build Test** - 构建测试
   - Web 应用构建测试
   - Electron 应用构建测试

3. **Release** - 多平台发布构建
   - macOS 平台构建
   - Windows 平台构建  
   - Linux 平台构建

4. **Publish Release** - 发布到 GitHub Releases
   - 打包所有平台构建产物
   - 创建发布说明
   - 上传到 GitHub Releases

## 部署目录结构

构建完成后，会在 `releases/` 目录生成以下结构：

```
releases/
├── version.json          # 版本信息
├── deploy-manifest.json  # 部署清单
├── web/                  # Web 应用
│   ├── index.html
│   └── assets/
└── electron-*/           # Electron 桌面应用
    ├── darwin/           # macOS
    ├── win32/            # Windows  
    └── linux/            # Linux
```

## 特色功能

### 1. 智能依赖管理
- 支持选择性安装依赖
- 自动跳过 optional 依赖避免构建卡顿

### 2. 安全部署
- 自动备份当前部署
- 支持一键回滚
- 健康检查确保部署成功

### 3. 多平台支持
- Web 应用（现代浏览器）
- macOS 桌面应用（DMG）
- Windows 桌面应用（NSIS、Portable）
- Linux 桌面应用（AppImage、DEB）

### 4. 版本管理
- 自动生成版本信息文件
- Git 提交信息追踪
- 构建环境信息记录

## 故障排除

### 构建失败
1. 检查 Node.js 版本（要求 18+）
2. 清理 node_modules 重新安装依赖
3. 检查网络连接是否正常

### 部署失败  
1. 确认目标目录权限正确
2. 检查 Web 服务器配置
3. 查看部署日志获取详细错误信息

### Electron 构建问题
1. 确保已安装必要的构建工具
2. 检查平台特定的依赖项
3. 验证 assets 目录中的图标文件

## 迁移说明

从旧的 `CICD.sh` 迁移到新系统：

1. **备份当前配置**
2. **替换部署脚本**：使用 `deploy-web.sh` 替代 `CICD.sh`
3. **更新构建命令**：使用新的 npm 脚本
4. **配置 GitHub Actions**：已自动配置，无需手动设置

## 联系支持

如有问题，请参考：
- GitHub Issues：报告 bug 和功能请求
- 项目文档：查看详细配置说明
- CI/CD 日志：分析构建失败原因