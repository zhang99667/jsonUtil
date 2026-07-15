# JSONUtils 项目架构说明

本文档描述 JSONUtils 专业版的整体架构、目录结构和核心模块。

## 项目结构概览

```
json-助手-&-ai-修复/
├── backend/                    # Java Spring Boot 后端
├── frontend/                   # React + Vite 前端
├── docker-compose.yml          # Docker 部署配置
├── ARCHITECTURE.md             # 本文档
├── CHANGELOG.md                # 更新日志
└── README.md                   # 项目介绍
```

---

## 后端架构 (backend/)

### 技术栈
- **框架**: Spring Boot 3.x
- **语言**: Java 17+
- **数据库**: PostgreSQL (生产与 Docker 本地环境)
- **ORM**: Spring Data JPA
- **安全**: Spring Security + JWT

### 目录结构

```
backend/src/main/java/com/jsonhelper/backend/
├── controller/           # REST API 控制器
│   ├── StatisticsController.java   # 仪表盘统计
│   ├── TrafficController.java      # 流量统计 API
│   ├── AdminController.java        # 用户管理
│   ├── FileController.java         # 管理后台文件
│   ├── HealthController.java       # 部署与外部监控探活
│   ├── VisitorController.java      # 前台访客打点与匿名事件
│   └── ...
├── service/              # 业务逻辑层
│   ├── StatisticsService.java
│   ├── TrafficService.java
│   ├── GeoService.java            # IP 地理位置解析
│   └── ...
├── repository/           # 数据访问层 (JPA Repository)
│   ├── VisitLogRepository.java    # 访问日志查询
│   └── ...
├── entity/               # JPA 实体类
│   ├── VisitLog.java              # 访问日志实体
│   ├── User.java
│   └── ...
├── dto/                  # 数据传输对象
│   ├── request/          # 请求 DTO
│   └── response/         # 响应 DTO
│       ├── TrafficOverviewDTO.java
│       ├── DailyTrendDTO.java
│       ├── GeoStatsDTO.java
│       └── ...
├── config/               # 配置类
├── security/             # 安全相关
│   └── TrafficFilter.java         # 流量记录过滤器
└── common/               # 公共组件
```

### API 端点概览

| 模块 | 前缀 | 说明 |
|------|------|------|
| 统计 | `/api/stats` | 仪表盘统计数据 |
| 流量 | `/api/admin/traffic` | 流量分析 API |
| 用户 | `/api/admin/users` | 用户管理 |
| 文件 | `/api/admin/files` | 管理后台文件上传、预览和下载 |
| 认证 | `/api/auth` | 登录认证 |
| 健康检查 | `/api/health` | 部署与外部监控探活，不写入访客流量表 |
| 访客 | `/api/visitor` | 前台访客打点与匿名工具事件 |

### 流量统计 API 详情

