# JSONUtils - 专业版

**强大的 JSON 处理工具，集成了 AI 智能修复功能。**

</div>

## 简介

JSONUtils 专业版是一款现代化的 JSON 处理工具，旨在提高开发人员的效率。它不仅提供了标准的格式化和验证功能，还集成了 Google Gemini AI，能够智能修复格式错误的 JSON 数据。配合双栏实时预览、JSONPath 查询和丰富的文件管理功能，它是您处理 JSON 数据的得力助手。

除了通用 JSON 场景，当前版本也面向复杂接口 response / CMD / Scheme 排查做了专项增强。整段广告 response 可以直接展开多层 URL、CMD、Base64、运行时占位符和监测链接，并可复制 cmdHandler 风格结构、质量快照和协作排查摘要；独立 Scheme 面板也支持复制不含原始值的结构化质量快照。

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
    *   解析质量与性能已接入脱敏 corpus 和 CI 门禁，防止主 CMD Schema、占位符、关键参数路径和大 response 解析耗时退化。
*   **文件管理**:
    *   支持多标签页，同时处理多个文件。
    *   自动保存功能，防止数据丢失。
    *   支持打开本地文件和另存为。
    *   支持导入 `.har` 抓包文件，自动提取 request/response body 为派生 JSON 标签，并进入嵌套解析模式。
*   **高度可定制**:
    *   自定义快捷键，打造个人专属工作流。
    *   配置 AI 模型参数 (API Key, Model)。
    *   灵活的界面布局，支持侧边栏折叠和面板大小调整。
*   **管理后台产品洞察**:
    *   支持查看访问流量、地区、设备、来源和停留时长。
    *   支持匿名工具事件统计，按功能、输入大小档、耗时档和失败率观察使用情况，不采集 JSON 原文。

## 安装与运行

### 前置要求

*   [Node.js](https://nodejs.org/) (推荐最新 LTS 版本)

### 开发环境运行

1.  **安装依赖**:
    ```bash
    cd frontend
    npm install
    ```

2.  **配置 AI (可选)**:
    在应用设置中配置您的 Gemini API Key，或者创建 `.env.local` 文件预设环境变量（参考 `.env.example`）。

    访问统计默认不加载第三方脚本；如需启用 Google Analytics，请在构建时设置 `VITE_GA_MEASUREMENT_ID=G-...`。

    匿名工具事件在非本机生产域名默认启用；本机预览或开发态如需联调管理后台工具事件统计，可设置 `VITE_TOOL_EVENT_TELEMETRY_ENABLED=true`。

3.  **启动 Web 版本**:
    ```bash
    npm run dev
    ```
    访问 `http://localhost:3000` 开始使用，管理后台入口为 `http://localhost:3000/admin.html`。

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
    Web 静态资源将生成在 `frontend/dist/`，桌面安装包（`.dmg`, `.zip` 等）将生成在 `frontend/build/` 目录下。

### 解析质量与性能检查

```bash
npm run corpus:snapshot:check
npm run corpus:snapshot:diff -- --before before.json --after after.json --strict
npm run perf:scheme -- --iterations 3 --strict
npm run perf:jsonpath -- --iterations 3 --strict
```

`corpus:snapshot:check` 用于校验脱敏真实 response 的解析质量基线；`corpus:snapshot:diff` 用于对比两份质量快照的覆盖率、CMD/资源字段、必需项失败和 cmdHandler 对齐趋势；`perf:scheme` 会优先复制真实 `data.video` 条目构造 50KB / 250KB response，用于对核心解析耗时、展开记录、CMD 字段和资源字段下限做本地/CI 预算检查；`perf:jsonpath` 会复用同一份脱敏 response 和大量命中列表，校验 JSONPath 大查询耗时、命中数、高亮范围和结果上限保护。

### CMD 结构差异 CLI

`cmd:diff` 用于对齐本工具解析出的 CMD 结构与内部 cmdHandler expected。actual 可以是本工具复制的 CMD 结构，也可以是整段真实 response；expected 可以是 cmdHandler JSON、树形可见文本、日志片段、Markdown 代码块或字符串化 JSON。

```bash
# 对比两个文件
npm run cmd:diff -- actual.json expected.json

# 对比页面复制出的 actual/expected 包
pbpaste | npm run cmd:diff -- --stdin

# expected 只保存稳定子集时忽略 actual 额外展开路径
npm run cmd:diff -- actual.json expected.json --ignore-extra

# actual 是整段 response 时，先推荐最接近 expected 的 CMD 候选
npm run cmd:diff -- actual-response.json cmdhandler-expected.json --suggest-actual

# 根据推荐路径定点对比
npm run cmd:diff -- actual-response.json cmdhandler-expected.json --actual-path '$.data.video[0].material[0].info[0].ad_common.scheme'
```

退出码约定：`0` 表示结构一致，`1` 表示存在差异，`2` 表示参数或输入错误。运行 `npm run cmd:diff -- --help` 可查看最新参数说明。

## CI/CD 与部署

项目已提供根目录 GitHub Actions 和本机 SSH 部署脚本：

*   CI: `.github/workflows/ci.yml`
*   CD: `.github/workflows/deploy.yml`，支持全量部署和预构建前端快速部署
*   本地完整检查: `bash scripts/ci/local-ci.sh`
*   远端磁盘健康检查: `bash scripts/deploy/ssh-disk-health.sh`
*   远端 Docker 未使用对象清理: `bash scripts/deploy/ssh-docker-prune.sh`
*   远端开发残留清理: `bash scripts/deploy/ssh-prune-dev-artifacts.sh`
*   公网部署验证: `bash scripts/deploy/verify-public-deploy.sh`
*   本机直连服务器部署: `bash scripts/deploy/ssh-docker-compose-deploy.sh`
*   本机预构建前端快速部署: `bash scripts/deploy/ssh-prebuilt-frontend-deploy.sh`

详细配置、GitHub Secrets 和服务器要求请查看 [CI/CD 使用说明](docs/CICD.md)。

生产部署不会再创建固定默认管理员账号。首次部署如需初始化管理员，请在 `.env` 中显式配置 `ADMIN_BOOTSTRAP_*` 变量，创建后建议关闭 `ADMIN_BOOTSTRAP_ENABLED`。

## 相关文档

*   [产品与工程升级评审](docs/PRODUCT-AND-ENGINEERING-REVIEW.md): PM 与工程视角的当前状态、风险、优化方向和新增功能路线。
*   [架构说明](ARCHITECTURE.md): 前后端架构、模块目录、数据流和扩展指南。
*   [后端 API 权限矩阵](docs/BACKEND-API-MATRIX.md): 后端接口访问级别、数据边界、文件限制和生产部署前检查。
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
