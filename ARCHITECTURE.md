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
│   │   ├── transformations.ts     # JSON 转换
│   │   └── diffUtils.ts           # 差异对比
│   ├── App.tsx               # 主应用入口
│   └── main.tsx              # 主应用挂载
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