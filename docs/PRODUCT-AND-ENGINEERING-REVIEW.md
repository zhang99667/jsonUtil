# JSONUtils 产品与工程升级评审

评审日期: 2026-06-18

本文档从 PM 和工程负责人两个视角评审 JSONUtils 当前状态，沉淀后续升级路线。结论基于当前仓库代码、文档、测试脚本、线上部署状态和最近围绕真实广告 response / cmdHandler 对齐完成的改造。

## 一句话结论

JSONUtils 已经不只是通用 JSON 格式化工具，而是逐步形成了“复杂 JSON / 广告 CMD / 真实 response 解析工作台”。下一阶段最值得投入的方向不是继续堆单点按钮，而是把解析质量、样本沉淀、对比验证和协作交付做成闭环。

## 当前定位

### 核心用户

- 通用开发者: 需要格式化、压缩、校验、JSONPath 查询、文件编辑和 AI 修复。
- 广告/客户端研发: 需要解析多层 URL、CMD、Scheme、Base64、运行时占位符和真实 response。
- 运营与管理后台用户: 需要用户、文件、访问统计和部署后的运行观测。

### 当前优势

- 主应用已经覆盖 JSON 编辑、转换、JSONPath、AI 修复、文件草稿、自动保存和多标签。
- Scheme/CMD 能力已经有明显专业化优势，支持整段 response、cmdHandler 风格复制、页面内对比、Top CMD Schema、占位符、Base64 后缀和质量快照。
- CI 闭环较完整，包含前端 typecheck、单测、构建、首屏预加载检查、E2E、后端 Maven、Docker compose 校验。
- 安全基础已有改善，生产默认管理员关闭，JWT secret 默认不再给固定值。

### 当前风险

- 核心能力集中在少数大文件，后续继续加功能会推高理解和回归成本。
- README 和架构文档偏通用 JSON 工具视角，对已经形成的 CMD/真实 response 专业能力表达不足。
- 解析质量已有脱敏样本库、质量快照和 CI 门禁，但样本覆盖还偏单一，也缺少长期趋势视图。
- 管理后台更像基础运维面板，还没有反哺主工具能力的数据闭环。

## 当前证据

- 前端脚本: `npm run typecheck`、`npm run test`、`npm run build`、`npm run check:preloads`、`npm run test:e2e`。
- 后端脚本: Maven test/package，根目录 local CI 会覆盖前后端和 Docker compose。
- 当前仓库版本: v1.8.244。
- 当前测试规模: Vitest 全量 53 个测试文件、882 个用例，主应用 smoke E2E 约 97 个用例，前端源码文件约 123 个。
- 关键模块体量:
  - `frontend/src/utils/transformSummary.ts`: 3671 行
  - `frontend/src/utils/schemeUtils.ts`: 2380 行
  - `frontend/src/components/TransformReportPanel.tsx`: 2587 行
  - `frontend/src/components/SchemeViewerModal.tsx`: 1444 行
  - `frontend/src/App.tsx`: 1989 行
  - `frontend/src/utils/transformations.ts`: 1266 行
- 最新真实 response 探针结论: 可识别主入口 `nadcorevendor://vendor/ad/rewardImpl`，并固定自定义 Scheme、结构化 HTTPS、资源 URL、运行时占位符和 cmdHandler expected 子集，证明当前解析链路已能覆盖典型广告 response 的多层结构。

## 产品升级路线

### P0: 解析质量闭环

目标: 让“这次解析有没有变好”可量化、可回归、可对比。

已落地进展:

- 页面复制产物内置下一步命令: CMD 对比包、问题样本 JSON 和归档包会提示 `cmd:diff`、`samples:to-regression` 与 corpus 基线校验命令，减少从页面排查切到 CLI 验证时的记忆成本。

建议功能:

- 样本库管理: 将真实 response 的脱敏样本、问题样本、质量快照统一保存到 `fixtures` 或后端样本库。
- 质量基线: 每个样本记录覆盖率、CMD Schema 数量、占位符数量、待检查数量、跳过数量。
- 发布门禁: CI 跑固定样本集，阻止覆盖率下降、schema 消失或待检查数量异常上升。
- cmdHandler 对齐集: 对核心样本保存内部 cmdHandler expected，自动跑差异报告。

验收标准:

- 新增样本后可以一条命令生成质量快照。
- CI 能报告每个样本的解析质量变化。
- 对真实 response 的主入口 schema、关键 nested schema 和占位符路径有固定断言。

### P0: 真实 response 排查效率

目标: 从“能解析”升级到“能指导研发下一步怎么排查”。

建议功能:

- 一键生成排查报告: 聚合 Top CMD Schema、运行时占位符、未展开原因、cmdHandler diff 和建议动作。
- 路径定位组合包: 每条风险路径同时提供 JSONPath、原始 source 路径、cmdHandler actual 片段。
- 占位符回填工作流增强: 回填模板应用后自动重新生成质量快照，展示替换前后差异。