| 端点 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/admin/traffic/overview` | GET | `days` | 流量概览 |
| `/api/admin/traffic/trend` | GET | `days` | 每日趋势 |
| `/api/admin/traffic/top-ips` | GET | `days`, `limit` | IP 排行 |
| `/api/admin/traffic/top-paths` | GET | `days`, `limit` | 路径排行 |
| `/api/admin/traffic/hourly` | GET | `days` | 24小时分布 |
| `/api/admin/traffic/geo-distribution` | GET | `days`, `limit` | 地区分布 |

---

## 前端架构 (frontend/)

### 技术栈
- **框架**: React 19 + TypeScript
- **构建**: Vite 6
- **样式**: Tailwind CSS
- **编辑器**: Monaco Editor
- **桌面**: Electron

### 目录结构

```
frontend/
├── src/
│   ├── admin/                # 管理后台模块
│   │   ├── pages/            # 页面组件
│   │   │   ├── Dashboard.tsx      # 仪表盘
│   │   │   ├── TrafficStats.tsx   # 流量统计
│   │   │   ├── UserManagement.tsx # 用户管理
│   │   │   └── Login.tsx          # 登录页
│   │   ├── services/         # API 服务
│   │   │   ├── request.ts         # HTTP 请求封装
│   │   │   ├── stats.ts           # 统计 API
│   │   │   ├── traffic.ts         # 流量 API
│   │   │   └── auth.ts            # 认证 API
│   │   ├── App.tsx           # 管理后台入口
│   │   └── main.tsx          # 管理后台挂载
│   ├── components/           # 主应用组件
│   │   ├── Editor.tsx             # Monaco 编辑器封装
│   │   ├── ActionPanel.tsx        # 工具栏、SOURCE 智能建议和轻量排查工作流入口
│   │   ├── ChangelogModal.tsx     # 前端版本更新日志弹窗
│   │   ├── JsonPathPanel.tsx      # JSONPath 查询、字段名快捷查询、Response 常用预设、结果复制和结构导航定位面板
│   │   ├── JsonComparePanel.tsx   # 通用 JSON 语义对比、忽略路径、差异路径动作与报告复制面板
│   │   ├── JsonTreePanel.tsx      # JSON 结构导航、路径双向定位、同名字段查询、语义继续解析和节点 TS 类型复制面板
│   │   └── ...
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useFileSystem.ts       # 文件操作
│   │   ├── useFeatureTour.ts      # 功能引导
│   │   └── ...
│   ├── services/             # 主应用服务
│   │   └── aiService.ts           # 智能修复服务（本地规则优先，必要时调用 AI）
│   ├── utils/                # 工具函数
│   │   ├── transformations.ts     # JSON 转换与深度解析
│   │   ├── schemeUtils.ts         # Scheme/CMD 递归解码与回写
│   │   ├── schemePathValues.ts    # Scheme 面板 JSONPath 路径值复制
│   │   ├── transformSummary.ts    # 深度解析报告、质量快照和 CMD 结构导出
│   │   ├── cmdStructureDiff.ts    # cmdHandler 风格结构差异对比
│   │   ├── jsonSemanticDiff.ts    # 通用 JSON / JSON Lines 语义差异、JSON Pointer、忽略路径和 Markdown 报告
│   │   ├── jsonTreeModel.ts       # JSON 树模型、路径与预览摘要生成
│   │   ├── jsonToTypeScript.ts    # JSON / JSON Lines 到 TypeScript 类型声明生成与可信度摘要
│   │   ├── jsonSchemaInference.ts # JSON Schema 推断、采样摘要与契约可信度统计
│   │   ├── smartInputSuggestion.ts # SOURCE 输入类型识别、下一步工具推荐与轻量工作流动作
│   │   ├── changelog.ts           # CHANGELOG 解析与前端展示数据
│   │   └── diffUtils.ts           # 差异对比
│   ├── workers/              # 大输入异步处理
│   │   ├── transform.worker.ts    # 格式化、压缩、深度解析 Worker
│   │   ├── jsonTree.worker.ts     # 结构导航树模型 Worker
│   │   ├── schemeDecode.worker.ts # Scheme/CMD 大响应解码 Worker
│   │   ├── schemeScan.worker.ts   # PREVIEW Scheme 图标扫描 Worker
│   │   └── jsonPath.worker.ts     # JSONPath 查询 Worker
│   ├── App.tsx               # 主应用入口
│   └── main.tsx              # 主应用挂载
├── fixtures/                 # 回归样本
│   └── scheme-corpus/             # 脱敏真实响应语料与预期基线
├── electron/                 # Electron 相关
│   ├── main.js               # 主进程
│   └── preload.js            # 预加载脚本
├── public/                   # 静态资源
├── dist/                     # 构建产物
├── admin.html                # 管理后台 HTML
├── index.html                # 主应用 HTML
└── vite.config.ts            # Vite 配置
```

### 双入口架构

项目采用双入口设计：

1. **主应用** (`index.html` → `src/main.tsx`)
   - JSON 处理工具
   - 面向普通用户

2. **管理后台** (`admin.html` → `src/admin/main.tsx`)
   - 数据统计和用户管理
   - 面向管理员
   - 使用 Ant Design UI

### 前端版本感知

- `vite.config.ts` 构建时读取根目录 `CHANGELOG.md`，将完整内容注入 `import.meta.env.VITE_APP_CHANGELOG`，供主应用懒加载的 `ChangelogModal` 解析展示。
- 构建产物中的 `/version.json` 会携带当前版本号、构建时间和最近 changelog 片段；`useAppUpdateCheck` 在生产环境轮询该文件，发现新版本后展示 Toast，并允许用户在刷新前打开目标版本更新说明。
- 底部状态栏版本号是常驻入口，点击后展示最近 12 个版本，避免版本更新提示与具体变更说明脱节。

### 管理后台路由机制

管理后台使用状态驱动的条件渲染（非 React Router）：

```tsx
// frontend/src/admin/App.tsx
const items: MenuItem[] = [
    getItem('仪表盘与统计', '1', <PieChartOutlined />),
    getItem('流量统计', '3', <BarChartOutlined />),
    getItem('用户管理', '2', <TeamOutlined />),
];

