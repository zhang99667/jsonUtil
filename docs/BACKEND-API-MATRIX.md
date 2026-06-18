# 后端 API 权限矩阵

本文档记录当前后端 API 的访问级别、数据边界和生产配置要求。新增、删除或调整 Controller 端点时，需要同步更新本矩阵；本地 CI 和 GitHub CI 会运行 `node scripts/ci/check-backend-api-matrix.mjs` 校验 Controller 端点是否全部被记录。

## 路径级安全规则

| 规则 | 权限 | 说明 |
|------|------|------|
| `OPTIONS /**` | 公开 | CORS 预检请求放行，不进入业务接口 |
| `/api/auth/**` | 公开 | 登录入口，不要求 JWT |
| `/api/visitor/**` | 公开 | 健康检查与匿名工具事件，只允许采集分桶和枚举，不采集 JSON 原文 |
| `/api/stats/**` | 管理员 | 统计汇总接口，需要 `ROLE_ADMIN` |
| `/api/admin/**` | 管理员 | 管理后台接口，需要 `ROLE_ADMIN` |
| 其他路径 | 已登录 | 当前没有额外业务 Controller，默认要求认证 |

## 端点矩阵

| Method | Path | 权限 | 请求参数/Body | 响应 | 数据与风险边界 |
|--------|------|------|---------------|------|----------------|
| POST | `/api/auth/login` | 公开 | `LoginRequest` | `JwtResponse` | 返回 JWT；失败信息不得泄露账号枚举细节 |
| GET | `/api/visitor/ping` | 公开 | 无 | `Result<String>` | 健康检查，仅返回 `pong` |
| POST | `/api/visitor/events` | 公开 | `ToolEventRequest` | `Result<Void>` | 仅保存功能名、类别、状态、输入大小档、耗时档和来源；不得接收 JSON 原文、路径值或完整输入长度 |
| GET | `/api/stats` | 管理员 | 无 | `Result<StatisticsDTO>` | 管理统计汇总，需要 JWT 管理员权限 |
| POST | `/api/admin/users/add` | 管理员 | `RegisterRequest` | `Result<User>` | 创建后台用户；调用方必须已是管理员 |
| GET | `/api/admin/users` | 管理员 | `page`、`size`、`keyword` | `Result<Page<User>>` | 用户列表支持分页与关键词搜索 |
| PUT | `/api/admin/users/{id}` | 管理员 | `UpdateUserRequest` | `Result<User>` | 更新用户资料和角色信息 |
| DELETE | `/api/admin/users/{id}` | 管理员 | Path `id` | `Result<Void>` | 删除用户，需避免误删当前唯一管理员 |
| PUT | `/api/admin/users/{id}/toggle-enabled` | 管理员 | Path `id` | `Result<User>` | 启停用户账号 |
| GET | `/api/admin/files` | 管理员 | `page`、`pageSize`、`keyword` | `Result<Map>` | 文件列表分页；不返回磁盘绝对路径 |
| GET | `/api/admin/files/{id}/content` | 管理员 | Path `id` | `Result<String>` | 受 `FILE_MAX_PREVIEW_SIZE_BYTES` 限制，只用于文本预览 |
| GET | `/api/admin/files/{id}/download` | 管理员 | Path `id` | 文件流 | 仅下载已登记文件，文件名通过 RFC 5987 编码 |
| POST | `/api/admin/files/upload` | 管理员 | multipart `file` | `Result<Map>` | 受上传大小和扩展名白名单限制，存储文件名会重命名 |
| DELETE | `/api/admin/files/{id}` | 管理员 | Path `id` | `Result<Void>` | 删除数据库记录并尝试删除磁盘文件 |
| GET | `/api/admin/traffic/overview` | 管理员 | `days` | `Result<TrafficOverviewDTO>` | 访问概览，按天数聚合 |
| GET | `/api/admin/traffic/trend` | 管理员 | `days` | `Result<List<DailyTrendDTO>>` | 每日趋势 |
| GET | `/api/admin/traffic/top-ips` | 管理员 | `days`、`limit` | `Result<List<IpStatsDTO>>` | IP 排行，包含地理解析结果 |
| GET | `/api/admin/traffic/top-paths` | 管理员 | `days`、`limit` | `Result<List<PathStatsDTO>>` | 路径访问排行 |
| GET | `/api/admin/traffic/hourly` | 管理员 | `days` | `Result<List<HourlyStatsDTO>>` | 24 小时时段分布 |
| GET | `/api/admin/traffic/geo-distribution` | 管理员 | `days`、`limit` | `Result<List<GeoStatsDTO>>` | 地理位置分布 |
| GET | `/api/admin/traffic/device-distribution` | 管理员 | `days`、`limit` | `Result<List<DeviceStatsDTO>>` | 设备类型分布 |
| GET | `/api/admin/traffic/browser-distribution` | 管理员 | `days`、`limit` | `Result<List<DeviceStatsDTO>>` | 浏览器分布 |
| GET | `/api/admin/traffic/referer-distribution` | 管理员 | `days`、`limit` | `Result<List<RefererStatsDTO>>` | 来源分布 |
| GET | `/api/admin/traffic/session-duration` | 管理员 | `days` | `Result<List<SessionStatsDTO>>` | 访问停留时长分布 |
| GET | `/api/admin/traffic/tool-events` | 管理员 | `days`、`limit` | `Result<ToolEventStatsDTO>` | 匿名工具事件聚合，不包含原始 JSON 内容 |