验收标准:

- 用户粘贴整段 response 后，3 次点击内可以复制一份可发给协作者的排查报告。
- 占位符替换前后能看到解析覆盖率和 CMD Schema 变化。

### P1: 多格式与导入导出

目标: 拓宽工具使用场景，同时不稀释 JSON 专业能力。

已落地进展:

- HAR 请求提取: 打开 `.har` 文件时会生成不绑定原抓包文件句柄的派生 JSON 标签，提取 request/response body，补充 method/status/host/MIME 摘要、4xx/5xx/解析失败/截断等异常摘要和不含 query 的短标签，并在深度解析报告里把 CMD/资源记录关联到接口上下文。

建议功能:

- YAML / XML / HAR 局部解析: 已完成 HAR body 导入转换，后续可继续补 YAML / XML 到 JSON 视图，不急于做全功能编辑器。
- JSON Schema 校验: 支持从当前 JSON 按严格/宽松策略生成初始 Schema、粘贴 schema 校验当前 JSON，并在编辑器中标记错误路径。
- HAR 请求提取增强: 已支持在深度解析报告中按接口域名、状态码和路径筛选 CMD/资源记录，并在导入摘要中提示需关注接口；后续可补独立的 HAR payload 列表筛选和选中片段导出。
- 工作区导出: 导出当前 tabs、设置、质量快照、问题样本，便于跨机器复现。

验收标准:

- 新格式进入后仍能落到统一 JSON 工作台。
- 导入失败时能给出可操作错误，而不是静默返回原文。

### P1: AI 修复升级

目标: AI 从“修 JSON”升级为“理解当前工具上下文的修复助手”。

建议功能:

- AI 修复策略选择: 严格 JSON、保留注释、JSON Lines、真实 response 保守修复。
- 修复前后差异解释: 生成结构变化摘要，避免用户盲目接受 AI 修改。
- 本地规则优先增强: 在已支持常见尾逗号、单引号、未加引号 key、注释和字符串内原始换行的基础上，继续补充更多可解释规则。
- 敏感值保护增强: 在默认阻断发送原文基础上，继续补充一键脱敏后发送。

验收标准:

- AI 修复结果必须可复制“修改摘要”。
- 命中敏感字段时默认不直接发送原文。

### P1: 管理后台反哺主产品

目标: 管理后台不只是看 PV，而是帮助判断产品价值和问题分布。

建议功能:

- 工具使用事件: 已新增匿名工具事件上报和后台聚合，统计格式化、深度解析、Scheme 解析、AI 修复、JSONPath 查询等显式动作使用频率。
- 失败分布: 统计 JSON 校验失败、AI 失败、文件失败、解析跳过的类型。
- 性能观测: 上报大 response 解析耗时区间和取消率，指导 Worker 与预算优化。

验收标准:

- 后台能回答“用户最常用什么功能”“失败主要在哪”“大 response 是否卡顿”三个问题。
- 统计默认不采集原始 JSON 内容，只采集类型、耗时、大小区间和错误类别。

### P2: 协作与分发

目标: 从个人工具走向团队共享工具。

建议功能:

- 浏览器扩展版: 对网页响应、复制内容和 Network payload 做快速格式化/深度解析。
- 团队规则包: 团队可维护常用 CMD 字段、业务标签、占位符说明和脱敏规则。
- 分享链接: 对脱敏后的片段、质量快照和问题样本生成可分享链接。

验收标准:

- 分享内容默认脱敏。
- 团队规则包可版本化，并能被 CI 样本验证。

## 工程升级路线

### P0: 大模块拆分

当前几个核心文件已超过 1000 行。建议按稳定边界拆分，不做一次性大重构。

已落地进展:

- `transformSummary.ts` 的首屏摘要逻辑已抽到 `transformContextSummary.ts`，主应用只静态加载轻量摘要；完整报告、质量快照和导出能力继续随报告面板或占位符回填按需加载。
- JSON 转 TypeScript 已从基础转换静态链路移到动态加载/Worker 路径，避免低频类型生成挤占首屏预算。

建议顺序:

- `schemeUtils.ts`: 拆成 `schemeDetection`、`schemeDecode`、`base64Payload`、`queryParser`、`schemeEncode`。
- `transformSummary.ts`: 拆成 `reportModel`、`reportView`、`qualitySnapshot`、`issueSampleExport`、`cmdStructureReport`。
- `SchemeViewerModal.tsx`: 抽出 summary chips、runtime placeholder panel、base64 meta panel。
- `TransformReportPanel.tsx`: 抽出 report toolbar、record list、placeholder section、comparison section。

验收标准:

- 每次拆分都保持现有单测和 E2E 全绿。
- 拆分不改变 UI 文案和行为，除非单独声明。