const renderContent = () => {
    switch (selectedKey) {
        case '1': return <Dashboard />;
        case '3': return <TrafficStats />;
        case '2': return <UserManagement />;
    }
};
```

**添加新页面步骤**：
1. 创建 `pages/NewPage.tsx`
2. 在 `items` 数组添加菜单项
3. 在 `renderContent` 添加对应 case
4. import 新组件

---

## 数据流架构

### 深度解析与 CMD/Scheme 解析流程

```
SOURCE JSON → transform.worker → deepParseWithContext
                         ↓
             TransformContext 路径记录
                         ↓
PREVIEW JSON + TransformReportPanel
                         ↓
质量快照 / cmdHandler 结构 / 占位符模板 / 诊断摘要
```

核心模块：

| 模块 | 说明 |
|------|------|
| `transformations.ts` | 负责格式化、压缩、深度格式化、包装 JSON 提取和基于上下文的回写 |
| `schemeUtils.ts` | 负责 URL/Scheme/CMD/Base64/JWT 等字符串的递归识别、分层解码、查询参数原始值/URL 解码/JSON 解析证据和按原层级回写 |
| `schemeMetadata.ts` | 汇总 CMD Schema、内部 CMD 字段、运行时占位符和 cmdHandler 兼容结构 |
| `transformSummary.ts` | 生成深度解析报告、质量快照、问题样本、占位符模板和 cmdHandler 风格复制文本 |
| `smartInputSuggestion.ts` | 根据 SOURCE 内容推荐单步工具或 Response 排查工作流，支持 JSON Lines / NDJSON 入口识别、坏行提示和 App 串联嵌套解析报告 |
| `jsonSchemaInference.ts` | 从 SOURCE JSON / JSON Lines 推断 JSON Schema，输出长数组采样摘要和对象/字段/required/union/format 可信度统计 |
| `cmdStructureDiff.ts` | 对比本工具实际结果与内部 cmdHandler 预期结果，输出缺失路径、额外路径和值差异 |
| `harImport.ts` | 将 HAR 请求/响应正文提取为派生 JSON，生成接口摘要、异常摘要和不含查询参数的短标签 |

### 大输入 Worker 分层

真实响应往往包含大量 URL、Base64 和嵌套 JSON。主线程只保留编辑器交互和结果渲染，耗时解析放入 Worker：

- `transform.worker.ts`: 大输入格式化、压缩、深度解析和 Key 排序。
- `jsonTree.worker.ts`: 结构导航异步构建 JSON / JSON Lines 树模型，避免大 JSON 树遍历阻塞编辑器交互。
- `schemeDecode.worker.ts`: 独立 Scheme 面板的大响应递归解码、查询参数分层证据、Base64 元信息和 CMD 摘要，供面板展示与质量快照复制使用。
- `schemeScan.worker.ts`: PREVIEW 区 Scheme 图标扫描，复用源码映射（source map）定位字符串范围。
- `jsonPath.worker.ts`: JSONPath 查询、结果截断和高亮范围映射。

### JSON Schema 校验流程

```
SOURCE JSON → JsonSchemaPanel → Ajv 校验
       ↓              ↓
Schema 推断     示例生成 / 应用 SOURCE / 复制 / 收藏 / 导入 / 导出
       ↓              ↓