## 文件上传与预览限制

| 配置 | 默认值 | 说明 |
|------|--------|------|
| `FILE_UPLOAD_DIR` | `./uploads` | 后端文件落盘目录 |
| `FILE_MAX_UPLOAD_SIZE_BYTES` | `52428800` | 单文件上传大小上限，默认 50MB |
| `FILE_MAX_PREVIEW_SIZE_BYTES` | `2097152` | 在线预览大小上限，默认 2MB |
| `FILE_ALLOWED_EXTENSIONS` | `.conf,.config,.css,.csv,.env,.geojson,.har,.html,.ini,.java,.js,.json,.json5,.jsonc,.jsonl,.jsx,.log,.map,.md,.ndjson,.properties,.sql,.topojson,.toml,.ts,.tsx,.txt,.webmanifest,.xml,.yaml,.yml` | 管理后台允许上传的文本/调试类文件扩展名 |

## 生产部署前检查

| 配置 | 必填 | 生产要求 |
|------|------|----------|
| `POSTGRES_PASSWORD` | 是 | 强密码，不能使用 `change-me` 示例值 |
| `SPRING_DATASOURCE_PASSWORD` | 是 | 与数据库账号匹配，不能使用 `change-me` 示例值 |
| `JWT_SECRET` | 是 | 足够长的随机值，建议使用 Base64；后端会拒绝过短 secret |
| `ADMIN_BOOTSTRAP_ENABLED` | 否 | 默认 `false`；首次创建管理员后应关闭 |
| `ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` / `ADMIN_BOOTSTRAP_EMAIL` | 条件必填 | 仅在 `ADMIN_BOOTSTRAP_ENABLED=true` 时使用，密码必须显式配置 |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | 否 | 生产默认 `validate`，数据库结构由 Flyway 管理 |

## 维护流程

1. 新增或删除 Controller 端点后，先更新本文档的端点矩阵。
2. 如果新增公开接口，明确说明为什么不需要 JWT，以及它是否可能接收用户原文。
3. 如果新增管理接口，确认路径落在 `/api/admin/**` 或 `/api/stats/**` 下，避免被默认认证规则误放宽。
4. 运行 `node scripts/ci/check-backend-api-matrix.mjs` 和后端测试，确保矩阵覆盖当前 Controller。