### P0: 样本驱动测试

建议把真实 response 能力从 E2E 合成样本扩展为稳定 corpus。

建议结构:

```text
frontend/fixtures/scheme-corpus/
├── reward-response.redacted.json
├── reward-response.expected.snapshot.json
├── reward-response.cmdhandler.expected.json
├── landing-response.redacted.json
├── landing-response.expected.snapshot.json
├── landing-response.cmdhandler.expected.json
├── phone-response.redacted.json
├── phone-response.expected.snapshot.json
└── phone-response.cmdhandler.expected.json
```

验收标准:

- 单测可以读取 corpus，验证主入口 schema、Top schema、占位符、Base64 后缀。
- corpus 文件必须脱敏，不包含真实 token、设备 ID、cookie 或用户标识。

### P1: 性能预算分层

已有首屏预加载预算，并已新增核心 Scheme 解析性能预算脚本。下一步建议继续补齐浏览器 Worker 与 JSONPath 查询的端到端预算。

建议指标:

- 50KB response 解码耗时
- 250KB response Worker 解码耗时
- 超长字段跳过数量
- JSONPath 大查询取消响应时间

验收标准:

- 性能测试不要求极端精确，但要能发现 2 倍以上退化。
- 预算失败时输出具体样本和步骤。

### P1: 后端接口治理

建议补齐后端 API 合约文档与权限矩阵。

建议内容:

- 管理端、公开端、访客端 API 按权限列清楚。
- 文件上传限制、预览大小、允许扩展名和错误响应写入文档。
- JWT secret、管理员初始化、CORS、数据库迁移作为部署前检查项。

验收标准:

- 新增后端接口时必须同步更新权限矩阵。
- 部署文档能明确生产必填环境变量。

## 文档升级建议

- README 应突出“复杂 response / CMD / Scheme 工作台”能力，否则外部用户只会把它理解成普通格式化工具。
- `docs/SCHEME-STRING-FEATURE.md` 更像早期方案文档，后续应补一版“当前实现说明”，减少和现实代码的偏差。
- `ARCHITECTURE.md` 需要补 Worker、质量快照、cmdHandler 对比、样本回归脚本这些已落地能力。
- 新增功能最好从 CHANGELOG 反向沉淀到专题文档，避免只在更新日志里才能找到能力说明。

## 近期落地进展

