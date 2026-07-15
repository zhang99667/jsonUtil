# 后端 API 权限矩阵

本文档记录当前后端 API 的访问级别、数据边界和生产配置要求。新增、删除或调整 Controller 端点时，需要同步更新本矩阵；本地 CI 和 GitHub CI 会运行 `node scripts/ci/check-backend-api-matrix.mjs` 校验 Controller 端点是否全部被记录。

## 路径级安全规则

| 规则 | 权限 | 说明 |
|------|------|------|
| `OPTIONS /**` | 公开 | CORS 预检请求放行，不进入业务接口 |
| `/api/auth/**` | 公开 | 登录入口，不要求 JWT |
| `/api/health` | 公开 | 部署与外部监控探活，不写入访客流量表 |
| `/api/visitor/**` | 公开 | 前台访客打点与匿名工具事件，只允许采集分桶和枚举，不采集 JSON 原文 |
| `/api/stats/**` | 管理员 | 统计汇总接口，需要 `ROLE_ADMIN` |
| `/api/admin/**` | 管理员 | 管理后台接口，需要 `ROLE_ADMIN` |
| 其他路径 | 已登录 | 当前没有额外业务 Controller，默认要求认证 |

## 端点矩阵

| Method | Path | 权限 | 请求参数/Body | 响应 | 数据与风险边界 |
|--------|------|------|---------------|------|----------------|
| POST | `/api/auth/login` | 公开 | `LoginRequest` | `JwtResponse` | 用户名和密码必须非空且不超过 255 个字符；返回 JWT，失败信息不得泄露账号枚举细节 |
| GET | `/api/health` | 公开 | 无 | `Result<String>` | 部署和外部监控探活，仅返回 `pong`，不计入 PV/UV |
| GET | `/api/visitor/ping` | 公开 | 无 | `Result<String>` | 前台访客打点，仅返回 `pong`，由流量过滤器计入普通访问统计 |
| POST | `/api/visitor/events` | 公开 | `ToolEventRequest` | `Result<Void>` | 功能名最多 64 字符、类别最多 48 字符、来源最多 24 字符，三者只接受 ASCII 字母、数字及 `_.:-`；状态只接受 `success/error/skipped/cancelled`，输入大小档和耗时档只接受下表闭集；非法请求返回 400 且不写入事件表，不得接收 JSON 原文、路径值或完整输入长度 |
| GET | `/api/stats` | 管理员 | 无 | `Result<StatisticsDTO>` | 管理统计汇总，需要 JWT 管理员权限 |
| POST | `/api/admin/users/add` | 管理员 | `RegisterRequest` | `Result<User>` | 用户名和密码必须非空且不超过 255 个字符；角色可省略，否则只能是 `USER` 或 `ADMIN` |
| GET | `/api/admin/users` | 管理员 | `page`、`size`、`keyword` | `Result<Page<User>>` | 页码不小于 0，每页 1 至 100 条，关键词最多 255 个字符；按创建时间与用户 ID 倒序稳定分页 |
| PUT | `/api/admin/users/{id}` | 管理员 | `UpdateUserRequest` | `Result<User>` | 可选字段提供时校验长度、邮箱及角色；空白密码继续表示不修改密码；降权或禁用最后一个已启用管理员时返回 409 |
| DELETE | `/api/admin/users/{id}` | 管理员 | Path `id` | `Result<Void>` | 删除最后一个已启用管理员时返回 409，其余用户按既有语义删除 |
| PUT | `/api/admin/users/{id}/toggle-enabled` | 管理员 | Path `id` | `Result<User>` | 启停用户账号；禁用最后一个已启用管理员时返回 409 |
| GET | `/api/admin/files` | 管理员 | `page`、`pageSize`、`keyword` | `Result<Map>` | 文件列表分页；不返回磁盘绝对路径 |
| GET | `/api/admin/files/{id}/content` | 管理员 | Path `id` | `Result<String>` | 仅预览真实上传根目录内的直接子普通 UTF-8 文件，校验后固定不跟随链接的句柄，最多读取配置上限加一字节确认超限；越界路径、符号链接、目录、缺失或不可读返回 404，非法编码或超限返回 400 |
| GET | `/api/admin/files/{id}/download` | 管理员 | Path `id` | 文件流 | 仅下载真实上传根目录内已登记且可读的直接子普通文件；校验后立即以不跟随链接方式打开句柄；越界路径、符号链接、目录、缺失或不可读返回 404；响应头同时提供安全的 ASCII 兼容名和 RFC 5987 UTF-8 完整名 |
| POST | `/api/admin/files/upload` | 管理员 | multipart `file` | `Result<Map>` | 受上传大小、扩展名白名单和 500 个 Unicode code point 文件名上限约束；物理文件名由服务端原子生成，不拼接原始名 |
| DELETE | `/api/admin/files/{id}` | 管理员 | Path `id` | `Result<Void>` | 只删除真实上传根目录内的直接子普通文件，磁盘删除成功或受管文件已缺失后才删除数据库记录；越界路径、符号链接和目录均拒绝 |
| GET | `/api/admin/traffic/overview` | 管理员 | `days` | `Result<TrafficOverviewDTO>` | 访问概览，按天数聚合 |
| GET | `/api/admin/traffic/trend` | 管理员 | `days` | `Result<List<DailyTrendDTO>>` | 每日趋势 |
| GET | `/api/admin/traffic/top-ips` | 管理员 | `days`、`limit` | `Result<List<IpStatsDTO>>` | IP 排行，包含地理解析结果 |
| GET | `/api/admin/traffic/top-paths` | 管理员 | `days`、`limit` | `Result<List<PathStatsDTO>>` | 路径访问排行 |
| GET | `/api/admin/traffic/hourly` | 管理员 | `days` | `Result<List<HourlyStatsDTO>>` | 24 小时时段分布 |
| GET | `/api/admin/traffic/geo-distribution` | 管理员 | `days`、`limit` | `Result<List<GeoStatsDTO>>` | 地理位置分布 |
| GET | `/api/admin/traffic/device-distribution` | 管理员 | `days`、`limit` | `Result<List<DeviceStatsDTO>>` | 设备类型分布 |
| GET | `/api/admin/traffic/browser-distribution` | 管理员 | `days`、`limit` | `Result<List<DeviceStatsDTO>>` | 浏览器分布 |
| GET | `/api/admin/traffic/referer-distribution` | 管理员 | `days`、`limit` | `Result<List<RefererStatsDTO>>` | 来源分布仅按网页来源的主机名分类，路径、查询参数和相似后缀不参与匹配 |
| GET | `/api/admin/traffic/session-duration` | 管理员 | `days` | `Result<List<SessionStatsDTO>>` | 访问停留时长分布 |
| GET | `/api/admin/traffic/tool-events` | 管理员 | `days`、`limit` | `Result<ToolEventStatsDTO>` | 匿名工具事件聚合，不包含原始 JSON 内容；总数、状态和各维度分组共享只读可重复读快照 |

