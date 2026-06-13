# JSONUtils 产品与工程升级评审

评审日期: 2026-06-13

本文档从 PM 和工程负责人两个视角评审 JSONUtils 当前状态，沉淀后续升级路线。结论基于当前仓库代码、文档、测试脚本和最近围绕真实广告 response / cmdHandler 对齐完成的改造。

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
- 当前测试规模: 前端单测文件 27 个，E2E spec 3 个，前端/后端/测试源码文件约 107 个。
- 关键模块体量:
  - `frontend/src/utils/transformSummary.ts`: 2737 行
  - `frontend/src/utils/schemeUtils.ts`: 1699 行
  - `frontend/src/components/TransformReportPanel.tsx`: 1563 行
  - `frontend/src/components/SchemeViewerModal.tsx`: 1307 行
  - `frontend/src/App.tsx`: 1326 行
  - `frontend/src/utils/transformations.ts`: 1190 行
- 最新真实 response 探针结论: 可识别主入口 `nadcorevendor://vendor/ad/rewardImpl`，并汇总 44 个 CMD Schema，证明当前解析链路已能覆盖典型广告 response 的多层结构。

## 产品升级路线

### P0: 解析质量闭环

目标: 让“这次解析有没有变好”可量化、可回归、可对比。

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

建议功能:

- YAML / XML / HAR 局部解析: 先做导入转换和 JSON 视图，不急于做全功能编辑器。
- JSON Schema 校验: 支持粘贴 schema 后校验当前 JSON，并在编辑器中标记错误路径。
- HAR 请求提取: 从 HAR 中提取 request/response body，直接送入深度解析或 Scheme 面板。
- 工作区导出: 导出当前 tabs、设置、质量快照、问题样本，便于跨机器复现。

验收标准:

- 新格式进入后仍能落到统一 JSON 工作台。
- 导入失败时能给出可操作错误，而不是静默返回原文。

### P1: AI 修复升级

目标: AI 从“修 JSON”升级为“理解当前工具上下文的修复助手”。

建议功能:

- AI 修复策略选择: 严格 JSON、保留注释、JSON Lines、真实 response 保守修复。
- 修复前后差异解释: 生成结构变化摘要，避免用户盲目接受 AI 修改。
- 本地规则优先: 对常见尾逗号、单引号、未转义换行等确定性错误先本地修，再把复杂问题交给 AI。
- 敏感值保护: 请求 AI 前提示 token、cookie、设备标识等命中项，并支持脱敏发送。

验收标准:

- AI 修复结果必须可复制“修改摘要”。
- 命中敏感字段时默认不直接发送原文。

### P1: 管理后台反哺主产品

目标: 管理后台不只是看 PV，而是帮助判断产品价值和问题分布。

建议功能:

- 工具使用事件: 统计格式化、深度解析、Scheme 解析、AI 修复、JSONPath 查询等功能使用频率。
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
└── reward-response.cmdhandler.expected.json
```

验收标准:

- 单测可以读取 corpus，验证主入口 schema、Top schema、占位符、Base64 后缀。
- corpus 文件必须脱敏，不包含真实 token、设备 ID、cookie 或用户标识。

### P1: 性能预算分层

已有首屏预加载预算，建议补解析性能预算。

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
- CI 会生成 Markdown 质量摘要并上传 JSON 快照 artifact，PM 和研发可以直接下载对照样本质量变化。
- 已支持用 `--input` 对本地真实 response 做一次性质量诊断，便于先验证、再脱敏沉淀为 corpus。

## 两周迭代建议

### 第 1 周

- 建立脱敏 corpus 目录和第一个真实 response 样本。
- 将质量快照生成接入 corpus 单测。
- README 增加 CMD/Scheme 专业能力入口。
- 从 `transformSummary.ts` 里拆出质量快照相关逻辑。

### 第 2 周

- 增加一键复制“协作排查报告”。
- 将 cmdHandler expected 接入 corpus diff。
- 给 Scheme 面板增加“解析前后质量对比”入口。
- 更新 `ARCHITECTURE.md` 的 Worker 与解析质量闭环章节。

## 不建议马上做的事

- 不建议直接接入大量新格式编辑器。YAML/XML/HAR 应先以导入解析为主，避免扩大编辑和回写复杂度。
- 不建议立刻重写 Scheme 解析器。当前能力已覆盖真实 response，短期更应该用 corpus 锁住行为，再逐步拆分。
- 不建议把管理后台做成重 BI。当前优先级应是轻量指标反哺产品决策。

## 下一步决策

如果只选一个方向继续投入，建议优先做“解析质量 corpus + CI 基线”。它能同时服务 PM 的质量可见性、研发的回归安全和用户的真实 response 解析体验，是当前业务价值和工程收益最集中的升级点。