- 已建立脱敏真实 response corpus，并在 CI 中固定主 CMD Schema、热点 Schema、资源字段、占位符、扫描位置和 cmdHandler expected 子集。
- 已新增 `corpus:snapshot` / `corpus:snapshot:check`，支持一条命令生成质量快照，并在 expected 阈值不通过时阻断 CI。
- 新增 corpus 样本如果缺少 expected snapshot，会被质量门禁识别并失败，避免无基线样本混入。
- 质量快照会同步输出 cmdHandler expected 子集对齐结果；strict 模式会拦截 expected 缺失、关键路径缺失和字段值不一致。
- 深度解析报告已支持一键复制协作排查报告，把诊断摘要、质量快照要点和当前页面内 cmdHandler 差异合并为可转发文本。
- 占位符回填模板应用后会展示并支持复制质量前后对比，能直接看到 CMD 结构、内部字段、占位符和风险计数变化。
- 深度解析报告已支持复制排查归档包，把诊断摘要、质量快照、脱敏问题样本、占位符回填模板和 corpus 文件清单打包为安全沉淀材料。
- CI 会生成 Markdown 质量摘要并上传 JSON 快照 artifact，PM 和研发可以直接下载对照样本质量变化。
- 已新增质量快照趋势对比命令，可把两份 snapshot 对比为 JSON/Markdown 报告，并在 strict 模式下拦截解析质量退化。
- 已支持用 `--input` 对本地真实 response 做一次性质量诊断，便于先验证、再脱敏沉淀为 corpus。
- 已新增 `perf:scheme` 核心解析性能预算，可基于脱敏 corpus 构造 50KB / 250KB response，输出耗时、覆盖率、CMD 结构、资源字段、占位符、待检查和跳过数量，并支持 strict 模式拦截本地退化。
- 已新增 `perf:jsonpath` JSONPath 性能预算，可复用脱敏 response 和大量命中列表，输出查询耗时、命中数、高亮范围和结果上限保护，并接入 CI artifact。
- 已新增匿名工具事件闭环，主工具会按功能名、状态、输入大小档和耗时档上报，管理后台可查看工具事件总量、失败率、高频功能、输入大小和耗时分布，默认不采集 JSON 原文。
- 根据真实 response 对照发现并补齐字符串型资源 URL 洞察，`button_icon`、`user_portrait`、`button_image`、lottie 等不带 query 的素材字段会进入资源字段和静态资源 URL Top。
- AI 修复发送前会默认阻断 token、sign、cookie、密钥和设备标识等疑似敏感字段，覆盖多层 URL 编码和内部 Base64 片段，避免把真实 response 原文直接发给模型。
- AI 修复已增加本地确定性修复前置能力，常见小错误能在本地完成并跳过模型调用，连接测试仍会真实请求 AI 服务。
- 已收敛 HTTPS Scheme 误判，普通 `http/https` URL 不再作为业务 CMD 入口或内层 `cmdSchema` 展示，只有自定义 Scheme 或携带结构化 CMD 参数的 HTTP(S) URL 会进入 Scheme 列表。
- 资源字段已补齐原始 URL source 追踪，带 query 的 `video_url`、`imageUrl` 等素材地址在展示为解析对象的同时仍能进入静态资源 URL Top。
- 静态资源 URL Top 已补充资源类型分组，视频、图片、Lottie、音频、包/压缩和其他资源会在面板、诊断摘要和质量快照 JSON 中使用统一分类口径。
- 静态资源类型分布已支持占比展示和一键筛选，点击“视频”“图片”“Lottie”等类型后会保留所在展开记录并聚焦对应资源字段。
- 质量快照趋势对比已支持静态资源类型占比变化，能在 JSON/Markdown 中标出资源类型新增、消失和视频/图片/Lottie 等占比漂移。
- 质量快照趋势对比已支持资源类型可选阈值，能用 `--resource-type-drop video=20`、`--resource-type-rise lottie=20` 在 strict 模式下拦截视频占比骤降或 Lottie 占比异常上升。
- CI 已接入完整质量快照趋势对比，当前快照会和 committed baseline 做 strict diff，并上传 `scheme-corpus-quality-trend` artifact，资源类型阈值会参与发布门禁。
- 已新增 `corpus:snapshot:baseline` 安全更新入口，strict 通过后才覆盖 committed 质量趋势基线，并在 CI 文档中明确 baseline 接受与回退标准。
- 已接入前端 ESLint flat config，`npm run lint` 作为错误级门禁进入本地 CI 和 GitHub Actions，同时保留 `npm run lint:report` 用于逐步清理历史 warning。
- 已从版本库移除 `frontend/.vite` 缓存文件，避免 Vite 本地预构建元数据继续污染代码提交。
- 已完成前端依赖安全治理，`npm audit` 从 7 个风险收敛为 0 个风险，并新增 `audit:security` 门禁拦截 moderate 及以上漏洞回流。
- 已为本机 SSH 部署脚本和 GitHub Actions Deploy 工作流补充 SSH keepalive，降低远端 Docker 构建长时间运行时连接中断导致的半部署风险。
- 已补齐本地 CI 的 Docker Compose 配置校验假环境变量，完整本地 CI 不再依赖开发机存在生产 `.env`。
- 已补齐后端 API 权限矩阵，并新增 Controller 扫描校验脚本接入本地 CI 与 GitHub Actions，新增接口必须同步记录权限和数据边界。
- 管理后台工具事件洞察已补 PM 速览，直接展示高频功能、大输入占比、慢操作占比和建议动作，帮助判断“大 response 是否卡顿”和“失败主要在哪”。
- 已新增第二类脱敏落地页 response corpus，覆盖 easybrowse、deeplink、openapp、结构化 HTTPS 落地页、监测 URL、占位符和 cmdHandler expected 子集，质量快照样本数从 1 扩展到 2。
- 已新增第三类脱敏电话拨打 response corpus，覆盖 makePhoneCall、numberUrl、logUrl、Base64 extInfo、hash 落地页参数、运行时占位符和 cmdHandler expected 子集，质量快照样本数从 2 扩展到 3。
- Scheme 面板质量摘要已支持复制结构化质量快照 JSON，在不包含原始 Scheme、解码结果或参数值的前提下沉淀 coverage、状态、CMD/资源/占位符/跳过数量、Top CMD Schema 和建议动作。
- 本地 CI 会在 macOS 未显式设置 `JAVA_HOME` 时优先选择 Java 17，避免 Maven 误用 Java 26 导致 Mockito/Byte Buddy 后端测试兼容失败。
- Scheme 面板“复制路径和值”的 JSONPath 生成和截断逻辑已抽成 `schemePathValues` 纯工具函数，并用单测锁住特殊 key、空数组/空对象、非法 JSON 与截断提示。
- 深度解析报告已新增“真实 response 下一步”动作条，根据当前报告推荐最多 3 个优先入口，把 cmdHandler 对比、占位符回填、待处理筛选、归档包和协作报告复制从长按钮区收敛到摘要下方。
- 已新增 `perf:e2e` 浏览器 Worker 端到端性能预算，覆盖 JSONPath 取消响应、Scheme 取消响应、连续大 response 解析和已加载面板关闭态大输入切换，并在 CI 中输出 JSON artifact / Step Summary。
- 管理后台工具事件洞察已新增 PM 周报视图，按统计周期聚合高频功能、失败率、大输入和慢操作，并输出重点关注与下周动作。
- 已新增 JSON Schema 校验浮动面板，支持从当前 SOURCE JSON 按严格/宽松策略生成初始 Schema、粘贴 Schema 校验当前 JSON，展示错误 JSONPath、Schema 关键字和 Schema 路径，并可一键交给 JSONPath 面板定位。
- JSONPath 面板已补字段名快捷查询和 Response 常用查询预设，用户输入 `traceId` / `action_cmd` 会自动转成递归查询，`action_cmd`、`button_cmd`、`scheme`、`url`、`params`、`traceId` 也可一键填入并查询，减少真实接口 response 排查时手写表达式的成本。
- JSONPath 查询结果已支持一键定位到结构导航节点，命中项会通过 JSON Pointer 优先匹配并展开上下文，用户可继续查看 Pointer、子树、语义标签和节点 TS 类型，形成“查字段 -> 看结构上下文 -> 继续排查”的闭环。
- SOURCE 智能建议已支持 JSON Lines / NDJSON 入口识别，合法日志型多行 JSON 会推荐结构导航和 JSON 转 TS，含 CMD / Scheme 的行仍会走排查工作流，坏行则给出首个失败行号。
- 结构导航节点已支持“同名字段”递归查询，选中真实字段后可直接生成 `$..field` 或 bracket JSONPath 并打开查询面板，根节点和数组下标会隐藏该动作，避免无意义查询。
- JSON Schema 校验失败项已支持同名字段反查和复制查询，失败路径可直接转为 `$..field` / bracket JSONPath，用于排查全局字段分布是否存在同类约束问题。
- JSON Schema 校验结果已支持 SOURCE 编辑器内错误标记，校验未通过时会在原字段位置显示高亮和 hover 说明，头部同步提示问题数量，额外字段会优先定位到具体字段。
- JSON Schema 校验面板已支持浏览器本地 Schema 收藏、剪贴板导入/导出和配置备份同步，常用 Schema 可保存、载入、跨机器共享和团队复用。
- HAR 派生 payload 已新增问题导向摘要，统计客户端/服务端错误、未知状态、JSON 解析失败、截断 body 和未解码 Base64，并只暴露不含 query 的接口标签。
- 结构导航已支持多关键词和字符顺序模糊搜索，用户可以用路径/字段缩写快速命中目标节点，并在底部看到当前匹配数。
- 结构导航已补齐节点详情和复制能力，选中节点后可查看 JSONPath、JSON Pointer、类型、子节点数和值预览，并复制 Pointer、紧凑值或格式化值。
- 结构导航已补对象数组表格预览、全列搜索和稀疏字段重采样，选中列表型 response 数组时可直接看前几行字段分布，按列名从受限扫描行中聚焦关键字段，并复制当前可见列的表格 JSON 或 CSV 继续排查。
- 结构导航已补搜索结果、节点子树复制和当前子树 TS 类型复制，搜索命中可复制结构化 JSON 清单，容器节点可直接复制完整子树或生成当前节点的 TypeScript `interface` / `type` 声明。
- 结构导航已补搜索/筛选结果 Markdown 和 CSV 摘要复制，路径、Pointer、类型、子节点数和值预览可直接粘贴到排查文档或表格工具。
- 结构导航已补节点类型筛选，可跨整棵树筛选对象、数组、字符串、数字、布尔和空值节点，并联动复制当前筛选结果。
- 结构导航已补搜索命中高亮，精确命中的字段名和值预览片段会在结构行内突出显示，降低大 response 扫描成本。
- 结构导航已补搜索历史，最近 10 个搜索词可回填、删除和清空，并随配置备份导出/导入，适合反复排查 CMD Schema、电话链路、trace 字段等常用关键词。
- 结构导航已补字符串节点语义预览，选中 URL、Scheme、JWT、Base64、资源 URL、邮箱、电话、日期或颜色字符串时在节点详情区展示轻量标签；可解析语义值可一键送入 Scheme/编码解析面板继续排查，电话等普通语义只展示不触发解析；电话识别结合字段上下文，资源类型优先依据 URL 路径后缀，JWT/Base64 只展示结构摘要或长度，普通 HTTPS 与业务 Scheme 的入口判断保持不变。
- 深度解析报告面板关闭时不再构建报告视图和质量快照，减少关闭态随输入变化产生的主线程派生计算。
- JSON 转 TS 已补生成可信度摘要，主转换和结构节点复制会说明样本数量、对象类型数量、可选字段、混合类型和空数组 unknown 风险，让从 response 到前端类型的结果更容易复核。
- JSON 转 TS 已从基础转换静态链路移到动态加载路径，小输入按需 import、大输入继续走 transform worker，避免低频类型生成和可信度摘要逻辑继续挤压首屏预加载预算。