编辑器错误标记 ← 校验结果 / JSONPath 定位
```

核心模块：

| 模块 | 说明 |
|------|------|
| `jsonSchemaInference.ts` | 根据当前 SOURCE JSON 推断初始 JSON Schema，支持严格/宽松必填策略、常见字符串 format 推断，并通过前段、尾段、分散点和稀疏字段代表行采样限制长数组推断成本，同时返回采样摘要元数据 |
| `jsonSchemaExample.ts` | 根据当前 JSON Schema 生成可复制或应用到 SOURCE 的示例 JSON，支持常见类型、数组/对象约束、动态对象字段、`allOf` 根约束合并、条件分支、对象依赖字段/子 Schema、组合分支择优、唯一数组、唯一 contains 数组、数组下限扩容、短字符串唯一值、常见字符串 pattern、标准 format、字面量优先级、本地 `$ref` 和生成后自校验 |
| `jsonSchemaValidation.ts` | 选择 Ajv / Ajv2019 / Ajv2020 并接入 `ajv-formats` 校验 Schema，输出可定位的问题列表、关键字分布、必填缺失字段路径、路径清单、脱敏修复建议和 Markdown 修复清单 |
| `jsonSchemaIssueHighlights.ts` | 将 Schema 校验问题映射成 SOURCE 编辑器高亮范围 |
| `jsonSchemaLibrary.ts` | 管理浏览器本地 Schema 收藏，并支持剪贴板导入校验、导出共享包、重复/无效项跳过统计和配置备份同步 |

### 解析质量闭环

```
脱敏响应语料 → npm run corpus:scheme → 质量快照 + cmdHandler 预期结果差异 + 性能预算 → CI 门禁
```

当前语料位于 `frontend/fixtures/scheme-corpus/`：

| 文件 | 说明 |
|------|------|
| `reward-response.redacted.json` | 脱敏激励广告响应样本，保留 rewardImpl、rewardDialog、deeplink、browser、openapp、资源 URL 和占位符形态 |
| `reward-response.expected.snapshot.json` | 激励广告质量基线，校验主 CMD Schema、Top 热点 Schema、扫描位置、占位符和覆盖指标 |
| `reward-response.cmdhandler.expected.json` | 激励广告 cmdHandler 预期子集，用于锁定关键 CMD Schema 和参数路径 |
| `landing-response.redacted.json` | 脱敏落地页响应样本，覆盖 browser、deeplink、openapp、结构化 HTTPS 落地页、监测 URL 和占位符 |
| `landing-response.expected.snapshot.json` | 落地页质量基线，校验扫描入口、热点 Schema、占位符和 cmdHandler 忽略额外路径上限 |
| `landing-response.cmdhandler.expected.json` | 落地页 cmdHandler 预期子集，用于锁定 fallback_cmd、appUrl、webUrl、adFlag 和 callbackUrl |
| `phone-response.redacted.json` | 脱敏电话拨打响应样本，覆盖 makePhoneCall、numberUrl、logUrl、Base64 extInfo、hash 落地页参数和占位符 |
| `phone-response.expected.snapshot.json` | 电话拨打质量基线，校验扫描入口、热点 Schema、号码监测 URL 展开和运行时占位符 |
| `phone-response.cmdhandler.expected.json` | 电话拨打 cmdHandler 预期子集，用于锁定 params、extInfo、numberUrl、logUrl 和 type |
| `corpus-quality.baseline.snapshot.json` | 完整语料质量快照基线，用于 CI 趋势对比和资源类型占比漂移门禁 |

CI 中的 `Scheme corpus baseline` 步骤会运行 `npm run corpus:scheme`，`Scheme corpus quality snapshot` 会校验质量阈值和 cmdHandler 预期结果，`Scheme corpus quality trend` 会把当前快照与完整基线做严格对比，并拦截视频占比骤降或 Lottie 占比异常上升，`Scheme performance budget` 会校验核心解析耗时。相关步骤与普通单测分开展示，便于快速定位真实响应解析能力、素材结构或性能退化。

解析质量还提供两个面向评审和本地排查的脚本：

| 命令 | 说明 |
|------|------|
| `npm run corpus:snapshot:check` | 输出语料覆盖率、CMD/资源热点、占位符、待检查项和 cmdHandler 预期结果对齐情况，并在预期阈值失败时退出非 0 |
| `npm run corpus:snapshot:diff -- --before fixtures/scheme-corpus/corpus-quality.baseline.snapshot.json --after <snapshot.json> --strict --resource-type-drop video=20 --resource-type-rise lottie=20` | 对比完整质量快照趋势，拦截覆盖率、CMD/资源热点、必需项、cmdHandler 忽略额外路径和资源类型占比异常漂移 |
| `npm run corpus:snapshot:baseline` | 在严格检查通过后更新已提交的完整质量快照基线，用于接受已评审的解析能力或样本结构变化 |
| `npm run perf:scheme -- --iterations 3 --strict` | 基于脱敏语料复制真实 `data.video` 条目构造 50KB / 250KB 响应，测量 `deepParseWithContext` 核心解析耗时，并同步校验展开记录、CMD 结构、CMD 字段、资源字段、待检查和跳过数量 |
| `npm run perf:e2e` | 通过独立 Playwright 性能配置测量浏览器 Worker 端到端响应，覆盖 JSONPath 取消、Scheme 取消和连续大响应解析 |

`perf:scheme` 是核心解析性能预算，`perf:e2e` 是浏览器 Worker 响应预算。前者适合定位解析规则和算法退化，后者适合发现 UI 取消响应、Worker 调度或连续大输入体验退化；两类预算会和普通 E2E 分开展示，便于快速判断问题层级。

### 流量记录流程

```
用户访问 → TrafficFilter 拦截 → 提取 IP/Path → 保存 VisitLog → 数据库
```

### 流量查询流程

```
前端请求 → TrafficController → TrafficService → VisitLogRepository → 数据库
                                      ↓
                               GeoService (IP解析)
                                      ↓
                               返回 DTO 数据