## 认证与用户管理输入限制

| 场景 | 字段 | 限制 |
|------|------|------|
| 登录、新增用户 | `username`、`password` | 必填、不能只包含空白字符、最多 255 个字符 |
| 新增用户 | `role` | 可省略并默认使用 `USER`；提供时仅接受大小写不敏感的 `USER` 或 `ADMIN` |
| 更新用户 | `username` | 可省略；提供时不能只包含空白字符，最多 255 个字符 |
| 更新用户 | `email` | 可省略或为空字符串；非空时必须符合邮箱格式，最多 255 个字符 |
| 更新用户 | `password` | 可省略或只包含空白字符以保持原密码；非空时最多 255 个字符 |
| 更新用户 | `role` | 可省略；提供时仅接受大小写不敏感的 `USER` 或 `ADMIN` |
| 用户列表 | `page`、`size`、`keyword` | `page >= 0`、`1 <= size <= 100`，关键词最多 255 个字符 |

上述限制不满足时统一返回 400 和稳定的“请求参数不合法”提示，字段原值不会写入响应或日志。

## 匿名工具事件输入限制

| 字段 | 允许值或限制 |
|------|--------------|
| `eventName` | 必填，最多 64 个字符，只接受 ASCII 字母、数字及 `_.:-` |
| `category` | 必填，最多 48 个字符，只接受 ASCII 字母、数字及 `_.:-` |
| `status` | 必填，只接受 `success`、`error`、`skipped`、`cancelled` |
| `inputSizeBucket` | 必填，只接受 `empty`、`lt_10kb`、`10_50kb`、`50_250kb`、`250kb_1mb`、`gt_1mb`、`unknown` |
| `durationBucket` | 必填，只接受 `instant`、`lt_100ms`、`100_500ms`、`500ms_2s`、`2_10s`、`gt_10s`、`unknown` |
| `source` | 必填，最多 24 个字符，只接受 ASCII 字母、数字及 `_.:-` |

任一字段缺失、空白、超长或超出闭集时统一返回 400，服务不会静默改写后继续入库；特别是未知状态不会再被记为成功事件。

## 管理员访问存续保护

删除、降权和禁用操作会在同一事务内按用户编号固定顺序锁定当前已启用管理员。若操作会移除最后一个已启用管理员，接口统一返回 409 和“至少需要保留一个已启用的管理员”；普通用户操作不受该约束。固定锁顺序同时串行化并发管理写入，避免两个事务分别通过校验后共同移除全部管理员。