## 2026-06-19 竞品复评补充

参考 JSON Hero、JSON Crack、JSON Editor Online / jsoneditor、Dadroit、jq playground、JSON Compare 和 JSON Formatter 后，当前项目已经覆盖通用 JSON 工作台的大部分基础能力，差异化优势仍在复杂 response / CMD / Scheme 解析。下一阶段不建议继续堆单点按钮，而应把“结构理解、修复解释、协作排查”做得更像一个检查器。

本次联网复核补充参考:

- JSON Hero: https://jsonhero.io/ 和 https://github.com/triggerdotdev/jsonhero-web
- JSON Crack: https://jsoncrack.com/ 和 https://github.com/AykutSarac/jsoncrack.com
- JSON Editor Online / jsoneditor: https://jsoneditor.io/ 和 https://github.com/josdejong/jsoneditor
- quicktype: https://quicktype.io/ 和 https://quicktype.io/typescript
- DevToys: https://devtoys.app/ 和 https://devtoys.app/doc/articles/extension-development/guidelines/UX/support-smart-detection.html
- JSONLint Repair / jsonrepair: https://jsonlint.com/json-repair 和 https://github.com/josdejong/jsonrepair
- JSON Diff: https://jsondiff.com/
- JSON Path Finder: https://jsonpathfinder.com/
- Dadroit: https://dadroit.com/
- jq playground: https://play.jqlang.org/
- JSON Compare: https://jsoncompare.com/
- JSON Formatter: https://jsonformatter.org/

