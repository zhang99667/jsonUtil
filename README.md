# JSONUtils - 专业版

**强大的 JSON 处理工具，集成了 AI 智能修复功能。**

</div>

## 简介

JSONUtils 专业版是一款现代化的 JSON 处理工具，旨在提高开发人员的效率。它不仅提供了标准的格式化和验证功能，还提供本地规则优先、必要时调用 AI 的智能修复能力，能够修复常见格式错误的 JSON 数据。配合双栏实时预览、JSONPath 查询和丰富的文件管理功能，它是您处理 JSON 数据的得力助手。

除了通用 JSON 场景，当前版本也面向复杂接口 response / CMD / Scheme 排查做了专项增强。整段广告 response 可以直接展开多层 URL、CMD、Base64、运行时占位符和监测链接，并可复制 cmdHandler 风格结构、质量快照和协作排查摘要；独立 Scheme 面板也支持复制不含原始值的结构化质量快照。

## 核心功能

*   **双栏实时编辑**: 左侧源码编辑，右侧实时预览处理结果，支持双向同步。
*   **智能建议**: 根据当前 SOURCE 自动推荐下一步动作；复杂 response 默认优先提示嵌套解析和结构导航，需要复盘时可从低频辅助入口打开高级排查报告；独立 CMD/Scheme 会提示 Scheme 面板，复杂 JSON 和 JSON Lines / NDJSON 会提示结构导航或类型生成，普通 HTTP(S) URL 只提示 URL 解码，避免把所有链接误当业务 Scheme。
*   **多种转换模式**:
    *   **格式化 / 深度格式化**: 美化 JSON 结构，使其易于阅读。
    *   **压缩**: 移除空白字符，减小体积。
    *   **转义 / 反转义**: 处理 JSON 字符串中的转义字符。
    *   **Unicode / 中文转换**: 方便查看和处理包含 Unicode 编码的中文内容。
*   **本地隐私状态**: 底部状态栏会显示“本地处理 / 本地大输入 / 本地 Worker / 智能修复中”，明确常规格式化、查询、结构导航、Schema 和类型生成都在浏览器本地执行，大输入会启用 Worker、采样或结果上限保护。
*   **智能修复**: 优先使用本地确定性规则修复注释、尾逗号、单引号、裸 key 和字符串内换行等常见问题；本地不可修复时再调用已配置的 AI 服务，并在摘要和状态栏中标明修复来源与 AI 调用边界。
*   **JSONPath 查询**: 内置强大的 JSONPath 查询面板，支持字段名快捷查询、常用示例、按当前 JSON 结构生成的场景示例、Response 常见字段预设、收藏/历史、结果预览、路径和值复制、PREVIEW 高亮定位以及命中结果回到结构导航，轻松排查真实接口数据。
*   **JSON 对比**: 以当前 SOURCE 为基线，对比另一份 JSON / JSON Lines，输出路径级新增、删除、修改差异；支持按 JSONPath 前缀忽略噪声字段，差异行可复制 JSONPath / JSON Pointer 并定位 SOURCE 原值，也可复制带忽略上下文的 Markdown 协作报告。
*   **结构导航**: 以树形结构浏览当前 PREVIEW JSON / JSON Lines，支持字段/路径多关键词与模糊搜索、搜索命中高亮、节点类型筛选、节点详情、字符串语义预览（URL、Scheme、JWT、Base64、资源 URL、邮箱、电话、UUID、时间戳、哈希、日期、颜色）、可解析语义值一键送入 Scheme/编码解析面板、对象数组表格预览、表格列筛选、复制 JSONPath / JSON Pointer / 节点值 / 节点子树 / 当前子树 TypeScript 类型 / 搜索结果 JSON / 搜索结果 Markdown / 搜索结果 CSV / 表格 JSON / 表格 CSV，并与 JSONPath 面板双向联动定位，可从字段节点一键发起同名字段递归查询；树模型在 Worker 中异步构建，降低大 JSON 阻塞编辑器的风险。
*   **JSON 转 TypeScript**: 可从 JSON / JSON Lines 生成 `interface` / `type` 声明，对象数组会合并样本字段并标记可选属性；输出会附带样本数量、可选字段、混合类型和空数组风险摘要，方便接口 response 快速沉淀为可复核的前端类型。
*   **JSON Schema 校验**: 支持从当前 SOURCE JSON 按严格/宽松策略生成初始 Schema，并自动推断常见 `format`；生成后会展示契约可信度和长数组采样摘要，说明对象/字段规模、required/可选字段、union 类型、format 命中、采样行数、稀疏字段命中和 required 策略；支持粘贴校验、复制当前 Schema、复制/应用自校验示例 JSON、动态对象、`allOf` 根约束合并、条件分支、对象依赖字段/子 Schema、组合分支择优、唯一数组、唯一 `contains` 数组、数组下限扩容、短字符串唯一值和常见字符串 `pattern` 示例、标准 `format` 约束、问题分布、修复建议、修复清单、必填缺失字段路径、同名字段反查、Schema 约束路径定位、编辑器内标记，以及本地收藏的导入校验、导出共享和配置备份同步。
*   **CMD/Scheme 深度解析**:
    *   支持整段 response 中的 URL Scheme、CMD 参数、Base64 JSON、运行时占位符和落地页参数递归展开。
    *   Scheme 面板展示解析链路与 Query 参数分层证据，可直接看到 raw、URL Decode、JSON/CMD 解析、修复提示和重新编码预览。
    *   支持复制 cmdHandler 风格 CMD 结构、页面内对比 cmdHandler expected、复制质量快照和诊断摘要。
    *   解析质量与性能已接入脱敏 corpus 和 CI 门禁，防止主 CMD Schema、占位符、关键参数路径和大 response 解析耗时退化。
*   **文件管理**:
    *   支持多标签页，同时处理多个文件。
    *   自动保存功能，防止数据丢失。
    *   支持打开本地文件和另存为。
    *   支持导入 `.har` 抓包文件，自动提取 request/response body 为派生 JSON 标签，生成接口摘要、异常摘要和不含 query 的短标签，并在深度解析报告中展示和筛选接口上下文。
*   **高度可定制**:
    *   自定义快捷键，打造个人专属工作流。
    *   配置 AI 模型参数 (API Key, Model)。
    *   灵活的界面布局，支持侧边栏折叠和面板大小调整。
*   **版本更新可见**: 底部状态栏版本号可直接查看最近更新日志；检测到线上新版本时，可在刷新前打开目标版本变更说明。
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

页面复制出的 CMD 对比包、问题样本 JSON 和深度解析归档包会内置 `suggestedCommands`，可直接看到下一步建议命令，把页面排查结果衔接到 CLI 对比、回归模板生成和 corpus 基线校验。

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