## 密码摘要兼容策略

| 账号来源 | 摘要格式 | 兼容边界 |
|----------|----------|----------|
| 新增用户、更新密码、管理员初始化 | `{pbkdf2@SpringSecurity_v5_8}` | 使用 Spring Security 版本化 PBKDF2，完整处理 255 字符输入，不沿用 BCrypt 的 72 字节静默截断语义 |
| 历史账号 | 无前缀 BCrypt 摘要 | 只保留登录验证兼容，不在登录时自动重写；管理员显式重置密码后迁移到当前格式 |

历史 BCrypt 摘要无法还原原始密码，也无法可靠区分 72 字节后的后缀，因此不能在登录成功时自动推断并迁移长密码。

## Spring MVC 请求异常响应

所有 JSON 请求体都使用严格反序列化：未知字段、错误字段类型以及数字、浮点数或布尔值到文本字段的隐式转换统一拒绝，不会在字段校验前被静默丢弃或改写。

| 场景 | HTTP 状态 | 稳定响应消息 |
|------|-----------|--------------|
| 请求体不可读、参数校验失败或缺少 multipart 文件 | 400 | `请求参数不合法` |
| 请求方法不受支持 | 405 | `请求方式不支持`，并保留框架生成的 `Allow` 响应头 |
| Servlet 上传大小超限 | 413 | `上传文件超过大小限制` |
| 请求媒体类型不受支持 | 415 | `请求媒体类型不支持` |

上述框架异常统一使用 `Result` 响应体并保留原始 HTTP 状态。错误响应委托 Spring 父类保留语义响应头和已提交响应短路；安全的 4xx `ResponseStatusException` 原因继续返回，框架内部 5xx 和未分类异常只返回“服务器内部错误”，不把异常正文写入响应。

## 文件上传与预览限制

| 配置 | 默认值 | 说明 |
|------|--------|------|
| `FILE_UPLOAD_DIR` | `./uploads` | 后端文件落盘目录 |
| `FILE_MAX_UPLOAD_SIZE_BYTES` | `52428800` | 单文件上传大小上限，默认 50MB |
| `FILE_MAX_PREVIEW_SIZE_BYTES` | `2097152` | 在线预览大小上限，允许 0 至 2147483646 字节；超出 JDK 有界读取范围时启动失败 |
| `FILE_ALLOWED_EXTENSIONS` | `.conf,.config,.css,.csv,.env,.geojson,.har,.html,.ini,.java,.js,.json,.json5,.jsonc,.jsonl,.jsx,.log,.map,.md,.ndjson,.properties,.sql,.topojson,.toml,.ts,.tsx,.txt,.webmanifest,.xml,.yaml,.yml` | 管理后台允许上传的文本/调试类文件扩展名 |

原始文件名仅用于列表展示、下载响应头和数据库元数据，最多 500 个 Unicode code point；底层存储使用 JDK 原子创建的固定短物理名，不用文件系统字节上限替代元数据字符上限。

## 生产部署前检查

| 配置 | 必填 | 生产要求 |
|------|------|----------|
| `POSTGRES_PASSWORD` | 是 | 强密码，不能使用 `change-me` 示例值 |
| `SPRING_DATASOURCE_PASSWORD` | 是 | 与数据库账号匹配，不能使用 `change-me` 示例值 |
| `JWT_SECRET` | 是 | 足够长的随机值，建议使用 Base64；后端会拒绝过短 secret |
| `JWT_EXPIRATION` | 否 | 默认 `86400000` 毫秒；支持 `24h` 等 Spring Boot 时长格式，且必须大于零 |
| `ADMIN_BOOTSTRAP_ENABLED` | 否 | 默认 `false`；首次创建管理员后应关闭 |
| `ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` / `ADMIN_BOOTSTRAP_EMAIL` | 条件必填 | 仅在 `ADMIN_BOOTSTRAP_ENABLED=true` 时使用；密码按配置原值编码；同名账号必须是已启用管理员，否则启动失败 |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | 否 | 生产默认 `validate`，数据库结构由 Flyway 管理 |

## 维护流程

1. 新增或删除 Controller 端点后，先更新本文档的端点矩阵。
2. 如果新增公开接口，明确说明为什么不需要 JWT，以及它是否可能接收用户原文。
3. 如果新增管理接口，确认路径落在 `/api/admin/**` 或 `/api/stats/**` 下，避免被默认认证规则误放宽。
4. 运行 `node scripts/ci/check-backend-api-matrix.mjs` 和后端测试，确保矩阵覆盖当前 Controller。