### 同类工具学习点

- 2026-06-19 二次调研补充: 优先参考官方页面和公开仓库说明，重点看 JSON Hero、JSON Crack、CyberChef、jsoneditor/jsonrepair、quicktype、jq 和 JSONPath Finder 这几类工具；结论是本项目不应只做“更多转换按钮”，而要围绕搜索定位、语义理解、可组合流水线、本地修复、转换可信度和协作证据继续增强。
- JSON Editor Online / jsoneditor: 多模式编辑、自动修复、Schema 校验、JMESPath 转换和 500MiB 级预览是成熟工作台的底线；本项目已具备格式化、修复和结构导航，后续要补 Schema 校验、JMESPath/jq 预览和更明确的修复解释。
- JSON Hero: 多视图浏览、字符串语义预览、自动 Schema、键值搜索、键盘可访问和带路径的分享链接都很强；当前已先补 URL、Scheme、JWT、Base64、资源 URL、邮箱、电话、日期和颜色的轻量语义标签，并把可解析语义值接到 Scheme/编码解析面板，后续可把空值分布、相关值统计和长数组字段采样质量做成节点详情语义卡片。
- JSON Crack: 图形化结构、多格式转换、Schema/类型生成、查询和图片导出更适合讲解复杂结构；本项目已先在结构导航补“从节点继续生成 TS 类型”的短路径，后续可继续补从节点对比和导出证据图。
- quicktype: 多语言模型和运行时校验生成证明“从样本到代码”是高频链路；本项目已补 JSON 转 TS、结构节点 TS 类型复制、Schema 示例和 Schema 可信度摘要，继续把 Schema 与 TS 生成的字段规模、可选字段、混合类型和 format 提示统一起来。
- DevToys: 离线工具箱和 Smart Detection 说明“自动识别当前输入并推荐可串联工具”很重要；本项目已先补 SOURCE 智能建议，会按当前输入推荐 Response 排查工作流、嵌套解析报告、Scheme 面板、JSON Lines 结构导航、TS/Schema 或 URL 解码，后续可扩展到剪贴板智能识别、转换结果转入下一工具和本地隐私承诺。
- JSONLint Repair / jsonrepair: 自动修复要明确列出 trailing comma、单引号、未加引号 key、注释、Markdown 包裹、截断和缺逗号等可修复类型；本项目应继续保持本地规则优先，并把修复步骤解释做成可复制摘要。
- CyberChef: 481 个 operation 和 recipe 模式说明“可组合流水线”比单个按钮更有生命力；本项目已先落地 Response 排查工作流，把 JSON 内含 CMD/Scheme 的场景串到 Deep Parse -> 深度解析报告，后续再围绕 URL Decode -> JSON Repair -> Deep Parse -> JSONPath/Schema 形成可保存、可复制的轻量 recipe，而不是一次性复制 CyberChef 的大而全。
- jq / JSONPath Plus / JSON Path Finder: 查询工具的核心价值是低门槛定位字段、复制路径、回到结构上下文和组合过滤；本项目已先落地 JSONPath 字段名快捷查询、结果定位结构导航、结构节点同名字段查询和 Schema 失败项同名字段反查，后续可以补查询历史分组、jq/JMESPath 只读预览。
- Dadroit: 大文件、JSON Lines/ndjson、类数据库查询和自动刷新是桌面场景刚需；本项目应继续强化 Worker/虚拟化/增量分析能力，并把“敏感数据本地处理”作为桌面版核心承诺。
- JSON Diff / JSON Path Finder / jq playground / JSON Compare / JSON Formatter: 查询、对比、格式化、校验和多格式转换是开发者高频入口；本项目已为 JSONPath 补充字段名快捷查询和 Response 常用查询预设，也为 JSON 对比补充按 JSONPath 前缀忽略噪声字段、复制 JSONPath / JSON Pointer 和联动 JSONPath 定位 SOURCE 原值，后续更应该把“转换后如何检查结果是否可信”做成优势。

