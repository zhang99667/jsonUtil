# JSONUtils - 专业版

**强大的 JSON 处理工具，集成了 AI 智能修复功能。**

</div>

## 简介

JSONUtils 专业版是一款现代化的 JSON 处理工具，旨在提高开发人员的效率。它不仅提供了标准的格式化和验证功能，还集成了 Google Gemini AI，能够智能修复格式错误的 JSON 数据。配合双栏实时预览、JSONPath 查询和丰富的文件管理功能，它是您处理 JSON 数据的得力助手。

除了通用 JSON 场景，当前版本也面向复杂接口 response / CMD / Scheme 排查做了专项增强。整段广告 response 可以直接展开多层 URL、CMD、Base64、运行时占位符和监测链接，并可复制 cmdHandler 风格结构、质量快照和协作排查摘要。

## 核心功能

*   **双栏实时编辑**: 左侧源码编辑，右侧实时预览处理结果，支持双向同步。
*   **多种转换模式**:
    *   **格式化 / 深度格式化**: 美化 JSON 结构，使其易于阅读。
    *   **压缩**: 移除空白字符，减小体积。
    *   **转义 / 反转义**: 处理 JSON 字符串中的转义字符。
    *   **Unicode / 中文转换**: 方便查看和处理包含 Unicode 编码的中文内容。
*   **AI 智能修复**: 集成 Google Gemini AI，一键修复无效或损坏的 JSON 数据。
*   **JSONPath 查询**: 内置强大的 JSONPath 查询面板，支持高亮显示匹配结果，轻松定位数据。
*   **CMD/Scheme 深度解析**:
    *   支持整段 response 中的 URL Scheme、CMD 参数、Base64 JSON、运行时占位符和落地页参数递归展开。
    *   支持复制 cmdHandler 风格 CMD 结构、页面内对比 cmdHandler expected、复制质量快照和诊断摘要。
    *   解析质量已接入脱敏 corpus、CI 门禁和本地性能预算脚本，防止主 CMD Schema、占位符、关键参数路径和大 response 解析耗时退化。
*   **文件管理**:
    *   支持多标签页，同时处理多个文件。
    *   自动保存功能，防止数据丢失。
    *   支持打开本地文件和另存为。
*   **高度可定制**:
    *   自定义快捷键，打造个人专属工作流。
    *   配置 AI 模型参数 (API Key, Model)。
    *   灵活的界面布局，支持侧边栏折叠和面板大小调整。

## 安装与运行

### 前置要求

*   [Node.js](https://nodejs.org/) (推荐最新 LTS 版本)

### 开发环境运行

1.  **安装依赖**:
    ```bash
    npm install
    ```

2.  **配置 AI (可选)**:
    在应用设置中配置您的 Gemini API Key，或者创建 `.env.local` 文件预设环境变量（参考 `.env.example`）。

    访问统计默认不加载第三方脚本；如需启用 Google Analytics，请在构建时设置 `VITE_GA_MEASUREMENT_ID=G-...`。

3.  **启动 Web 版本**:
    ```bash
    npm run dev
    ```
    访问 `http://localhost:5173` 开始使用。

### 桌面端运行 (Electron)

本项目支持打包为 Electron 桌面应用，提供更原生的体验。

1.  **启动开发模式**:
    ```bash
    npm run electron:dev
    ```

2.  **打包生产版本**:
    ```bash
    npm run electron:build
    ```
    构建产物（`.dmg`, `.zip` 等）将生成在 `dist/` 目录下。

### 解析质量与性能检查

```bash
npm run corpus:snapshot:check
npm run perf:scheme -- --iterations 3 --strict
```

`corpus:snapshot:check` 用于校验脱敏真实 response 的解析质量基线；`perf:scheme` 用于对 50KB / 250KB response 的核心解析耗时和质量指标做本地预算检查。

## CI/CD 与部署

项目已提供根目录 GitHub Actions 和本机 SSH 部署脚本：

*   CI: `.github/workflows/ci.yml`
*   CD: `.github/workflows/deploy.yml`
*   本地完整检查: `bash scripts/ci/local-ci.sh`
*   本机直连服务器部署: `bash scripts/deploy/ssh-docker-compose-deploy.sh`

详细配置、GitHub Secrets 和服务器要求请查看 [CI/CD 使用说明](docs/CICD.md)。

生产部署不会再创建固定默认管理员账号。首次部署如需初始化管理员，请在 `.env` 中显式配置 `ADMIN_BOOTSTRAP_*` 变量，创建后建议关闭 `ADMIN_BOOTSTRAP_ENABLED`。

## 相关文档

*   [产品与工程升级评审](docs/PRODUCT-AND-ENGINEERING-REVIEW.md): PM 与工程视角的当前状态、风险、优化方向和新增功能路线。
*   [架构说明](ARCHITECTURE.md): 前后端架构、模块目录、数据流和扩展指南。
*   [Scheme 字符串解析方案](docs/SCHEME-STRING-FEATURE.md): 深度格式化和 Scheme/CMD 解析机制说明。

## 技术栈

*   **前端框架**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **桌面封装**: [Electron](https://www.electronjs.org/)
*   **编辑器**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
*   **样式**: [Tailwind CSS](https://tailwindcss.com/)
*   **AI 服务**: [Google Gemini](https://deepmind.google/technologies/gemini/)

## 快捷键

您可以在设置面板中查看和修改所有快捷键。默认常用快捷键包括：

*   `Cmd/Ctrl + S`: 保存
*   `Cmd/Ctrl + Alt + F`: 格式化
*   `Cmd/Ctrl + Alt + M`: 压缩
*   `Cmd/Ctrl + P`: 打开命令面板/设置

## 许可证

[MIT](LICENSE)
