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
- **数据库**: MySQL (生产) / H2 (开发)
- **ORM**: Spring Data JPA
- **安全**: Spring Security + JWT

### 目录结构

```
backend/src/main/java/com/jsonhelper/backend/
├── controller/           # REST API 控制器
│   ├── StatisticsController.java   # 仪表盘统计
│   ├── TrafficController.java      # 流量统计 API
│   ├── UserController.java         # 用户管理
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
| 认证 | `/api/admin/auth` | 登录认证 |
| 访客 | `/api/visitor` | 访客打点 |

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
│   │   ├── ActionPanel.tsx        # 工具栏
│   │   ├── JsonPathPanel.tsx      # JSONPath 查询面板
│   │   └── ...
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useFileSystem.ts       # 文件操作
│   │   ├── useFeatureTour.ts      # 功能引导
│   │   └── ...
│   ├── services/             # 主应用服务
│   │   └── aiService.ts           # AI 修复服务
│   ├── utils/                # 工具函数
│   │   ├── transformations.ts     # JSON 转换与深度解析
│   │   ├── schemeUtils.ts         # Scheme/CMD 递归解码与回写
│   │   ├── transformSummary.ts    # 深度解析报告、质量快照和 CMD 结构导出
│   │   ├── cmdStructureDiff.ts    # cmdHandler 风格结构差异对比
│   │   └── diffUtils.ts           # 差异对比
│   ├── workers/              # 大输入异步处理
│   │   ├── transform.worker.ts    # 格式化、压缩、深度解析 Worker
│   │   ├── schemeDecode.worker.ts # Scheme/CMD 大 response 解码 Worker
│   │   ├── schemeScan.worker.ts   # PREVIEW Scheme 图标扫描 Worker
│   │   └── jsonPath.worker.ts     # JSONPath 查询 Worker
│   ├── App.tsx               # 主应用入口
│   └── main.tsx              # 主应用挂载
├── fixtures/                 # 回归样本
│   └── scheme-corpus/             # 脱敏真实 response corpus 与 expected baseline
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
| `transformations.ts` | 负责格式化、压缩、深度格式化、包装 JSON 提取和基于 context 的回写 |
| `schemeUtils.ts` | 负责 URL/Scheme/CMD/Base64/JWT 等字符串的递归识别、解码和按原层级回写 |
| `schemeMetadata.ts` | 汇总 CMD Schema、内部 CMD 字段、运行时占位符和 cmdHandler 兼容结构 |
| `transformSummary.ts` | 生成深度解析报告、质量快照、问题样本、占位符模板和 cmdHandler 风格复制文本 |
| `cmdStructureDiff.ts` | 对比本工具 actual 与内部 cmdHandler expected，输出缺失路径、额外路径和值差异 |

### 大输入 Worker 分层

真实 response 往往包含大量 URL、Base64 和嵌套 JSON。主线程只保留编辑器交互和结果渲染，耗时解析放入 Worker：

- `transform.worker.ts`: 大输入格式化、压缩、深度解析和 Key 排序。
- `schemeDecode.worker.ts`: 独立 Scheme 面板的大 response 递归解码、Base64 元信息和 CMD 摘要。
- `schemeScan.worker.ts`: PREVIEW 区 Scheme 图标扫描，复用 source map 定位字符串范围。
- `jsonPath.worker.ts`: JSONPath 查询、结果截断和高亮范围映射。

### 解析质量闭环

```
脱敏 response corpus → npm run corpus:scheme → 质量 snapshot + cmdHandler expected diff → CI 门禁
```

当前 corpus 位于 `frontend/fixtures/scheme-corpus/`：

| 文件 | 说明 |
|------|------|
| `reward-response.redacted.json` | 脱敏广告 response 样本，保留真实编码层级和占位符形态 |
| `reward-response.expected.snapshot.json` | 质量基线，校验主 CMD Schema、Top 热点 Schema、扫描位置、占位符和覆盖指标 |
| `reward-response.cmdhandler.expected.json` | cmdHandler expected 子集，用于锁定关键 CMD Schema 和参数路径 |

CI 中的 `Scheme corpus baseline` 步骤会运行 `npm run corpus:scheme`。该步骤与普通单测分开展示，便于快速定位真实 response 解析能力退化。

解析质量还提供两个面向评审和本地排查的脚本：

| 命令 | 说明 |
|------|------|
| `npm run corpus:snapshot:check` | 输出 corpus 覆盖率、CMD/资源热点、占位符、待检查项和 cmdHandler expected 对齐结果，并在 expected 阈值失败时退出非 0 |
| `npm run perf:scheme -- --iterations 3 --strict` | 基于脱敏 corpus 构造 50KB / 250KB response，测量 `deepParseWithContext` 核心解析耗时，并同步输出覆盖率、CMD 结构、资源字段、占位符、待检查和跳过数量 |

`perf:scheme` 是核心解析性能预算，不等同于浏览器 Worker 的完整端到端 benchmark。它的目标是给 PM/研发一个稳定、低成本的退化探针；浏览器输入响应、取消响应和 Worker 调度仍由 E2E 与手工体验验证补充。

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

工具事件只记录功能名、类别、状态、输入大小分桶、耗时分桶和来源，不保存 JSON 原文、路径值、完整输入长度或解析结果。当前覆盖转换模式切换、JSONPath/Scheme/模板面板开关、AI 修复、打开、保存和新建标签等显式动作。

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

- **开发环境**: H2 内存数据库 + Vite Dev Server
- **生产环境**: MySQL + Nginx 静态托管

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