### 2026-06-19 联网竞品扫描结论

本次继续检索 JSON Hero、JSON Crack、JSONLint、quicktype、JSON Formatter、FreeFormatter URL Parser、EasyTools URL Parser、Jam Query Params to JSON 等工具，补充以下更贴近当前产品形态的学习点:

- 工具箱矩阵不是简单堆按钮。JSONLint 把验证、修复、Diff、Tree、Path、Search、Schema、CSV/YAML/XML、代码生成和编码工具分成清晰栏目；本项目应保持主界面克制，把高频链路做成智能建议和动作条，把低频工具放到懒加载面板或专题入口。
- URL / Query 解析要明确输入边界。FreeFormatter 会拆出 scheme、host、path、query、hash 等 URL 部件；EasyTools 明确要求完整 URL，重复 query key 导出为数组；Jam 聚焦 query 参数转 JSON。对应到本项目，普通 HTTPS 应继续按 URL 处理，不默认当业务 Scheme；只有自定义 Scheme 或携带可展开业务参数的 URL 才进入 CMD/Scheme 链路。
- JSON 修复要可解释。JSONLint Repair 把尾逗号、单引号、未加引号 key、注释、Markdown 包裹、截断和缺逗号列成可修复类型。本项目的 AI 修复应继续“本地确定性规则优先”，并把修复步骤、风险和前后结构差异输出成可复制摘要。
- Schema / 类型生成要从“生成结果”升级到“契约可信度”。JSON Hero 和 JSONLint 都强调从样本推断 Schema，quicktype 强调从 JSON / Schema / TypeScript 生成多语言模型。本项目已先补 Schema 可信度摘要，展示对象/字段规模、required/可选字段、union 类型、format 和采样数组数，让用户知道生成的 TS/Schema 可信到什么程度。
- 可视化价值在“定位复杂结构”。JSON Crack 的图形/树视图、导出图片和多格式转换适合讲解复杂数据；本项目不必立刻做完整图编辑器，可以先在结构导航补“证据导出图/Markdown”、节点间差异对比和 Top CMD Schema 到结构节点的反向定位。
- 隐私承诺应该前置。JSON Crack、EasyTools、quicktype 都强调浏览器本地处理或不上传样本。本项目已适合把“本地解析、不上传原始 response、AI 发送前敏感阻断”放在设置、AI 修复和导出报告中更显眼的位置。

短期优先级建议:

1. P0: 继续强化 CMD/Scheme 边界判断和样本回归，尤其是普通 HTTPS、结构化 HTTPS、query JSON、URL 编码 JSON、多层转义之间的分类解释。
2. P1: 继续统一 Schema/TS 生成可信度摘要；当前已覆盖 Schema 对象/字段规模、required/可选字段、union、format 和数组采样，后续可扩展到多样本字段覆盖率。
3. P1: 扩展查询/解析 recipe；当前已先做 Response 排查工作流，后续支持保存 URL Decode -> JSON Repair -> Deep Parse -> JSONPath/Schema 的常用排查链路。
4. P2: 做轻量证据导出，把结构导航当前节点、路径、同名字段分布、Top CMD Schema 和资源类型分布导出为 Markdown 或图片。

### 竞品启发的新增待办