```

### 工具事件闭环

```
主工具动作 → productTelemetry → /api/visitor/events → ToolEventService → tool_events
                                                     ↓
管理后台 /api/admin/traffic/tool-events → 功能频率 / 失败率 / 输入大小档 / 耗时档
```

工具事件只记录功能名、类别、状态、输入大小分桶、耗时分桶和来源，不保存 JSON 原文、路径值、完整输入长度或解析结果。当前覆盖转换模式切换、JSONPath/Scheme/模板面板开关、智能修复、打开、保存和新建标签等显式动作。

### 后端 API 权限治理

后端接口按路径分为公开入口、健康检查、访客匿名事件、管理员统计和管理后台接口。完整端点、权限、请求数据和生产配置要求维护在 `docs/BACKEND-API-MATRIX.md`。

CI 会运行 `node scripts/ci/check-backend-api-matrix.mjs` 扫描 `backend/src/main/java/com/jsonhelper/backend/controller` 下的 Controller 映射，并和权限矩阵中的 Method + Path 对齐。新增或删除后端端点时，如果没有同步更新矩阵，本地 CI 和 GitHub Actions 会失败。

---

## 部署架构

### Docker 部署

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8080:8080"]
  frontend:
    build: ./frontend
    ports: ["80:80"]
```

### 环境配置

- **开发环境**: Vite Dev Server + PostgreSQL（可通过 `docker-compose.local.yml` 启动）
- **生产环境**: PostgreSQL + Nginx 静态托管

---

## 扩展指南

### 添加新的统计维度

1. **后端**:
   - 在 `VisitLogRepository` 添加查询方法
   - 在 `TrafficService` 添加业务方法
   - 创建对应 DTO
   - 在 `TrafficController` 添加 API 端点

2. **前端**:
   - 在 `traffic.ts` 添加 API 调用
   - 在 `TrafficStats.tsx` 添加展示组件

### 添加新的管理功能

1. 创建新页面 `pages/NewFeature.tsx`
2. 创建 API 服务 `services/newFeature.ts`
3. 修改 `App.tsx` 添加路由

---

## 依赖说明

### 后端关键依赖

| 依赖 | 用途 |
|------|------|
| spring-boot-starter-web | Web 框架 |
| spring-boot-starter-data-jpa | ORM |
| spring-boot-starter-security | 安全认证 |
| ip2region | IP 地理位置解析 |
| lombok | 代码简化 |

### 前端关键依赖

| 依赖 | 用途 |
|------|------|
| react | UI 框架 |
| antd | UI 组件库 (Admin) |
| tailwindcss | 样式 (主应用) |
| monaco-editor | 代码编辑器 |
| axios | HTTP 请求 |
| driver.js | 用户引导 |