- 语义预览: 已在结构检查器节点详情中识别 URL、Scheme、JWT、Base64、图片/视频/Lottie/音频/包资源、邮箱、电话、日期和颜色；URL/Scheme/JWT/Base64/资源 URL 已提供继续解析入口，后续可补复制属性、资源预览和相关值统计。
- 路径级协作: 已支持复制带路径上下文的 Markdown 和 CSV 摘要，JSONPath 面板提供 Response 常用查询预设，JSON 对比也支持按 JSONPath 前缀忽略噪声字段、复制 Path / Pointer 并定位修改或删除项的 SOURCE 原值；后续 Web 版可考虑 URL hash 定位到某个 JSONPath。
- 图形证据: 复杂对象可导出结构缩略图或 Mermaid/图片，服务于排查报告和评审沟通，而不是把完整 JSON 截图贴出去。
- 桌面效率: 已补当前 SOURCE 的智能建议入口；Electron 版可继续补剪贴板智能识别、打开历史、文件拖拽和系统快捷入口，强化“敏感数据不出本机”的定位。
- 转换可信度: JSON 转 CSV/YAML/TS/Schema 后增加样本行数、丢失字段、动态 key、混合类型和截断提示，让转换结果更可审查；JSON Schema 生成已补长数组前段、尾段、分散点和稀疏字段代表行采样，并在面板展示采样行数、稀疏字段命中、扫描上限和 required 策略摘要。
- Recipe 工作流: 借鉴 CyberChef 的 recipe 思路，沉淀常用排查链路，例如“URL 反解 -> JSON 修复 -> 深度解析 -> 查询 action_cmd -> 复制排查报告”，先以本地收藏和分享文本落地，不急于做后端协作。
- 查询降门槛: JSONPath 字段名直查、结果回到结构导航和结构节点同名字段查询已落地，下一步可继续补“复制递归字段查询”“复制精确路径查询”和查询历史分组，让不熟 JSONPath 的用户也能完成排查。

### 新 P0: 结构检查器

目标: 把结构导航从“树形浏览”升级为“可复制、可定位、可对比的结构检查器”。

建议功能:

- 节点详情: 选中节点后展示类型、子节点数量、JSONPath、JSON Pointer、值预览、紧凑值和格式化值。
- 复制能力: 已支持复制 JSONPath、JSON Pointer、节点值、节点子树、当前搜索结果 JSON、Markdown 摘要和 CSV 摘要。
- 数组表格视图: 已完成前 N 行对象数组表格、全列搜索、稀疏字段重采样和 CSV/JSON 复制；后续补展开嵌套对象和更多 CSV 选项，降低接口列表型 response 的阅读成本。
- 搜索增强: 已完成多关键词、模糊搜索、按类型筛选、精确命中高亮和最近搜索历史。

验收标准:

- 不破坏现有 Worker 构建树模型、展开/折叠、路径定位和 JSONPath 联动。
- 大 JSON 打开结构检查器仍有节点上限和截断提示。
- 结构检查器复制内容不包含额外 UI 文案，可直接粘贴到代码、文档或协作报告。

### 新 P0: 关闭态性能预算

目标: 面板关闭后不再为不可见 UI 做重型派生计算。

建议功能:

- 深度报告: 已完成关闭态派生门控，并补充已加载面板关闭态大输入切换的浏览器性能预算；后续可继续下钻组件级回归测试。
- 首屏分包: 已将 Scheme 二维码依赖从通用工具包拆到独立按需 chunk，并把 `vendor-qrcode` 纳入首屏 preload 禁止名单，避免低频弹窗能力重新挤占首页预算。
- 占位符回填: 大文件回填后的质量对比仍可能同步跑两次深度解析，建议迁移到 Worker 或增加大小预算。
- 浮动面板: 继续确认所有面板关闭态都不会保留昂贵计算和事件监听。

验收标准:

- 关闭深度报告后切换大输入，不触发报告聚合。
- 大文件占位符回填不会长时间阻塞主线程。
- E2E 性能预算已覆盖“已加载面板关闭态输入切换”的退化。

## 两周迭代建议

### 第 1 周

- 从 `transformSummary.ts` 里拆出质量快照和资源/CMD Top 聚合逻辑，优先切走纯函数并保持单测全绿。
- 更新 `ARCHITECTURE.md`，补 Worker、版本感知、质量快照、cmdHandler diff 和 corpus/perf 门禁的当前实现。
- 继续补充纯监测链路或文件/HAR 导入样本，进一步降低 corpus 业务形态偏置。

### 第 2 周

- 继续优化“真实 response 下一步”动作条的排序策略，结合工具事件观察用户实际点击后再决定是否加入更多业务规则。
- 继续观察浏览器 Worker 性能预算 artifact，结合真实慢操作事件决定是否把 70KB 连续解析扩展到 250KB 分层预算。
- 继续观察 PM 周报中的重点关注项，必要时按功能补充失败原因、取消率和慢操作样本分桶。
- 观察 JSON Schema 生成、校验和收藏共享的工具事件与用户反馈，再决定是否补充 Schema diff、字段说明生成或团队规则包。

## 不建议马上做的事

- 不建议直接接入大量新格式编辑器。YAML/XML/HAR 应先以导入解析为主，避免扩大编辑和回写复杂度。
- 不建议立刻重写 Scheme 解析器。当前能力已覆盖真实 response，短期更应该用 corpus 锁住行为，再逐步拆分。
- 不建议把管理后台做成重 BI。当前优先级应是轻量指标反哺产品决策。

## 下一步决策

如果只选一个方向继续投入，建议优先做“结构检查器 MVP”。解析质量 corpus 和 CI 基线已经形成基础闭环，下一阶段应提升用户在大 response 中定位、理解、复制和协作的效率。
