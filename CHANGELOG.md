# 更新日志 (Changelog)
## v1.8.295 (2026-07-02) - CMD Schema Origin Draft State 分层
### 🚀 优化与改进
- **Draft State Helper**: 将 CMD Schema origin 草稿状态、Set 去重和可见 schema 截断逻辑抽成独立纯 helper，聚合入口回归 occurrence 遍历和 origin 路由
- **Origin 截断回归**: 补充 schema 展示截断但唯一 schema 总数和 hasMoreSchemas 保持准确的回归测试，并同步收紧 origin draft 预算

## v1.8.294 (2026-07-02) - 工具栏工具组类型分层
### 🚀 优化与改进
- **工具组类型拆分**: 将工具栏转换按钮的 icon id、按钮项和分组契约抽成独立类型文件，工具组配置回归纯元数据职责
- **工具栏预算收紧**: 为工具组类型文件补充可维护性预算，并把原工具组配置预算降到配置层范围，防止类型声明回流

## v1.8.293 (2026-07-02) - CMD Schema Origin 提取分层
### 🚀 优化与改进
- **Origin 提取 Helper**: 将 CMD Schema origin 的协议、域名和转义斜杠归一化抽成独立纯 helper，分组草稿入口回归去重、计数和截断职责
- **Origin 预算收紧**: 为 origin 提取 helper 补充可维护性预算，并把 origin draft 预算降到聚合层范围，防止解析规则回流

## v1.8.292 (2026-07-02) - 筛选视图 Nested Patch 分层
### 🚀 优化与改进
- **筛选 Patch 分层**: 将深度解析报告筛选中的 nested command/resource 字段 patch 抽成独立纯 helper，视图 patch 入口回归 decoded path 和字段组合职责
- **筛选预算收紧**: 为 nested patch helper 补充可维护性预算，并把原 filter view patch 入口预算降到组合层范围

## v1.8.291 (2026-07-02) - Transform Summary Artifact 类型分层
### 🚀 优化与改进
- **Artifact 类型拆分**: 将问题样本、占位符回填、质量快照和归档包类型拆成独立类型文件，artifact 类型入口回归兼容 re-export 职责
- **Artifact 类型预算收紧**: 为新增 artifact types 文件补充独立预算，并把原 artifact 类型入口预算降到 facade 范围

## v1.8.290 (2026-07-02) - Transform Summary 记录类型分层
### 🚀 优化与改进
- **记录类型拆分**: 将深度解析报告中的 record、decoded path、warning 和 unresolved candidate 类型抽到独立类型文件，核心 summary 类型入口回归报告聚合与视图契约
- **Summary 类型预算收紧**: 为新增 record types 文件补充可维护性预算，并把 transform summary 类型入口预算降到 facade 职责范围

## v1.8.289 (2026-07-02) - 工具面板 State Fixture 分层
### 🚀 优化与改进
- **State Fixture Helper**: 将工具面板命令测试 fixture 中的 state key 清单、override 判断和初始值读取抽成独立 test helper，fixture 主体回归 React hook mock 与命令装配
- **工具面板预算收紧**: 为新增 state test helper 补充可维护性预算，拆出命令面板测试预算表，并把工具面板命令 fixture 预算降到 React mock 装配职责范围

## v1.8.288 (2026-07-02) - SchemeViewer 测试 Helper 分层
### 🚀 优化与改进
- **React 树测试 Helper**: 将 SchemeViewer 多个组件测试重复的文本收集、data-tour 查找和组件类型查找抽成共享 test helper，测试主体回归业务断言
- **SchemeViewer 测试预算收紧**: 为共享 test helper 补充可维护性预算，拆出 shell 测试预算表，并下调 Base64、Runtime 占位符、参数明细、解码链路、CMD 摘要和诊断容器测试预算

## v1.8.287 (2026-07-02) - AI 治理规则分层
### 🚀 优化与改进
- **AI Governance 规则拆分**: 将 AI 协作治理中的必需文件清单和 Codex skill 引用规则拆成独立 helper，主规则入口回归引用组合
- **AI 预算收紧**: 为新增治理 helper 补充可维护性预算，并把 AI governance 规则入口预算降到组合职责范围

## v1.8.286 (2026-07-02) - 工具面板测试 Fixture 分层
### 🚀 优化与改进
- **窗口事件测试 Helper**: 将工具面板命令 fixture 中的 CustomEvent 和 window listener stub 抽成独立 test-only helper，主 fixture 回归 React hook mock 与状态捕获
- **Fixture 预算收紧**: 为窗口事件 helper 补充可维护性预算，并把工具面板命令 fixture 预算降到测试装配职责范围

## v1.8.285 (2026-07-02) - 报告路径区块配置分层
### 🚀 优化与改进
- **路径区块配置 Helper**: 将深度解析记录里的内部 CMD、静态资源和内部路径区块配置抽成独立 helper，组件入口只负责渲染编排
- **路径区块预算收紧**: 为配置 helper 补充可维护性预算，并把路径区块入口预算降到轻量组合层

## v1.8.284 (2026-07-02) - 报告筛选视图分层
### 🚀 优化与改进
- **筛选视图 Helper 分层**: 将深度解析报告的命中行收集和视图 patch 构造拆成独立纯 helper，入口回归短路与合并
- **筛选预算收紧**: 为命中收集、视图 patch 和入口分别补充可维护性预算，防止筛选逻辑继续回流到单文件

## v1.8.283 (2026-07-02) - CMD Schema Origin 分层
### 🚀 优化与改进
- **Origin 聚合分层**: 将 CMD Schema origin 的草稿聚合和结果映射拆成独立纯 helper，入口只保留收集与组合
- **Origin 预算收紧**: 为新增 helper 补充可维护性预算，并把 origin 分组入口预算降到轻量组合层

## v1.8.282 (2026-07-02) - 工具栏设置入口分层
### 🚀 优化与改进
- **设置入口组件化**: 将 ActionPanel 内联设置按钮抽成独立组件，主工具栏回归交互装配和状态汇总
- **设置入口覆盖**: 新增设置按钮展开/折叠态单测，并把设置入口纳入工具栏可维护性预算

## v1.8.281 (2026-07-02) - CMD 候选 Helper 再分层
### 🚀 优化与改进
- **CMD Candidate Helper 分层**: 将 CMD 候选类型、actual 归一化和路径拼接拆成独立纯 helper，decoded scanner 回归递归遍历和候选去重
- **CMD Candidate 预算收紧**: 为类型、actual 和 path helper 补充可维护性预算，并把 decoded scanner 的预算降到扫描职责范围

## v1.8.280 (2026-07-02) - CMD 候选扫描分层
### 🚀 优化与改进
- **CMD Actual 候选扫描 Helper**: 将 CMD actual 候选中的已解码结构扫描、路径拼接、actual 归一化和去重抽成独立 helper，入口回归 raw CMD 解码与扫描编排
- **CMD 预算规则分层**: 将 CMD 预算治理拆成 candidate/raw 与 diff/value 子表，并补充根候选、特殊 key、数组路径和非字符串 schema/source 的回归覆盖

## v1.8.279 (2026-07-02) - 报告视图复制 Workflow 分层
### 🚀 优化与改进
- **ReportView 复制 Workflow**: 将深度解析报告中的筛选结果、诊断摘要、质量快照、归档包、排查 recipe 和协作报告复制动作抽成独立 workflow helper
- **复制组合层收敛**: 原报告级复制入口回归完整报告、reportView 复制、质量基线和路径/CMD 列表复制组合，并同步收紧可维护性预算

## v1.8.278 (2026-07-02) - Scheme 参数 Pair 扫描分层
### 🚀 优化与改进
- **Scheme 参数 Pair Helper**: 将 Scheme 参数解码阶段中的 query pair 扫描、key/value 解码和 24 条上限控制抽成独立 helper，来源入口回归 query/hash/log-field 编排
- **Hash 剩余额度覆盖**: 新增回归用例锁定 query 已占 23 条时 hash 只补剩余 1 条的行为，并同步收紧 Scheme 参数阶段预算

## v1.8.277 (2026-07-02) - 质量基线复制分层
### 🚀 优化与改进
- **质量基线 Workflow 分层**: 将深度解析报告复制中的设为基线、复制质量对比和清除基线动作抽成独立 workflow helper，报告复制入口回归报告级动作编排
- **复制 Workflow 预算收紧**: 为质量基线 helper 补充可维护性预算，并把报告复制入口预算降到报告动作组合级别

## v1.8.276 (2026-07-02) - 状态栏状态分层
### 🚀 优化与改进
- **状态栏 Helper 分层**: 将状态栏模式文案、保存状态、SOURCE 校验状态和类型契约拆成独立纯 helper，入口回归兼容导出和字节大小文案
- **状态栏预算收紧**: 为拆出的状态栏 helper 补充可维护性预算，并把原入口预算降到轻量 facade 级别

## v1.8.275 (2026-07-02) - 占位符工具栏契约分层
### 🚀 优化与改进
- **占位符工具栏类型契约**: 将深度解析占位符工具栏状态的输入和输出类型拆到独立契约文件，状态入口回归纯派生和兼容导出
- **工具栏预算收紧**: 为新的类型契约补充可维护性预算，并把原状态入口预算降到组合函数级别

## v1.8.274 (2026-07-02) - 解析覆盖率结果分层
### 🚀 优化与改进
- **覆盖率入口分层**: 将深度解析覆盖率的分数计算、结果文案和类型契约拆出，入口只保留 warning、未展开、占位符、成功四类优先级路由
- **覆盖率预算收紧**: 为覆盖率 score、details 和 types helper 补充可维护性预算，并把原入口预算降到路由函数级别

## v1.8.273 (2026-07-02) - 解析报告筛选按钮配置分层
### 🚀 优化与改进
- **筛选按钮配置分层**: 将深度解析顶部筛选按钮的静态元数据和计数来源拆成独立 config，入口只负责生成按钮项和过滤零计数
- **筛选按钮覆盖**: 新增直接单测锁定按钮顺序、计数映射和零计数过滤，并把筛选按钮入口预算收紧到组合函数级别

## v1.8.272 (2026-07-02) - SOURCE 编辑器 Props 分层
### 🚀 优化与改进
- **SOURCE Props Helper**: 将 SOURCE CodeEditor 的文件、路径、校验和 warning 映射抽成纯 helper，组件只保留错误修复 slot 和头部动作装配
- **SOURCE 映射覆盖**: 新增单测锁定活动文件、校验失败、空活动文件和校验通过的编辑器 props 映射，并同步收紧 SOURCE 编辑器预算

## v1.8.271 (2026-07-02) - 工具栏按钮状态分层
### 🚀 优化与改进
- **按钮状态 Helper 分层**: 将工具栏按钮 class 拼装和折叠态 a11y 文案拆成独立纯 helper，原状态入口只保留兼容 re-export
- **工具栏预算收紧**: 为按钮 class 与折叠态 a11y helper 补充预算，并把原状态入口预算降为兼容出口级别

## v1.8.270 (2026-07-02) - 智能建议 Scheme 计划分层
### 🚀 优化与改进
- **Scheme 计划 Helper**: 将智能输入建议里的 Scheme 面板计划抽成独立 helper，主 builder 只保留动作分发和静态计划回退
- **Scheme 计划覆盖**: 新增单测锁定空 SOURCE 跳过和成功打开 Scheme 面板两条路径，并拆出智能建议预算子表

## v1.8.269 (2026-07-01) - 懒加载面板类型分层
### 🚀 优化与改进
- **懒加载面板类型契约**: 将 `AppLazyToolPanels` 的面板 props 类型抽到独立契约文件，组件只保留懒加载插槽装配
- **组件预算收紧**: 为懒加载面板类型契约补充可维护性预算，并收紧原组件预算，避免类型声明继续推高渲染文件

## v1.8.268 (2026-07-01) - Chunk 恢复派发分层
### 🚀 优化与改进
- **Chunk 恢复派发分层**: 将手动 chunk 恢复事件创建抽成独立 helper，派发入口只保留错误识别和事件分发语义
- **恢复事件契约覆盖**: 新增单测锁定手动恢复事件的事件名、可取消状态和 payload 载荷，避免旧 chunk 恢复链路后续回归
- **派发边界覆盖**: 补充无派发目标和 `dispatchEvent()` 取消事件的单测，保护手动懒加载 catch 的接管返回值

## v1.8.267 (2026-07-01) - 命令预算规则分层
### 🚀 优化与改进
- **命令预算分层**: 将 App command 维护预算拆为 core、模板填充和工具面板子表，主入口只负责组合，避免一个规则文件继续贴近上限
- **治理预算覆盖**: 新增 command 治理预算子表，把拆分后的规则文件纳入门禁，后续新增命令 helper 时能先按领域落位

## v1.8.266 (2026-07-01) - 自动保存开关计划分层
### 🚀 优化与改进
- **自动保存计划 Helper**: 将 `App.tsx` 中自动保存开关的可用性校验、下一状态和 toast 文案抽成纯 helper，组件只负责执行副作用
- **自动保存覆盖**: 新增单测锁定无活动文件、无文件句柄、开启和关闭四条路径，保护自动保存入口提示和状态翻转语义

## v1.8.265 (2026-07-01) - Schema 编辑器反馈分层
### 🚀 优化与改进
- **Schema Feedback Helper**: 将 `App.tsx` 中 JSON Schema invalid warning 和编辑器诊断高亮映射抽成纯 helper，主入口继续回归状态接线
- **Schema Feedback 覆盖**: 新增单测锁定 invalid、valid/null 和 SOURCE 不可定位三种路径，保护 warning 与 Monaco 诊断高亮的 App 层契约

## v1.8.264 (2026-07-01) - 转换上下文持久化分层
### 🚀 优化与改进
- **Context 持久化 Hook**: 将 `App.tsx` 中 deep format context 写回当前 Tab 或 fallback ref 的副作用抽成独立 hook，主入口继续回归状态接线
- **Context 写入覆盖**: 新增 hook 单测锁定无结果、有活动 Tab 和无 Tab 三种路径，保护转换报告上下文不串台也不丢失

## v1.8.263 (2026-07-01) - App 转换输出派生分层
### 🚀 优化与改进
- **转换输出派生**: 将 `App.tsx` 中同步深度解析、异步结果优先级、诊断文案和 PREVIEW 暂存输出解析抽成可测 helper，主入口继续回归状态接线
- **输出优先级覆盖**: 新增输出派生单测，锁定 pending 输出、同步/异步 deep format、异步占位和普通转换 fallback 的顺序，保护 PREVIEW 反写防回流语义

## v1.8.262 (2026-07-01) - SOURCE 替换命令契约分层
### 🚀 优化与改进
- **SOURCE 替换类型契约**: 将 SOURCE 替换命令的打点和 pending 操作类型抽成 type-only 契约文件，多个 hook 不再从带 toast/performance 副作用的 helper 中取类型
- **SOURCE 工作流预算**: 将新的命令契约文件纳入可维护性预算，防止后续替换计划、确认和打点类型继续堆回同一 runner

## v1.8.261 (2026-07-01) - 异步 Promise 分支分层
### 🚀 优化与改进
- **异步 Promise Task**: 将异步转换 hook 中的动态转换 Promise 分支抽成可测 helper，hook 回归请求启动、Worker 分流和状态消费
- **旧 Chunk 恢复覆盖**: 新增 Promise task 单测覆盖成功结果、旧 chunk 统一刷新恢复、业务错误 fallback 和过期请求忽略，保护发布切换期间的恢复链路

## v1.8.260 (2026-07-01) - 异步 Worker 消息分层
### 🚀 优化与改进
- **Worker 消息契约**: 将异步转换 Worker 的请求/响应类型和请求构造抽成共享 helper，hook 与 worker 共用同一份消息边界
- **Worker 请求回归覆盖**: 新增 Worker 请求构造单测，锁定 requestId、snapshot 输入和 `autoExpandScheme` 透传，降低后续调整大文件转换链路的回归风险

## v1.8.259 (2026-07-01) - 异步转换身份分层
### 🚀 优化与改进
- **异步转换 Snapshot**: 将异步转换的 `input`、`mode` 和 `autoExpandScheme` 身份对象抽成独立 helper，成功结果、fallback 和 freshness 校验统一围绕同一个 snapshot 传递
- **异步转换回归覆盖**: 更新状态 helper 单测覆盖 snapshot 构造、fallback 和新鲜度匹配，减少 hook 内三元参数散落导致的后续回归风险

## v1.8.258 (2026-07-01) - 设置备份命令分层
### 🚀 优化与改进
- **设置备份命令拆分**: 将配置备份 runner 拆为兼容出口、导出命令、导入命令和类型契约，降低导出/导入副作用继续扩展时的耦合
- **可维护性预算收紧**: 为设置备份导出、导入和类型 helper 补充独立预算，避免后续把两条命令链路重新堆回单文件

## v1.8.257 (2026-07-01) - AI 修复命令分层
### 🚀 优化与改进
- **AI 修复 Runner 分层**: 将智能修复 hook 中的动态加载、成功应用、错误恢复和埋点顺序下沉到可测 runner，hook 回归状态与回调装配
- **AI 修复回归覆盖**: 新增 runner 单测覆盖空输入跳过、成功应用、API Key 设置入口和旧 chunk 失效恢复，降低后续调整 AI 修复流程的回归风险

## v1.8.256 (2026-07-01) - 发布节奏门禁
### 🏗️ 架构与基础设施
- **版本区块限流**: 发布前版本检查新增顶部 CHANGELOG 条目数量上限，避免一个版本继续堆积几十条维护提交
- **发布规范收敛**: 更新 AI 工程 Playbook、Codex skill 和代码规范，明确上线/用户可见改动需要先开新 patch 版本区块，再记录本次发布内容

## v1.8.255 (2026-07-01) - 发布版本可见性修正
### 🏗️ 架构与基础设施
- **前端版本递增**: 将前端包版本递增到 `v1.8.255`，让状态栏、更新检测和 `version.json` 能准确反映本轮已上线的维护性改动
- **版本一致性门禁**: 新增发布前版本一致性检查，校验 `frontend/package.json`、`package-lock.json` 和 CHANGELOG 顶部版本一致，降低上线后版本展示停留在旧号的风险

## v1.8.254 (2026-06-20) - JSON Lines 多样本 Schema
### 🚀 优化与改进
- **异步转换结果构造分层**: 将 `useAppAsyncTransform` 中 Promise/Worker 成功和 fallback 的结果对象构造抽到 `appAsyncTransformState` 纯 helper，hook 回归异步编排与取消保护，并用直测锁定 context 与 fallback 输出结构
- **模板填充 Runner 测试分层**: 将 `appTemplateFillCommandRunner.test` 中的模块 mock、默认 effects 和执行包装抽到专用 fixture，测试文件回归为普通模板、占位符质量 delta、SOURCE 竞态和错误文案断言，并收紧测试预算
- **旧 chunk 恢复事件分层**: 将 Vite preload、Promise rejection、全局 error 和手动 catch 的恢复判定抽到 `chunkLoadRecoveryEventHandlers`，监听安装入口只保留注册/卸载和一次性刷新提示，降低发布恢复链路继续扩展时的耦合
- **手动懒加载恢复门禁**: 新增 `check-chunk-load-recovery-catches` AST 检查并接入本地 CI、AI Playbook、Codex skill 和 Claude guide，后续新增手动 `import()` catch 若缺少 `dispatchChunkLoadRecoveryEvent` 会直接报出文件和行号
- **手动懒加载失败统一恢复**: AI 修复、设置测试、配置备份、模板回填、异步类型生成和新手引导等手动 `import()` catch 路径命中旧 chunk 失效时，会复用“页面资源已更新”的刷新恢复提示，不再误展示业务错误或原始构建产物 URL
- **旧 chunk 错误识别加固**: 动态 import 失败识别会递归读取错误对象中的 `cause`、`reason`、`error`、`detail`、`payload` 和 `errors[]` 包装，并在全局资源错误只有 `/assets/*.js|css` URL 时提示刷新，减少浏览器或事件层二次封装后暴露原始 chunk 报错的概率
- **深度解析报告复制 Action 分层**: 将报告级复制里的 reportView guard、成功文案包装、路径/CMD 特殊文案和 CMD 对比上下文抽到 `transformReportPanelReportCopyActions`，主 workflow 回归动作编排并补充诊断/质量/recipe 成功路径测试
- **深度解析排查 Recipe 分层**: 将排查 recipe 的步骤编排与类型契约拆到独立模块，入口只负责安全摘要、质量指标和 suggested commands 组装，并用预算规则锁定后续扩展边界
- **原始 CMD Query 解析分层**: 将 `cmdStructureRawSourceDecoder` 中的 query 参数遍历和重复 key 聚合抽到 `cmdStructureRawQueryParams`，保留递归 value 解码回调，降低 raw CMD 快速结构化解码继续扩展时的耦合
- **CMD 值展示规则分层**: 将 CMD 结构 diff 里的稳定值序列化和预览截断抽到 `cmdStructureValueFormatter`，diff 报告入口只保留报告顺序和差异类型分发，并补充 key 排序与截断边界直测
- **文件关闭离页保护分层**: 将 `useAppFileCloseGuard` 中的 `beforeunload` 浏览器离页拦截拆到 `useAppBeforeUnloadGuard`，主 hook 只保留 pending 关闭编排，并把新 hook 与测试纳入可维护性预算
- **工具栏折叠态文案收敛**: 将工具栏工具按钮和面板入口按钮的折叠态 aria/title 文案拼装复用本地 helper，保持现有可访问输出不变，同时收紧 `actionPanelButtonState` 预算
- **展开记录 cmdHandler 动作分层**: 将深度解析展开记录头部里的 CMD 结构复制、对比包复制和 cmdHandler 对比入口下沉到 `transformReportRecordCmdActionButtons`，主动作区只保留通用复制、定位和 Scheme 打开装配
- **展开记录动作按钮壳复用**: 新增 `TransformReportRecordActionButton` 复用深度解析记录头部与路径行里的动作按钮壳，保留原有 `data-tour` 测试锚点和点击语义，同时减少复制、定位、Scheme 打开按钮样式重复
- **展开记录头部动作区分层**: 将深度解析展开记录头部里的复制、cmdHandler 对比、定位和 Scheme 打开按钮拆到 `TransformReportRecordHeaderActions`，主头部组件只保留来源 badge、路径和动作区装配，降低后续扩展记录操作时的回流风险
- **深度解析指标按钮分层**: 将深度解析顶部指标栏里重复的计数/快捷入口按钮样式抽到 `transformReportSummaryMetricButtons`，主指标栏只保留指标顺序、条件展示和动作装配，降低后续新增诊断指标时的样式复制成本
- **可维护性预算候选资产化**: 预算检查新增高使用率候选输出，并支持 `--top` 与 `--threshold` 控制候选池，方便 AI 后续从脚本结果直接选择重构切面，减少人工筛选预算清单的成本
- **状态栏左侧信息分层**: 将文件、保存和 SOURCE 校验 badge 组合抽到 `StatusBarStatusBadges`，并把左侧信息 props 拆成 type-only 契约，左侧容器继续只负责布局和指标/状态装配，降低后续扩展状态栏时的耦合
- **旧 chunk 全局错误恢复**: 动态 import 失败恢复新增 `window error` 事件覆盖，并将事件 target/载荷契约拆到 type-only 模块，减少部分浏览器只抛全局模块加载错误时暴露原始异常的概率
- **版本检测契约分层**: 将单次更新检测输入契约和调度 target 契约拆到独立 type-only 模块，runner 与 schedule 继续只保留请求/解析/通知和定时器监听装配，降低发布恢复链路继续扩展时的贴线风险
- **状态栏文件状态分层**: 将当前文件查找和保存状态构造抽到 `statusBarFileState` 纯 helper，`statusBarViewModel` 回归为状态栏聚合入口并收紧预算，降低后续扩展保存/草稿提示时误碰 SOURCE 校验和本地处理状态的风险
- **Scheme 诊断详情再分层**: 将诊断顶部摘要条、质量摘要卡片和性能护栏提示拆成独立纯展示组件，主诊断容器从 250 行降到 146 行，并把 diagnostics 预算拆成独立子表，继续保持“默认收起、解码结果优先”的低干扰展示结构
- **旧 chunk 错误边界降噪**: 动态 import 旧资源失败落到 ErrorBoundary 时不再展示 `Failed to fetch dynamically imported module` 和 hash 资源 URL，只保留“页面资源已更新”和刷新恢复入口，减少发布切换期间的技术噪音
- **Scheme 诊断容器分层**: 将 Scheme 解析详情的折叠摘要、质量摘要、Scheme 信息、性能护栏和诊断子面板装配抽到 `SchemeViewerDiagnosticsPanel`，主弹窗继续保留解码、复制、编辑和二维码副作用，降低后续压缩详情区视觉密度时误碰状态链路的风险
- **Scheme 底部操作栏分层**: 将取消解析、二维码、复制、序列化和应用修改按钮抽到 `SchemeViewerFooterActions`，主弹窗继续保留状态与 handler wiring，并把 `SchemeViewerModal.tsx` 预算从 1320 收紧到 1220，降低后续调整底部操作密度时误碰解码链路的风险
- **旧 chunk 预加载恢复降噪**: Vite `preloadError` 命中动态 import 失效时会阻止默认错误继续冒泡，只展示刷新恢复提示，减少打开中的旧页面在发布切换后看到原始 chunk 加载红错的概率
- **Scheme CMD 摘要 Badge 分层**: 将 CMD Schema、参数 keys 和内部线索展示拆到独立 badge 子组件，`SchemeViewerCommandSummaryPanel` 回归为组合外框并退出可维护性 near-list，降低后续扩展 CMD 摘要展示时的回流风险
- **Scheme 参数与链路诊断面板分层**: 将参数来源、参数分层解析证据和解码链路展示拆到 `SchemeViewerParamSectionsPanel`、`SchemeViewerParamStagesPanel` 与 `SchemeViewerDecodeLayersPanel`，主弹窗继续瘦身并保留原有参数预览、修复提示、可回写状态和层级证据语义
- **Scheme Viewer 组件预算再分层**: 将 Scheme viewer 组件预算拆为 shell/detail 子表，新增参数诊断面板时规则入口只负责聚合，避免治理表本身随着展示面板扩展再次贴线
- **Scheme 弹窗预算规则分层**: 将 Scheme viewer 预算清单拆为组件与支撑子表，入口只负责聚合，避免继续拆弹窗展示面板时让治理规则本身贴线
- **Scheme CMD 摘要面板分层**: 将 CMD Schema、Top Schema、参数 keys、cmd/ext/Base64 内部线索展示抽到 `SchemeViewerCommandSummaryPanel`，主弹窗只保留摘要数据装配，降低后续 CMD 展示规则扩展时误碰编辑和二维码链路的风险
- **Scheme 运行时占位符面板分层**: 将运行时占位符分组和路径明细展示抽到 `SchemeViewerRuntimePlaceholdersPanel`，主弹窗继续瘦身并把占位符 UI 纳入独立预算，降低后续占位符说明扩展时误碰解码、复制和编辑链路的风险
- **Scheme 弹窗 Base64 面板分层**: 将内部 Base64 元信息展示抽到 `SchemeViewerBase64MetaPanel`，并把弹窗 metadata 构造与质量样式映射拆成纯 helper，worker 与弹窗复用同一摘要规则，`SchemeViewerModal.tsx` 纳入可维护性预算防止回涨
- **主应用工具面板 Controller 分层**: 将 JSONPath、结构导航、Schema、Scheme、模板和深度解析面板的懒加载 props 装配下沉到 `AppToolPanelsController`，`App.tsx` 继续回归顶层状态编排并退出预算临界区
- **主应用 SOURCE 输入分层**: 将 SOURCE 输入清洗、智能建议清空、AI 修复摘要快照和活动文件同步收敛到 `useAppSourceInputCommands`，主应用入口继续瘦身并降低输入状态机回流风险
- **深度解析 Section Model 分层**: 将报告内容区可见性、占位符工具栏、优先处理项和下一步行动的纯派生下沉到 `transformReportPanelSectionModel`，主面板继续保留真实状态与 handler wiring，降低后续扩展报告 section 时的耦合
- **深度解析面板 Frame 分层**: 将主报告面板的 DraggablePanel 默认布局和 footer 装配下沉到 `TransformReportPanelFrame`，主面板继续聚焦状态、复制 workflow 和内容 wiring，并退出可维护性预算 near-list
- **占位符 Section 类型契约复用**: 占位符 rows list 导出可复用行级 props 契约，Section 类型入口不再重复声明 `Omit<placeholder>` 结构，降低深度解析占位符区域继续扩展时的类型同步成本
- **深度解析预算规则表收敛**: 深度解析 artifact 治理、诊断和洞察预算规则复用本地表项工厂，预算内容保持不变但三张临界规则表退出 near-list，降低后续扩展报告治理规则时的维护噪音
- **公网资源预算表收敛**: JS 路径与扫描器预算规则复用表项工厂，预算内容保持不变但两个临界规则表退出 near-list，降低后续扩展静态资源巡检规则时的治理噪音
- **静态保留预算表收敛**: 静态资源保留预算规则复用表项工厂，预算内容保持不变但移除重复对象样板，给后续扩展部署保留门禁留出治理余量
- **工具栏 Badge 契约复用**: `ActionPanelButtonBadge` 复用入口按钮状态里的 badge 类型契约，移除重复 props 定义并退出预算临界列表，降低后续扩展工具栏状态徽标时的同步成本
- **深度解析复制 workflow 测试分层**: 将 `transformReportPanelCopyWorkflow.test` 中的 mock、默认 state/effects 和 guarded action 列表抽到专用 fixture，测试文件回归为复制行为断言，并收紧测试预算，降低后续扩展复制动作时的维护噪音
- **App 状态预算规则分层**: 将主应用状态预算下沉为 async/ui/core 三层子表，异步策略、异步转换状态、编辑区派生状态和懒加载 panel 状态各自归组，原 state 入口回归为聚合层，降低继续新增状态 helper 时预算规则贴线风险
- **旧 chunk 错误边界草稿保护**: 全局 ErrorBoundary 的动态 import 失效刷新按钮复用主应用草稿保存回调，避免旧页面 chunk 加载失败落到错误边界时直接刷新丢失当前工作区内容
- **工具面板命令计划与测试分层**: 将 `useAppToolPanelCommands` 中的请求 ID、面板事件名、SOURCE Scheme 判断、Changelog 状态和模板请求构造抽到 `appToolPanelCommandPlans` 纯 helper，并把测试里的 React hook mock、窗口事件 stub 和 state setter 捕获下沉到专用 fixture，主测试文件回归为 JSONPath、Scheme、模板和 Changelog 场景断言，降低后续拆分工具面板命令时被 `useState` 顺序误伤的风险
- **模板填充命令 Runner 分层**: 将 `useAppTemplateFillCommand` 中的模板应用顺序、占位符质量 delta、SOURCE 竞态保护和 toast 语义抽到 `appTemplateFillCommandRunner`，hook 回归为动态 summary loader、ref 和回调 effects 装配层，并补充 runner 直测，降低模板填充命令继续扩展时的回归风险
- **深度解析内容区 Shell 再分层**: 将 `TransformReportPanelContent` 收敛为滚动容器、无报告提示和 sections 分流，把有报告状态下的 section 装配下沉到 `TransformReportPanelSections`，并将 props 契约拆成 type-only 文件，补充 shell 委派和 section 透传测试，降低深度解析内容区继续扩展时的耦合
- **主工作台交互遮罩分层**: 将 resize 捕获层和文件拖拽浮层下沉到 `AppInteractionOverlays`，`AppWorkspaceOverlays` 回归为交互遮罩组与 Toast 宿主装配层，并补充分层后的组件测试，降低主应用遮罩入口继续扩展时的耦合
- **工具栏入口按钮包装瘦身**: 将转换工具按钮和面板入口按钮改为纯表达式包装器，继续复用统一入口状态 helper 与 `ActionPanelEntryButton`，两个组件各从 28 行降到 24 行，减少新增工具入口时的样板维护成本
- **深度解析 Support 治理预算分层**: 将 `maintainability-budget-governance-transform-panel-helper-support-rules` 拆成 UI、复制和 CMD 三张子表，原入口只聚合子表并追踪子治理表预算，避免 helper support 治理继续贴线
- **深度解析行动项与 Footer 预算分层**: 将 `maintainability-budget-transform-panel-helper-action-item-rules` 拆成 builder 与 contract 子表，`footer-workflow-rules` 拆成 action 与 handler 子表，原入口只聚合子表，并补充对应治理预算，避免深度解析 helper 继续扩展时预算规则表贴线
- **工具栏 AI 修复按钮契约收敛**: 将 `ActionPanelAiFixButtonProps` 并入 `ActionPanelButtonTypes`，让 AI 修复、转换工具和面板入口按钮复用同一 props 契约出口，AI 修复按钮组件从 32 行降到 27 行
- **文件关闭保护再分层**: 将 `useAppFileCloseGuard` 内未保存状态、pending 文件查找和关闭决策抽到 `appFileCloseGuardState` 纯 helper，补充关闭决策矩阵直测，并把文件关闭保护 hook 预算从 80 行收紧到 72 行
- **模板填充命令再分层**: 将 `useAppTemplateFillCommand` 内目标错误文案抽到 `appTemplateFillTargetError`，占位符回填前后质量 delta 构建抽到 `appTemplateFillQualityDelta`，补充目标错误矩阵和质量 delta 直测，并把模板填充命令 hook 预算从 125 行收紧到 90 行
- **主应用文件关闭保护分层**: 将 `App.tsx` 内未保存状态计算、离开页面确认、脏文件关闭 pending/确认/取消逻辑下沉到 `useAppFileCloseGuard`，补充 beforeunload、脏文件拦截和确认关闭直测，并把主应用预算从 1130 行收紧到 1090 行
- **主应用模板填充分层**: 将 `App.tsx` 内模板目标错误、模板应用、占位符回填质量 delta 和 SOURCE 变化竞态保护下沉到 `useAppTemplateFillCommand`，补充普通模板、占位符模板和 stale SOURCE 直测，并把主应用预算从 1190 行收紧到 1130 行
- **主应用 SOURCE 校验分层**: 将 `App.tsx` 内 SOURCE 输入防抖校验、旧请求取消和 request id 防串写逻辑下沉到 `useAppSourceValidation`，补充 hook 直测并把主应用预算从 1220 行收紧到 1190 行
- **工具栏入口状态工厂**: 将 ActionPanel 转换工具按钮和面板入口按钮重复的 `entryProps/iconState` 拼装收敛到纯 factory，保留现有 Tool/Panel 组件 DOM 契约与状态测试，降低后续新增入口按钮时复制状态结构的风险
- **主应用懒加载状态分层**: 将 `App.tsx` 内根据设置、更新日志、JSONPath、结构树、对比、Schema、Scheme、模板和深度解析面板 open 状态维护 loaded 标记的编排下沉到 `useAppLazyPanelLoadState`，补充粘性加载直测，并把主应用预算从 1250 行收紧到 1220 行
- **主应用 PREVIEW 同步分层**: 将 `App.tsx` 内右侧 PREVIEW 编辑反向同步的校验、防抖回写、深度格式化 context 还原和解锁时序下沉到 `useAppPreviewOutputSync` 与纯 helper，并补充 context 回写/fallback 直测，主应用预算从 1700 行收紧到 1250 行
- **深度解析复制 workflow 分层**: 将 `TransformReportPanel` 中报告复制、归档/协作导出、质量基线、占位符模板、问题样本和行级 CMD 复制动作拆到独立 workflow 子模块，并补充 pending guard、CMD 对比注入、模板打开、质量基线和空 CMD 包直测，主面板预算从 700 行收紧到 430 行，降低复制导出逻辑继续回流主面板的风险
- **AI 子 Agent 委派治理**: 在 `AGENTS.md`、`CLAUDE.md`、AI Playbook、Codex skill 和工具适配文档中补充子 Agent 委派判断、主线程整合和复杂任务拆分边界，并让 `check-ai-governance` 强制校验关键引用，避免复杂重构只靠临场记忆执行
- **深度解析 CMD 对比状态分层**: 将 `TransformReportPanel` 内的 CMD 对比打开/收起、首条打开、候选切换、expectedText 和忽略额外路径状态转移拆到 `transformReportCmdComparisonController`，并补充 ignoreExtraPaths 保留/重置边界直测，降低报告面板状态机和 UI 编排继续交织的风险
- **深度解析报告内容区分层**: 将 `TransformReportPanel` 内的总览、筛选、记录、未展开线索、占位符、告警和空态装配拆到 `TransformReportPanelContent`，主面板预算从 830 行收紧到 700 行，并把壳组件预算拆到独立子表、补充 section 可见性与回调透传直测，降低报告面板继续扩展时的 UI 编排耦合
- **主工具栏入口分层**: 将 `ActionPanel` 的顶部栏、分组标题、转换工具组、面板入口组和自定义滚动条拆成独立组件，并补充折叠语义、分组透传和滚动条样式直测，主工具栏预算从 270 行收紧到 200 行，降低后续新增工具入口时挤占主功能结构的风险
- **深度解析报告问题与占位符文本分层**: 将报告文本里的跳过记录/未展开线索拆到 `transformReportIssueTextSections`，运行时占位符汇总/明细拆到 `transformReportPlaceholderTextSections`，`transformReportTextSections` 回归为兼容导出入口，并新增来源标签、预览和空态直测，降低报告复制文案继续扩展时的职责混杂风险
- **状态栏 SOURCE 动作契约分层**: 将 SOURCE 校验状态栏的定位错误和打开 Scheme 动作类型拆到 `statusBarSourceValidationActionTypes`，展示组件改为依赖独立契约，动作 helper 继续只保留错误定位优先于 Scheme 面板入口的纯规则，降低后续新增状态栏动作时的耦合
- **深度解析报告记录文本分层**: 将报告文本里的记录明细行输出拆到 `transformReportRecordTextLines`，原 `transformReportTextSections` 保留兼容导出和跳过/未展开/占位符段落，并新增 cmdParams、参数分层、Schema 行、内部字段和截断提示直测，降低报告文案继续扩展时的维护压力
- **深度解析资源类型 Top 分层**: 将资源类型 Top 的草稿累计、schema 展示截断和结果排序映射拆成独立纯 helper，原 `buildTopResourceTypeGroups` 保留兼容入口，并新增重复资源、record 去重、schemaLimit 和同数排序直测，降低静态资源分布继续扩展时的误改风险
- **CMD 结构值 Diff 分层**: 将 CMD 参数值 diff 的路径行展开、结构化 source 等价判断和类型契约拆成独立 helper，保留 `compareCmdStructureValues` 兼容入口，并新增 bracket key、数组路径和 source 等价直测，降低后续 CMD 对比/回写排查误改风险
- **深度解析 Section 可见性 Helper 分层**: 将四类 section 可见 flag 与空态编排拆成独立纯 helper 和类型契约，保留原入口兼容调用，并补齐任一区域可见与全空态直测，降低报告面板继续扩展筛选区域时的误改风险
- **状态栏保存状态分层**: 将左侧状态栏中的保存状态 badge 拆成独立组件并纳入可维护性预算，`StatusBarLeftInfo` 回归为内容统计、文件、保存和 SOURCE 校验状态装配层，降低后续扩展状态栏时互相挤占预算的风险
- **深度解析诊断摘要分层**: 将诊断摘要 Top、样例和建议 section 拆成独立 helper，原 section 入口保留兼容导出，并新增样例 section 脱敏直测，降低复制给协作者/AI 的排查摘要继续扩展时误带原始值的风险
- **公网 JS 资源路径解析分层**: 将 JS chunk 中 assets 字符串、相对 import 和 `import.meta.url` 候选的归一化与文档示例过滤抽到 `productionFrontendAssetJavascriptPathResolvers`，并新增 focused node:test 锁定顺序、嵌套 chunk 和示例降噪边界，降低发布巡检继续扩展时漏扫旧 chunk 的风险
- **保存计划副作用分层**: 将保存计划到文件副作用的分发抽到 `appSavePlanEffectRunner`，`appSavePlanExecutor` 聚焦 skip、执行结果和成功提示，并补齐 executor 直测覆盖 PREVIEW/SOURCE 写入边界
- **工具栏入口状态分层**: 将转换工具入口和面板入口的状态派生拆到独立纯 helper，`actionPanelEntryButtonState` 保留兼容导出，减少新增工具或面板时互相挤占预算的维护风险
- **深度解析 Schema 分组分层**: 将 schema origin 归并、资源类型分组和 schema 分组默认上限拆到独立纯 helper，`transformReportCommandSchemaGroups` 保留兼容导出并只负责 schema 维度聚合；同步把 schema 预算拆成子表，降低后续扩展 CMD/资源分布统计时的维护风险
- **深度解析资源字段提取分层**: 将资源字段 schema 提取和 resourceType 补充抽到 `transformReportDecodedPathResource` 共享 helper，`transformReportCommandSchemaOccurrences` 只保留记录扫描入口，并用单测锁定 `sourceValue` 优先级，减少 CMD/资源分组与记录洞察的重复规则
- **占位符回填模板明细分层**: 将运行时占位符回填模板里的 `placeholderDetails` 构建抽到 `transformPlaceholderFillTemplateDetails`，模板入口继续专注 schema/tool/filter/summary/placeholders 外层契约，并用单测锁定 suggestion 与来源字段的可选输出结构，降低后续扩展回填候选字段时的回归风险
- **主应用工具面板命令分层**: 将 `App.tsx` 内 JSONPath/结构树/Schema/Scheme/模板/changelog 面板开关、外部请求 ID 和报告入口动作下沉到 `useAppToolPanelCommands`，智能建议改为消费受控 Scheme 请求回调，补充面板命令直测，并把主应用预算从 1090 行收紧到 980 行
- **SOURCE 命令聚合装配分层**: 将 `useAppSourceReplacementCommands` 的公开字段拼装抽到 `appSourceReplacementCommandBundle` 纯 helper，并用单测锁定 App 消费字段名与函数引用，聚合 Hook 继续保持固定 hooks 调用顺序，降低 SOURCE 替换入口继续扩展时的维护成本
- **SOURCE 粘贴与 Scheme 排查 pending 收敛**: 粘贴 SOURCE 和 Scheme 原始值排查复用 `usePendingSourceReplacementCommand` 的 request/confirm/cancel 编排，继续保留剪贴板错误计时、Scheme confirm-as-skipped 特例和各自确认文案，减少 SOURCE 替换命令后续维护重复配置
- **SOURCE 替换 pending 编排复用**: 抽出 `usePendingSourceReplacementCommand` 统一管理 pending 文本、确认替换和取消打点，`useAppApplySourceReplacementCommands` 只保留 PREVIEW/Schema 两个 request 入口，降低后续新增 SOURCE 替换场景时复制 event/category/successMessage 的风险
- **版本检测调度分层**: 将打开状态下的新版本检测定时器、窗口聚焦和可见态恢复监听抽到 `appUpdateCheckSchedule`，`useAppUpdateCheck` 继续专注 Toast、manifest 拉取和单次检查器装配，并用单测锁定监听清理行为
- **保存命令副作用装配收敛**: `useAppSaveCommands` 复用 memoized save effects 装配，快捷键保存和工具栏保存只传各自输入数据，减少保存链路新增 toast、埋点或另存为副作用时的重复改动点
- **公网 JS 资源候选提取分层**: 将 JS chunk 内 assets 字符串、相对 import 和 `new URL(..., import.meta.url)` 候选识别拆到 `productionFrontendAssetJavascriptCandidates`，资源路径入口继续专注归一化和文档示例降噪，降低后续扩展深层 chunk 巡检规则时的贴线风险
- **深度解析 Footer Handler 映射收敛**: 将底部操作 handler 改为 `ActionId -> dependency key` 的类型约束映射，并用表驱动测试校验每个按钮触发对应副作用，降低后续新增复制/快照动作时漏补 handler 的风险
- **CMD 结构值比对分层**: 将 CMD 参数路径展开、source 等价判断和值差异比较抽到 `cmdStructureValueDiff`，`cmdStructureDiff` 继续聚焦解析归一化、schema/source 顶层差异和候选排序，降低后续扩展 cmdHandler 对比规则时的耦合
- **Scheme 类型契约分层**: 将 `SchemeDecodeResult`、`DecodeLayer`、参数 stage 和占位符等公共类型拆到 `schemeTypes`，`schemeUtils` 保留兼容导出，减少占位符、编码、诊断和 worker 模块对核心解码入口的类型耦合
- **公网资源巡检示例降噪**: JS chunk 扫描会忽略 CHANGELOG/文档里的 `/assets/chunk.js`、`/assets/chunks/*.js` 等占位示例，避免发布后巡检被非真实资源误报拦截
- **前端旧 chunk 迁移保护**: 远端 Docker Compose 部署会在替换前从当前前端容器备份旧 `/assets`，新容器启动后回填到静态目录，并把 helper 纳入部署语法检查、静态保留自检和预算，避免首次切换静态保留卷或发布替换时让打开中的旧页面懒加载 chunk 404
- **深度解析类型出口分层**: 将样本导出、占位符回填模板、质量快照和协作归档包类型拆到 `transformSummaryArtifactTypes`，并将 schema/资源/嵌套字段分组类型拆到 `transformSummaryGroupTypes`，`transformSummaryTypes` 保留核心报告/视图契约并兼容 re-export；同步拆出 artifact 类型预算子表，降低深度解析类型仓库继续贴线和 type-only 环的风险
- **工具栏入口按钮状态装配收敛**: `ActionPanelEntryButton` 改为接收完整入口状态并统一装配图标 slot、active、a11y 和 badge，转换工具/面板入口按钮只保留点击语义透传，减少后续新增工具入口的重复样板
- **公网资源支撑预算分层**: 将 production assets 支撑预算继续拆成 IO 与 discovery queue 子表，support 聚合入口从 24/25 行降到轻量聚合，避免新增旧资源、请求或 MIME 规则时再次贴线
- **公网资源发现队列职责收敛**: 将旧资源和深层 chunk 的发现入队逻辑从 `productionFrontendAssetPaths` 迁到 `productionFrontendAssetDiscoveryQueue`，路径入口只保留 HTML/env/兼容导出，递归 scanner 专注消费 JS/CSS 待扫描队列
- **公网 JS 资源发现分层**: 将公网资源巡检里的 JS chunk 引用发现拆到 `productionFrontendAssetJavascriptPaths`，并新增 production assets path 预算子表，让 HTML 入口解析、JS 引用提取和路径归一化各自独立演进
- **深度解析 Section 预算分层**: 将 `maintainability-budget-transform-panel-section-rules` 拆成 summary 与 issue section 子表，并新增 section domain 治理预算，降低顶部总览和问题线索区域后续扩展时预算入口贴线风险
- **Scheme 结构化 Query 预算分层**: 将 `maintainability-budget-scheme-support-structured-query-rules` 拆成 parse、assign、serialize 三个子表，并新增结构化 Query 治理预算，避免后续 CMD/Scheme 回写能力扩展时预算入口再次贴线
- **部署预算规则再分层**: 将 `maintainability-budget-infra-deploy-rules` 拆成部署检查器与运行脚本两个子表，并把基础设施治理入口继续分为部署/资源子表，降低发布门禁和部署脚本继续扩展时规则表贴线风险
- **可维护性预算临界摘要**: `check-maintainability-budgets` 新增“剩余 ≤5 行或使用率 ≥90%”热点摘要，并将报告构造拆到 `maintainabilityBudgetReport` 纯 helper，帮助 AI/人工优先处理即将贴线的模块
- **公网 CSS 资源归一化分层**: 将公网资源巡检里的 CSS 相对路径归一化和同站 asset 判断拆到 `productionFrontendAssetCssNormalization`，CSS 提取文件从贴线的 43 行降到 24 行并收紧预算
- **公网资源路径归一化分层**: 将公网资源巡检里的 baseUrl 校验、asset path 归一化、相对路径归一化和 JS asset 类型判断拆到 `productionFrontendAssetPathNormalization`，让 HTML/JS 提取文件从贴线的 68 行降到 46 行并收紧预算
- **动态 chunk 刷新前草稿保护**: 旧页面懒加载 chunk 失效提示刷新时会先显式写入现有工作区草稿快照，避免用户为恢复新版资源而丢失未保存 SOURCE 或标签内容
- **部署语法检查器职责拆分**: 将 `check-deploy-shell-syntax` 的目标清单、`bash -n` 执行/失败格式化、shell 文件检查和 workflow run 检查拆到独立 helper，主检查器重新聚焦报告合并，避免发布门禁自身继续贴近预算上限
- **Workflow Run 语法门禁**: `check-deploy-shell-syntax` 会提取 GitHub Actions 的 inline/block `workflow run` 脚本并替换 `${{ ... }}` 表达式后执行 `bash -n`，让 CI/Deploy YAML 内联脚本也进入同一条发布语法门禁
- **部署 Heredoc 语法门禁**: `check-deploy-shell-syntax` 会提取 `REMOTE_SCRIPT heredoc` 远端脚本片段并单独执行 `bash -n`，补齐外层部署脚本语法检查无法覆盖远端清理脚本正文的问题
- **部署 Shell 语法门禁**: 新增 `check-deploy-shell-syntax`，用 `bash -n` 覆盖 GitHub helper、前端 entrypoint、本地 CI 和远端部署脚本，并接入 GitHub CI、本地 CI、AI Playbook 与可维护性预算，减少上线脚本语法错误流入远端部署
- **动态 chunk 恢复事件分层**: 将旧页面加载新版懒加载 chunk 失败的监听和去重抽到 `chunkLoadRecoveryEvents` 并补充事件安装测试，Vite preloadError 保留默认错误传播给 ErrorBoundary，同时补齐 CSS preload 失败识别并把发布恢复预算拆成 runtime/update 子表
- **动态 chunk 恢复 Hook 门禁**: 补充 `useAppChunkLoadRecovery` focused test，固定生产态监听安装、自定义 Toast 参数和刷新按钮行为，避免旧页面资源失效提示在装配层退化
- **CI 脚本单测门禁**: 将 `scripts/ci/*.test.mjs` 挂入本地 CI 和 GitHub 前端流水线，确保公网资源巡检与静态资源保留脚本的回归测试不再只靠人工手跑
- **后台发布恢复入口**: 新增 `useAdminReleaseRecovery`，让管理后台同时具备主动版本检测和动态 chunk 失效刷新提示，并将后台恢复入口与更新检查 hook 纳入发布恢复预算
- **GitHub Deploy 公网复查对齐**: Deploy workflow 增加静态资源保留门禁、部署前旧 asset 记录和部署后公网递归巡检，复用 `verify-public-deploy.sh` 校验新版本、后端健康、当前 chunk 与旧 hash 资源
- **GitHub Workflow 发布门禁自检**: 将 CI/Deploy 中脚本单测、静态资源保留、部署前旧 asset 捕获、部署后旧资源复查和公网验证命令纳入静态保留配置自检，避免 workflow 漂移后发布恢复链路只停留在文档里
- **部署旧资源捕获失败保护**: GitHub Deploy 捕获旧 hash assets 时会区分“巡检失败但已拿到路径”和“完全未拿到路径”，后者直接中断发布，避免旧页面 chunk 复查静默降级
- **SSH 部署旧资源捕获失败保护**: 本机 SSH 部署脚本同步收紧部署前旧 hash assets 捕获，巡检失败且没有任何路径时会中断部署，避免手动远端上线绕过旧 chunk 复查
- **更新提示 Toast 分层**: 将新版本提示 UI 拆到 `AppUpdateToastContent` 并补充按钮行为测试，`useAppUpdateCheck` 回归定时器、可见态监听和版本检查编排
- **发布恢复 Toast 样式独立化**: 新版本和旧 chunk 失效刷新提示改为复用独立 CSS，避免后台入口缺少主应用 Tailwind 类时提示样式丢失
- **公网资源巡检覆盖 import.meta worker**: 资源巡检支持 `new URL("worker.js", import.meta.url)` 这类同目录裸文件名，防止 worker chunk 缺失绕过发布后公网校验
- **公网资源 MIME 校验**: 资源巡检对 JS/CSS 增加 Content-Type 校验，避免缺失 chunk 被 fallback 成 HTML 且返回 200 时误判发布成功
- **旧 chunk 临场复查参数**: `check-production-frontend-assets` 支持 `--extra-asset <url-or-path>`，可把用户反馈的历史 hash chunk 直接纳入公网巡检并复用 404/MIME 诊断；CLI 参数解析拆到 `productionFrontendAssetCliArgs` 并纳入预算，AI 治理脚本同步防止入口文档遗漏该排查动作
- **旧 Scheme chunk 404 回归**: 将用户反馈的 `SchemeViewerModal` 旧 hash chunk 缺失场景补入公网资源巡检单测，确保 `--extra-asset` 复查能稳定报告旧页面动态 import 404
- **公网巡检参数解析瘦身**: 将 `--extra-asset=` / `--extra-assets=` inline 参数识别收敛为统一模式并补充单数 inline 回归测试，给发布巡检 CLI 参数解析继续扩展留出预算余量
- **公网资源外链过滤**: 公网资源巡检忽略 `new URL("https://cdn.example.com/assets/x.js", import.meta.url)` 这类外部绝对 URL，并补充嵌套 chunk 同目录相对路径测试，避免把第三方资源误判为本站缺失 chunk
- **部署旧资源主域名快照**: SSH 部署、独立公网验证和 GitHub Deploy 捕获旧 hash 资源时默认使用 `https://jsonutils.markz.fun`，避免 IP 访问落到后台默认站点而漏记主应用懒加载 chunk；静态资源保留门禁同步保护该默认值
- **公网验证 TLS 默认收紧**: 公网版本/健康检查和资源巡检随主域名默认值改为启用正常 TLS 校验，不再默认设置不安全证书容错；GitHub Deploy 增加显式 `public_verify_insecure_tls` 输入，仅在临时用 IP 探活且证书域名不匹配时开启
- **公网巡检 TLS 开关别名**: `check-production-frontend-assets` 兼容部署 wrapper 的 `PUBLIC_VERIFY_INSECURE_TLS` / `PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS` 和直接脚本的 `FRONTEND_ASSET_VERIFY_INSECURE_TLS`，减少手动排查旧 chunk 时环境变量误用
- **公网巡检入口页失败聚合**: 公网资源巡检在首页或后台入口读取失败时返回可读页面失败项，并继续扫描其他可访问入口，避免部署前旧资源快照因单页异常丢失全部资产线索
- **公网巡检 CSS 资源递归**: 公网资源巡检会继续解析 CSS `url(...)` 中的字体和图片资源，防止样式文件可达但字体、背景图等二级静态资源漏部署
- **公网巡检 CSS import 递归**: 公网资源巡检补充识别 CSS `@import "./theme.css"` 链路，继续扫描被引入样式及其后续字体、图片资源
- **公网巡检子目录资源递归**: 公网资源巡检将 `/assets/chunks/*.js` 和 `/assets/chunks/*.css` 等子目录资源也纳入递归扫描，避免深层样式或脚本内部资源漏检
- **公网巡检 CSS 注释降噪**: CSS 资源扫描会忽略注释中的 `url(...)` 和 `@import` 示例，避免注释里的无效资源路径导致线上巡检误报
- **AI 发布治理 CSS 自检**: Codex/Claude/Playbook/skill 均明确公网资源巡检需要覆盖 CSS `url(...)` 二级资源和 CSS `@import` 链路，并由 AI 治理脚本防止该语义从入口文档中丢失
- **静态资源保留缺失文件诊断**: 静态资源保留配置检查在 Dockerfile/Compose 配置文件缺失时返回可读失败项，不再直接抛出 Node 文件读取异常，方便 CI 和 AI 助手定位发布保留链路断点
- **AI 发布治理 MIME 自检**: Codex/Claude/Playbook/skill 均明确公网资源巡检需要校验 JS/CSS `Content-Type`，并由 AI 治理脚本防止该规则从入口文档中丢失
- **AI 治理脚本可测化**: 将 AI 协作入口规则构造和缺失收集拆到 `aiGovernanceRules` / `aiGovernanceChecks` 并补充 node:test，确保 `fallback 成 HTML` 等发布门禁语义缺失时能被单测定位
- **打开状态更新策略分层**: 将版本检查活跃态、可见态、重复提示和单次请求执行拆到纯 helper 并补充单测，避免页面卸载后异步返回仍弹出更新 Toast
- **SOURCE 替换命令契约补强**: 补齐 SOURCE 替换 helper 的错误跳过和空 pending no-op 测试，保护粘贴、应用预览、Schema 示例和 Scheme 排查共用命令链路
- **工具栏图标契约收紧**: 将工具按钮 iconId 收敛为运行时可校验列表，`ActionPanelToolIcon` 改为显式覆盖 `sort` 等全部图标并补齐组件测试，避免新增图标静默落到错误兜底
- **Scheme 结构化 Query 回归契约**: 补齐结构化数组索引重复叶子合并、嵌套对象数组回写和点号/括号风格保持测试，防止后续 CMD/Scheme 参数编辑破坏原始 query 形态
- **深度解析 Footer Action 契约测试**: 补强 footer action 可见性、禁用态和 handler 异步触发语义测试，保护筛选 pending、样本导出和完整报告等入口的既有行为
- **深度解析诊断摘要分层**: 将诊断摘要 formatter 从筛选报告文本 helper 中拆出，并继续把 Top、样例、建议 section 下沉到独立 helper；补齐 limit、资源 Top、字段 Top 与脱敏边界测试
- **深度解析 CMD 复制文本分层**: 将 CMD 结构复制文案 formatter 拆到独立 helper，并补齐空态、来源、参数摘要、内部 CMD 聚焦和占位符截断边界测试，降低复制文本入口继续贴线风险
- **工具栏文件操作配置分层**: 将打开文件和保存 JSON 的普通文件操作元数据拆到纯配置 helper 并补充顺序单测，文件操作区组件继续只负责配置渲染和 AI 修复入口装配
- **工具栏入口状态契约分层**: 将工具栏入口按钮 badge、icon state 和状态生成参数类型拆到独立契约文件，并收紧状态 helper 预算，避免按钮状态适配继续因类型声明贴线
- **App Workflow 预算分层**: 将 App workflow 预算入口里的状态派生和支撑 helper 拆成 state/support 子表，并把治理入口自检预算拆到 self 子表，避免后续命令工作流继续扩展时预算入口贴线
- **静态资源保留门禁分层**: 将旧 hash assets 保留校验拆成配置片段检查与发布场景验证两个 helper，并纳入独立预算子表，降低后续部署策略扩展时 CI 脚本贴线风险
- **部署前旧资源回归验证**: SSH 部署会在替换前记录当前公网 asset 列表，部署后将旧 hash 资源一并纳入递归巡检，防止长时间打开页面持有的懒加载 chunk 被新版本清理后 404
- **深度解析 Footer Helper 预算分层**: 将 footer helper 预算拆成 workflow 与 contract 两个子表，并把 workflow 治理继续按 action/footer 分层，避免 footer 规则表和治理入口继续贴线
- **深度解析 Action Helper 预算分层**: 将面板 action helper 预算拆成 action item 与 runner 两个子表，降低行动项配置和副作用分发继续堆到同一规则表的风险
- **深度解析 Panel Helper 治理分层**: 将面板 helper 自检预算拆成 workflow 与 support 两个治理子表，降低 action/footer/UI/copy/CMD helper 后续扩展时治理入口贴线风险
- **深度解析 Summary Support 治理分层**: 将 summary support 自检预算继续拆成 foundation 与 artifact 两个治理子表，降低新增预算规则时 support 治理入口继续贴线的风险
- **深度解析 Summary 预算子表分层**: 将 coverage、CMD 源、嵌套字段、记录洞察、schema 分组和排查 recipe 预算拆到 `maintainability-budget-transform-summary-insight-rules`，并新增 summary support 治理子表，避免 support 与 summary 治理表继续贴线
- **Scheme 弹窗懒加载入口收敛**: 编辑器内 Scheme 弹窗改为复用统一懒加载入口，并补充 ErrorBoundary 动态 import 旧 chunk 失效刷新提示测试，减少发布后旧页面资源失效的漏兜底风险
- **可维护性治理规则分层**: 将深度解析 summary 相关预算规则的自检预算拆到 `maintainability-budget-governance-transform-summary-rules`，避免 transform 治理表继续贴线
- **深度解析 Section 可见性分层**: 将展开记录、待检查、占位符、跳过记录和空态的显示条件拆到 `transformReportSectionVisibility` 并补充单测，减少主面板 JSX 内重复计数判断
- **深度解析占位符工具栏状态分层**: 将占位符工具栏的禁用态和按钮 title 派生拆到 `transformReportPlaceholderToolbarState` 并补充单测，减少主面板 JSX 内联状态矩阵
- **深度解析复制副作用收敛**: 将深度解析面板内复制、成功提示和错误提示的重复流程收敛到 `transformReportCopyActionRunner` 并补充单测，减少新增复制动作时的样板代码和漏改风险
- **深度解析类型契约分层**: 将深度解析报告记录、视图、质量快照、样本导出、占位符模板和归档包类型拆到 `transformSummaryTypes`，`transformSummary` 保持兼容 re-export 并继续聚焦构建流程
- **深度解析协作归档分层**: 将协作排查报告和安全归档包组装拆到 `transformCollaborationReport` / `transformArchivePackage` 并补充专属单测，`transformSummary` 继续收敛为报告聚合入口和类型契约
- **深度解析诊断文本分层**: 将筛选报告和诊断摘要文本 formatter 拆到 `transformReportDiagnosticText` 并补充专属单测，继续削薄 `transformSummary` 聚合职责
- **深度解析复制文本分层**: 将路径值、CMD 结构和运行时占位符复制文本 formatter 拆到 `transformReportCopyTexts` 并补充专属单测，继续压缩 `transformSummary` 聚合文件职责
- **工具栏入口 Badge 契约收敛**: 将入口按钮 badge 类型从组件与状态 helper 的重复定义收敛为单一导出契约，减少后续工具栏状态字段调整时的双点维护
- **公网资源相对 chunk 覆盖**: 公网资源巡检的 JS 解析支持 `import("./chunk.js")` / `new URL("./worker.js", import.meta.url)` 这类相对 asset 引用，避免仅依赖 Vite mapDeps 中的 `assets/...` 字符串兜底
- **公网资源请求层分离**: 将公网资源巡检里的超时包装、文本拉取和 HEAD 可达性检查拆到 `productionFrontendAssetRequests` 并纳入预算，`productionFrontendAssetAudit` 继续收敛为递归扫描编排
- **公网资源路径解析分层**: 将公网资源巡检里的 HTML/JS asset 提取、路径归一化和 JS 资源判断拆到 `productionFrontendAssetPaths` 并补充纯函数测试，让 audit 核心继续聚焦递归扫描和可达性校验
- **公网资源巡检职责分层**: 将公网静态资源递归发现与可达性校验拆到 `productionFrontendAssetAudit`，`check-production-frontend-assets` 收敛为 CLI 壳，并把生产资源巡检预算拆到独立子表，方便后续扩展资源校验策略
- **公网资源递归巡检**: `check-production-frontend-assets` 从入口资源扩展为递归扫描已发现的 JS chunk，能继续校验二级懒加载、worker 等深层 `/assets/*` 引用，降低发布后深层功能点击才暴露缺 chunk 的风险
- **懒加载恢复判定分层**: 将 Vite preloadError 与 Promise rejection 的刷新提示判断收敛到 `chunkLoadRecovery` 纯函数并补充单测，避免发布后旧 chunk 失效恢复逻辑散落在 hook 事件分支里
- **保存计划策略分层**: 将快捷键保存和工具栏保存的路径决策拆到 `appSaveShortcutPlan` / `appSaveToolbarPlan`，`appSaveActionPlan` 收敛为兼容入口，降低 PREVIEW/SOURCE 保存语义混在同一文件里的维护风险
- **工具栏 AI 修复按钮状态分层**: 将 AI 修复按钮的 class、禁用态、aria/title 和可见文案聚合到 `actionPanelFileActions`，按钮组件继续聚焦 AI_FIX 点击透传与图标装配
- **工具栏入口状态适配分层**: 将转换工具按钮和面板入口按钮重复的 a11y、badge 与图标状态适配拆到 `actionPanelEntryButtonState` 和 `ActionPanelEntryIconSlot`，两个按钮组件继续聚焦点击语义透传
- **状态栏右侧 Badge 分层**: 将本地处理状态样式矩阵和当前视图提示拆到 `StatusBarLocalProcessingBadge` / `StatusBarModeBadge`，右侧状态入口继续收敛为状态、视图和版本装配
- **工具栏文件操作图标分层**: 将打开文件和保存 JSON 的 SVG 图标拆到 `ActionPanelFileActionIcon`，文件操作区继续收敛为打开、保存和 AI 修复入口装配
- **工具栏 AI 修复图标分层**: 将 AI 修复按钮的 idle/loading 图标拆到 `ActionPanelAiFixIcon` 并补充单测，按钮主体继续聚焦文案、禁用态和 AI_FIX 动作透传
- **状态栏内容统计分层**: 将左侧状态栏里的编码、长度、字节、光标和行列统计拆到 `StatusBarContentMetrics`，`StatusBarLeftInfo` 继续收敛为统计、文件、保存和 SOURCE 校验装配入口
- **保存计划执行器分层**: 将保存命令中的 skip、SOURCE/PREVIEW 写回、另存为和成功提示矩阵拆到 `appSavePlanExecutor`，`appSaveCommandRunner` 收敛为计划生成与打点入口并收紧预算
- **深度解析占位符 Section 契约分组**: 将占位符 section 的工具栏参数和行级动作参数改为 `toolbar` / `rows` 分组透传，并收紧 section 与类型预算，让渲染入口继续只负责三块区域装配
- **工具栏按钮预算余量收口**: 继续压缩转换工具按钮和面板入口按钮的样板行数，并下调薄组件预算上限，防止按钮入口在后续功能迭代中重新贴线膨胀
- **工具栏按钮薄组件收口**: 移除转换工具按钮和面板入口按钮未使用的 props 二次导出，并继续收紧按钮预算，让类型契约统一由 `ActionPanelButtonTypes` 承接
- **深度解析占位符行列表分层**: 将运行时占位符 section 的 props 契约和行列表遍历拆到独立模块，并收紧占位符 section 预算，让区域入口只负责工具栏、分组列表和行列表装配
- **保存链路类型契约分层**: 将保存计划类型与保存命令输入/副作用类型拆到独立契约文件，并收紧 `appSaveActionPlan` 与 `appSaveCommandRunner` 预算，让保存计划和执行器继续聚焦纯路径分支与副作用编排
- **工具栏按钮类型契约分层**: 将转换工具按钮和面板入口按钮的 props 契约集中到 `ActionPanelButtonTypes`，并收紧按钮组件预算，让具体按钮继续只维护图标状态、badge 和点击透传
- **SOURCE 编辑器类型契约分层**: 将 `AppSourceCodeEditorProps` 拆到独立类型契约文件并收紧 SOURCE 编辑器预算，组件主体继续聚焦 `CodeEditor` 装配和动作 slot 组合
- **App 工作流预算子表分层**: 将复制、设置备份和智能建议等命令型 workflow 预算拆到 `maintainability-budget-app-workflow-command-rules`，并把新子表纳入治理预算，避免 App 工作流预算入口继续贴线膨胀
- **智能建议命令分层**: 将智能建议点击后的 AI 修复委托、模式切换、Scheme 输入请求、面板开关、toast 和埋点执行拆到 `useAppSmartSuggestionCommands` 与 `appSmartSuggestionCommandRunner` 并补充单测，`App.tsx` 继续收敛为状态编排
- **设置备份命令分层**: 将配置备份导出/导入的动态加载、文件下载、文件读取、状态写回和 toast 副作用拆到 `useAppSettingsBackupCommands` 与 `appSettingsBackupCommandRunner` 并补充单测，继续压缩 `App.tsx` 主编排职责且保持 `appBackup` 懒加载边界
- **公网静态资源巡检**: 新增 `check-production-frontend-assets` 线上资源巡检脚本，从入口 HTML 追踪 main/admin JS 懒加载 asset 表并逐个校验可达性，公网部署验证会在版本和健康检查通过后继续拦截当前构建 chunk 缺失导致的动态 import 失败
- **复制命令 Hook 分层**: 将 SOURCE/PREVIEW 复制的空态、处理中、剪贴板错误、成功文案和打点拆到 `useAppCopyCommands` 与 `appCopyCommandRunner`，并补充单测，继续压缩 `App.tsx` 内编辑器命令副作用
- **SOURCE 替换副作用分层**: 将 SOURCE 写入提示、Scheme 排查面板复位、剪贴板智能建议来源、粘贴 SOURCE、Scheme 排查替换、PREVIEW/Schema 应用和清空 SOURCE 命令拆到专用 hooks，并收紧 SOURCE 工作流预算，降低替换命令继续回流到主 hook 的风险
- **保存命令 Hook 分层**: 将预览另存为、快捷键保存、工具栏保存和保存打点编排拆到 `useAppSaveCommands`，`App.tsx` 只保留动作分发入口，继续为后续 `useAppActionCommands` 收敛铺路
- **保存动作计划分层**: 将快捷键保存和工具栏保存的路径差异抽到 `appSaveActionPlan` 并补充单测，明确 PREVIEW 快捷键写回当前文件、工具栏另存为预览结果的历史语义，降低后续动作命令重构误合并风险
- **AI 修复命令 Hook 分层**: 将 AI 修复的首次引导、处理中状态、动态加载、错误提示、设置入口和摘要写回编排拆到 `useAppAiRepairCommand`，纯提示与摘要组装逻辑拆到 `appAiRepairCommand` 并补充单测，继续压缩 `App.tsx` 主动作分发职责
- **SOURCE 替换工作流 Hook 分层**: 将粘贴 SOURCE、应用 PREVIEW、应用 Schema 示例、Scheme 原始值排查和清空 SOURCE 的 pending 状态与确认处理拆到 `useAppSourceReplacementCommands`，共用计划分发逻辑拆到 `appSourceReplacementCommandHelpers` 并补充单测，显著压缩 `App.tsx` 主编排职责
- **状态栏 ViewModel 分层**: 将当前文件、字节大小、保存状态、SOURCE 校验状态/动作和本地处理状态聚合拆到 `statusBarViewModel` 并补充单测，收紧 `StatusBar` 预算，让状态栏组件只负责左右状态区装配
- **PREVIEW 编辑器装配分层**: 将 PREVIEW 版 `CodeEditor` 的只读状态、校验错误、深度解析提示、高亮和头部动作装配拆到 `AppPreviewCodeEditor` 并补充单测，拆出 PREVIEW/editor 治理预算子表并收紧 `AppPreviewEditorPane` 预算，让 Pane 只负责右侧编辑器容器
- **SOURCE 错误修复入口 Slot 分层**: 将 SOURCE 校验无效且有内容时展示 AI 修复按钮的条件拆到 `AppSourceErrorActionsSlot` 并补充单测，收紧 `AppSourceCodeEditor` 预算，让 SOURCE 编辑器主体继续聚焦 `CodeEditor` 参数和头部动作装配
- **SOURCE 编辑器装配分层**: 将 SOURCE 版 `CodeEditor` 的文件状态、校验错误、Schema 提示、AI 修复入口和头部动作装配拆到 `AppSourceCodeEditor` 并补充单测，收紧 `AppSourceEditorPane` 预算，让 Pane 只负责左侧宽度容器
- **状态栏 SOURCE 动作分层**: 将 SOURCE JSON 错误定位与独立 Scheme 输入打开的优先级判断拆到 `statusBarSourceValidationAction` 并补充单测，收紧 `StatusBar` 预算，让状态栏主组件继续聚焦状态派生和左右区域装配
- **主工具栏入口按钮壳分层**: 将转换工具按钮和面板入口按钮共用的 DOM 外壳、折叠态标签隐藏与状态 badge 装配拆到 `ActionPanelEntryButton` 并补充单测，收紧 `ActionPanelToolButton` / `ActionPanelPanelButton` 预算，让两个业务按钮只保留图标状态和点击透传
- **主工具栏 AI 修复按钮分层**: 将文件操作区里的 AI 修复按钮状态、loading 图标和处理中中文案拆到 `ActionPanelAiFixButton` 并补充单测，收紧 `ActionPanelFileOperations` 预算，让文件操作区只负责打开、保存和 AI 修复入口装配
- **主工具栏文件按钮壳分层**: 将打开文件和保存 JSON 共用的按钮样式、折叠态 title 与 action 透传拆到 `ActionPanelFileActionButton` 并补充单测，收紧 `ActionPanelFileOperations` 预算，让文件操作区继续聚焦图标选择和 AI 修复入口装配
- **主工具栏按钮状态分层**: 将转换工具和面板入口按钮共用的 active/collapsed class、折叠态可访问文案与右侧状态 badge 拆到 `actionPanelButtonState` / `ActionPanelButtonBadge` 并补充单测，收紧 `ActionPanelToolButton` / `ActionPanelPanelButton` 预算，让按钮组件只负责渲染和点击透传
- **状态栏当前文件 badge 分层**: 将左侧状态栏里的当前文件图标、路径提示和文件名截断展示拆到 `StatusBarActiveFileBadge` 并补充单测，收紧 `StatusBarLeftInfo` 预算，让左侧状态栏继续聚焦编码、长度、行列、保存和 SOURCE 校验装配
- **主编辑区分栏布局分层**: 将 SOURCE/PREVIEW 分栏容器和 resize handle 装配拆到 `AppEditorSplitPanes` 并补充单测，收紧 `AppEditorWorkspace` 预算，让编辑区外壳继续聚焦 AI 修复摘要和两侧编辑 Pane 装配
- **主工具栏低频入口分层**: 将“更多 / 实验”里的高级排查入口拆到 `ActionPanelAuxiliaryWorkbench` 并补充单测，继续把低频排查能力隔离在主功能按钮之外，收紧 `ActionPanel` 预算
- **主工具栏按钮分层**: 将转换工具按钮和面板入口按钮拆到 `ActionPanelToolButton` / `ActionPanelPanelButton` 并补充单测，收紧 `ActionPanel` 预算，让主工具栏继续聚焦工具分组、状态装配和引导触发
- **状态栏左侧信息分层**: 将状态栏左侧编码、长度、行列、文件名、保存状态和 SOURCE 校验状态展示拆到 `StatusBarLeftInfo` 并补充单测，收紧 `StatusBar` 预算，让状态栏入口只负责状态派生和左右区域装配
- **主工作台懒加载面板插槽分层**: 将工具面板的 loaded 判断和空 fallback `Suspense` 包裹拆到 `AppLazyPanelSlot` 并补充单测，收紧 `AppLazyToolPanels` 预算，减少懒加载面板装配重复 JSX
- **主应用 Toast 宿主分层**: 将主工作台全局 Toast 的位置和顶部偏移配置拆到 `AppToastHost` 并补充单测，继续收紧 `AppWorkspaceOverlays` 预算，让 overlay 容器只负责组合展示层
- **主工作台 resize 捕获层分层**: 将布局调整时的全屏鼠标捕获层拆到 `AppResizeCaptureOverlay` 并补充单测，收紧 `AppWorkspaceOverlays` 预算，让工作区 overlay 容器只负责组合 resize、拖拽和 Toast 宿主
- **状态栏 SOURCE 校验状态分层**: 将 SOURCE 校验状态的普通展示、错误定位和 Scheme 面板打开三态渲染拆到 `StatusBarSourceValidationBadge` 并补充单测，收紧 `StatusBar` 预算，让状态栏主组件继续聚焦状态计算与布局
- **SOURCE 错误修复入口分层**: 将 SOURCE 编辑器错误态的 AI 修复按钮拆到 `SourceEditorErrorActions` 并补充单测，同时拆出 `app-editor-source` 预算子表，让源编辑 Pane 保持纯编辑器装配职责
- **主工作台 AI 修复摘要槽位分层**: 将 AI 修复摘要的懒加载与事件透传拆到 `AppAiRepairSummarySlot` 并补充单测，进一步收紧 `AppEditorWorkspace` 预算，让主编辑区外壳只保留 SOURCE/PREVIEW 与分栏装配
- **发布后懒加载恢复**: 主工具会更快检测线上新版本并在空闲时预热高频 Scheme 弹窗 chunk，主工具和后台都会监听 Vite 动态 chunk 加载失败并提示刷新，ErrorBoundary 也会识别旧页面加载新版资源失败，解决长时间打开页面后点击 Scheme 面板拉取旧 hash 文件失败的问题
- **状态栏右侧视图分层**: 将本地处理状态和当前视图标签拆到 `StatusBarViewStatus`，版本入口拆到 `StatusBarVersionBadge` 并补充单测，主状态栏继续收敛为状态计算和左侧状态装配
- **主工作台侧栏面板容器分层**: 将工具栏宽度和 `ActionPanel` props 透传拆到 `AppSidebarActionPanel` 并补充单测，`AppActionSidebar` 只保留侧栏容器与 resize handle 装配
- **深度解析覆盖率条目分层**: 将覆盖率卡片内的条目 chips 拆到 `TransformReportCoverageItems` 并补充单测，收紧覆盖率卡片预算，让卡片只保留摘要外壳和风险样式
- **主工作台拖拽浮层组件化**: 将文件拖拽释放提示拆到 `AppFileDropOverlay` 并补充单测，`AppWorkspaceOverlays` 只保留 resize、拖拽浮层和 Toast 宿主装配
- **深度解析占位符分组列表分层**: 将运行时占位符分组列表拆到 `TransformReportPlaceholderGroupsList` 并补充单测，收紧占位符 section 预算，让区域入口继续保持纯装配职责
- **静态资源发布保留**: 前端 Docker 镜像启动时会把新构建产物同步到持久化静态目录，并默认保留 14 天旧 hash assets；CI 新增静态资源保留校验，防止上线后旧页面请求懒加载 chunk 直接 404
- **AI 发布门禁闭环**: 将静态资源保留校验写入 AI Playbook、Codex skill、Claude 工具说明和 AI 治理脚本，确保后续 agent 修改前端 Docker/Compose/Nginx 时会检查旧 chunk 兼容性
- **主工具栏文件操作分层**: 将打开文件、保存 JSON 和 AI 智能修复按钮拆到 `ActionPanelFileOperations`，将 AI 修复状态文案与折叠态 title 拆到 `actionPanelFileActions` 并补充单测，继续压缩 `ActionPanel` 主组件
- **主工具栏智能建议分层**: 将智能建议卡片的折叠/展开渲染拆到 `ActionPanelSmartSuggestion`，将 tone 样式、剪贴板来源标签和可见动作规则拆到 `actionPanelSmartSuggestionState` 并补充单测，继续压缩 `ActionPanel` 主组件
- **主工具栏面板入口配置分层**: 将 JSONPath、JSON 对比、结构导航、Schema、Scheme 和模板填充入口拆到 `actionPanelPanelItems` 纯配置并补充单测，图标渲染拆到 `ActionPanelPanelIcon`，减少 `ActionPanel` 内重复面板按钮 JSX
- **主工具栏滚动交互分层**: 将工具栏自定义滚动条监听、拖拽和 thumb 计算拆到 `useActionPanelScrollbar` 与 `actionPanelScrollbar`，并补充纯函数单测，让 `ActionPanel` 继续收敛为工具入口装配
- **主工具栏按钮配置分层**: 将转换工具按钮的分组、文案、颜色和引导锚点拆到 `actionPanelToolGroups` 纯配置并补充单测，图标渲染拆到 `ActionPanelToolIcon`，同时把工具栏纳入 App 可维护性预算
- **主工作台状态栏状态分层**: 将保存状态、SOURCE 校验状态、字节大小和模式文案拆到 `statusBarState` 纯 helper 并补充单测，同时把状态栏纳入 App 可维护性预算，避免状态栏文案矩阵继续堆在 JSX 中
- **主工作台侧栏外壳组件化**: 将左侧 `ActionPanel` 容器和 sidebar resize handle 拆到 `AppActionSidebar`，新增 App shell 预算子表，给 `App.tsx` 主编排文件释放维护余量
- **主工作台编辑区组件化**: 将 AI 修复摘要、SOURCE/PREVIEW 编辑器和分栏调整手柄拆到 `AppEditorWorkspace`，新增 App editor 预算子表，让 `App.tsx` 继续回归状态与事件编排
- **主工作台编辑 Pane 分层**: 将 SOURCE 与 PREVIEW 两侧编辑器分别拆到 `AppSourceEditorPane` 和 `AppPreviewEditorPane`，让 `AppEditorWorkspace` 只保留编辑区外壳装配
- **主工作台遮罩层组件化**: 将 resize 捕获层、文件拖拽放置提示和全局 Toast 宿主拆到 `AppWorkspaceOverlays`，减少 `App.tsx` 内的静态 SVG、通知宿主与展示节点
- **主工作台调整手柄组件化**: 将工具栏宽度和 SOURCE/PREVIEW 分栏调整手柄拆到 `AppResizeHandles`，保留原 ARIA 与键盘拖拽能力，同时继续压缩 `App.tsx`
- **主工作台全局弹窗组件化**: 将 Settings 和 Changelog 的懒加载弹窗壳拆到 `AppLazyShellModals`，继续让 `App.tsx` 聚焦业务状态和工作区编排
- **主工作台懒加载面板组件化**: 将 JSONPath、结构导航、语义对比、Schema、深度解析、Scheme 和模板填充懒加载面板装配拆到 `AppLazyToolPanels`，并把 App 展示组件预算拆入独立规则表
- **主工作台确认弹窗组件化**: 将关闭标签、清空、粘贴替换、应用预览、Schema 示例和 Scheme 排查确认弹窗拆到 `AppConfirmDialogs`，继续压缩 `App.tsx` 的纯展示装配
- **主工作台头部动作组件化**: 将 SOURCE/PREVIEW 编辑器头部按钮从 `App.tsx` 拆到 `EditorHeaderActions`，并收紧主入口预算，减少主应用编排文件的 JSX 噪声
- **Scheme 弹窗格式化分层**: 将参数预览、tooltip 裁剪、解码层尺寸和可回写标签拆到 `schemeViewerFormatters` 并补充单测，继续压缩弹窗组件内的纯展示逻辑
- **Scheme 弹窗操作标题分层**: 将二维码、复制、序列化和应用修改按钮的 title/aria 状态矩阵拆到 `schemeViewerActionTitles` 并补充单测，减少弹窗主组件中的分支文案
- **Scheme 解析弹窗诊断分层**: 将弹窗顶部诊断摘要、参数来源计数和详情显示条件拆到 `schemeViewerDiagnostics` 并补充单测，让 `SchemeViewerModal` 更聚焦渲染与交互状态
- **Scheme 解析默认聚焦结果**: 将 Scheme 解析弹窗上方诊断区改为默认紧凑摘要，CMD 结构、参数分层和解析链路改为按需展开，减少对解码结果区域的遮挡
- **深度解析报告分布文案分层**: 将 CMD Schema、资源类型、静态资源字段等分布摘要段落拆到 `transformReportTextDistributionSections` 并补充单测，报告文本入口继续收敛为记录、跳过和占位符明细
- **深度解析 Schema occurrence 分层**: 将 command/resource schema 的记录扫描和资源 URL schema 提取拆到 `transformReportCommandSchemaOccurrences` 并补充单测，schema 分组模块继续收敛为纯聚合排序
- **深度解析质量快照热点分层**: 将质量快照的 schema、问题原因、占位符和参数分层热点聚合拆到 `transformQualitySnapshotHotspots` 并补充单测，快照入口继续收敛为顶层编排
- **深度解析占位符工具栏分层**: 将 `TransformReportPlaceholdersSection` 内的运行时占位符摘要和模板复制按钮拆到 `TransformReportPlaceholderToolbar` 并补充单测，section 继续收敛为占位符区域装配入口
- **CMD 差异报告段落分层**: 将 CMD 结构差异报告的上下文、source 截断和路径分支段落拼装拆到 `cmdStructureDiffReportSections`，并收紧 formatter 预算防止展示 helper 回涨
- **深度解析占位符单行动作分层**: 将 `TransformReportPlaceholderRow` 内的复制、定位和 Scheme 打开按钮矩阵拆到 `TransformReportPlaceholderRowActions` 并补充单测，单行组件继续收敛为路径和值展示
- **深度解析占位符区域瘦身**: 将 `TransformReportPlaceholdersSection` 的行级复制、定位和 Scheme 动作改为类型化 props 透传并收紧预算，减少占位符 section 与单行组件的重复耦合
- **深度解析路径行单行瘦身**: 将 `TransformReportRecordPathRow` 的动作配置改为 rest props 透传并收紧组件预算，避免单行展示组件重复维护复制、定位和 Scheme 打开参数
- **深度解析路径行列表瘦身**: 将 `TransformReportRecordPathRows` 的行级配置改为 rest props 透传并收紧组件预算，避免路径行列表因重复转发 props 贴近上限
- **深度解析记录洞察分层**: 将内部 CMD 字段、资源 URL 字段、ext 和 Base64 后缀解析线索构建拆到 `transformReportRecordInsights` 并补充单测，`transformSummary` 继续收敛为报告聚合入口
- **深度解析 CMD 结构源分层**: 将报告记录的 commandSchema 提取、CMD 结构源判断、参数摘要和 cmdHandler 兼容复制 getter 拆到 `transformReportCmdStructureSource` 并补充单测，继续压缩 `transformSummary` 单文件职责
- **深度解析 decoded value 分层**: 将报告记录的 Scheme 解码值优先级、JSON parse 兜底和预览格式化拆到 `transformReportDecodedValue` 并补充单测，避免 decoded 提取逻辑继续停留在 `transformSummary`
- **深度解析 Schema 分组分层**: 将报告顶部 command/resource schema、origin 与资源类型聚合拆到 `transformReportCommandSchemaGroups` 并补充单测，`transformSummary` 继续收敛为深度解析报告聚合入口
- **深度解析嵌套字段分组分层**: 将报告顶部内部 CMD 字段与资源 URL 字段的 Top 分组共用逻辑拆到 `transformReportNestedFieldGroups` 并补充单测，`transformSummary` 继续收敛为报告聚合入口
- **CMD raw JSON 值处理分层**: 将原始 CMD 快速解码中的 JSON 字符串解析、URL Decode 后 JSON 解析和 unknown 到 JsonValue 转换拆到 `cmdStructureRawJsonValue` 并补充单测，raw source decoder 聚焦 URL/query 递归流程
- **Scheme 参数值暴露判断分层**: 将嵌套 CMD 参数值的 JSON 字符串、转义、URL 编码和 Base64 递归判断拆到 `schemeStructuredActionableParamValue` 并补充单测，HTTP(S) 参数扫描入口继续收敛
- **CMD 差异路径分支分层**: 将 CMD 结构差异里的子孙路径折叠和分支计数拆到 `cmdStructurePathBranches` 并补充单测，diff formatter 聚焦报告文本展示
- **Scheme 暴露判断分层**: 将 HTTP(S) query/hash 中嵌套 CMD 参数的识别拆到 `schemeNestedCommandExposure` 并补充专属单测，`schemeExposure` 聚焦协议分流和递归暴露入口
- **Scheme 参数 stage 构造分层**: 将参数分层证据的 path、解析预览、修复提示和可逆性判断拆到 `schemeParamDecodeStageBuilder`，`schemeParamDecodeStages` 聚焦 query/hash/log-field 来源扫描
- **Scheme Query 识别分层**: 将普通 query、单参数可解析 query 和日志前缀 query 的检测拆到 `schemeQueryDetection` 并补充单测，`schemeUtils` 继续收敛为递归解码策略编排入口
- **CMD raw source 解码器分层**: 将原始 CMD 的 URL/query/JSON 快速结构化解码拆到 `cmdStructureRawSourceDecoder` 并补充单测，raw source 入口继续收敛为候选扫描、优先级排序和兼容导出
- **CMD raw source guard 分层**: 将原始 CMD 字段优先级、URL/query 形态判断、安全 URL Decode 和结构化字段识别拆到 `cmdStructureRawSourceGuards` 并补充单测，raw source 解码器继续聚焦候选扫描与快速结构化解析
- **CMD actual 候选收集分层**: 将 actual CMD 候选的结构化对象扫描、raw source 解码接入、去重和路径标注拆到 `cmdStructureCandidates` 并补充单测，`cmdStructureDiff` 继续收敛为结构归一化、diff 和候选排序入口
- **CMD raw source 解码分层**: 将 response 内原始 CMD 字符串候选扫描、优先级选择和快速 query/JSON 解码拆到 `cmdStructureRawSource` 并补充单测，`cmdStructureDiff` 继续收敛为结构归一化、diff 和候选排序入口
- **深度解析当前 CMD 对比分层**: 将面板内 active CMD 对比记录定位、候选集合和当前报告文本构建拆到 `transformReportActiveCmdComparison` 并补充单测，继续压缩深度解析主面板状态编排
- **Scheme 参数分层证据分层**: 将 query/hash/log-field 的参数分层证据构建拆到 `schemeParamDecodeStages` 并补充单测，同时把 Scheme 核心 helper 预算拆到独立子表，让 `schemeUtils` 继续收敛为递归解码编排入口
- **深度解析路径行动作分层**: 将展开记录路径行的复制路径、复制片段、Scheme 打开和定位按钮拆到 `TransformReportRecordPathRowActions` 并补充单测，同时把记录路径组件预算收口到独立子表
- **深度解析占位符分组分层**: 将运行时占位符分组摘要、来源预览和筛选入口拆到 `TransformReportPlaceholderGroupCard` 并补充单测，同时把占位符 section 与面板 helper 治理预算收口到独立子表
- **深度解析占位符单行分层**: 将运行时占位符的路径、来源、复制、定位和 Scheme 打开操作拆到 `TransformReportPlaceholderRow` 并补充单测，占位符 section 继续收敛为分组和行组件装配
- **深度解析指标栏分层**: 将顶部总览里的展开计数、Scheme 计数、cmdHandler 对比、待处理和占位符快捷入口拆到 `TransformReportSummaryMetricsBar` 并补充单测，顶部总览 section 收敛为纯子模块装配
- **深度解析优先处理分层**: 将顶部总览里的建议优先处理卡片拆到 `TransformReportIssueTriagePanel` 并补充单测，顶部总览 section 继续收敛为筛选指标和子面板装配
- **深度解析下一步行动分层**: 将顶部总览里的真实 response 下一步行动卡片拆到 `TransformReportNextActionsPanel` 并补充单测，顶部总览 section 继续收敛为总览模块装配
- **深度解析记录路径分层**: 将展开记录内部 CMD 字段、静态资源字段、内部路径、解析结果和原始值预览编排拆到 `TransformReportRecordPathSections` 并补充单测，记录主 section 继续收敛为记录模块装配
- **深度解析记录标签分层**: 将展开记录标签、内部 CMD/资源计数、聚焦复制和洞察 chip 拆到 `TransformReportRecordBadges` 并补充单测，记录主 section 继续收敛为模块编排
- **深度解析记录头部分层**: 将展开记录头部路径、不可逆状态和复制/定位/Scheme 操作拆到 `TransformReportRecordHeader` 并补充单测，展开记录主 section 继续收敛为记录级编排
- **深度解析 cmdHandler 摘要分层**: 将展开记录内的 cmdHandler schema 与参数筛选摘要拆到 `TransformReportCmdHandlerSummary` 并补充单测，展开记录主 section 继续聚焦记录级编排
- **深度解析 CMD Schema 行分层**: 将展开记录内的 CMD Schema 路径列表拆到 `TransformReportCommandSchemaRows` 并补充单测，展开记录主 section 继续收敛为记录级编排
- **深度解析路径行单行分层**: 将展开记录路径行的单行布局、复制、定位和 Scheme 打开动作拆到 `TransformReportRecordPathRow` 并补充单测，路径行列表只负责标题、列表和更多提示
- **深度解析展开记录路径行分层**: 将内部 CMD 字段、静态资源字段和内部路径的重复行展示抽到 `TransformReportRecordPathRows` 并补充单测，展开记录 section 继续收敛为记录级编排
- **深度解析记录区预算分层**: 将展开记录 section 和路径行组件预算拆到 record-section 子表，避免面板组件预算表继续膨胀
- **深度解析质量快照计数分层**: 将质量快照 totals、filtered 和 truncation 映射拆到 `transformQualitySnapshotMetrics` 并补充单测，质量快照入口继续聚焦热点和建议编排
- **深度解析质量预算分层**: 将质量建议、Bucket、Delta、快照和计数 helper 预算拆到 quality 子表，避免核心预算规则继续贴线
- **深度解析问题样本文本分层**: 将问题样本复制报告文本拆到 `transformIssueSampleReportText` 并补充单测，`transformIssueSamples` 继续聚焦 JSON 样本导出
- **深度解析 issue 预算分层**: 将问题筛选、样本 JSON、样本文本和回归模板预算拆到 report issue 子表，避免报告预算规则继续膨胀
- **深度解析覆盖率策略分层**: 将报告覆盖率评分、风险文案和占位符提示拆到 `transformReportCoverage` 并补充单测，继续压缩 `transformSummary` 聚合职责
- **深度解析 summary 预算分层**: 将 decoded、coverage、copy payload 和 recipe 等 support helper 预算拆到独立子表，并收紧 `transformSummary` 行数预算防止回涨
- **深度解析 footer 分发分层**: 将报告 footer action id 到复制、基线和归档副作用的映射拆到 `transformReportFooterActionHandlers` 并补充单测，主面板继续收敛为状态装配
- **深度解析行动分发分层**: 将报告下一步和优先处理 action 到面板副作用的分发拆到 `transformReportActionRunners`，主面板继续聚焦状态装配和渲染
- **深度解析覆盖率卡片组件化**: 将报告覆盖率说明和覆盖项展示拆到 `TransformReportCoverageCard` 并纳入小型 section 预算，顶部总览继续收敛为指标与行动编排
- **深度解析空态组件化**: 将报告筛选空态拆到 `TransformReportEmptyState` 并纳入预算，让主面板继续聚焦状态和动作编排
- **深度解析顶部总览组件化**: 将报告顶部指标、覆盖率、下一步行动和优先处理区域拆到 `TransformReportSummarySection` 并纳入预算，继续压缩主面板 JSX
- **深度解析占位符模板分层**: 将运行时占位符回填模板 JSON 构建拆到 `transformPlaceholderFillTemplate` 并纳入预算，让 `transformSummary` 继续收敛为报告聚合入口
- **深度解析问题样本分层**: 将问题样本 JSON、复制报告文本和脱敏回归模板拆到 `transformIssueSamples`、`transformIssueRegressionTemplate` 并纳入预算，减少 `transformSummary` 的导出策略耦合
- **深度解析质量快照分层**: 将质量快照指标、热点 Bucket 和建议组装拆到 `transformQualitySnapshot` 并纳入预算，让 `transformSummary` 继续回归报告聚合
- **Scheme Query 解码分层**: 将 URL Decode 兜底、query 加号空格语义和结构化值加号保留逻辑拆到 `schemeQueryDecoding` 并补充单测，继续收窄 Scheme 核心文件职责
- **Scheme URL 信息分层**: 将 URL protocol/host/path、query 参数和 hash 参数摘要提取拆到 `schemeUrlInfo` 并补充单测，继续压缩 Scheme 解码核心入口
- **深度解析展开记录组件化**: 将展开记录列表、内部路径、CMD Schema 行和 cmdHandler 对比入口拆到 `TransformReportRecordsSection` 并补充单测，主面板继续收敛为状态编排
- **深度解析排查 Recipe 分层**: 将 troubleshooting recipe 的步骤编排、摘要和建议命令拆到 `transformTroubleshootingRecipe` 并纳入维护性预算，让 `transformSummary` 继续回归报告聚合
- **深度解析占位符区域组件化**: 将运行时占位符分组、明细和回填模板操作拆到 `TransformReportPlaceholdersSection` 并补充单测，继续压缩深度解析主面板 JSX
- **深度解析未展开线索组件化**: 将报告底部的未展开线索列表拆到 `TransformReportUnresolvedSection` 并补充单测，继续降低深度解析主面板的异常线索展示复杂度
- **深度解析跳过记录组件化**: 将报告底部的性能保护跳过记录列表拆到 `TransformReportWarningsSection` 并补充单测，让深度解析主面板继续聚焦状态编排
- **深度解析 Top 分布组件化**: 将报告顶部的 CMD 来源、CMD Schema、静态资源和内部字段分布按钮拆到 `TransformReportTopDistributions` 并补充单测，继续压缩深度解析主面板 JSX
- **深度解析报告文本分层**: 将深度解析报告的 CMD/资源分布、展开记录、待检查、跳过和占位符文本段落拆到 `transformReportTextSections`，让 `transformSummary` 继续聚焦报告聚合与导出入口
- **CMD 差异报告格式化分层**: 将 CMD 结构差异报告格式化、路径分支折叠和稳定值序列化拆到 `cmdStructureDiffFormatter`，让 `cmdStructureDiff` 聚焦解析、归一化和 diff 排序
- **Scheme 暴露判断分层**: 将普通 HTTP(S) 过滤、业务 Scheme 暴露和嵌套 CMD 参数启发式拆到 `schemeExposure`，让 `schemeUtils` 继续收窄为检测与递归解码入口
- **Scheme query layer 回写分层**: 将 raw URL、日志字段和前缀 query 的回写策略拆到 `schemeQueryLayerEncoding` 并补充单测，进一步收窄反向编码入口职责
- **Scheme URL layer 回写分层**: 将 URL query/hash 合并回写拆到 `schemeUrlLayerEncoding` 并补充单测，让反向编码入口只负责编码层顺序
- **Scheme hash 回写分层**: 将 hash route、锚点参数和裸 query hash 的替换规则拆到 `schemeHashEncoding` 并补充单测，继续降低反向编码 helper 复杂度
- **Scheme 反向编码分层**: 将 URL/query/hash/log-field 回写从 `schemeUtils` 拆到 `schemeLayerEncoding`，让 Scheme 核心文件继续聚焦检测与递归解码
- **Scheme Base64 后缀 Query 分层**: 将 extraParam 后缀 Base64 query 扫描拆到 `schemeBase64SuffixQuery` 并补充单测，让后缀元信息模块只负责 JSON 注入
- **Scheme 扁平 Query 分层**: 将扁平 query 参数聚合与重复 key 合并拆到 `schemeFlatQueryParams`，让原始参数模块聚焦单个未编码 JSON/URL 参数识别
- **Scheme 日志字段引号分层**: 将日志字段 key/value 引号解包拆到 `schemeLogFieldQuotes` 并补充单测，让语法模块继续聚焦字段匹配、尾逗号和分隔符归一化
- **Scheme 结构化 Query 路径赋值分层**: 将结构化 Query 的嵌套路径遍历拆到 `schemeStructuredQueryAssignPath`，让赋值入口只保留 key 解析与普通参数合并
- **Scheme JWT 分层**: 将 JWT header/payload 解码拆到 `schemeJwt` 并补充专属单测，让 Base64 公开入口继续聚焦编码、解码和结构化片段识别
- **主应用旧 JSONPath 分层**: 将旧 JSONPath 写值兼容逻辑拆到 `appLegacyJsonPath` 并补充独立单测，让 App 工作流 helper 回归文案与模板判断
- **可维护性预算面板治理分层**: 将深度解析面板相关预算规则自身拆到独立治理子表，并让新子表继续纳入预算自检
- **深度解析 warning 分类分层**: 将性能保护 warning 的原因和下一步建议拆到 `transformWarningClassification`，让待检查候选分类入口更聚焦
- **占位符回填类型分层**: 将运行时占位符回填建议的 group/record/view 类型拆到 `transformPlaceholderSuggestionTypes`，让建议入口继续保持短小
- **AI Skill 发现闭环**: AI 治理脚本自动发现 `.codex/skills/*/SKILL.md`，新增项目级 Codex skill 时会校验 README、Claude guide 和 Playbook 引用同步
- **可维护性预算自检闭环**: 预算检查脚本会自动发现未纳入自检的 `maintainability-budget-*` 规则文件，并补齐深度解析复制 helper 规则表自身预算
- **可维护性预算治理分层**: 将 Scheme support 预算规则自身拆入独立治理子表，补齐 Base64、日志字段、Query 语法和结构化 Query 规则文件的自检覆盖
- **构建配置可维护性**: 将 Vite 手工分包策略拆成独立 `config/chunkStrategy` 纯函数并补充单测，继续守住 Monaco、AntD、AntV、二维码和 JSON 工具依赖的 chunk 边界
- **版本更新闭环**: 将 `version.json` manifest 和前端 CHANGELOG 注入逻辑拆成独立构建模块，避免更新提示逻辑散落在 Vite 配置中
- **深度解析可维护性**: 将静态资源 URL 类型识别从 `transformSummary` 拆到独立 `staticResourceSchema` 模块，降低报表汇总大文件的规则耦合
- **协作样本脱敏可维护性**: 将问题样本敏感字段识别和 originalValue 脱敏逻辑拆到独立 `issueSampleRedaction` 模块，便于后续审计协作材料隐私边界
- **CMD 聚焦复制可维护性**: 将内部路径 JSONPath 解析、取值和聚焦 cmdParams 子树构建拆到独立 `jsonPathFocus` 模块，降低深度解析报告大文件的路径投影复杂度
- **深度解析面板可维护性**: 将复制文案、CMD 候选摘要、路径重映射和占位符回填摘要等纯 UI helper 拆到 `transformReportPanelHelpers`，让报告面板组件更聚焦渲染和状态
- **深度解析面板 helper 分层**: 将复制大小统计、内部字段 Scheme 输入、复制 title 基础状态和占位符回填摘要拆到 `transformReportCopyMetrics`、`transformReportDecodedSchemeInput`、`transformReportCopyTitleHelpers`、`transformReportPlaceholderFillSummary`，让 `transformReportPanelHelpers` 只保留兼容导出
- **深度解析面板 atom 可维护性**: 将来源标签、摘要指标 chip 和内部路径计数展示拆到 `TransformReportPanelAtoms`，继续压缩报告面板主组件体积
- **深度解析面板布局分层**: 将报告 footer 按钮区和筛选输入条拆到 `TransformReportPanelFooter`、`TransformReportFilterBar`，让主面板继续聚焦报告状态编排
- **深度解析复制文案可维护性**: 将深度解析报告复制按钮 title 和占位符回填模板 title 规则收敛到 `transformReportPanelHelpers`，避免筛选 pending、无报告和不可复制状态分散在组件内
- **深度解析复制入口可维护性**: 将深度解析报告复制入口的 title 文案矩阵拆到 `transformReportCopyTitles`，让报告面板组件只保留当前状态和事件处理
- **深度解析底部汇总可维护性**: 将深度解析报告 footer 的筛选/总量汇总文案拆到 `transformReportFooterSummary`，减少报告面板 JSX 内的长字符串拼装
- **深度解析样式可维护性**: 将深度解析覆盖率标签和下一步行动按钮的 class 映射拆到 `transformReportPanelStyles`，让状态到样式的映射可单测验证
- **深度解析行动策略可维护性**: 将真实 response 下一步行动和建议优先处理项的排序、标题、禁用态拆到 `transformReportActionItems`，让报告面板只负责事件分发和渲染
- **深度解析行动策略分层**: 将优先处理项和下一步行动 builder 拆到 `transformReportIssueTriageItems`、`transformReportNextActionItems`，让行动项入口只保留兼容导出
- **深度解析行动项类型分层**: 将下一步行动和优先处理项的 action/state/item 类型拆到 `transformReportActionItemTypes`，让行动策略 builder 更聚焦文案与排序规则
- **深度解析行动项配置分层**: 将下一步行动和优先处理项的静态文案、action 与 tone 矩阵拆到 `transformReportActionItemConfig`，让行动策略 builder 只保留排序编排
- **深度解析 footer 操作可维护性**: 将报告底部复制、质量基线、问题样本和 CMD 结构入口的显示顺序、标题、禁用态拆到 `transformReportFooterActions`，避免按钮状态矩阵继续堆在主面板 JSX
- **深度解析 footer 操作分层**: 将 footer 操作 ID/状态类型与静态配置拆到 `transformReportFooterActionTypes`、`transformReportFooterActionConfig`，让 `transformReportFooterActions` 只保留操作组装逻辑
- **深度解析 footer builder 分层**: 将筛选报告、质量基线、CMD 结构和配置化 footer action 生成拆到 `transformReportFooterActionBuilders`、`transformReportFooterBaselineActions`、`transformReportFooterActionFactory`，让 footer actions 入口只保留操作顺序编排
- **深度解析 CMD 对比可维护性**: 将 cmdHandler expected 对比、actual 候选推荐、差异摘要和候选文本拆到 `transformReportCmdComparison`，继续压缩报告面板组件
- **深度解析 CMD 对比面板组件化**: 将报告面板内联的 cmdHandler 对比 UI 抽到 `TransformReportCmdComparisonPanel`，主面板只保留状态编排和复制副作用，并将主面板预算收紧到 2000 行
- **深度解析 CMD 对比候选分层**: 将 actual 候选收集、排序、候选文案和输入转换拆到 `transformReportCmdComparisonCandidates`，类型集中到 `transformReportCmdComparisonTypes`，让面板状态模块只保留差异报告编排
- **深度解析 CMD 对比 helper 分层**: 将 cmdHandler expected 校验、路径数量摘要、候选摘要和候选路径重映射拆到 `transformReportCmdComparisonHelpers`，让通用面板 helper 回归复制文案、路径值和占位符标题
- **深度解析 CMD 对比摘要分层**: 将 cmdHandler 差异报告格式化和面板摘要提取拆到 `transformReportCmdComparisonSummary`，让 CMD 对比状态构建只保留解析、diff 和候选推荐流程
- **深度解析复制 payload 可维护性**: 将路径值复制、聚焦 CMD 结构复制和 cmdHandler 对比包组装拆到 `transformReportCopyPayloads`，继续压缩 `transformSummary` 聚合文件
- **深度解析 decoded 路径可维护性**: 将 decoded leaf 路径收集、复制文本重定位和搜索索引构建拆到 `transformReportDecodedPaths`，让报告聚合文件减少递归遍历细节
- **深度解析 decoded 搜索索引分层**: 将 decoded 搜索文本和搜索路径索引构建继续拆到 `transformReportDecodedSearchData`，路径复制模块只保留可复制 leaf 路径收集
- **深度解析归档脱敏可维护性**: 将归档包问题样本省略原文和占位符回填模板去候选值逻辑拆到 `transformArchiveSanitizers`，强化协作材料隐私边界
- **深度解析建议命令可维护性**: 将 cmdHandler 对比、问题样本回归和归档 corpus 的建议命令构造拆到 `transformSuggestedCommands`，减少 `transformSummary` 聚合文件的数据常量负担
- **深度解析值预览可维护性**: 将 JSON 值预览、原始字符串截断和内部路径复制值格式化拆到 `transformValuePreview`，继续压缩 `transformSummary` 聚合文件体积
- **深度解析质量对比可维护性**: 将质量快照指标 delta、Top CMD Schema 对比和建议文案格式化拆到 `transformQualityDelta`，让 `transformSummary` 更聚焦报告聚合
- **深度解析质量建议可维护性**: 将质量快照的跳过、待检查、占位符、参数分层和 CMD 对比建议文案拆到 `transformQualityRecommendations`，减少报告聚合文件中的策略分支
- **深度解析质量 Bucket 可维护性**: 将质量快照待检查原因、跳过原因和跳过类型的 Top Bucket 聚合拆到 `transformQualityBuckets`，让主报告聚合文件不再承载排序与路径去重细节
- **深度解析问题分类可维护性**: 将待检查字段和性能保护跳过记录的原因标签、风险等级和下一步建议拆到 `transformIssueClassification`，让 `transformSummary` 更聚焦报告聚合
- **占位符回填建议可维护性**: 将运行时占位符回填候选匹配、冲突去重和强匹配文案拆到 `transformPlaceholderSuggestions`，继续压缩深度解析报告聚合文件
- **占位符回填规则分层**: 将运行时占位符别名表、安全替换判断和候选去重拆到 `transformPlaceholderSuggestionRules`，让建议生成入口只保留 view 到 suggestion 的编排
- **占位符回填 builder 分层**: 将单个运行时占位符的候选收集、唯一性判断和强匹配文案拆到 `transformPlaceholderSuggestionBuilder`，让建议入口只负责遍历 view 与组装 Map
- **深度解析筛选可维护性**: 将报告查询匹配、资源类型 token 匹配、CMD Schema 行聚焦和筛选视图裁剪拆到 `transformReportFilters`，让 `transformSummary` 更聚焦报告聚合
- **深度解析筛选 matcher 分层**: 将路径、资源类型、内部 CMD 字段、CMD Schema 行和长原文兜底匹配拆到 `transformReportFilterMatchers`，让筛选入口只保留记录匹配与兼容导出
- **深度解析筛选 view 分层**: 将筛选后的内部路径、资源字段和 CMD Schema 聚焦裁剪拆到 `transformReportFilterView`，避免 `transformReportFilters` 贴近预算上限
- **深度解析占位符可维护性**: 将运行时占位符筛选、按值聚合和来源聚合拆到 `transformRuntimePlaceholders`，减少报告聚合文件中的占位符分组细节
- **深度解析占位符分层**: 将运行时占位符类型、快捷筛选和按来源聚合继续拆到 `transformRuntimePlaceholderTypes`、`transformRuntimePlaceholderMatchers`、`transformRuntimePlaceholderGroups`，让公开入口只保留兼容导出
- **深度解析问题筛选可维护性**: 将待检查和跳过记录的快捷词、来源标签、原因文案和长原文兜底筛选拆到 `transformIssueFilters`，继续降低报告聚合文件复杂度
- **深度解析参数分层可维护性**: 将参数分层标签、摘要合并、质量 Bucket 和搜索文本拆到 `transformSchemeParamStages`，继续压缩 `transformSummary` 聚合文件
- **深度解析步骤标签分层**: 将转换步骤类型和 Scheme 可回写标签文案拆到 `transformStepLabels`，让参数分层模块只保留摘要聚合和质量 Bucket 逻辑
- **深度解析参数分层 helper 分层**: 将参数层质量 Bucket 聚合和搜索索引文本拆到 `transformSchemeParamStageBuckets`、`transformSchemeParamStageSearch`，让参数分层入口只保留摘要合并和兼容导出
- **CMD 参数识别可维护性**: 将常见 CMD / Schema 参数名白名单与结构化字段后缀判定拆到 `structuredParamNames`，统一 `schemeUtils` 和 `cmdStructureDiff` 的识别规则来源
- **Scheme 占位符可维护性**: 将运行时占位符识别、业务说明、递归收集和分组排序拆到 `schemePlaceholders`，让 Scheme 解码核心文件更聚焦解析流程
- **Scheme URL 形态可维护性**: 将 JSON 转义 URL 归一化、协议相对 URL、裸域名 URL 和原形状序列化拆到 `schemeUrlShapes`，减少 Scheme 解码主流程中的 URL 形态分支
- **Scheme Query 语法可维护性**: 将 Query 参数串归一化、前缀剥离、参数串识别和保留原始 JSON 值的 pair 拆分拆到 `schemeQuerySyntax`，让 Scheme 解码主流程更聚焦业务语义
- **Scheme Query 语法分层**: 将 Query key/pair pattern、日志形态归一化和原始 JSON 值安全 pair 拆分拆到 `schemeQueryPatterns`、`schemeQueryNormalization`、`schemeQueryPairs`，让 `schemeQuerySyntax` 只保留兼容导出
- **Scheme Query JSON 值扫描分层**: 将 Query pair 中原始 JSON 值边界扫描拆到 `schemeQueryRawJson`，让 `schemeQueryPairs` 只保留分隔符定位和 pair 切分
- **Scheme 前缀 Query 可维护性**: 将带日志前缀的 CMD 参数串切分规则拆到 `schemePrefixedQuery`，统一递归解码和元信息导出对前缀 query 的识别边界
- **Scheme 原始参数可维护性**: 将单个未编码 JSON/URL 参数识别和扁平 query 参数收集拆到 `schemeRawParams`，统一 `parseUrl`、深层解码和反向编码的原始参数规则
- **Scheme 结构化 Query 可维护性**: 将点号 key、括号 key、空数组 key 的解析赋值和反向编码风格恢复拆到 `schemeStructuredQuery`，让 Scheme 主流程不再承载 Query 树构建细节
- **Scheme 结构化 Query 分层**: 将结构化 Query 的 key 解析、对象/数组赋值和类型定义拆到 `schemeStructuredQueryKeys`、`schemeStructuredQueryAssign`、`schemeStructuredQueryTypes`，让回写模块只保留原始风格恢复和序列化
- **Scheme 结构化 Query 回写分层**: 将结构化 Query 的原始风格恢复/序列化和值字符串化拆到 `schemeStructuredQuerySerializer`、`schemeStructuredQueryValues`，让公开入口只保留兼容导出
- **Scheme 结构化 Query 赋值分层**: 将结构化 Query 的叶子合并和嵌套容器创建拆到 `schemeStructuredQueryAssignNodes`，让赋值入口只保留 key 遍历和路径落点
- **Scheme 结构化 Query 风格分层**: 将原始 Query 的 dot/bracket/空数组风格采集拆到 `schemeStructuredQueryStyles`，让序列化模块只保留递归回写
- **Scheme 日志字段可维护性**: 将日志字段 CMD 识别、引号解包、尾逗号保留和回写格式化拆到 `schemeLogFields`，让 Scheme 主流程继续聚焦递归解析
- **Scheme 日志字段语法分层**: 将日志字段正则匹配、key/value 解包和分隔符归一化拆到 `schemeLogFieldSyntax`，类型集中到 `schemeLogFieldTypes`，让 `schemeLogFields` 只保留业务字段与可解码判定
- **Scheme Base64 可维护性**: 将 UTF-8 Base64、JWT、带内部头 JSON 片段和 extraParam 后缀元信息解析拆到 `schemeBase64`，让 Scheme 主流程只保留递归编排
- **Scheme Base64 分层**: 将 Base64 UTF-8 codec、真实广告 extraParam 内部头/后缀 JSON 片段解析和类型定义拆到 `schemeBase64Codec`、`schemeBase64PrefixedJson`、`schemeBase64Types`，让公开入口只组合解码、识别和 JWT 包装
- **Scheme Base64 后缀分层**: 将内部头 Base64 JSON 候选补全和 extraParam 后缀元信息注入拆到 `schemeBase64JsonFragments`、`schemeBase64SuffixMeta`，让 `schemeBase64PrefixedJson` 只保留 payload 扫描编排
- **Scheme Fragment 可维护性**: 将 hash route、锚点后追加参数和 URL 编码 fragment 参数源识别拆到 `schemeFragmentParams`，继续降低 Scheme 主流程复杂度
- **Scheme JSON Payload 可维护性**: 将严格 JSON、HTML 引号实体、反斜杠引号、Loose JSON 修复和 parse meta 拆到 `schemeJsonPayloads`，让 Scheme 主流程只消费解析结果和修复提示
- **Scheme JSON Payload 分层**: 将 JSON payload 类型定义与 HTML 引号、反斜杠引号、Loose JSON 修复策略拆到 `schemeJsonPayloadTypes`、`schemeJsonPayloadNormalizers`，让解析入口只保留策略编排和 parse meta
- **Scheme JSON Payload parser 分层**: 将 JSON payload 的 strict/html-quote/escaped-quote/loose-json 解析编排拆到 `schemeJsonPayloadParser`，让公开入口只保留兼容导出
- **Scheme JSON 转义载荷可维护性**: 将 JSON 斜杠转义和 Unicode ASCII 转义载荷识别拆到 `schemeEscapedPayloads`，并收紧 `schemeUtils` 核心预算
- **Scheme 结构化展开护栏可维护性**: 将整段 JSON response 内部字符串递归展开预算、跳过计数和警告构造拆到 `schemeStructuredDecodeGuards`，减少 `schemeUtils` 主流程状态机负担
- **Scheme 结构化展开护栏分层**: 将 JSON response 字符串递归展开 warning/state 类型拆到 `schemeStructuredDecodeTypes`，让护栏模块只保留预算状态机
- **Scheme 结构化展开 warning 分层**: 将递归展开性能保护 warning 构造拆到 `schemeStructuredDecodeWarnings`，让护栏入口只保留计数状态机和兼容导出
- **Scheme 结构化展开 state 分层**: 将 JSON response 字符串递归展开默认阈值和 state factory 拆到 `schemeStructuredDecodeState`，让 guard 文件只保留跳过判定
- **Scheme 结构化展开 skip 分层**: 将递归展开预算命中判定和跳过路径记录拆到 `schemeStructuredDecodeSkip`，给 guard 入口继续留出维护余量
- **Scheme 结构化展开 budget 分层**: 将 JSON response 字符串递归展开预算累计和跳过判定拆到 `schemeStructuredDecodeBudget`，让 guard 入口只保留兼容导出
- **主应用编排可维护性**: 将 App 顶部复制文案、内容体积摘要、占位符模板识别和旧 JSONPath 写值逻辑拆到 `appWorkflowHelpers`，让主组件更聚焦状态与事件编排
- **主应用懒加载可维护性**: 将侧边工具、设置、更新日志、AI 摘要和深度解析等懒加载注册拆到 `appLazyPanels`，减少 App 主入口的加载边界噪音
- **主应用懒加载状态可维护性**: 将设置、更新日志、JSONPath、结构导航、Schema、Scheme、模板和深度报告面板的 loaded 粘性状态合并逻辑拆到 `appLazyPanelLoadState`，减少 App 主入口重复 state/effect
- **布局键盘交互可维护性**: 将侧栏和左右面板键盘 resize 的按键计算拆到 `layoutKeyboardResize`，保留组件内事件分发并让可访问性边界可单测验证
- **主应用文件拖拽分层**: 将文件拖拽计数、遮罩状态和 drop 事件封装到 `useAppFileDrop`，让 App 主入口减少边缘交互状态
- **确认弹窗文案可维护性**: 将清空、粘贴替换、应用预览、应用 Schema 示例和 Scheme 原始值排查的确认文案下沉到 `appWorkflowHelpers`，减少 App 渲染前的字符串拼装
- **操作文案可维护性**: 将自动保存、SOURCE 操作、智能修复、深度解析报告和 PREVIEW 操作的 title / aria 文案拆到 `appActionLabels`，减少主组件内 UI 文案分支
- **主应用编辑区状态可维护性**: 将 SOURCE / PREVIEW 派生状态、自动保存可用性、按钮 title 和确认弹窗文案组合拆到 `appEditorUiState`，让 App 主入口更聚焦事件和渲染编排
- **主应用 SOURCE 替换可维护性**: 将剪贴板粘贴、PREVIEW 应用、Schema 示例应用和 Scheme 原始值排查的跳过/确认/替换决策拆到 `appSourceReplacePlans`，减少 App 主入口重复分支
- **主应用 SOURCE 替换 core 分层**: 将候选为空、内容相同、已有 SOURCE 确认和直接应用的通用决策拆到 `appSourceReplacePlanCore`，让各入口只保留场景文案与特殊条件
- **智能建议动作可维护性**: 将智能输入建议点击后的 mode 切换、面板打开、跳过状态和提示文案拆到 `appSmartSuggestionActions`，让 App 主入口只执行副作用
- **智能建议动作矩阵分层**: 将智能输入建议的静态 effects 与成功文案拆到 `appSmartSuggestionActionConfig`，让计划 builder 只保留特殊动作校验和分发
- **主应用异步策略可维护性**: 将大输入 Worker 阈值、异步校验阈值、动态转换触发和统计扫描上限拆到 `appAsyncPolicy`，让 App 主入口不再直接承载性能策略常量
- **主应用异步状态可维护性**: 将异步转换结果 freshness、深度格式化结果选择和 PREVIEW 输出占位/回退决策拆到 `appAsyncTransformState`，继续压缩 App 主入口
- **主应用异步转换 hook 化**: 将大输入 Worker、动态转换 Promise、requestId 竞态保护和异步结果 freshness 下沉到 `useAppAsyncTransform`，让 App 主入口只消费转换状态
- **React Compiler 兼容性**: 补齐 App 主入口手写 `useCallback` 的 setter 依赖，让 `preserve-manual-memoization` 门禁可以持续校验 memo 语义

### 🏗️ 架构与基础设施
- **Scheme Base64 后缀预算分层**: 将 extraParam 后缀 meta/query 预算拆到独立规则子表，避免 Base64 主预算表因真实广告后缀扩展继续贴边
- **Scheme token 预算分层**: 新增 token 预算规则子表承接 `schemeJwt`，避免 Base64 预算规则表因 JWT/JWS/JWE 扩展继续贴边
- **AI 协作资产**: 新增 Codex 项目级 skill 模板和 AI 工程协作 Playbook，让 Claude Code、Codex、Ducc 等工具共享同一套读文件、改代码、验证、更新日志闭环
- **AI 治理门禁**: 新增 `check-ai-governance` 脚本并接入 GitHub Actions / 本地 CI，自动校验 AGENTS、CLAUDE、Playbook 和 Codex skill 的关键引用不失联
- **可维护性预算门禁**: 新增 `check-maintainability-budgets` 脚本并接入 CI，守住 `transformSummary`、`TransformReportPanel`、`schemeUtils`、`App` 和新拆分 helper 的行数预算，防止复杂度反弹
- **可维护性预算规则拆分**: 将预算清单拆到 `maintainability-budget-rules`，让检查脚本只保留执行逻辑，后续新增受控模块不再推高 checker 复杂度
- **可维护性预算规则分域**: 将预算规则继续按深度解析、Scheme/App 和基础设施拆成独立规则表，聚合入口只负责组合，避免治理规则自身成为新大文件
- **深度解析预算规则分域**: 将深度解析预算规则继续拆成核心聚合与报告 UI 两个子域，避免新增报告面板 helper 时撑大单个治理规则文件
- **深度解析面板预算分域**: 将报告面板、footer、样式、atom 和 CMD 对比 helper 预算拆到独立规则表，避免报告数据 helper 与 UI helper 共享单个上限
- **深度解析面板预算细分**: 将报告面板组件预算与 footer/CMD 对比/helper 预算继续拆成 component/helper 两张规则表，避免新增 UI helper 时撑大单个治理清单
- **深度解析 helper 预算细分**: 将面板 helper 预算继续拆成 UI、footer 和 CMD 对比三张规则表，避免新增 CMD 对比 helper 后让治理清单再次接近上限
- **深度解析行动项预算细分**: 将报告行动项 helper 预算拆到独立 action 规则表，避免 UI helper 预算清单继续贴近上限
- **深度解析聚合预算细分**: 将 `transformSummary`、decoded 路径 helper 与复制 payload helper 的预算拆到独立 summary 规则表，后续压缩聚合文件时可以单独收紧预算
- **深度解析筛选预算细分**: 将报告筛选 view 与 matcher 预算拆到独立 filter 规则表，避免 transform core 治理清单再次贴近上限
- **Scheme/App 预算规则分域**: 将 Scheme 与 App 预算规则继续拆成独立子域，新增解析 helper 时不再推高单个治理规则文件复杂度
- **App 预算规则细分**: 将 App 主入口、懒加载和键盘交互预算拆到 core 规则表，工作流 helper 拆到 workflow 规则表，避免主应用治理清单再次接近上限
- **App 工作流预算细分**: 将 SOURCE 替换计划入口与 core helper 的预算拆到 workflow-source 规则表，避免主应用工作流治理清单继续贴近上限
- **App 主入口预算收紧**: 将 `App.tsx` 行数预算从 2115 收紧到 2030，并新增 `useAppAsyncTransform` hook 预算，防止异步转换编排回流主组件
- **Scheme 预算规则细分**: 将 Scheme 核心大文件预算和 Base64、日志字段、Query、原始参数、URL 形态等支撑 helper 预算拆成 core/support 两张规则表，给后续 CMD/Scheme 解析增强预留治理空间
- **Scheme 支撑预算细分**: 将 Scheme 支撑 helper 预算继续拆成 payload 与 query 两张规则表，避免 JSON 转义载荷 helper 接入后治理清单贴近上限
- **Scheme Base64 预算细分**: 将 Base64 公开入口、codec、extraParam 片段解析和类型预算拆到独立 base64 规则表，避免 payload 预算清单继续贴近上限
- **Scheme 结构化展开预算细分**: 将 JSON response 字符串递归展开的 guard、warning 和类型预算拆到独立 structured-decode 规则表，避免 payload 预算清单继续贴近上限
- **Scheme 日志预算细分**: 将日志字段解析入口、语法 helper 和类型定义预算拆到独立 log 规则表，避免 Query 支撑预算清单再次贴近上限
- **Scheme Query 语法预算细分**: 将 Query syntax、pattern、normalization 和 pair 拆分预算拆到独立 query-syntax 规则表，避免 Query 支撑预算清单继续贴边
- **Scheme 结构化 Query 预算细分**: 将结构化 Query 回写、赋值、key 解析和类型预算拆到独立 structured-query 规则表，避免 Query 支撑预算清单继续贴边
- **治理预算规则分域**: 将 CI checker 与预算规则文件自身的预算从基础设施规则表拆到 governance 规则表，确保治理脚本新增受控条目时也有自我约束
- **治理预算自分层**: 将治理规则自身的预算继续拆成 checker、transform、Scheme/App 三张子表，避免治理清单接近上限后反向阻碍新增规范

### ✨ 新特性
- **JSON Lines Schema 生成**: Schema 面板支持从 JSON Lines / NDJSON 直接生成根数组 Schema，按多行样本合并字段、推断 required 交集并保留可选字段
- **多样本可信度**: Schema 可信提示新增来源类型，JSON Lines 会显示为多样本来源并复用样本数、format 命中、可选字段和采样摘要
- **Schema 校验闭环**: 使用生成后的根数组 Schema 校验同一份 JSON Lines 时会按多样本数组校验，问题路径以 `$[行索引]` 形式展示

### 🎨 UI/UE 优化
- **深度解析报告**: 修复内部路径、CMD Schema 和资源字段列表的行内按钮错位，路径和值保持左侧阅读区，操作按钮统一贴齐右侧
- **报告打开方式**: 智能建议和 Scheme 原始值排查不再自动弹出深度解析报告，只切换到嵌套解析并保留 PREVIEW 顶部手动入口

### 📝 文档
- **Schema 说明同步**: README 补充 JSON / JSON Lines 多样本 Schema 推断、来源类型和 required 交集说明

### 🧪 测试
- **JSON Lines 覆盖**: 扩展 Schema 推断和校验单测，覆盖 JSON Lines 多样本生成、坏行错误、校验通过和缺字段路径
- **资源识别覆盖**: 新增静态资源 Schema 单测，覆盖图片、视频、Lottie、音频、安装包、普通落地页 HTTPS 边界和资源类型搜索 token
- **脱敏规则覆盖**: 新增问题样本脱敏单测，覆盖 URL 编码敏感字段、边界词误报、脱敏提示和回归模板敏感线索
- **聚焦路径覆盖**: 新增 JSONPath 聚焦单测，覆盖 dot/bracket/数组路径解析、叶子 key 提取、cmdParams 子树裁剪和无效路径忽略
- **面板 helper 覆盖**: 新增深度解析面板 helper 单测，覆盖复制大小、CMD diff 摘要、候选路径重映射、Scheme 输入转换和占位符回填标题
- **面板 atom 覆盖**: 新增深度解析面板 atom 单测，覆盖 CMD Schema 展示上限和内部路径截断计数文案
- **深度解析 title 覆盖**: 扩展深度解析面板 helper 单测，覆盖复制按钮 pending、无报告、不可复制和占位符回填模板不可用状态
- **深度解析复制入口覆盖**: 新增复制入口 title 矩阵单测，覆盖筛选更新中、无报告、不可复制、聚焦 CMD、完整报告和占位符回填模板标题
- **深度解析底部汇总覆盖**: 新增 footer 汇总文案单测，覆盖无报告空态和展开记录、CMD、内部字段、资源、占位符、待检查、跳过记录计数
- **深度解析样式覆盖**: 新增深度解析面板样式映射单测，覆盖覆盖率 success/info/warning 和下一步行动 primary/purple/rose/cyan tone
- **深度解析行动策略覆盖**: 新增深度解析行动策略单测，覆盖优先处理项顺序、占位符回填降级、下一步行动排序和筛选 pending 禁用态
- **深度解析行动项配置覆盖**: 新增行动项静态配置单测，覆盖跳过/待检查文案、占位符动作降级、归档和质量快照配置
- **深度解析 footer 操作覆盖**: 新增 footer 操作矩阵单测，覆盖筛选入口、质量基线对比、CMD 聚焦、筛选 pending 禁用态和不可复制内容降级
- **深度解析 CMD 对比覆盖**: 新增 CMD 对比 helper 单测，覆盖差异报告、actual 候选推荐、候选切换输入和无效 expected 错误态
- **深度解析 CMD 对比面板覆盖**: 新增 cmdHandler 对比面板组件单测，覆盖差异摘要、候选推荐、空 expected 引导、复制按钮禁用态和候选切换回调
- **深度解析复制 payload 覆盖**: 新增复制 payload helper 单测，覆盖内部路径复制文本、内部 CMD 字段聚焦复制、CMD 结构裁剪和 cmdHandler 对比包生成
- **深度解析 decoded 路径覆盖**: 新增 decoded 路径 helper 单测，覆盖路径重定位、展示上限、搜索索引和非对象值空态
- **深度解析 decoded 搜索覆盖**: 新增 decoded 搜索索引 helper 单测，覆盖搜索文本、路径数量上限和非对象值空态
- **深度解析筛选覆盖**: 新增报告筛选 helper 单测，覆盖 schema origin、参数层 key、资源类型 token、内部路径裁剪和 CMD Schema 聚焦路径
- **深度解析筛选 matcher 覆盖**: 新增筛选 matcher 单测，覆盖资源 token、对象/数组摘要防误命中、CMD Schema origin 和长原文兜底规则
- **深度解析占位符覆盖**: 新增运行时占位符 helper 单测，覆盖按值/来源聚合排序、快捷筛选词、来源标签和长原文兜底搜索
- **深度解析问题筛选覆盖**: 新增待检查/跳过筛选 helper 单测，覆盖快捷筛选词、detectedType、来源标签、原因建议和长原文兜底搜索
- **深度解析参数分层覆盖**: 新增参数分层 helper 单测，覆盖步骤标签、摘要合并、计数统计、质量 Bucket 和搜索文本
- **Scheme Base64 覆盖**: 新增 Base64/JWT 纯模块单测，覆盖 UTF-8 编解码、短 JSON 识别、普通短文本误判防护和 extraParam 后缀元信息
- **Scheme Fragment 覆盖**: 新增 fragment 参数源单测，覆盖 hash route、锚点后追加参数、URL 编码 fragment 和普通文本误判防护
- **Scheme JSON Payload 覆盖**: 新增 JSON payload 单测，覆盖严格 JSON、Loose JSON、HTML 引号实体、反斜杠引号和修复策略元信息
- **Scheme JSON 转义载荷覆盖**: 新增 JSON 斜杠转义和 Unicode ASCII 转义 helper 单测，覆盖结构化载荷归一化和普通文本误判防护
- **Scheme 结构化展开护栏覆盖**: 新增字符串递归展开护栏单测，覆盖长度累计、单字段跳过、警告生成和跳过路径样本上限
- **深度解析归档脱敏覆盖**: 新增归档脱敏单测，覆盖未脱敏 originalValue 省略、脱敏样本保留、占位符候选值清空和来源预览移除
- **建议命令覆盖**: 新增深度解析建议命令单测，覆盖 cmdHandler 对比、问题样本回归、归档命令和按 id 去重
- **值预览覆盖**: 新增深度解析值预览单测，覆盖字符串截断、对象/数组摘要、基础类型预览和内部路径复制值长度保护
- **质量对比覆盖**: 新增深度解析质量快照 delta 单测，覆盖正负指标变化、Top CMD Schema 对比和应用后建议输出
- **质量建议覆盖**: 新增深度解析质量建议单测，覆盖多风险建议组合和无风险质量基线建议
- **质量 Bucket 覆盖**: 新增深度解析质量 Bucket 单测，覆盖原因聚合、稳定排序、路径去重、路径上限和 Top 上限
- **问题分类覆盖**: 新增深度解析问题分类单测，覆盖 URL 编码失败、疑似 CMD/URL 规则缺口、Base64 非 JSON、默认风险等级和两类跳过保护文案
- **占位符回填建议覆盖**: 新增运行时占位符回填建议单测，覆盖字段名归一化、安全替换过滤、冲突候选跳过和筛选态复用全量记录
- **CMD 参数名覆盖**: 新增结构化参数名单测，覆盖别名归一化、camelCase 结构化后缀和普通字段不误判
- **Scheme 占位符覆盖**: 新增运行时占位符单测，覆盖业务说明兜底、对象/数组路径收集和按值聚合排序
- **Scheme URL 形态覆盖**: 新增 URL 形态单测，覆盖 JSON 转义归一化、协议相对 URL、裸域名 URL、HTTP 协议判定和按原始形态序列化
- **Scheme Query 语法覆盖**: 新增 Query 语法单测，覆盖 HTML/Unicode/分号/逗号/换行归一化、前缀剥离、参数串识别和原始 JSON 值安全拆分
- **Scheme 前缀 Query 覆盖**: 新增前缀 query helper 单测，覆盖日志前缀、箭头前缀、问号前缀、多行防误判和普通 query 防误判
- **Scheme 原始参数覆盖**: 新增原始参数 helper 单测，覆盖未编码 JSON 参数、未编码 URL 参数、重复 key 合并和加号表单解码
- **Scheme 结构化 Query 覆盖**: 新增结构化 Query 单测，覆盖点号 key、索引数组、空数组、括号对象、重复参数和原始回写风格恢复
- **Scheme 日志字段覆盖**: 新增日志字段解析单测，覆盖中文冒号、箭头分隔符、日志前缀、JSON 属性片段、尾逗号和回写引号格式
- **App helper 覆盖**: 新增主应用 workflow helper 单测，覆盖复制文案、多字节大小、占位符模板识别和旧 JSONPath 对象/数组写值
- **布局键盘覆盖**: 新增布局键盘 resize 单测，覆盖方向键、Shift 双倍步长、Home/End、边界收敛和无关按键忽略
- **确认弹窗覆盖**: 扩展主应用 workflow helper 单测，覆盖清空 SOURCE、粘贴替换、应用 PREVIEW、Schema 示例和 Scheme 原始值排查确认文案
- **操作文案覆盖**: 新增主应用操作文案单测，覆盖自动保存 title/aria、SOURCE 操作、智能修复、深度解析报告和 PREVIEW 操作文案
- **编辑区状态覆盖**: 新增主应用编辑区 UI 状态单测，覆盖 SOURCE/PREVIEW 内容状态、自动保存状态、处理中按钮文案、确认弹窗文案和独立 Scheme 输入识别
- **SOURCE 替换计划覆盖**: 新增 SOURCE 替换计划单测，覆盖剪贴板粘贴、PREVIEW 应用、Schema 示例应用和 Scheme 原始值排查的空态、相同内容、确认替换和直接应用
- **SOURCE 替换 core 覆盖**: 新增 SOURCE 替换通用决策单测，覆盖候选为空、内容相同、已有 SOURCE 确认和空 SOURCE 直接应用
- **智能建议动作覆盖**: 新增智能建议动作计划单测，覆盖 AI 修复委托、空 SOURCE 跳过、Scheme 面板打开、结构导航 mode 切换和纯模式切换
- **智能建议动作矩阵覆盖**: 新增智能建议静态动作配置单测，覆盖报告、结构导航、纯模式切换和特殊动作回退
- **懒加载状态覆盖**: 新增主应用懒加载面板 loaded 状态单测，覆盖默认未加载、打开后粘性保持和无新增打开时复用原对象
- **异步策略覆盖**: 新增主应用异步策略单测，覆盖 Worker 阈值、输出同步保护、TypeScript 动态异步路径、空白输入和性能常量稳定性
- **异步状态覆盖**: 新增主应用异步转换状态单测，覆盖过期结果丢弃、深度格式化结果选择、PREVIEW 暂存保护、异步占位和 fallback 懒执行
- **构建规则覆盖**: 新增 chunk 分包策略和版本 manifest 单测，覆盖首屏性能边界和打开状态更新检查所需的构建资产
- **Lint 门禁补齐**: 前端 lint 范围纳入 `config/` 构建源码，避免 Vite 分包和版本 manifest 规则绕过日常静态检查

## v1.8.253 (2026-06-20) - 本地隐私状态与辅助入口
### ✨ 新特性
- **本地隐私状态**: 底部状态栏新增“本地处理 / 本地大输入 / 本地 Worker / 智能修复中”状态，明确常规格式化、查询、结构导航、Schema 和类型生成默认在浏览器本地执行
- **AI 边界可见**: 状态说明补充智能修复会先走本地确定性规则，只有手动触发且本地规则无法修复时才可能调用已配置 AI
- **大输入保护提示**: 大输入和 Worker 转换状态会提示采样、结果上限、Worker 处理和处理期间复制/应用限制，让 JSON Editor Online 式本地大文件承诺在主界面可见

### 🎨 UI/UE 优化
- **高级排查降权**: 侧栏不再展示完整“进阶工作流”卡片，仅在文件和智能修复区域下方保留“更多 / 实验”折叠入口，避免低频排查工作台抢占格式化、查询和结构导航等主功能

### 📝 文档
- **隐私说明同步**: README 补充状态栏本地隐私、大输入保护、AI 调用边界和高级排查低频入口说明

### 🧪 测试
- **状态计算覆盖**: 新增 localProcessingStatus 单测，覆盖本地处理、大输入、Worker 和智能修复状态文案

## v1.8.252 (2026-06-20) - 结构语义 ID 线索
### ✨ 新特性
- **更多语义预览**: 结构导航字符串语义新增 UUID、时间戳和哈希摘要识别，便于在 response 中快速判断 trace、实验、资源校验和事件时间字段
- **时间戳上下文保护**: 10 位秒级和 13 位毫秒级时间戳只在字段名或路径包含时间语义时展示，避免普通数字 ID 被误标
- **哈希误判收敛**: 哈希摘要只识别 32/40/64 位且包含 a-f 的十六进制字符串，纯数字长串保持普通字符串

### 📝 文档
- **结构导航说明**: README 补充 UUID、时间戳和哈希语义预览范围

### 🧪 测试
- **语义识别覆盖**: 扩展 jsonValueSemantics 单测，覆盖 UUID、秒/毫秒时间戳、MD5 形态哈希、非上下文时间戳和纯数字长串不误判

## v1.8.251 (2026-06-20) - JSONPath 场景示例
### ✨ 新特性
- **场景示例推荐**: JSONPath 面板会根据当前 PREVIEW 结构自动生成场景示例，覆盖对象数组遍历、常见字段提取、布尔/状态/数值过滤和全局同名字段递归查询
- **查询学习路径补强**: 参考 jq playground 的即时示例体验，把静态语法示例扩展为贴合当前 response 的可点击查询模板，降低临时写 JSONPath 的成本
- **大输入保护**: 场景示例只在本地对合理大小的 JSON 做轻量分析，超大输入或非法 JSON 不生成推荐，避免影响大文件浏览体验

### 📝 文档
- **JSONPath 能力说明**: README 补充按当前 JSON 结构生成场景示例的能力说明

### 🧪 测试
- **场景示例覆盖**: 新增 jsonPathExamples 单测，覆盖数组遍历、字段提取、过滤查询、特殊字段安全写法和超大输入保护

## v1.8.250 (2026-06-20) - 高级排查入口降权
### ✨ 新特性
- **排查 recipe 导出**: 深度解析报告新增“复制 recipe”，生成不含原始 response 的可复用排查步骤 JSON，可按当前筛选复现深度解析、cmdHandler 对比、占位符回填、质量快照、问题样本回归和安全归档流程
- **按场景裁剪步骤**: recipe 会根据当前报告是否包含 CMD 结构、占位符、待检查或跳过记录自动组合步骤和建议命令，避免固定流水线噪音
- **隐私边界明确**: recipe 只保存步骤、筛选、计数和建议命令，不携带 SOURCE 原文、原始字段值或敏感参数

### 🎨 UI/UE 优化
- **高级排查降权**: 进阶工作流里的排查入口改名为“高级排查”并移到末尾，避免低频排查能力抢占结构图谱、语义预览和 Schema 等更常用路径
- **智能建议排序**: JSON / JSON Lines 内含 CMD 或 Scheme 时优先推荐“嵌套解析”和“结构导航”，把“高级排查”放到第三动作，减少误把复盘链路当作日常主流程

### 🧪 测试
- **Recipe 导出覆盖**: 新增 transformSummary 单测，覆盖 recipe 步骤组合、建议命令和原始值不外泄
- **建议排序覆盖**: 更新智能建议单测，覆盖 CMD / JSON Lines 场景下高级排查降权后的动作顺序

## v1.8.249 (2026-06-20) - 结构图谱视图
### ✨ 新特性
- **结构图谱视图**: 结构导航新增“列表 / 图谱”切换，可用轻量 SVG 图谱查看 JSON 父子关系，点击图谱节点仍会定位到 SOURCE 对应路径
- **筛选上下文保留**: 图谱模式复用现有搜索和类型筛选，筛选后自动保留命中节点的祖先路径，避免图谱只剩孤立节点
- **大结构保护**: 图谱按节点数量和深度做本地截断提示，不新增图形库依赖，也不影响首屏预加载预算

### 🧪 测试
- **图谱布局覆盖**: 新增结构图谱布局单测，覆盖节点坐标、父子边、深度截断和数量截断

## v1.8.248 (2026-06-20) - 进阶工作流与样本可信度
### ✨ 新特性
- **进阶工作流**: 侧栏底部新增折叠型进阶入口，集中串起结构图谱、排查配方、语义预览、契约可信和本地大文件路径，不抢占格式化、编码、查询等高频主功能
- **智能建议升级**: JSON / JSON Lines / 大 JSON / CMD 场景的智能建议补充第三个后续动作，可从排查报告继续进入结构导航、Schema 或类型生成
- **Schema 样本可信度**: Schema 生成后的可信提示新增 SOURCE 样本数和数组项采样比例，让单样本、多样本和长数组采样风险更清晰

### 🧪 测试
- **建议与契约覆盖**: 扩展智能建议和 Schema 推断单测，覆盖第三动作推荐、根数组多样本可信度和长数组采样项统计

## v1.8.247 (2026-06-20) - 健康检查与访客统计分流
### ⚡ 性能优化
- **流量口径隔离**: 新增 `/api/health` 作为部署和外部监控专用探活接口，避免健康检查请求混入前台 PV/UV
- **访客打点保留**: `/api/visitor/ping` 继续作为前台页面访问打点，防止优化健康检查时误伤真实访问统计
- **部署脚本更新**: GitHub Actions、本机 SSH 部署、远端 Docker Compose 健康检查和公网验证默认切换到 `/api/health`

### 📝 文档
- **API 矩阵更新**: 后端 API 权限矩阵和 CI/CD 文档补充 `/api/health`，明确健康检查与访客打点的数据边界

### 🧪 测试
- **流量过滤覆盖**: 新增 `TrafficFilterTest`，覆盖健康检查不写入访问日志、前台 ping 仍写入访问日志

## v1.8.246 (2026-06-20) - 后台首屏图表依赖隔离
### ⚡ 性能优化
- **后台图表依赖隔离**: 将 `@ant-design/charts`、`@ant-design/plots`、`@ant-design/graphs` 和 `@ant-design/charts-util` 明确归入图表 chunk，避免它们落入后台基础 `vendor-antd-deps` 后把 AntV / D3 / html2canvas 提前拉进 `admin.html`
- **后台首屏瘦身**: 后台首屏 `modulepreload` 从 35 个降到 10 个，初始 JS 从约 3291.7 KiB raw / 1005.8 KiB gzip 降到 1306.2 KiB raw / 427.3 KiB gzip，流量统计图表仍保留页面内按需加载
- **门禁补强**: `check:preloads` 新增后台入口检查，禁止后台首屏预加载 AntV、D3、html2canvas、图表工具和相关 graph/ml chunk，防止图表依赖再次回流首屏

### 🧪 测试
- **首屏预算覆盖**: 构建后通过主页面和后台页面 preload 门禁，持续守住主工具与后台首屏预算

## v1.8.245 (2026-06-20) - 智能粘贴识别
### ✨ 新特性
- **智能粘贴来源**: 点击 SOURCE 顶部“粘贴”后，如果剪贴板内容命中智能建议，会在侧栏建议卡片标记“剪贴板识别”，让从日志、IM、Charles 或浏览器复制来的 JSON / JSON Lines / URL 能直接进入下一步动作
- **竞品学习落地**: 参考 DevToys 的 Smart Detection、JSON Hero 的快速搜索、JSON Crack 的结构理解和 JSON Editor Online 的工作台能力，把本轮对标沉淀到产品工程评审文档，并优先推进“粘贴 -> 识别 -> 一键排查”路径
- **HTTPS 边界延续**: 智能粘贴复用现有 SOURCE 智能建议，普通 HTTP(S) URL 仍只推荐 URL 解码，不会被误导到业务 Scheme 面板

### 🧪 测试
- **剪贴板回归**: 扩展主应用 E2E，覆盖 JSON Lines 剪贴板推荐结构导航 / 转 TS、普通 HTTPS 剪贴板推荐 URL 解码，以及剪贴板来源标识展示

## v1.8.244 (2026-06-19) - Schema 问题同名字段查询
### ✨ 新特性
- **Schema 问题反查**: Schema 校验失败项新增“同名字段”动作，可从失败路径生成 `$..field` 或 bracket JSONPath 并打开 JSONPath 面板排查全局同名字段
- **查询复制**: 每条可定位问题新增“复制查询”，方便把同名字段 JSONPath 贴到协作排查文档或单独复用
- **特殊字段安全**: 复用 JSONPath 字段查询规则，`trace.id`、中文字段、数字字符串字段、包含引号或 URL 字符的字段会自动生成安全查询表达式

### 🧪 测试
- **Schema 联动覆盖**: 扩展 JSONPath 输入工具单测和 Schema 面板 E2E，覆盖 JSON Pointer 字段提取、同名字段查询、复制查询和精确路径定位共存

## v1.8.243 (2026-06-19) - JSON Lines 智能建议
### ✨ 新特性
- **JSON Lines 入口识别**: SOURCE 智能建议可识别合法 JSON Lines / NDJSON，直接推荐结构导航和 JSON 转 TS，不再把日志型多行 JSON 误当成坏 JSON
- **行级错误提示**: JSON Lines 只有后续某行解析失败时，会在智能建议中提示首个失败行号，并继续引导智能修复
- **CMD 工作流串联**: JSON Lines 内含 CMD / Scheme 字符串时仍会优先推荐 Response 排查工作流和嵌套解析报告
- **大输入保护**: 超大 JSON Lines 候选会跳过同步逐行解析并推荐结构导航 / 嵌套解析，避免误落到当前不适用的 Schema 入口

### 🧪 测试
- **智能建议覆盖**: 扩展智能建议单测和主应用 E2E，覆盖合法 JSON Lines、含 CMD 的 JSON Lines、坏行行号、超大 JSON Lines 和多行普通坏 JSON 的区分

## v1.8.242 (2026-06-19) - 二维码依赖按需分包
### ⚡ 性能优化
- **二维码依赖拆包**: 将 `qrcode.react` 从首屏通用 `vendor-tools` 拆到独立 `vendor-qrcode`，Scheme 二维码功能保持按需加载，减少低频二维码能力对首屏工具包的挤占
- **预加载门禁补强**: 首屏预加载检查新增 `vendor-qrcode` 禁止项，并扫描初始 JS 资产中的二维码实现特征，后续如果二维码依赖重新进入主页面会直接失败

### 🧪 测试
- **首屏预算覆盖**: 通过构建产物和 `check:preloads` 验证主页面不预加载二维码 chunk，继续守住首屏 JS raw/gzip 预算
- **二维码回归**: 扩展 Scheme 面板 E2E，覆盖二维码按钮打开后可渲染 canvas，防止分包后按需路径失效

## v1.8.241 (2026-06-19) - Schema 可信度摘要
### ✨ 新特性
- **Schema 契约提示**: 根据 SOURCE 生成 JSON Schema 后新增可信度摘要，展示对象数、字段数、required 数、可选字段、union 类型、format 识别和长数组采样数量
- **生成风险可见**: 手动编辑 Schema 后会清除推断摘要，避免把旧 SOURCE 的采样和可信度信息误认为当前 Schema 仍然适用

### 📝 文档
- **联网竞品复核**: 产品评审继续沉淀 JSON Editor Online、JSON Crack、JSON Hero、quicktype、CyberChef、DevToys 和 jq Playground 的学习点，将“契约可信度、可组合排查链路、本地隐私承诺、结构证据导出”列为后续重点

### 🧪 测试
- **Schema 推断覆盖**: 扩展 Schema 推断单测和主应用 E2E，覆盖 required/optional、union、format、长数组采样和手动编辑清除摘要

## v1.8.240 (2026-06-19) - Response 排查工作流
### ✨ 新特性
- **智能工作流**: SOURCE 智能建议在识别到 JSON 内含 CMD / Scheme 时新增“排查工作流”，一键切到嵌套解析并打开深度解析报告
- **竞品学习落地**: 参考 CyberChef recipe 和 DevToys Smart Detection，把单步推荐推进到可串联的 Response 排查入口，先复用现有报告能力，不新增复杂面板

### 🧪 测试
- **工作流覆盖**: 扩展智能建议单测和主应用 E2E，覆盖工作流按钮、模式切换和报告打开

## v1.8.239 (2026-06-19) - 深度解析报告首屏瘦身
### ⚡ 性能优化
- **报告模块按需加载**: 深度解析的一句话摘要拆到轻量工具，`App` 不再静态引入完整报告汇总模块，报告面板和占位符回填质量对比保持按需加载
- **模板回填延迟计算**: 只有应用占位符回填模板时才动态加载质量快照计算逻辑，普通模板应用不再进入报告模块链路

### 🧪 测试
- **摘要拆分回归**: 保留 `transformSummary` 对外导出并复用原有单测，覆盖深度解析摘要、报告和质量快照行为不变

## v1.8.238 (2026-06-19) - JSON 转 TS 按需加载
### ⚡ 性能优化
- **TS 生成按需加载**: JSON 转 TypeScript 从基础转换静态链路移到动态加载路径，小输入按需 import，大输入继续走 transform worker，低频类型生成不再随首屏同步加载，收回上一版可信度摘要带来的首屏包体压力
- **统一异步提示**: 异步转换占位文案从“大文件处理中”调整为通用处理提示，兼容小文件 JSON 转 TS 的动态加载路径

### 🧪 测试
- **异步转换覆盖**: 转换单测改为验证异步转换 helper，主应用 E2E 继续覆盖工具栏 JSON 转 TS 输出摘要、接口声明和可选字段

## v1.8.237 (2026-06-19) - TS 类型生成可信度摘要
### ✨ 新特性
- **TS 生成说明**: JSON 转 TypeScript 输出新增注释摘要，说明当前基于单样本、数组样本或空数组推断，并展示生成的对象类型数量
- **可信度提示**: 自动标出可选字段、混合 union 类型和空数组 `unknown[]` 风险，提醒用户用更多真实 response 样本复核 required 与 union 类型
- **结构节点同步**: 结构导航复制当前子树 TS 类型时也会带上同样摘要，让局部类型复制结果更可审查

### 📝 文档
- **竞品学习落地**: README、架构说明和产品评审同步记录 quicktype / Schema 类工具启发下的类型生成可信度说明能力

### 🧪 测试
- **TS 生成覆盖**: 补充 TypeScript 生成摘要单测、转换模式单测和主应用 E2E，覆盖样本数量、可选字段、混合类型与空数组提示

## v1.8.236 (2026-06-19) - 竞品调研与首屏瘦身
### ⚡ 性能优化
- **配置备份懒加载**: 设置备份导出/导入工具从主入口静态依赖改为点击时按需加载，释放首屏预加载预算，保持首屏编辑、格式化、JSONPath 和 Scheme 排查链路更轻

### 📝 文档
- **竞品扫描沉淀**: 产品与工程评审补充 JSON Hero、JSON Crack、JSONLint、quicktype、URL Parser 等同类工具学习点，明确后续优先做 CMD/Scheme 专业化、结构定位、Schema/类型契约和可组合排查链路

### 🧪 测试
- **备份回归保护**: 继续使用 appBackup 单测、类型检查、构建和预加载预算校验覆盖配置备份懒加载后的功能与包体变化

## v1.8.235 (2026-06-19) - 结构节点同名字段查询
### ✨ 新特性
- **结构反查字段**: 结构导航选中真实字段节点后新增“同名字段”动作，可一键生成 `$..field` 或 bracket 递归 JSONPath 并打开查询面板
- **特殊字段安全**: `trace.id`、中文字段、包含空格或 URL 字符的 key 会自动生成 `$..["..."]` 查询，根节点和数组下标不展示同名字段动作

### 📝 文档
- **查询闭环增强**: README、架构说明和产品评审同步记录结构导航到 JSONPath 的递归字段查询能力，继续补齐 JSONPath Finder 式低门槛排查体验

### 🧪 测试
- **结构导航覆盖**: 扩展字段查询 formatter 单测和结构导航 E2E，覆盖特殊 key 生成递归查询、数组项隐藏同名字段动作和 JSONPath 面板联动

## v1.8.234 (2026-06-19) - JSONPath 结果定位结构导航
### ✨ 新特性
- **结果回到结构**: JSONPath 查询结果新增“结构”动作，可把当前命中项直接定位到结构导航节点，快速查看上下文、Pointer、子树和语义标签
- **特殊 key 稳定定位**: 结构导航外部定位优先使用 JSON Pointer 匹配，`trace.id`、数组下标和 JSON Lines 等路径不再依赖字符串 JSONPath 比对

### 📝 文档
- **闭环排查**: README、架构说明和产品评审同步记录 JSONPath 查询结果与结构导航的双向联动，承接 JSON Hero / JSONPath Finder 类工具的查找上下文体验

### 🧪 测试
- **联动覆盖**: 新增结构导航外部定位纯函数单测，扩展 JSONPath E2E 覆盖命中结果打开结构导航并选中对应节点

## v1.8.233 (2026-06-19) - JSONPath 字段名快捷查询
### ✨ 新特性
- **字段名直查**: JSONPath 面板支持直接输入 `traceId`、`action_cmd` 等字段名，查询时自动转成 `$..traceId`、`$..action_cmd` 递归查询
- **特殊字段保护**: `button-cmd`、`trace.id`、中文字段等会自动生成 bracket JSONPath，标准 `$` / `@` 表达式保持原样，不干扰高级查询

### 📝 文档
- **查询门槛降低**: README、架构说明和产品评审同步记录字段名快捷查询能力，承接 JSON Path Finder 类工具的快速找字段体验

### 🧪 测试
- **JSONPath 覆盖**: 新增字段名归一化单测，扩展 JSONPath 面板 E2E 覆盖字段名自动转递归查询和结果展示

## v1.8.232 (2026-06-19) - JSONPath Response 常用预设
### ✨ 新特性
- **Response 快查**: JSONPath 面板新增 `action_cmd`、`button_cmd`、`scheme`、`url`、`params`、`traceId` 常用查询预设，可一键填入并执行递归查询
- **查询链路复用**: 预设点击沿用现有查询、结果预览、历史记录、路径和值复制与 PREVIEW 高亮能力，不新增额外面板负担

### 📝 文档
- **竞品学习落地**: README、架构说明和产品评审同步记录 JSON Path Finder / jq 类工具的高频字段快查思路

### 🧪 测试
- **JSONPath 覆盖**: 扩展 JSONPath 面板 E2E，覆盖 Response 常用预设的可访问文案、自动填入、查询执行和结果展示

## v1.8.231 (2026-06-19) - 结构语义继续解析
### ✨ 新特性
- **语义值继续解析**: 结构导航选中 URL、Scheme、JWT、Base64 或资源 URL 字符串时，节点详情区新增“继续解析”动作，可直接把原始值送入 Scheme/编码解析面板继续排查
- **普通语义保护**: 电话、邮箱、日期、颜色等只展示语义标签，不展示解析入口；普通 HTTP(S) 仍保持 URL 语义，不会被自动当成业务 Scheme

### 📝 文档
- **竞品学习落地**: README、架构说明和产品评审同步记录结构语义识别到后续工具链的串联能力

### 🧪 测试
- **结构导航覆盖**: 补充语义值继续解析 E2E，覆盖电话语义不触发解析、业务 Scheme 语义可打开 Scheme 面板并预填原始值

## v1.8.230 (2026-06-19) - 结构导航复制 TS 类型
### ✨ 新特性
- **节点直出类型**: 结构导航选中对象或数组节点后，可直接复制当前子树的 TypeScript `interface` / `type` 声明，不必再把整份 JSON 切到 JSON 转 TS
- **数组元素命名**: 选中 `$.items[0]` 这类数组元素时会沿用父数组名称生成 `ItemsItem`，避免回退成泛化的 `Root`

### 📝 文档
- **节点继续操作**: README、架构说明和产品评审同步记录结构导航与 quicktype 式类型生成的串联能力

### 🧪 测试
- **结构导航覆盖**: 扩展结构导航 E2E，覆盖数组节点和数组元素复制 TS 类型；补充 JSON 转 TS 自定义根类型名单测

## v1.8.229 (2026-06-19) - SOURCE 智能建议
### ✨ 新特性
- **输入智能识别**: 侧栏会根据当前 SOURCE 自动推荐下一步动作，复杂 response 优先提示嵌套解析报告，独立 CMD/Scheme 优先提示 Scheme 面板，复杂 JSON 优先提示结构导航，简单 JSON 可直接推荐 TS 或 Schema
- **HTTPS 误判保护**: 普通 HTTP(S) URL 只推荐 URL 解码，不再被当成业务 Scheme；带可展开 action 参数的 HTTP(S) 链接仍会推荐 Scheme 面板

### 📝 文档
- **竞品学习落地**: README、架构说明和产品评审同步记录 DevToys Smart Detection 类能力的第一步落地，后续可继续扩展到剪贴板检测和工具链串联

### 🧪 测试
- **建议逻辑覆盖**: 新增智能建议单测，覆盖 JSON 内嵌 Scheme、独立 Scheme、普通 HTTPS、可展开 HTTPS 参数、坏 JSON、复杂 JSON 和简单 JSON；E2E 覆盖建议动作切换到深度解析报告和普通 HTTPS URL 解码

## v1.8.228 (2026-06-19) - Schema 生成采样摘要
### ✨ 新特性
- **采样摘要可见**: JSON Schema 生成后会展示长数组采样摘要，说明路径、总项数、采样项数、稀疏字段扫描范围和 strict/loose required 策略
- **稀疏字段提示**: 长数组后段字段被代表行捕获时，摘要会列出 `cmdSchema`、`traceId` 等命中的稀疏字段；超过前 200 项扫描上限时会提示仍需用结构导航搜索确认超后段字段

### 📝 文档
- **转换可信度补齐**: README、架构说明和产品评审同步更新 Schema 采样摘要能力，承接“转换后如何检查结果是否可信”的路线

### 🧪 测试
- **采样摘要覆盖**: 扩展 Schema 推断单测和 Schema 面板 E2E，覆盖长数组采样摘要、稀疏字段命中、扫描上限和手动编辑后清除摘要

## v1.8.227 (2026-06-19) - JSON 对比差异行路径动作
### ✨ 新特性
- **差异行可行动**: JSON 对比结果每行新增 `Path`、`Ptr` 和“定位”动作，可直接复制 JSONPath、复制 JSON Pointer，或把修改/删除项联动到 JSONPath 面板定位 SOURCE 原值
- **新增项定位保护**: 新增差异只存在于对比 JSON，定位 SOURCE 动作会置灰并给出禁用说明，避免误导用户

### 📝 文档
- **路径级协作升级**: README、架构说明和产品评审同步补充差异行复制路径、复制 Pointer 和定位 SOURCE 能力

### 🧪 测试
- **路径动作覆盖**: 扩展语义 diff 单测和 JSON 对比 E2E，覆盖特殊 key Pointer 转义、Path/Pointer 复制、SOURCE 定位和新增项禁用定位

## v1.8.226 (2026-06-19) - JSON 对比忽略路径
### ✨ 新特性
- **忽略噪声路径**: JSON 对比面板新增忽略路径输入，可按 JSONPath 前缀排除 `$.traceId`、`$.meta.updatedAt` 等时间戳、追踪 ID 或埋点字段，让报告聚焦真实业务差异
- **报告保留上下文**: 复制 Markdown 对比报告会写入当前忽略路径，协作方能判断哪些差异被主动过滤

### 📝 文档
- **路径级协作补齐**: README、架构说明和产品评审同步更新 JSON 对比能力，承接 JSON Diff / JSON Path Finder 类工具的路径级对比学习点

### 🧪 测试
- **对比回归覆盖**: 补充语义 diff 忽略路径、忽略路径输入解析和 JSON 对比 E2E，验证列表、摘要和复制报告保持一致

## v1.8.225 (2026-06-19) - Schema 长数组采样补强
### ✨ 新特性
- **长数组 Schema 推断**: JSON Schema 生成从仅采样数组前 20 项升级为前段、尾段、分散点和稀疏字段代表行采样，真实 response 后段才出现的 `cmdSchema`、`traceId` 等字段不再容易漏出 Schema
- **竞品调研落地**: 结合 JSON Hero 的结构推断、JSON Crack 的 Schema/类型生成和 JSON Editor Online 的大文件工作台思路，将“长列表结构可信推断”补到当前 Schema 生成链路

### 📝 文档
- **同类工具复核**: 产品与工程评审补充 quicktype、DevToys 智能检测、JSONLint Repair、JSON Diff 和 JSONPath Finder 等学习点，沉淀为 Schema 可信度、工具串联和路径级协作待办

### 🧪 测试
- **采样覆盖**: 新增长数组后段稀疏字段和后段类型差异单测，确保稀疏字段不会误标 required，尾部类型差异能参与合并

## v1.8.224 (2026-06-19) - 结构导航搜索历史
### ✨ 新特性
- **最近搜索词**: 结构导航会记录最近 10 个搜索词，按 Enter、点击节点或复制筛选结果后自动置顶，方便反复排查 `cmdSchema`、`traceId`、`phone` 等字段
- **配置备份同步**: 结构导航搜索历史会随配置备份导出/导入，跨浏览器或机器恢复常用排查关键词

### 🧪 测试
- **历史交互覆盖**: 新增通用最近列表单测，扩展结构导航和配置备份 E2E，覆盖回填、删除、清空、导出和导入

## v1.8.223 (2026-06-19) - 结构数组表格稀疏字段重采样
### ✨ 新特性
- **稀疏字段可定位**: 结构导航对象数组表格会在受限行数内扫描完整字段，字段只出现在后几行时也能通过列筛选找到
- **筛选行重采样**: 列筛选命中当前预览行没有值的稀疏字段时，会改为展示包含该字段的样本行，CSV / JSON 复制直接带出真实值

### 🧪 测试
- **稀疏列覆盖**: 扩展表格预览单测和结构导航 E2E，覆盖第 9 行以后才出现的字段筛选与 CSV 复制

## v1.8.222 (2026-06-19) - 结构数组表格全列搜索
### ✨ 新特性
- **隐藏列可搜索**: 结构导航对象数组表格列筛选会搜索采样行中的完整列清单，即使字段没有出现在默认前几列，也可以通过列名筛出来
- **筛选复制保真**: 搜索隐藏列后，表格 JSON / CSV 复制会使用该字段的原始值，继续保持当前可见列导出语义

### 🧪 测试
- **隐藏列覆盖**: 扩展表格预览单测，覆盖超过列上限后的隐藏字段筛选、空值单元格和 JSON / CSV 输出

## v1.8.221 (2026-06-19) - 结构数组表格列筛选
### ✨ 新特性
- **表格列筛选**: 结构导航选中对象数组时，表格预览新增列名筛选输入，可在列表型 response 中快速聚焦关键字段
- **复制联动**: 表格 JSON / CSV 复制会跟随当前列筛选，只导出可见列，方便直接粘贴到表格工具或排查文档

### 🧪 测试
- **表格工具覆盖**: 新增列筛选纯函数单测，验证筛列后 JSON / CSV 输出只包含可见字段
- **结构导航回归**: 扩展结构导航 E2E，覆盖列筛选后的 CSV 与 JSON 复制结果

## v1.8.220 (2026-06-19) - 结构节点 JWT 与 Base64 语义
### ✨ 新特性
- **JWT 语义提示**: 结构导航选中 JWT 字符串时，会在节点详情区展示 `JWT` 标签和 header / payload 字段摘要，快速判断 token 结构
- **Base64 语义提示**: 结构导航选中 Base64 字符串时，会展示 `Base64` 标签，并以 JSON 字段摘要或文本长度描述解码结果，避免直接铺开敏感明文

### 🧪 测试
- **语义识别覆盖**: 新增 JWT、Base64 JSON、Base64 可读文本和误判规避单测
- **结构导航回归**: 扩展结构导航 E2E，验证 JWT 与 Base64 标签在真实面板中可见

## v1.8.219 (2026-06-19) - 结构节点资源语义
### ✨ 新特性
- **资源 URL 语义提示**: 结构导航选中图片、视频、Lottie、音频或包资源 URL 时，会在详情区显示对应资源类型标签
- **素材字段识别**: 资源类型优先依据 URL 路径后缀判断，Lottie 额外结合字段上下文识别 `.json` / `.zip` 动效资源，避免普通下载页或接口页被误标为素材

### 🧪 测试
- **资源类型覆盖**: 新增语义单测，覆盖图片、视频、Lottie、音频、包资源、普通 URL 和下载页不误标资源
- **结构导航回归**: 扩展结构导航 E2E，验证图片资源字段会展示资源语义标签

## v1.8.218 (2026-06-19) - 结构节点电话语义
### ✨ 新特性
- **电话语义提示**: 结构导航选中电话相关字段时，会在详情区识别手机号、400/800 电话和座机格式，帮助快速判断拨打链路字段
- **误判收敛**: 电话识别必须结合字段名或路径上下文，避免把 `id`、`traceId`、订单号等 11 位数字误标为电话

### 🧪 测试
- **语义识别覆盖**: 新增电话语义单测，覆盖手机号遮罩、`+86`、400 电话、座机和非电话字段误判规避
- **结构导航回归**: 扩展结构导航 E2E，验证 `phone` 字段展示电话语义，同值 `id` 字段不展示电话语义

## v1.8.217 (2026-06-19) - 结构结果 CSV 摘要
### ✨ 新特性
- **CSV 摘要复制**: 结构导航搜索或类型筛选后，“结果”下拉新增 CSV 摘要，可直接粘贴到表格工具继续筛选、排序和归档
- **路径级协作补齐**: 搜索结果复制现已覆盖 JSON、Markdown 和 CSV 三种常用协作格式，仍保持顶部紧凑入口

### 🧪 测试
- **CSV 格式覆盖**: 新增结构搜索结果 CSV 单测，覆盖特殊 key、逗号、空格、换行预览和根节点
- **交互回归**: 扩展结构导航 E2E，覆盖 CSV 摘要复制并保留 JSON / Markdown 复制断言

## v1.8.216 (2026-06-19) - 结构结果 Markdown 摘要
### ✨ 新特性
- **Markdown 摘要复制**: 结构导航搜索或类型筛选后，“结果”入口可选择复制 JSON 清单或 Markdown 表格摘要，方便粘贴到排查文档和协作沟通
- **紧凑复制入口**: “结果”保持为顶部下拉触发器，不额外增加横向按钮，避免压缩结构导航搜索输入区域

### 🧪 测试
- **格式化覆盖**: 新增结构搜索结果 Markdown 单测，覆盖特殊 key、管道符、反斜杠、根节点和空结果
- **交互回归**: 扩展结构导航 E2E，覆盖 Markdown 摘要复制并保留 JSON 清单复制断言

## v1.8.215 (2026-06-19) - 结构节点语义预览
### ✨ 新特性
- **节点语义提示**: 结构导航选中字符串节点时，会在详情区识别 URL、Scheme、邮箱、日期时间、日期和颜色，帮助快速判断字段含义
- **普通 HTTPS 区分**: 普通 `http/https` 字符串只展示为 URL 语义提示，不改变业务 Scheme 解析入口判断

### 🧪 测试
- **语义识别覆盖**: 新增纯函数单测覆盖 URL、Scheme、邮箱、日期、颜色和非法日期
- **结构导航回归**: 扩展结构导航 E2E，验证 URL 字符串节点详情会展示语义标签

## v1.8.214 (2026-06-19) - 结构导航搜索高亮
### ✨ 新特性
- **搜索命中高亮**: 结构导航搜索时会高亮节点名称和值预览中的精确命中片段，保留原有模糊匹配能力，同时让精确命中更容易扫到

### 📝 文档
- **竞品调研复核**: 补充 JSON Hero、JSON Crack、jsoneditor、DevUtils、OK JSON 等同类工具学习点，并沉淀为结构检查器、桌面效率和转换可信度待办

### 🧪 测试
- **回归保护**: 扩展结构导航 E2E，覆盖 `trace.id` 搜索后的行内高亮展示

## v1.8.213 (2026-06-19) - 结构检查器类型筛选
### ✨ 新特性
- **按类型筛选节点**: 结构导航新增节点类型筛选，可直接查看对象、数组、字符串、数字、布尔或空值节点，适合在大 response 中快速定位列表和叶子字段
- **筛选结果复制联动**: “结果”复制会跟随当前搜索词和类型筛选，只复制用户当前看到的匹配节点结构清单

### 🧪 测试
- **回归保护**: 扩展结构导航 E2E，覆盖数组类型筛选、可见节点数量和过滤后结果复制内容

## v1.8.212 (2026-06-19) - 结构检查器复制结果
### ✨ 新特性
- **复制搜索结果**: 结构导航搜索后可复制当前匹配结果，输出包含 JSONPath、JSON Pointer、类型、子节点数和值预览的结构化 JSON 清单
- **复制节点子树**: 选中对象或数组节点时新增“子树”复制入口，直接复制当前节点完整格式化 JSON，列表型 response 可更快发给协作者复现

### ⚡ 性能优化
- **关闭态性能预算**: `perf:e2e` 新增已加载面板关闭后切换大输入的浏览器预算，覆盖 JSONPath、结构导航和深度解析报告的关闭态回归

### 🧪 测试
- **回归保护**: 补充结构搜索结果 formatter 单测，并扩展结构导航 E2E 与浏览器性能预算，覆盖搜索结果、节点子树剪贴板内容和关闭态大输入切换

## v1.8.211 (2026-06-19) - 结构检查器数组表格
### ✨ 新特性
- **对象数组表格预览**: 结构导航选中对象数组时会展示前几行表格，自动按样本字段合并列，并标记行数或列数截断状态
- **表格复制能力**: 数组表格支持复制当前预览为 JSON 或 CSV，CSV 会处理逗号、引号、换行和首尾空白，方便粘贴到表格工具继续排查
- **竞品启发落地**: 参考同类 JSON 工具的 table mode 和多格式转换能力，把列表型 response 的阅读入口补到结构检查器里

### 🧪 测试
- **回归保护**: 补充对象数组表格模型单测和结构导航 E2E，覆盖混合数组兜底、CSV 转义、表格展示与复制链路

## v1.8.210 (2026-06-19) - 结构检查器节点详情
### ✨ 新特性
- **节点详情面板**: 结构导航选中节点后会展示类型、子节点数、JSONPath、JSON Pointer 和值预览，搜索命中后能直接看清节点上下文
- **节点复制能力**: 结构导航支持复制 JSONPath、JSON Pointer、紧凑节点值和格式化节点值，复制值使用真实节点数据而不是截断预览
- **Pointer 语义打通**: 结构树遍历时直接生成 RFC6901 JSON Pointer，JSONPath 查询结果也带出 pointer 字段，为后续结构检查器与 JSONPath 面板联动打基础

### 🧪 测试
- **回归保护**: 补充 JSON Pointer 工具、结构树节点值复制、JSONPath pointer 输出和结构导航 E2E，覆盖特殊 key、JSON Lines、根节点与非法 pointer

## v1.8.209 (2026-06-19) - 结构导航模糊搜索
### ✨ 新特性
- **结构导航搜索升级**: 结构导航支持多关键词和字符顺序模糊匹配，例如 `usr dnm` 可命中 `userProfile.displayName`，大 response 里按记忆片段找字段更快
- **匹配数量反馈**: 搜索时底部状态会展示当前匹配数和总节点数，方便判断关键词是否过宽或过窄
- **PM 评审沉淀**: 产品与工程评审文档补充竞品启发后的下一阶段路线，优先推进结构检查器、节点详情和数组表格视图

### ⚡ 性能优化
- **关闭态轻量化**: 深度解析报告面板关闭时不再构建 report、reportView 和质量快照，避免面板已关闭后仍随输入变化做重型派生计算

### 🧪 测试
- **回归保护**: 补充结构导航 fuzzy search 单测，并复跑结构树、深度报告和浮动面板相关用例

## v1.8.208 (2026-06-19) - 深度解析参数摘要
### ✨ 新特性
- **深度报告参数层**: 深度格式化/解析的报告、诊断摘要、协作排查报告和质量快照都会统计 Scheme Query 参数分层，展示参数层数量、修复提示数量、不可回写数量和 Top key/source
- **修复线索脱敏**: 参数分层摘要只保留路径、key、来源、长度、修复提示和可回写状态，不输出手机号、token、原始 URL 编码、解码文本或重新编码内容，方便安全协作
- **竞品启发沉淀**: 参考 JSON Editor Online、JSON Hero、JSON Crack、CyberChef 等工具，将“结构搜索、可视化、离线安全、修复解释、Schema/类型生成”列为后续产品升级方向

### 🧪 测试
- **回归保护**: 补充电话 Scheme 和 malformed `params` 的深度解析报告测试，锁定参数层聚合、loose JSON 修复提示和导出内容不泄露原值

## v1.8.207 (2026-06-19) - Scheme 参数分层质量快照
### ✨ 新特性
- **参数分层摘要**: Scheme 解析质量摘要会在识别到 Query 参数分层时展示参数层数量和修复提示数量，复杂 `params` 解析是否触发 loose JSON 修复更容易在面板顶部发现
- **脱敏质量快照**: 复制质量快照新增参数来源、参数 key、修复提示、可回写状态和各阶段长度统计，不输出 `raw`、`urlDecoded`、`parsed`、`reencoded` 原始参数内容，方便发给协作者排查
- **安全说明补充**: 快照 safety notes 明确运行时占位符 token 与真实业务参数值的边界，避免把占位符类别误读为完整原始值

### 🧪 测试
- **回归保护**: 补充带手机号和 token 哨兵值的参数分层快照测试，断言协作快照仅包含脱敏聚合信息，不泄露原始 URL 编码、解码文本或回写预览

## v1.8.206 (2026-06-19) - Scheme 分层解析链路
### ✨ 新特性
- **解析链路可见**: Scheme 面板的解码层级升级为“解析链路”明细，每层展示解析类型、可回写/只读状态、输入输出字符数和前后内容预览，方便定位 URL Decode、JSON 字符串解析、Base64 或 CMD 参数展开在哪一层发生变化
- **复杂 params 兜底**: `baiduboxapp://...makePhoneCall?params=%7b...%2ctype%22...%7d` 这类 URL 编码内嵌半坏 JSON 的参数会继续修复为对象，并在参数分层中标出 raw、URL Decode、JSON/CMD 解析、修复提示和重新编码预览
- **链路证据保留**: `DecodeLayer` 新增每层输出内容，`SchemeDecodeResult` 新增 Query 参数分层证据，后续复制质量快照、问题样本和解析报告时可以复用同一份转换证据

### 🧪 测试
- **回归保护**: 补充真实 makePhoneCall Scheme、双层 JSON 字符串转义和 Scheme 面板解析链路 E2E 断言，锁住 URL 编码 + JSON 反转义组合场景

## v1.8.205 (2026-06-19) - 结构导航 Worker 化
### ⚡ 性能优化
- **结构导航异步解析**: 结构导航从主线程同步 `JSON.parse` 改为独立 Worker 构建树模型，大 JSON 打开结构树时不再长时间阻塞编辑器交互
- **请求取消保护**: SOURCE/PREVIEW 变化或面板关闭时会终止旧 Worker，只接收最新 requestId 的结果，避免旧解析结果覆盖新内容
- **状态反馈**: 结构导航在等待 Worker 返回时展示“正在解析”状态，保留原有搜索、展开、折叠、复制路径和 JSONPath 定位体验

### 🧪 测试
- **回归保护**: 复用结构导航 E2E、结构树模型单测、全量类型检查和构建预算，验证 Worker 化后路径搜索与 JSONPath 联动仍然可用

## v1.8.204 (2026-06-19) - JSON 语义对比
### ✨ 新特性
- **通用 JSON 对比**: 工具栏新增“JSON 对比”浮动面板，可用当前 SOURCE 作为基线，粘贴另一份 JSON / JSON Lines 后输出路径级新增、删除和修改差异
- **协作报告复制**: 对比结果可一键复制 Markdown 报告，包含差异汇总、JSONPath 路径和变更前后预览，方便发给接口维护者或沉淀排查记录
- **布局与备份同步**: JSON 对比面板复用浮动面板布局能力，支持拖拽、调整尺寸、布局重置和配置备份导入导出

### 🧪 测试
- **回归保护**: 补充语义 diff 单测、布局备份覆盖和 JSON 对比 E2E，验证特殊 key、JSON Lines、截断、路径级结果与报告复制

## v1.8.203 (2026-06-19) - JSON 转 TypeScript
### ✨ 新特性
- **类型声明生成**: 工具栏新增“JSON 转 TS”，可从当前 JSON / JSON Lines 生成 `export interface Root` 或 `export type Root`，方便接口 response 直接沉淀为前端类型声明
- **数组样本合并**: 对象数组会合并多条样本字段，缺失字段自动标记为可选，字符串 / 数字 / 布尔 / null 会生成对应 union 类型
- **特殊字段兼容**: 非标准 TypeScript 字段名会自动加引号，嵌套对象和对象数组会生成稳定的子 interface 名称

### 🧪 测试
- **回归保护**: 补充类型生成单测、转换入口单测和主流程 E2E，覆盖嵌套对象、JSON Lines、可选字段和工具栏入口

## v1.8.202 (2026-06-19) - JSON 结构导航
### ✨ 新特性
- **结构导航面板**: 工具栏新增“结构导航”，可按树形结构浏览当前 PREVIEW JSON / JSON Lines，展示对象、数组、基础值类型、节点路径和值预览
- **路径搜索与定位**: 结构导航支持搜索字段、路径和值预览；点击节点会复用 JSONPath 查询面板定位并高亮对应 PREVIEW 内容，特殊 key 会自动使用 bracket JSONPath
- **布局与备份同步**: 结构导航复用浮动面板能力，支持拖拽、调整尺寸、布局重置和配置备份导入导出

### 🧪 测试
- **回归保护**: 补充结构树模型单测、布局备份覆盖和结构导航 E2E，验证搜索、特殊 key 路径和 JSONPath 联动定位

## v1.8.201 (2026-06-19) - 智能修复可信闭环
### ✨ 新特性
- **智能修复来源可见**: 修复摘要会区分“本地规则修复”和“AI 模型修复”，本地修复会展示命中的确定性规则，例如修正常见 JS 对象写法、移除尾随逗号、移除 JSON 注释和转义字符串内换行/控制字符
- **隐私优先链路**: 智能修复会先尝试本地规则修复；只有本地不可修复、准备调用 AI 时才做敏感字段拦截，常见含 token/sign/device 字段但本地可修的 JSON 不再被误拦截，也不会发送到模型
- **前端文案统一**: 工具栏按钮、错误条快捷修复、功能引导和复制摘要提示统一改为“智能修复”，避免用户误以为每次点击都会调用 AI 服务

### 🧪 测试
- **回归保护**: 补充本地修复规则标签、修复来源摘要、敏感字段本地可修/不可修分支和前端智能修复文案 E2E 用例

## v1.8.200 (2026-06-19) - 前端版本更新日志
### ✨ 新特性
- **版本更新入口**: 底部状态栏版本号可打开前端版本更新弹窗，登录或进入主工具后不再只能看到“有新版本”而不知道改了什么
- **更新提示联动**: 新版本 Toast 新增“查看更新”操作，并从线上 `version.json` 读取最近 changelog 片段，长时间打开旧页面时也能在刷新前查看目标版本的变更说明
- **构建数据源**: Vite 构建会把根目录 `CHANGELOG.md` 注入前端并写入 `version.json`，前端展示和仓库更新日志复用同一份内容，降低文案漂移风险

### 🧪 测试
- **回归保护**: 补充 changelog 解析、版本 manifest changelog 字段和前端弹窗入口 E2E 用例，覆盖状态栏入口与线上更新提示入口

## v1.8.199 (2026-06-19) - Schema AllOf 根约束示例
### ✨ 新特性
- **JSON Schema 示例**: `allOf` 示例生成会同时合并根级 Schema 和各分支 Schema 的候选结果，避免“基础对象字段在根上、额外必填字段在 allOf 分支里”时只保留分支字段而丢失根级字段
- **自校验择优**: 合并后会优先选择能通过整体 `allOf` Schema 的示例，基础对象 + 扩展约束、接口通用字段 + 场景字段等组合写法可直接复制/应用并通过校验

## v1.8.198 (2026-06-19) - Schema 条件分支示例
### ✨ 新特性
- **JSON Schema 示例**: 对象示例生成支持常见 `if` / `then` / `else` 条件分支，会根据当前生成对象判断命中的条件分支，并合并分支子 Schema 生成出的字段，判别字段、支付方式、类型分流等接口 Schema 示例不再容易缺少分支必填字段
- **约束一致性**: 条件分支合并继续复用对象字段准入规则，遵守根对象 `propertyNames` 和 `additionalProperties:false`，并在分支字段触发对象依赖时继续补齐依赖字段

## v1.8.197 (2026-06-19) - Schema 依赖子 Schema 示例
### ✨ 新特性
- **JSON Schema 示例**: 对象示例生成支持 `dependentSchemas` 和 schema 型 `dependencies`，字段出现后会尝试从被触发的子 Schema 生成并合并依赖字段，支付方式、订阅模式、登录态等联动对象可直接生成可校验示例
- **兼容边界**: 合并依赖子 Schema 时仍遵守根对象 `propertyNames` 和 `additionalProperties:false`，不可满足的依赖组合继续由最终自校验提示失败路径，避免静默塞入非法字段

## v1.8.196 (2026-06-19) - Schema 对象依赖示例
### ✨ 新特性
- **JSON Schema 示例**: 对象示例生成支持 `dependentRequired` 和老版 `dependencies` 数组依赖，生成 required/properties 后会自动补齐被当前字段触发的依赖字段，避免登录态、支付信息、类型标识等接口 Schema 示例缺少联动字段后被自校验拦截
- **链式补齐**: 依赖字段会按当前已生成字段闭环补齐，支持 `a -> b -> c` 这类链式依赖；若依赖字段被 `propertyNames` 或 `additionalProperties:false` 阻断，仍由最终自校验给出明确失败路径

## v1.8.195 (2026-06-19) - Schema 组合分支示例
### ✨ 新特性
- **JSON Schema 示例**: `oneOf` / `anyOf` 分支示例会优先选择能通过当前组合 Schema 整体校验的候选，避免第一个分支生成值与其它分支重叠或自身超过安全上限时，明明后续分支可用却被自校验拦截
- **回归保护**: 补充 `oneOf` 重叠字符串分支和 `anyOf` 超限数组分支的示例生成用例，确保组合 Schema 能返回可复制、可应用的合法示例

## v1.8.194 (2026-06-19) - Schema 短字符串唯一示例
### ✨ 新特性
- **JSON Schema 示例**: `uniqueItems` 字符串数组在遇到 `maxLength: 1`、单字符 `pattern` 或固定长度大写 `pattern` 时，会生成 `A/B/C`、`AAA/AAB/AAC` 这类不重复且可校验的短值，避免短 code、状态位、权限标识等 Schema 示例被自校验拦截
- **兼容策略**: 普通字符串数组仍保持 `string/string2/string3` 的既有示例风格，仅在后缀会违反长度或 pattern 约束时启用短候选，降低对已有协作样例的扰动

## v1.8.193 (2026-06-19) - Schema 数组示例扩容
### ✨ 新特性
- **JSON Schema 示例**: 常见 `minItems` / `minContains` 下限会按约束扩展示例数组，最多生成 8 项，`minItems: 5`、`minContains: 5` 这类接口列表 Schema 可直接复制/应用并通过校验
- **安全边界**: 普通数组仍默认生成短示例；超出安全上限或约束矛盾的 Schema 继续由生成后自校验拦截并提示失败路径，避免输出过大的示例 JSON

## v1.8.192 (2026-06-19) - Schema 示例自校验
### ✨ 新特性
- **JSON Schema 示例**: 复制或应用示例前会用当前 Schema 对生成结果做自校验，若示例无法满足 `minItems`、组合约束等规则，会提示首个失败路径并阻止覆盖 SOURCE，避免“工具生成的示例一应用就校验失败”
- **回归保护**: 补充数组下限和 `not` 组合约束的自校验用例，并在 Schema 面板 E2E 中确认失败示例不会覆盖当前 SOURCE

## v1.8.191 (2026-06-19) - Schema 收藏导入校验
### ✨ 新特性
- **JSON Schema 收藏**: 导入共享包时会跳过无法解析或不像 JSON Schema 的 `schemaText`，并在提示中区分重复项和无效项，避免团队共享包“导入成功但后续校验才失败”
- **协作兼容**: Schema 收藏导入支持布尔 JSON Schema，同时保留重复项跳过和收藏上限策略，保证共享包合并结果稳定可预期

## v1.8.190 (2026-06-19) - Schema 必填路径定位
### ✨ 新特性
- **JSON Schema 校验**: `required` 缺失字段问题会定位到具体缺失字段路径，例如 `$.items[0].price`，复制报告、修复清单和路径清单不再只停留在父对象，协作修复时更容易直接找到应补字段
- **协作报告**: Schema 校验报告的每条问题补充 `Schema` 约束路径，发给接口维护者时可同时定位 JSON 数据路径和 Schema 规则路径，且仍不包含原始 JSON 或完整 Schema 内容

## v1.8.189 (2026-06-19) - Schema 唯一 Contains 示例
### ✨ 新特性
- **JSON Schema 校验**: 示例 JSON 生成优化 `contains` / `minContains` 与 `uniqueItems` 组合约束，重复匹配元素会生成更自然的递增值，且不会改写原本已经唯一的普通元素，事件流、错误列表等数组 Schema 示例可直接通过校验

## v1.8.188 (2026-06-19) - Schema Contains 数组示例
### ✨ 新特性
- **JSON Schema 校验**: 示例 JSON 生成支持 `contains` / `minContains` 数组约束，会优先生成满足条件的元素，再按 `minItems` 补足普通元素，减少事件列表、错误列表等“至少包含某类对象”的 Schema 示例失败

## v1.8.187 (2026-06-19) - Schema 唯一数组示例
### ✨ 新特性
- **JSON Schema 校验**: 示例 JSON 生成支持 `uniqueItems` 数组，字符串、数字和常见对象数组会生成不重复元素，避免标签、ID 列表、权限项等 Schema 示例一生成就违反唯一性约束

## v1.8.186 (2026-06-19) - Schema 字符串 Pattern 示例
### ✨ 新特性
- **JSON Schema 校验**: 示例 JSON 生成支持常见字符串 `pattern`，如订单号 `^ORD-[0-9]+$`、固定长度 trace code `^[A-Z]{3}-\\d{4}$` 等字段会生成更接近约束的样例，减少“复制/应用示例后立即校验失败”的情况

## v1.8.185 (2026-06-19) - Schema 动态对象示例
### ✨ 新特性
- **JSON Schema 校验**: 示例 JSON 生成支持 `patternProperties`、`additionalProperties`、`propertyNames` 和 `minProperties` 的常见动态对象写法，动态 map 类 Schema 不再容易生成 `{}` 后立即校验失败

## v1.8.184 (2026-06-19) - Schema 示例应用
### ✨ 新特性
- **JSON Schema 校验**: 面板新增“应用示例”，可将当前 Schema 生成的示例 JSON 直接写入 SOURCE；当 SOURCE 已有内容时复用全局确认弹窗，避免误覆盖，同时保留复制示例的轻量协作路径

## v1.8.183 (2026-06-18) - Schema 示例生成
### ✨ 新特性
- **JSON Schema 校验**: 面板新增“复制示例”，可根据当前 Schema 生成一份示例 JSON 并复制到剪贴板，支持常见类型、数组/对象约束、`format`、`default/examples/const/enum` 和本地 `$ref`，让接口约束能快速反向起草请求体/响应体

## v1.8.182 (2026-06-18) - 当前 Schema 复制
### ✨ 新特性
- **JSON Schema 校验**: 面板底部新增“复制Schema”，可直接复制当前生成或编辑中的 Schema 文本，便于把单份约束快速发给协作者，而无需先加入收藏包

## v1.8.181 (2026-06-18) - Schema Format 推断
### ✨ 新特性
- **JSON Schema 生成**: 根据 SOURCE 生成 Schema 时会保守识别 `email`、`uri`、`date-time` 和 `uuid` 字符串格式，并在数组样本格式一致时保留 `format` 约束，生成结果可直接配合标准 format 校验

## v1.8.180 (2026-06-18) - Schema Format 校验
### ✨ 新特性
- **JSON Schema 校验**: 接入官方 `ajv-formats`，启用 `email`、`uri`、`date-time`、`uuid` 等标准 `format` 约束校验，避免格式错误字段被误判为通过

## v1.8.179 (2026-06-18) - Schema 修复清单
### ✨ 新特性
- **JSON Schema 校验**: 校验失败后支持一键复制 Markdown 修复清单，将路径、关键字、错误说明、修复建议和 Schema 路径整理成待办项，便于跨端协作分发且不包含原始 JSON 值

## v1.8.178 (2026-06-18) - Schema 修复建议
### ✨ 新特性
- **JSON Schema 校验**: 每条校验问题新增脱敏修复建议，覆盖 `required`、`type`、`additionalProperties`、数值范围、字符串格式、数组约束和组合 Schema 等常见场景，面板和复制报告共用同一口径

## v1.8.177 (2026-06-18) - Schema 问题分布
### ✨ 新特性
- **JSON Schema 校验**: 校验失败结果新增关键字问题分布和路径清单，复制报告会携带不含原始值的修复清单，便于协作者快速定位 `required`、`type`、`additionalProperties` 等高频问题

## v1.8.176 (2026-06-18) - Schema 生成策略
### ✨ 新特性
- **JSON Schema 校验**: Schema 自动生成新增“严格/宽松”必填策略，默认保持严格 `required` 约束，宽松模式不生成 `required`，便于团队复用可选字段较多的接口 Schema

## v1.8.175 (2026-06-18) - Schema 收藏备份
### ✨ 新特性
- **配置备份**: 导出/导入配置备份时会同步包含 JSON Schema 收藏，并在已打开的 Schema 面板中自动刷新收藏列表，避免跨机器迁移时丢失常用接口约束

## v1.8.174 (2026-06-18) - HAR 异常摘要
### ✨ 新特性
- **HAR 导入**: 派生 JSON 顶层新增 `issueSummary`，统计 4xx/5xx、未知状态、JSON body 解析失败、截断 body 和未解码 Base64，并在导入提示中标出需关注接口数量

## v1.8.173 (2026-06-18) - Schema 生成与共享
### ✨ 新特性
- **JSON Schema 校验**: Schema 面板新增“生成”能力，可根据当前 SOURCE JSON 推断初始 Schema，并支持收藏包从剪贴板导入/导出，便于跨机器和团队复用常用接口约束

## v1.8.172 (2026-06-18) - HAR 上下文展示优化
### 🎨 UI/UE 优化
- **HAR 排查**: 深度解析报告和复制文本会将 HAR 标签展示为“接口上下文”，并隐藏内部 `HAR ` 前缀，避免抓包 payload 被误读为普通业务字段

## v1.8.171 (2026-06-18) - HAR 报告上下文
### ✨ 新特性
- **HAR 排查**: 深度解析 HAR 派生 payload 时，接口 URL 和 request/response body 内的 CMD/资源记录会继承 `HAR method status host/path` 上下文标签，可直接按域名、状态码或接口路径筛选报告

## v1.8.170 (2026-06-18) - 复制产物下一步命令
### ✨ 新特性
- **排查闭环**: CMD 对比包、问题样本 JSON 和深度解析归档包新增 `suggestedCommands`，把页面复制结果直接衔接到 `cmd:diff`、`samples:to-regression` 和 corpus 质量基线校验

## v1.8.169 (2026-06-18) - HAR 摘要标签
### ✨ 新特性
- **HAR 导入**: 派生 JSON 顶层新增 method、status、host、MIME 和 body 类型摘要，并为每条 payload 生成不含 query 的短标签，便于后续筛选和排查接口来源

## v1.8.168 (2026-06-18) - HAR 请求响应提取
### ✨ 新特性
- **HAR 导入**: 打开 `.har` 文件时自动提取 request/response body 为派生 JSON 标签，支持 JSON、表单参数和 base64 JSON body，并默认进入嵌套解析模式
- **文件安全**: HAR 派生标签不绑定原始抓包文件句柄，避免保存时把 `.har` 覆盖成提取后的 JSON

## v1.8.167 (2026-06-18) - Schema 本地收藏
### ✨ 新特性
- **JSON Schema 校验**: 新增本地 Schema 收藏列表，可保存、载入和删除常用 Schema，优先使用 `title` 或 `$id` 命名，并限制在浏览器本地最多保留 12 个

## v1.8.166 (2026-06-18) - Schema 错误编辑器标记
### ✨ 新特性
- **JSON Schema 校验**: Schema 校验未通过时会把问题路径直接标记到 SOURCE 编辑器，并在编辑器头部提示问题数量，定位额外字段时优先高亮具体字段

## v1.8.165 (2026-06-18) - Docker 空间清理
### ✨ 新特性
- **运维安全**: 新增默认 dry-run 的远端 Docker 未使用对象清理脚本，显式确认后才清理已停止容器、未使用构建缓存和未被容器引用的镜像，并明确不触碰业务 volume

## v1.8.164 (2026-06-18) - 公网部署验证
### ✨ 新特性
- **上线保障**: 新增公网部署验证脚本，SSH 部署完成后默认校验线上 `version.json` 版本与 `/api/visitor/ping`，把手工 curl 验证沉淀为可重复流程

## v1.8.163 (2026-06-18) - 同步排除清单收敛
### ♻️ 代码重构
- **部署可靠性**: 将本机 SSH 部署和 GitHub Actions 的 rsync 排除规则收敛到共享清单，避免非运行时文件排除项在多处配置中漂移

## v1.8.162 (2026-06-18) - 远端开发残留清理
### ✨ 新特性
- **运维安全**: 新增默认 dry-run 的远端非运行时开发残留清理脚本，显式确认后才删除 `.DS_Store`、编辑器目录和 AI 助手说明残留，减少生产目录污染且避免误删业务数据

## v1.8.161 (2026-06-18) - 部署目录残留检查
### ✨ 新特性
- **部署可靠性**: SSH/Actions 同步默认排除本地开发元数据，并在远端磁盘健康检查中列出历史残留与人工清理建议，避免非运行时文件继续污染生产目录

## v1.8.160 (2026-06-18) - 远端磁盘健康检查
### ✨ 新特性
- **运维可观测**: 新增只读远端磁盘健康检查脚本，可查看磁盘水位、Docker 空间摘要、运行容器、应用目录占用和安全清理建议，并支持 strict 模式用于巡检告警

## v1.8.159 (2026-06-18) - 部署磁盘水位保护
### ✨ 新特性
- **部署可靠性**: 远端部署在 Compose 构建前检查磁盘水位，默认 90% 告警、95% 阻断，并输出 Docker 空间摘要，降低满盘导致数据库 checkpoint 或镜像构建失败的风险

## v1.8.158 (2026-06-18) - GitHub 预构建前端部署
### ✨ 新特性
- **CI/CD**: 手动 Deploy 工作流新增 `prebuilt-frontend` 模式，可在 GitHub runner 中构建前端产物并只替换远端前端服务，降低远端 Node/npm 网络抖动和无谓后端重启风险

## v1.8.157 (2026-06-18) - 一键预构建前端部署
### ✨ 新特性
- **部署可靠性**: 新增本机预构建前端快速部署脚本，自动完成前端构建、预加载预算检查、`dist` 同步和远端前端服务替换，降低远端 Node/npm 网络抖动对上线的影响

## v1.8.156 (2026-06-18) - 收敛预构建忽略规则
### ♻️ 代码重构
- **部署可靠性**: 为预构建前端镜像新增专属 `.dockerignore`，让普通 Docker 构建继续排除 `dist`，避免本地构建产物污染默认构建上下文

## v1.8.155 (2026-06-18) - 修复预构建上下文
### 🐛 Bug 修复
- **部署可靠性**: 允许 `dist` 进入前端 Docker build context，修复预构建前端镜像无法复制本机产物的问题

## v1.8.154 (2026-06-18) - 预构建前端部署通道
### ✨ 新特性
- **部署可靠性**: 新增预构建前端 Dockerfile，并让 SSH 部署脚本支持同步 `dist`、指定 Compose 服务和跳过依赖服务，便于在远端 npm/Docker 网络不稳定时只替换前端静态镜像

## v1.8.153 (2026-06-18) - npm 安装网络兜底
### ✨ 新特性
- **部署可靠性**: Docker 前端构建默认使用 `npmmirror` 安装依赖，并保留 `NPM_REGISTRY` 构建参数，降低远端 `npm ci` 因公网 registry 连接重置而失败的概率

## v1.8.152 (2026-06-18) - Docker 冷构建瘦身
### ✨ 新特性
- **部署可靠性**: 前端 Docker 构建阶段切换为 `node:20-alpine`，降低远端冷构建拉取 Node 基础镜像的体积，减少 Docker Hub 抖动导致的上线阻塞

## v1.8.151 (2026-06-18) - 部署健康检查校准
### ✨ 新特性
- **部署可靠性**: 远端健康检查改为跟随 HTTP/HTTPS 跳转并最终要求 `200`，避免把 Nginx `301` 误判成后端 API 已可用
- **上线保障**: `/api/visitor/ping` 会真实等待后端启动完成，减少容器刚重启后公网短暂 `502` 的误判窗口

## v1.8.150 (2026-06-18) - SSH 同步产物排除
### ✨ 新特性
- **部署可靠性**: SSH/rsync 部署脚本新增 `artifacts`、`outputs`、`frontend/.vite`、`frontend/test-results` 排除规则，避免本机测试与临时产物同步到服务器占用磁盘
- **上线保障**: 结合 Docker 依赖重试配置，减少远端满盘和网络抖动两类发布中断风险

## v1.8.149 (2026-06-18) - Docker 构建依赖重试
### ✨ 新特性
- **部署可靠性**: 前端新增 npm fetch 重试配置，远端 Docker 构建在依赖下载遇到网络抖动时会自动重试，降低 `ECONNRESET` 等临时错误导致的发布失败率
- **镜像构建**: 前端 Dockerfile 在依赖层复制 `.npmrc` 并显式保留 optional dependencies，兼顾重试策略与 esbuild 平台包安装稳定性

## v1.8.148 (2026-06-18) - JSON Schema 校验闭环
### ✨ 新特性
- **主工具**: 新增 JSON Schema 校验浮动面板，支持粘贴 Schema 校验当前 SOURCE JSON，展示通过/未通过状态、错误路径、关键字和 Schema 路径
- **定位联动**: Schema 问题路径可一键交给 JSONPath 面板定位，校验报告复制默认只包含摘要和路径信息，不包含原始 JSON 或 Schema 内容
- **产品观测**: 新增 `SCHEMA_VALIDATE`、`SCHEMA_PANEL_OPEN/CLOSE` 工具事件标签，管理后台可观察 Schema 校验的使用频率和失败链路

## v1.8.147 (2026-06-18) - 工具事件周报视图
### ✨ 新特性
- **管理后台**: 工具使用洞察新增 PM 周报视图，按统计周期汇总工具事件、高频功能、失败率、大输入占比和慢操作占比，并给出重点关注和下周动作
- **产品决策**: 周报计算逻辑沉淀到 `toolEventInsights` 并补单测，后台可直接回答“高频功能、失败分布、大输入耗时”三个问题

## v1.8.146 (2026-06-18) - 浏览器 Worker 性能预算
### ✨ 新特性
- **性能门禁**: 新增 `npm run perf:e2e`，用独立 Playwright performance 配置量化 JSONPath Worker 取消、Scheme Worker 取消和连续大 response 解析的浏览器端到端耗时
- **CI 闭环**: 本地 CI 与 GitHub Actions 接入浏览器 Worker 性能预算，并输出 `browser-worker-performance-budget` JSON artifact / Step Summary，补齐核心函数预算之外的真实页面响应探针

## v1.8.145 (2026-06-18) - 真实 Response 下一步动作条
### ✨ 新特性
- **深度解析报告**: 覆盖率摘要下新增“真实 response 下一步”，按当前解析状态推荐最多 3 个优先入口，收敛 cmdHandler 对比、占位符回填、待处理筛选、归档包和协作报告复制
- **排查效率**: 新动作条复用现有对比/回填/复制能力，避免用户在长 footer 和记录卡片中寻找下一步；E2E 覆盖未展开线索和 cmdHandler 对比入口

## v1.8.144 (2026-06-18) - Scheme 路径值工具拆分
### ✨ 新特性
- **工程质量**: 将 Scheme 面板“复制路径和值”的 JSONPath 生成、叶子节点遍历和截断文案抽成 `schemePathValues` 纯工具函数，降低 `SchemeViewerModal` 组件体量
- **回归保护**: 新增路径值复制单测，锁住特殊 key bracket 表达式、空数组/空对象、非法 JSON 和截断提示，避免真实 response 排查路径复制漂移

## v1.8.143 (2026-06-18) - Scheme 质量快照 JSON
### ✨ 新特性
- **Scheme 面板**: 解析质量摘要新增“复制快照”，输出不含原始值的结构化 JSON，沉淀 coverage、状态、解码层、CMD/资源/占位符/跳过数量、Top CMD Schema 和建议动作
- **协作排查**: 单条 CMD/URL 不必先送回 SOURCE，也可以复制机器可读质量指标用于 issue、样本评审或后续转 corpus expected
- **本地 CI**: 本机完整 CI 在未显式设置 `JAVA_HOME` 时会优先选择 Java 17，避免 Maven 误用 Java 26 触发 Mockito/Byte Buddy 兼容失败

## v1.8.142 (2026-06-18) - 电话拨打 Corpus 基线
### ✨ 新特性
- **质量门禁**: 新增 `phone-response` 脱敏电话拨打 response 样本，覆盖 `makePhoneCall`、`numberUrl`、`logUrl`、Base64 `extInfo`、hash 落地页参数和运行时占位符
- **回归保护**: corpus 单测和质量快照扩展到 3 个样本，固定电话拨打链路的主入口、号码监测 URL 展开、占位符聚合和 cmdHandler expected 子集

## v1.8.141 (2026-06-18) - 落地页 Corpus 基线
### ✨ 新特性
- **质量门禁**: 新增 `landing-response` 脱敏落地页 response 样本，覆盖 easybrowse、deeplink、openapp、结构化 HTTPS 落地页、监测 URL 和运行时占位符
- **回归保护**: corpus 单测和 committed 质量快照扩展到 2 个样本，固定落地页链路的扫描入口、热点 Schema、占位符和 cmdHandler expected 子集，降低单一样本导致的回归盲区

## v1.8.140 (2026-06-18) - 工具事件 PM 速览
### ✨ 新特性
- **管理后台**: 工具使用洞察新增 PM 速览，展示最常用功能次数占比、大输入事件占比、慢操作事件占比和建议动作，帮助快速判断高频功能、失败风险与大 response 性能压力
- **文档校准**: 修正架构文档中的数据库栈描述，统一为当前实际使用的 PostgreSQL + Flyway

## v1.8.139 (2026-06-18) - 后端 API 权限矩阵
### ✨ 新特性
- **接口治理**: 新增后端 API 权限矩阵，梳理公开、访客、管理员接口的数据边界、文件限制和生产部署前检查项
- **质量门禁**: 新增 Controller 扫描脚本并接入本地 CI 与 GitHub Actions，新增或删除后端 API 时必须同步更新权限矩阵

## v1.8.138 (2026-06-18) - 本地 CI Compose 校验补强
### ✨ 新特性
- **质量门禁**: 本地 CI 的 Docker Compose 配置校验内置仅用于校验的数据库/JWT 假环境变量，不再依赖开发机存在生产 `.env` 文件，避免完整本地 CI 在最后一步误失败

## v1.8.137 (2026-06-18) - SSH 部署保活
### ✨ 新特性
- **部署可靠性**: 本机 SSH 部署脚本和 GitHub Actions Deploy 工作流新增 SSH keepalive 参数，长时间 Docker 构建期间默认保持连接，并支持通过 `SSH_SERVER_ALIVE_INTERVAL` / `SSH_SERVER_ALIVE_COUNT_MAX` 调整

## v1.8.136 (2026-06-18) - 前端依赖安全治理
### ✨ 新特性
- **依赖安全**: 修复前端 `npm audit` 中的 Babel、DOMPurify、form-data、joi 与 `shell-quote` 风险，保留 `concurrently@9` 的 Node 20 兼容性并通过 override 使用修复版 `shell-quote`
- **CI 门禁**: 新增 `npm run audit:security`，以 moderate 及以上漏洞作为依赖安全门禁，并接入本地 CI 与 GitHub Actions

## v1.8.135 (2026-06-18) - 前端 Lint 门禁接入
### ✨ 新特性
- **工程质量**: 前端迁移到 ESLint flat config，新增 `npm run lint` 错误级门禁和 `npm run lint:report` 历史 warning 报告，并接入本地 CI 与 GitHub Actions
- **仓库清理**: 移除已被 `.gitignore` 覆盖但仍被版本库跟踪的 `frontend/.vite` 缓存文件，减少构建缓存污染提交的风险

## v1.8.134 (2026-06-18) - Scheme 原始值排查入口
### ✨ 新特性
- **Scheme 面板**: 新增“用原始值排查”入口，可将独立 Scheme 面板中的原始值送回 SOURCE、切换嵌套解析并打开深度解析报告；SOURCE 已有内容时会先确认，避免静默覆盖

## v1.8.133 (2026-06-18) - Scheme 质量摘要复制
### ✨ 新特性
- **Scheme 面板**: 解析质量摘要新增一键复制，输出不含原始值的状态、说明和指标文本，方便把独立 Scheme 排查结果直接发给协作者

## v1.8.132 (2026-06-18) - Scheme 解析质量摘要
### ✨ 新特性
- **Scheme 面板**: 顶部新增解析质量摘要，聚合解码层、CMD Schema、CMD 字段、资源字段、运行时占位符和性能护栏跳过数量，打开面板即可判断本次解析是否完整、是否需要回填或复查

## v1.8.131 (2026-06-18) - 质量基线安全更新
### ✨ 新特性
- **质量门禁**: 新增 `corpus:snapshot:baseline` 命令，严格检查通过后才更新 committed 质量趋势基线，避免失败快照覆盖 CI baseline；同步补充基线接受/回退指引

## v1.8.130 (2026-06-18) - 质量趋势 CI 门禁
### ✨ 新特性
- **CI 门禁**: 新增完整 corpus 质量快照基线，并在 GitHub Actions 中运行 `corpus:snapshot:diff`，对比当前快照与基线，上传质量趋势 artifact；视频占比下降和 Lottie 占比上升阈值会在 strict 模式下参与发布门禁

## v1.8.129 (2026-06-18) - 资源类型趋势阈值
### ✨ 新特性
- **质量趋势**: `corpus:snapshot:diff` 新增 `--resource-type-drop` 与 `--resource-type-rise` 可选阈值，strict 模式可在视频占比骤降、Lottie 占比异常上升等素材结构漂移超过阈值时失败

## v1.8.128 (2026-06-18) - 资源类型趋势对比
### ✨ 新特性
- **质量趋势**: `corpus:snapshot` 样本快照会沉淀静态资源类型占比，`corpus:snapshot:diff` 的 JSON 与 Markdown 会展示视频、图片、Lottie 等资源类型的新增、消失和占比变化，方便 PM 观察素材结构漂移

## v1.8.127 (2026-06-18) - 资源类型占比筛选
### ✨ 新特性
- **深度解析报告**: 静态资源区新增资源类型 Top，占比展示视频、图片、Lottie 等素材分布，并支持点击类型一键筛选对应资源字段；诊断摘要、协作报告和质量快照 JSON 同步输出类型占比

## v1.8.126 (2026-06-18) - 资源 URL 类型分组
### ✨ 新特性
- **深度解析报告**: 静态资源 URL Top 会按视频、图片、Lottie、音频、包/压缩和其他类型补充分类标签，顶部面板、诊断摘要和质量快照 JSON 共用同一口径，方便快速判断素材问题分布

## v1.8.125 (2026-06-18) - 前端运行镜像固定
### 🐛 Bug 修复
- **生产部署**: 前端运行阶段从 `nginx:latest` 收敛为固定的 `nginx:1.28.0-alpine`，避免 latest digest 漂移导致远端上线临时拉取大体积基础层并长时间卡住

## v1.8.124 (2026-06-18) - 资源 URL 热点追踪
### ✨ 新特性
- **深度解析报告**: 资源字段会同时保留解析后的对象和值来源 URL，带 query 的 `video_url`、`imageUrl` 等素材地址也能进入静态资源 URL Top，方便 PM 和研发定位素材链路问题
- **产品工程评审**: 更新产品与工程升级评审的当前证据，补充 1.8.123 后的模块体量、测试规模和 HTTPS Scheme 收敛进展

## v1.8.123 (2026-06-17) - HTTPS Scheme 误判收敛
### 🐛 Bug 修复
- **Scheme 扫描**: 普通 `http/https` URL 不再自动作为业务 Scheme/CMD 入口展示，只有自定义 Scheme 或携带结构化 CMD 参数的 HTTP(S) URL 会进入 Scheme 列表和 `cmdSchema`
- **cmdHandler 导出**: 普通 HTTPS 落地页、静态资源 URL 不再生成内层 `cmdSchema` 包装，同时保留静态资源 URL 的资源分组统计

## v1.8.122 (2026-06-17) - 前端 Docker 低内存构建
### 🐛 Bug 修复
- **生产部署**: 前端 Docker 构建期 Node 堆上限调整为已在 2GB 线上主机验证通过的 `1200MB`，保证 Vite 构建和 preload 检查可稳定完成

## v1.8.121 (2026-06-17) - 前端 Docker 构建内存上限
### 🐛 Bug 修复
- **生产部署**: 前端 Docker 构建期 Node 堆上限调整为 `1536MB`，适配 2GB 级线上主机，避免过高堆配置触发系统 OOM

## v1.8.120 (2026-06-17) - 前端 Docker 构建内存
### 🐛 Bug 修复
- **生产部署**: 前端 Docker 构建阶段配置 `NODE_OPTIONS=--max-old-space-size=4096`，避免 Vite 生产构建在默认 Node 堆限制下 OOM 中断上线

## v1.8.119 (2026-06-17) - JSONPath 性能预算
### ✨ 新特性
- **性能门禁**: 新增 `perf:jsonpath`，复用脱敏 response 和大量命中列表校验 JSONPath 大查询耗时、命中数、高亮范围和结果上限保护，并接入 GitHub Actions 与本地 CI

## v1.8.118 (2026-06-17) - 编辑器头部紧凑布局
### 🐛 Bug 修复
- **Tab 展示区域**: 编辑器头部操作按钮默认以图标形态展示，并缩小单个文件 Tab 最小宽度，优先把横向空间留给已打开文件标签

## v1.8.117 (2026-06-17) - Scheme 内层 JSON 宽松解析
### 🐛 Bug 修复
- **Scheme 解析**: URL 参数解码后如果内层 JSON-like 对象出现 `,type"` 这类 key 前缺开引号的脏格式，会自动宽松修复并展开成对象，避免结果里残留 `\"` 形式的反转义字符

## v1.8.116 (2026-06-17) - 页面内层 CMD 候选切换
### ✨ 新特性
- **页面候选**: cmdHandler 页面内 actual 候选推荐会展开根 CMD 解析树里的内层 `panel_cmd`、`webpanel_cmd` 等结构，和 `cmd:diff --suggest-actual` 保持一致
- **候选切换**: 点击内层候选后会在原记录的对比面板中直接使用该候选作为 actual，复制差异报告和排查报告也会保留内层候选路径

## v1.8.115 (2026-06-17) - cmdHandler 内层候选发现
### ✨ 新特性
- **真实 response 候选**: `cmd:diff --suggest-actual` 会从已解析的 CMD 结构树继续收集内层 `panel_cmd`、`webpanel_cmd`、`stay_cmd` 等候选，不再只推荐整包里的根 `scheme`
- **定点对比**: `cmd:diff --actual-path` 支持选择这些解析树内层路径，便于把真实广告 response 中的某个内嵌 CMD 直接拿来对齐 cmdHandler expected

## v1.8.114 (2026-06-17) - cmdHandler 摘要分支口径
### ✨ 新特性
- **页面摘要**: cmdHandler 对比顶部摘要和 actual 候选卡片会使用折叠后的缺失/额外分支数量，和差异报告正文保持一致
- **CLI 摘要**: `cmd:diff --suggest-actual` 的候选摘要同步展示折叠分支数量，避免一个深层分支在推荐摘要里再次显示成多条缺失

## v1.8.113 (2026-06-17) - cmdHandler 差异分支折叠
### ✨ 新特性
- **差异报告**: 页面和 `cmd:diff` 会把同一缺失/额外分支下的子路径折叠展示，保留原始差异数量但只列出顶层分支，降低大对象分支不一致时的噪声
- **候选评分**: actual 候选排序按折叠后的缺失/额外分支数量计分，避免深层子路径数量把“一个分支没对上”放大成多个独立问题

## v1.8.112 (2026-06-17) - cmdHandler 候选全量扫描
### ✨ 新特性
- **候选推荐**: 页面内 cmdHandler actual 候选推荐会从全量深度解析记录扫描 CMD 结构，不再受报告列表前 200 条展示限制影响
- **候选切换**: 点击候选时会按目标路径筛选并定位对应记录，保证截断列表后的最佳候选也能直接打开对比

## v1.8.111 (2026-06-17) - cmdHandler 多段日志解析
### ✨ 新特性
- **cmdHandler 粘贴容错**: 页面和 `cmd:diff` 在日志里遇到多个 JSON 片段时，会优先选择可识别为 CMD 结构的片段，避免前置 metadata JSON 抢占解析结果
- **回归覆盖**: 补充“普通 metadata JSON + 后置 cmdHandler result”的页面与 CLI 解析用例，保持两端粘贴清洗策略一致

## v1.8.110 (2026-06-17) - cmd:diff 使用引导
### ✨ 新特性
- **CLI 帮助**: `cmd:diff` 支持 `-h/--help`，空 stdin 会回退展示用法，README 增加 cmdHandler 对齐、候选推荐和定点路径对比示例
- **候选引导**: `--suggest-actual` 会优先输出 actual 候选推荐，并给出可复制的 `--actual-path` 下一步参数，避免推荐结果被大段 diff 淹没
- **自动化契约**: `cmd:diff` 退出码统一为 `0` 结构一致、`1` 存在差异、`2` 参数或输入错误，便于接入 shell/CI 判断

## v1.8.109 (2026-06-17) - cmd:diff actual 候选推荐
### ✨ 新特性
- **CLI 候选推荐**: `cmd:diff` 新增 `--suggest-actual`，可从整段 actual response 中列出最接近 expected 的 CMD 候选路径，减少多 CMD 场景下猜错字段的排查成本
- **CLI 定点对比**: `cmd:diff` 新增 `--actual-path <path>`，可直接指定 actual response 里的候选路径参与结构对比，并在报告中保留所选路径和业务字段

## v1.8.108 (2026-06-17) - cmdHandler 局部树文本解析
### ✨ 新特性
- **cmdHandler 对比**: 支持只复制内部参考页 `result` 子树或 `cmdParams` 子树的可见文本，粘贴时仍能识别 `cmdSchema/cmdParams`
- **CLI 对齐**: `cmd:diff` 同步兼容局部树形文本，减少从内部页面精确框选顶层 `解析结果` 的操作成本

## v1.8.107 (2026-06-17) - cmdHandler 聚焦对比报告一致
### 🐛 Bug 修复
- **协作排查**: 筛选内部路径后进行聚焦 cmdHandler 对比时，复制排查报告和归档包会沿用当前聚焦 CMD 结构，避免页面显示结构一致但报告重新按整条根 CMD 误报额外路径
- **候选推荐**: actual 候选排序会优先使用当前聚焦记录参与对比，保持页面展示、复制报告和推荐摘要口径一致

## v1.8.106 (2026-06-17) - cmdHandler 候选推荐入报告
### ✨ 新特性
- **协作排查**: 复制排查报告时会同步带上 cmdHandler actual 候选推荐，避免协作者只看到当前巨大差异而遗漏“可能拿错 actual”的线索
- **归档包**: 归档包 artifacts 增加候选推荐摘要，保留多 CMD response 中 expected 最匹配 actual 的判断依据

## v1.8.105 (2026-06-17) - cmdHandler actual 候选推荐
### ✨ 新特性
- **cmdHandler 对比**: 粘贴 expected 后自动扫描当前报告中的 CMD 结构并展示 Top 3 actual 候选，当前行不是最佳匹配时提示可能拿错 actual
- **一键切换**: 候选列表支持直接切到更匹配的 CMD 记录继续对比，减少多 CMD response 中手动猜测和反复展开的成本

## v1.8.104 (2026-06-17) - cmd:diff 粘贴容错对齐
### ✨ 新特性
- **CLI 对齐**: `cmd:diff` 文件和 stdin 输入支持日志前缀、Markdown 代码块、字符串化 JSON 与树形文本，和页面内 cmdHandler 对比粘贴能力保持一致
- **对比包容错**: 单文件/stdin 对比包中的 `actual` 或 `expected` 如果是原始复制文本字符串，会先尝试提取 CMD 结构再对比，减少自动化前的手动清洗

## v1.8.103 (2026-06-17) - cmd:diff 无效输入提示
### ✨ 新特性
- **CLI 对齐**: `cmd:diff` 在 actual/expected 未识别到 CMD 结构时直接给出可操作错误提示，避免把普通 JSON 或空解析结果误判为完整 cmdParams 做噪声对比
- **回归覆盖**: 补充 CLI 输入识别用例，保持页面和命令行的无效粘贴反馈一致

## v1.8.102 (2026-06-17) - cmdHandler 无效粘贴提示
### ✨ 新特性
- **cmdHandler 对比**: 粘贴普通 JSON、空解析结果或未包含主 CMD 字段的内容时，页面会明确提示未识别到 CMD 结构，避免直接展示误导性的整段差异报告
- **回归覆盖**: 补充参考页空结果 `{ "解析结果": { "result": "" } }` 的识别用例，确保只有可归一化为 `cmdSchema/cmdParams` 的内容进入对比

## v1.8.101 (2026-06-17) - cmdHandler 字符串字段兼容
### ✨ 新特性
- **cmdHandler 对比**: 当本工具 actual 已把 URL/CMD 字段展开为 `cmdSchema/cmdParams/source`，而内部 cmdHandler expected 仍保留同一个 source 字符串时，开启忽略额外路径后不再误报父节点类型差异
- **CLI 对齐**: `cmd:diff` 同步支持结构化 CMD 与原始 source 字符串的等价判断，适配参考页对 `url` 字段只输出字符串的解析形态

## v1.8.100 (2026-06-17) - cmdHandler 树形文本与 response 粘贴
### ✨ 新特性
- **cmdHandler 对比**: 支持解析内部参考页树形视图复制出的可见文本，自动清理 `N item(s)` 与 `cmd解析` 展示文案后提取 `cmdSchema/cmdParams`
- **真实 Response**: 对比输入可直接粘贴整段广告 response，自动优先定位 `ad_common.scheme` 等主 CMD 字段并快速导出 `cmdSchema/cmdParams`
- **CLI 对齐**: `cmd:diff` 文件输入同步支持树形文本和整段 response，便于直接保存参考页复制内容或接口返回后做本地结构差异检查

## v1.8.99 (2026-06-17) - cmdHandler 解析结果包装兼容
### ✨ 新特性
- **cmdHandler 对比**: 支持识别内部参考页复制出的 `解析结果` 包装层，粘贴 `{ "解析结果": { "result": ... } }` 时仍能正确提取 `cmdSchema` 和 `cmdParams`
- **CLI 对齐**: `cmd:diff` 脚本同步支持 `解析结果` 包装，方便直接用页面复制内容做本地差异检查

## v1.8.98 (2026-06-17) - cmdHandler 根 schema 推断
### ✨ 新特性
- **cmdHandler 对齐**: 导出 cmdHandler 风格 CMD 结构时，如果调用方未显式传入根 `cmdSchema`，会从 URL source 自动推断，和内部 cmdHandler 参考页的根 schema 输出保持一致
- **CMD 结构**: 补充合成 rewardImpl 样例回归，确保根 `nadcorevendor://vendor/ad/rewardImpl` 和内层 `bottom_button_scheme` 都能稳定导出 schema

## v1.8.97 (2026-06-16) - promote 严格校验
### ✨ 新特性
- **Scheme Corpus**: `corpus:promote` 新增 `--strict` 参数，审计发现敏感残留或 `--validate` 质量快照失败时返回非 0，方便把真实 response 候选生成接入自动化防线
- **安全提交流程**: 严格校验保留 WARN 人工确认语义，长数字/高熵片段继续提示但不会阻断商品 ID、素材 hash 等业务样本沉淀

## v1.8.96 (2026-06-16) - promote 内置质量快照
### ✨ 新特性
- **Scheme Corpus**: `corpus:promote` 新增 `--validate` 参数，可在生成脱敏候选时直接输出质量快照摘要，展示覆盖率、CMD 结构、字段数量、占位符和待检查/跳过数量
- **质量快照**: 抽出内存 response 快照构建入口，避免 promote 复用 snapshot 能力时必须先落临时文件

## v1.8.95 (2026-06-16) - corpus 脱敏审计摘要
### ✨ 新特性
- **Scheme Corpus**: `corpus:promote` 生成候选后自动输出脱敏审计摘要，标记敏感属性/参数残留、UUID、长数字和高熵十六进制片段，并给出下一步质量快照命令
- **安全脱敏**: 审计改为检查回填后的完整脱敏 response，避免 replacements 分片导致的误报，同时保留需要人工确认的长 ID 和高熵片段提示
- **敏感别名**: 脱敏覆盖 `clickId`、`bd_vid`、`unionId`、`phoneNumber`、`mobilePhone` 等真实 CMD 常见标识，并保持多层编码 JSON 参数的原始编码层级

## v1.8.94 (2026-06-16) - 真实响应 corpus 候选生成
### ✨ 新特性
- **Scheme Corpus**: 新增 `corpus:promote` 命令，可将本地真实 response 转成脱敏 `*.redacted.json` 候选，并支持输出回填后的脱敏 response、安静模式和质量快照校验
- **安全脱敏**: corpus 候选生成会处理常见设备标识、签名、账号、手机号、长 ID、Base64 JSON、JSON 字符串、多层编码 JSON 属性和 `extraParam`，避免真实样本沉淀时泄露敏感值

## v1.8.93 (2026-06-16) - 质量快照临时基线
### ✨ 新特性
- **深度解析报告**: 质量快照支持设为当前会话临时基线，并可复制与当前报告的质量对比，便于回填占位符或调整解析后判断覆盖率、CMD 结构、待检查和跳过记录是否改善
- **浮动面板**: 底部操作栏右侧预留调整宽度手柄空间，避免按钮较多时最右侧操作被 resize 手柄遮挡

## v1.8.92 (2026-06-16) - 待处理排查建议
### ✨ 新特性
- **深度解析报告**: 覆盖率卡片下新增“建议优先处理”区，将跳过记录、待检查线索和运行时占位符前置成可点击排查入口，真实 response 排查时可直接进入下一步

## v1.8.91 (2026-06-16) - cmdHandler 子集对齐回归
### ✨ 新特性
- **cmdHandler 对比**: 页面输入提示明确支持日志前缀、Markdown 代码块和字符串化 JSON，并补充“忽略 actual 额外路径”子集对齐的页面级回归，确保真实复制输出可稳定判定结构一致

## v1.8.90 (2026-06-16) - 占位符回填表单
### ✨ 新特性
- **模板填充**: 占位符回填模板增加行内 replacement 表单，可直接填写或一键采用候选值，并同步更新底部 JSON 模板，减少真实 response 回填时手改大段 JSON 的成本

## v1.8.89 (2026-06-16) - 回填入口摘要前置
### ✨ 新特性
- **深度解析报告**: “回填占位符”入口直接展示 replacement 已预填数量，并在悬停说明中补充候选数与待补数，打开模板前即可判断真实 response 的占位符候选是否已自动带入

## v1.8.88 (2026-06-16) - 回填模板摘要
### ✨ 新特性
- **模板填充**: 占位符回填模板打开后展示 replacement 已填数量、候选数量和待补数量，让用户能快速判断候选是否已带入以及还需要补哪些占位符

## v1.8.87 (2026-06-16) - 筛选态回填候选保留
### 🐛 Bug 修复
- **深度解析报告**: 点击“占位符”筛选后再打开回填模板时，仍会从全量报告中保留 `extraParam` 等高置信 replacement 候选，避免筛选视图丢失跨字段来源

## v1.8.86 (2026-06-16) - 占位符回填候选
### ✨ 新特性
- **深度解析报告**: 运行时占位符回填模板会在 `extraParam` 等高置信业务字段与占位符强匹配时预填候选 replacement，并在报告顶部提供“回填占位符”入口，减少真实 response 手动查找和滚动操作

## v1.8.85 (2026-06-16) - cmdHandler 粘贴容错
### ✨ 新特性
- **cmdHandler 对比**: 页面内对比输入支持带前后文、Markdown 代码块和字符串化 JSON 的 cmdHandler 输出，减少从内部页面或日志复制结果后手动清洗的成本

## v1.8.84 (2026-06-16) - Unicode 转义 Scheme 解析
### 🐛 Bug 修复
- **CMD/Scheme 解析**: SOURCE、Scheme 面板和深度解析链路支持 `\u003a/\u002f/\u003f` 等 JSON Unicode ASCII 转义形态的裸 Scheme，日志复制出的 `baiduboxapp\u003a...` 可直接结构化展开

## v1.8.83 (2026-06-16) - 报告内部 CMD 快速解析
### ✨ 新特性
- **深度解析报告**: 内部 CMD 字段行新增“Scheme 打开”入口，可直接把二级/三级 CMD 对象送入 Scheme 面板继续查看，减少真实 response 排查时手动复制粘贴的步骤

## v1.8.82 (2026-06-16) - 编辑器 Scheme 数量提示
### ✨ 新特性
- **CMD/Scheme 解析**: SOURCE/PREVIEW 编辑器头部在检测到可点击 Scheme/CMD 字段时展示 `Scheme N` 提示，帮助用户发现原文和预览中的内嵌解析入口

## v1.8.81 (2026-06-16) - cmdHandler 对比入口前置
### ✨ 新特性
- **深度解析报告**: CMD 结构存在时在报告顶部提供“对比cmdHandler”入口，自动聚焦第一条可对比 CMD 结构，减少真实 response 排查时向下寻找逐条按钮的操作成本

## v1.8.80 (2026-06-16) - 深度解析报告待处理入口
### ✨ 新特性
- **深度解析报告**: 顶部新增“待处理”聚合筛选，一键查看待检查、性能跳过和运行时占位符，减少真实 response 排查时在多个计数之间来回切换

## v1.8.79 (2026-06-16) - SOURCE 错误快捷修复
### ✨ 新特性
- **AI 修复**: SOURCE JSON 报错条新增“修复”快捷入口，复用现有 AI 修复链路和安全校验，减少从错误定位到修复的操作路径

## v1.8.78 (2026-06-16) - SOURCE 内嵌 Scheme 只读解析
### ✨ 新特性
- **CMD/Scheme 解析**: SOURCE 原文为 JSON 时也会标记内嵌 Scheme/CMD 字段，点击可直接打开只读解析面板查看结构和来源路径，不需要先格式化到 PREVIEW 再定位

## v1.8.77 (2026-06-16) - 问题样本回归模板 smoke
### 🧪 测试与体验
- **深度解析报告**: “复制回归模板”和 `samples:to-regression` 生成的 Vitest 模板新增可执行 smoke 用例，先校验样本路径和原始值可被深度解析入口安全处理，再保留 `it.todo` 供补充精确断言

## v1.8.76 (2026-06-16) - camelCase 资源 URL 识别
### 🐛 Bug 修复
- **深度解析报告**: `imageUrl`、`iconUrl`、`posterUrl` 等 camelCase 静态资源字段会归入资源 URL 统计，不再被 `*url` 后缀误归为内部 CMD 字段

## v1.8.75 (2026-06-16) - SOURCE 编码 JSON 状态识别
### 🧪 测试与体验
- **状态栏**: SOURCE 直接粘贴 URL 编码 JSON 时显示 `SOURCE 编码JSON`，与普通 CMD/Scheme 的 `SOURCE Scheme` 区分；点击状态徽标可直接打开 Scheme 面板并预填当前 SOURCE，减少用户判断和复制成本
- **CMD/Scheme 解析**: SOURCE 直接粘贴整段 URL 编码 CMD/Scheme 时会自动进入深度格式化并显示 `SOURCE 编码Scheme`，避免用户先手动 URL 解码再解析

## v1.8.74 (2026-06-16) - URL 编码 JSON 根输入展开
### ✨ 新特性
- **CMD/Scheme 解析**: SOURCE 直接粘贴 `%7B...%7D` 形式的 URL 编码 JSON 时会自动进入深度格式化并结构化预览；普通 URL 编码文本仍保持原文，避免误展开

## v1.8.73 (2026-06-16) - 解析预算跳过统计修复
### 🐛 Bug 修复
- **深度解析报告**: 累计字符串解析预算耗尽后，逐字段记录被跳过路径，避免多个 CMD/Scheme 字段未展开时报告只显示“跳过 1”

## v1.8.72 (2026-06-16) - JSONPath 查询观测
### ✨ 新特性
- **产品观测**: JSONPath 查询现在记录匿名工具事件，区分成功、失败、跳过和取消，并按输入大小/耗时分桶，便于后台评估真实查询失败率和慢查询分布
- **管理后台**: 工具事件统计中补充 `JSONPATH_QUERY` 的中文展示

## v1.8.71 (2026-06-16) - 工具事件迁移与报告筛选重置
### 🐛 Bug 修复
- **后端迁移**: 新增 `tool_events` Flyway 建表迁移，避免生产环境 `ddl-auto=validate` 下匿名工具事件实体缺表导致启动失败
- **深度解析报告**: 切换输入或生成新报告后自动清空旧筛选和 cmdHandler 对比状态，避免新 response 被上一次筛选误导为空结果

### ✅ 测试
- **深度解析报告**: 补充切换输入后清空旧筛选的 E2E 回归

## v1.8.70 (2026-06-16) - 新版本提示
### ✨ 新特性
- **版本感知**: 生产环境构建自动输出 `/version.json`，页面长时间打开时会检查线上版本，发现新版本后提示刷新，避免继续使用旧包

## v1.8.69 (2026-06-16) - 入口缓存刷新
### 🐛 Bug 修复
- **线上更新**: HTML 入口页和 Admin 入口页显式使用 `no-cache`，避免浏览器停留在旧版本入口导致已修复的 SOURCE Scheme 展开逻辑仍按旧包执行

## v1.8.68 (2026-06-16) - Scheme 设置说明与回归保护
### 🧪 测试与体验
- **CMD/Scheme 解析**: 设置页明确说明自动展开开关只控制 JSON 内部字符串，SOURCE 直接粘贴整段 Scheme 时始终会结构化预览，并补充页面级回归测试防止再次回显原文

## v1.8.67 (2026-06-16) - 根 Scheme 强制展开
### 🐛 Bug 修复
- **CMD/Scheme 解析**: 修复关闭“深度解析自动展开 Scheme”设置后，整段 `baiduboxapp://...` 虽显示 `SOURCE Scheme` 但 PREVIEW 仍回显原文的问题；根输入为独立 Scheme 时现在始终直接展开

## v1.8.66 (2026-06-16) - 独立 Scheme 直接解析
### 🐛 Bug 修复
- **CMD/Scheme 解析**: 修复整段 SOURCE 直接粘贴 `baiduboxapp://...makePhoneCall?params=...` 时仍按纯文本展示的问题，独立 URL Scheme/CMD 参数串会自动进入深度解析并显示 `SOURCE Scheme`

## v1.8.65 (2026-06-16) - 低配服务器部署兜底
### 🐛 Bug 修复
- **部署脚本**: `deploy-web.sh` 支持 `SKIP_BUILD=true`，低配服务器无法完成前端构建时可复用预构建 `dist` 继续执行备份、发布和健康检查

## v1.8.64 (2026-06-16) - 远端 devDependencies 安装修复
### 🐛 Bug 修复
- **部署脚本**: 使用 `npm ci --production=false --include=optional` 强制安装构建所需 devDependencies，避免远端 `NODE_ENV=production` 下缺少 `vite`

## v1.8.63 (2026-06-16) - 远端构建平台依赖安装
### 🐛 Bug 修复
- **部署脚本**: 显式安装 dev 与 optional dependencies，避免 `NODE_ENV=production` 环境下 Rollup/esbuild 平台二进制包缺失导致远端构建失败

## v1.8.62 (2026-06-16) - 旧部署脚本依赖安装修复
### 🐛 Bug 修复
- **部署脚本**: 修复前端旧部署脚本使用 `npm ci --omit=optional` 导致 esbuild 平台二进制包缺失、远端构建失败的问题

## v1.8.61 (2026-06-16) - 生产构建配置修复
### 🐛 Bug 修复
- **部署构建**: 修复生产环境执行 `vite build` 时，`vite.config.ts` 运行时依赖 `vitest/config` 导致远端缺少测试依赖后构建失败的问题

## v1.8.60 (2026-06-16) - HTML 引号实体 CMD 解析
### ✨ 新特性
- **CMD/Scheme 解析**: 支持解析 `cmd={&quot;nid&quot;:123}`、`&#34;`、`&#x22;` 等 HTML 引号实体包裹的 JSON 参数，减少从 HTML/日志复制 CMD 后手动替换引号的操作

## v1.8.59 (2026-06-16) - hash 追踪参数展开
### ✨ 新特性
- **CMD/Scheme 解析**: 支持解析 URL hash 锚点后继续拼接的追踪参数，电话 Scheme 内二级落地页的 `unit`、`keyword`、`e_creative` 等字段可在 `_hash` 中直接查看

## v1.8.58 (2026-06-16) - loose JSON 参数拆分稳固
### 🐛 Bug 修复
- **CMD/Scheme 兼容性**: 修复半解码 loose JSON 参数中单引号字符串包含 `}` 时，JSON 值被提前截断并误拆内层 URL 参数的问题

## v1.8.57 (2026-06-15) - 半解码 Scheme 外层参数保留
### 🐛 Bug 修复
- **CMD/Scheme 兼容性**: 修复 `params={"numberUrl":"...a=1&b=2"}&source=feed` 这类半解码 Scheme 中，JSON 内层 URL 的 `&` 影响后续外层参数拆分的问题

## v1.8.56 (2026-06-15) - 半解码电话 Scheme 解析
### 🐛 Bug 修复
- **CMD/Scheme 兼容性**: 修复 `makePhoneCall?params={"numberUrl":"...a=1&b=2"}` 这类半解码 Scheme 中，JSON 内层监测 URL 的 `&` 被误拆成外层参数导致 `params` 截断的问题

## v1.8.55 (2026-06-15) - 电话拨打 Scheme 解析回归
### ✅ 测试
- **CMD/Scheme 兼容性**: 增加 `baiduboxapp://v7/vendor/ad/makePhoneCall?params=...` 电话拨打 Scheme 回归覆盖，确认可直接展开号码、`numberUrl/logUrl` 监测 URL、`extInfo` Base64 JSON 与运行时占位符

## v1.8.54 (2026-06-15) - Base64 Scheme 导出对齐
### 🐛 Bug 修复
- **CMD/Scheme 兼容性**: 修复 `panel_scheme=<Base64(Scheme)>` 这类参数值复制为 cmdHandler 风格结构时，source shape 未解开 Base64 导致内层 Scheme 无法包装 `cmdSchema/source` 的问题

## v1.8.53 (2026-06-15) - 日志字段导出对齐
### 🐛 Bug 修复
- **CMD/Scheme 兼容性**: 修复 `I/NadRender: scheme = ...`、`cmd -> ...` 这类带日志前缀的单字段行复制为 cmdHandler 风格结构时，source shape 未提取字段原始值导致内层 CMD/Scheme 无法包装 `cmdSchema/source` 的问题

## v1.8.52 (2026-06-15) - 日志前缀参数导出对齐
### 🐛 Bug 修复
- **CMD/Scheme 兼容性**: 修复 `I/NadRender: cmd=...&from=...` 这类带日志前缀的参数串复制为 cmdHandler 风格结构时，source shape 未剥离前缀导致内层 CMD 字段无法包装 `cmdSchema/source` 的问题

## v1.8.51 (2026-06-15) - 换行参数导出对齐
### 🐛 Bug 修复
- **CMD/Scheme 兼容性**: 修复 `cmd=...\nfrom=...`、`cmd=...\\nfrom=...` 这类换行分隔参数复制为 cmdHandler 风格结构时，source shape 未正确拆分导致内层 `source` 粘连后续参数的问题

## v1.8.50 (2026-06-15) - HTML 十六进制实体参数解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析 `cmd&#x3D;...&#x26;from&#x3D;...` 这类 HTML 十六进制实体参数串，并同步用于 cmdHandler 风格导出

## v1.8.49 (2026-06-15) - HTML 等号参数解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析 `cmd&#61;...&#38;from&#61;...` 与 `cmd&equals;...&amp;from&equals;...` 这类 HTML 实体转义参数串，并同步用于 cmdHandler 风格导出

## v1.8.48 (2026-06-15) - Unicode 等号参数解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析 `cmd\\u003d...\\u0026from\\u003d...` 这类日志中同时转义 `=` 与 `&` 的 CMD 参数串，并同步用于 cmdHandler 风格导出

## v1.8.47 (2026-06-15) - 日志逗号参数解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析 `cmd=..., from=...` 这类日志或控制台输出中常见的逗号分隔 CMD 参数串，复制后无需手动替换成 `&`

## v1.8.46 (2026-06-15) - 日志转义换行参数解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析 `cmd=...\\nfrom=...`、`cmd=...\\r\\nfrom=...` 这类日志中常见的转义换行分隔 CMD 参数串，减少从单行日志复制后手动替换换行的步骤

## v1.8.45 (2026-06-15) - 日志转义 JSON 参数解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析 `task_params={\"task_id\":\"602\"}` 这类日志中常见的反斜杠引号转义 JSON 参数，单独复制字段时也能直接展开嵌套对象

## v1.8.44 (2026-06-15) - 结构化后缀参数识别
### ✨ 新特性
- **CMD/Scheme 兼容性**: 单独粘贴 `m_param=...`、`kepler_param=...`、`ulkScheme=...`、`activeUrl=...` 等真实链路结构化后缀字段时可直接展开，减少从复杂 Deeplink 中手动补外层字段名的成本

## v1.8.43 (2026-06-15) - Base64 参数加号保真
### 🐛 修复
- **CMD/Scheme 兼容性**: 修复单独粘贴 `extraParam=...` 等 raw Base64 参数时字面量 `+` 被当作空格导致无法展开的问题，同时保留普通查询词 `+` 作为空格的表单语义

## v1.8.42 (2026-06-15) - 广告 UI 配置字段解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持单独粘贴解析真实广告 response 的 `ad_tag=...`、`toolbaricons=...`、`render_sbox=...` UI 与渲染配置字段，减少定位广告标识和 WebPanel 配置时的手动补全

## v1.8.41 (2026-06-15) - 广告 extra 参数字段解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持单独粘贴解析真实广告 response 的 `extraParam=...`、`ubsParam=...`、`sboxParam=...` 扩展参数字段，减少从 `extra` 数组复制排查时的手动裁剪

## v1.8.40 (2026-06-15) - 广告互动组件字段解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持单独粘贴解析真实广告日志里的 `reward=...`、`rotation_component=...` 结构化字段，可展开内层激励 CMD 和互动组件占位符路径

## v1.8.39 (2026-06-15) - 广告落地 URL 字段识别
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持单独粘贴解析真实广告日志里的 `locid=...`、`s_url=...` 落地和曝光 URL 字段，并在编辑回写时保留未编码 raw URL 形态

## v1.8.38 (2026-06-15) - 日志箭头 CMD 字段解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析日志中常见的 `scheme => ...`、`cmd -> ...` 箭头字段，并在编辑回写时保留箭头分隔形态

## v1.8.37 (2026-06-15) - 日志前缀 CMD 参数串解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析 `I/TAG: cmd=...&from=...`、`CMD => ?scheme=...` 这类带日志前缀的完整 CMD 参数串，并在编辑回写时保留原日志前缀和 raw URL 字段形态

## v1.8.36 (2026-06-15) - 日志前缀 CMD 字段解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析带日志前缀的 `... scheme = ...`、`... "scheme": "...",` 这类单行字段，并在编辑回写时保留前缀，减少从 logcat 或调试页面复制整行后的手动裁剪

## v1.8.35 (2026-06-15) - 日志等号 CMD 字段解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析日志里常见的 `scheme = ...`、`cmd= ...` 这类带空格等号赋值字段，并在回写时保留赋值形态，减少复制日志后手动改成冒号或 `key=value` 的步骤

## v1.8.34 (2026-06-15) - JSON 属性尾逗号 CMD 解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析从 JSON 对象中复制出的 `"scheme": "...",` 这类带尾逗号属性行，并在编辑回写时保留尾逗号，进一步减少日志片段粘贴前的手动清理

## v1.8.33 (2026-06-15) - JSON 属性片段 CMD 解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持直接解析从 JSON 日志中复制出的 `"scheme": "..."` 这类单行属性片段，并在回写时保留属性片段形态，减少只复制局部字段时的手动补 `{}` 成本

## v1.8.32 (2026-06-15) - 日志冒号 CMD 字段解析
### ✨ 新特性
- **CMD/Scheme 兼容性**: 支持解析从日志或调试页面复制出的 `scheme: ...`、`cmd：...` 这类冒号字段行，并在编辑回写时保留冒号字段形态，减少真实排查时手动改成 `key=value` 的步骤

## v1.8.31 (2026-06-15) - CMD 忽略路径失败日志
### 🔧 改进
- **Scheme Corpus 快照**: `maxCmdHandlerIgnoredExtraPaths` 阈值失败时，strict 控制台日志和失败阈值摘要会带上 ignored extra 路径样例，便于不下载 artifact 也能快速定位

## v1.8.30 (2026-06-15) - CMD 忽略路径趋势样例
### 🔧 改进
- **Scheme Corpus 趋势对比**: `corpus:snapshot:diff` 会展示 cmdHandler ignored extra 路径新增/消失样例，便于对比两份质量快照时直接定位对齐范围变化

## v1.8.29 (2026-06-15) - CMD 忽略路径摘要样例
### 🔧 改进
- **Scheme Corpus 快照**: Markdown 摘要会列出 cmdHandler ignored extra 路径样例，CI 排查时无需先下载 JSON artifact 就能看到对齐范围漂移位置

## v1.8.28 (2026-06-15) - CMD 忽略路径基线门禁
### 🔧 改进
- **Scheme Corpus 快照**: expected snapshot 支持 `maxCmdHandlerIgnoredExtraPaths`，CI 常规快照检查会拦截 cmdHandler 子集对齐 ignored extra 路径数量异常上升

## v1.8.27 (2026-06-15) - CMD 忽略路径趋势门禁
### 🔧 改进
- **Scheme Corpus 趋势对比**: `corpus:snapshot:diff` 会把 cmdHandler 子集对齐中 ignored extra 路径数量的上升标记为趋势风险，并在 Markdown 摘要中展示变化，避免对齐范围悄悄漂移

## v1.8.26 (2026-06-15) - CMD 快照忽略路径追踪
### 🔧 改进
- **Scheme Corpus 快照**: cmdHandler 子集对齐会把被忽略的 actual 额外路径数量和样例写入质量快照与 Markdown 摘要，CI 排查时也能看清对齐范围

## v1.8.25 (2026-06-15) - CMD 子集对比忽略统计
### 🔧 改进
- **CMD 结构对比**: 子集对比模式会保留并展示被忽略的 actual 额外路径数量，页面摘要和 `cmd:diff` 报告都能看清本次忽略范围

## v1.8.24 (2026-06-15) - CMD 来源差异短预览
### 🔧 改进
- **CMD 结构对比**: `source` 不一致时差异报告会截断超长来源串，避免页面内对比和 `cmd:diff` 输出整段真实跳转链路造成噪音或误带敏感内容

## v1.8.23 (2026-06-15) - CMD source 缺失差异
### 🐛 修复
- **CMD 结构对比**: 修复 expected 提供 `source` 而 actual 缺失时未提示差异的问题，页面和 `cmd:diff` 的差异报告会把缺失来源展示为 `(空)`

## v1.8.22 (2026-06-15) - 页面内 CMD 子集对比
### 🔧 改进
- **CMD 结构对比**: 深度解析报告的页面内 cmdHandler 对比支持忽略 actual 额外路径，expected 只保存稳定子集时也能减少误报

## v1.8.21 (2026-06-15) - CMD 差异子集对比
### 🔧 改进
- **CMD 结构对比**: `cmd:diff` 支持 `--ignore-extra`，expected 只保存稳定子集时可忽略 actual 多出的路径，并在报告中标明当前对比模式

## v1.8.20 (2026-06-15) - CMD 对比来源上下文
### 🔧 改进
- **CMD 结构对比**: 对比包会携带工具版本，页面和 `cmd:diff` 生成的差异报告会展示版本、路径和业务字段，便于对齐内部 cmdHandler 结果时追溯来源

## v1.8.19 (2026-06-15) - 样本转回归保留上下文
### 🔧 改进
- **样本回归脚本**: `samples:to-regression` 会把问题样本 JSON 中的工具版本和筛选条件写入生成模板，避免 CLI 沉淀回归时丢失来源上下文

## v1.8.18 (2026-06-15) - 问题样本筛选上下文
### 🔧 改进
- **深度解析问题样本**: 文本问题样本和回归模板会记录当前筛选条件，和样本 JSON / 归档包保持一致，减少协作排查时的上下文丢失

## v1.8.17 (2026-06-15) - 排查导出筛选追踪
### 🔧 改进
- **深度解析排查导出**: 问题样本 JSON、脱敏样本 JSON、占位符回填模板和归档包子产物会记录当前筛选条件，便于协作者复现导出上下文

## v1.8.16 (2026-06-15) - Scheme 性能预算规模下限
### 🏗️ 架构与基础设施
- **Scheme 性能预算**: 50KB / 250KB 样本按真实放大规模校验展开记录、CMD 结构、CMD 字段和资源字段下限，避免只解析首条广告也通过性能预算

## v1.8.15 (2026-06-15) - Scheme 性能样本真实放大
### 🏗️ 架构与基础设施
- **Scheme 性能预算**: `perf:scheme` 会优先复制脱敏 response 的真实 `data.video` 条目构造 50KB / 250KB 样本，避免仅靠顶层 padding 字符串低估多广告条目解析负载

## v1.8.14 (2026-06-15) - Scheme 性能预算质量下限
### 🏗️ 架构与基础设施
- **Scheme 性能预算**: `perf:scheme` strict 模式会同步校验覆盖率、CMD 结构、CMD 字段和资源字段下限，避免核心解析结果退化但性能预算仍显示 PASS

## v1.8.13 (2026-06-15) - Scheme 性能预算 CI 门禁
### 🏗️ 架构与基础设施
- **Scheme 性能预算**: GitHub CI 和本地 CI 接入 `perf:scheme -- --iterations 3 --strict`，并上传性能预算 artifact，避免大 response 核心解析耗时退化只在手工检查中暴露

## v1.8.12 (2026-06-15) - 快照级趋势失败识别
### 🐛 Bug 修复
- **Scheme Corpus 趋势对比**: `corpus:snapshot:diff` 会把 after 快照级失败纳入 strict 结果和 Markdown 摘要，避免缺失基线等非样本指标退化漏判

## v1.8.11 (2026-06-15) - 新增样本趋势风险识别
### 🐛 Bug 修复
- **Scheme Corpus 趋势对比**: `corpus:snapshot:diff` 会把新增样本缺失 expected snapshot、缺失 cmdHandler expected 或 cmdHandler 对齐失败标记为退化，避免新 corpus 样本空基线通过趋势检查

## v1.8.10 (2026-06-15) - 必需项趋势内容对比
### 🐛 Bug 修复
- **Scheme Corpus 趋势对比**: `corpus:snapshot:diff` 会按 requiredChecks 失败内容识别新增和恢复，即使失败数量不变也能标记质量变化

## v1.8.9 (2026-06-15) - 质量趋势必需项对比
### 🏗️ 架构与基础设施
- **Scheme Corpus 趋势对比**: `corpus:snapshot:diff` 会把 requiredChecks 必需项失败纳入退化/恢复判断，并在 Markdown 趋势摘要中展示必需项失败变化

## v1.8.8 (2026-06-15) - 解析基线必需项门禁
### 🏗️ 架构与基础设施
- **Scheme Corpus 严格门禁**: `corpus:snapshot:check` 会校验 expected snapshot 中的扫描位置、必需 CMD Schema 和运行时占位符，CI 能发现解析能力退化但数值阈值未触发的问题

## v1.8.7 (2026-06-15) - JSONPath 打开即输入
### 🔧 改进
- **JSONPath 初始焦点**: JSONPath 面板打开后自动聚焦表达式输入框，保留 Escape 关闭和入口焦点恢复，减少查询前的多余 Tab 操作

## v1.8.6 (2026-06-15) - 布局键盘调节
### 🔧 改进
- **分隔条键盘可达**: 工具栏宽度和 SOURCE/PREVIEW 分栏宽度的拖拽手柄补充 separator 语义、当前值播报和方向键/Home/End 调节，键盘用户也能调整工作区布局

## v1.8.5 (2026-06-15) - 编辑器提示恢复
### 🔧 改进
- **Monaco 提示可见性**: 恢复编辑器诊断、Scheme 行内图标和字段说明 hover 提示，并统一为暗色工作台样式，避免错误定位和 CMD/Scheme 解析说明被全局隐藏

## v1.8.4 (2026-06-15) - 开发启动配置修正
### 🔧 改进
- **开发启动一致性**: Electron 开发模式等待端口和加载地址统一到 Vite 的 3000 端口，README 同步前端工作目录、Web/管理后台访问地址和 Electron 构建产物目录
- **环境变量示例**: 补充前端 `.env.example`，明确 Gemini、访问统计和匿名工具事件联调配置项

## v1.8.3 (2026-06-15) - JSONPath 操作语义
### ✨ 新特性
- **JSONPath 操作可访问语义**: JSONPath 收藏、示例、历史、结果定位、空结果清空和查询取消按钮补充明确操作名称，并让错误、空结果、查询中和结果计数进入可访问状态播报

## v1.8.2 (2026-06-15) - 排查材料版本追踪
### ✨ 新特性
- **排查导出版本元信息**: 深度解析诊断摘要、协作排查报告、问题样本 JSON、占位符回填模板、质量快照和归档包会携带当前工具版本，便于协作排查时确认解析结果来自哪个版本

## v1.8.1 (2026-06-15) - 状态栏版本识别
### 🔧 改进
- **版本号同步**: 同步 `frontend/package.json` 与 `package-lock.json` 至 v1.8.1，底部状态栏会展示新版本号，便于确认当前更新批次

## v1.8.0 (2026-04-21) - URL 编解码、侧边栏整理与通用设置
### ✨ 新特性
- **CMD/Scheme 参数递归解析**: Scheme 解析增强为参数级递归展开，支持 URL 内参数、独立 CMD 参数串、二级 URL、URL 编码 JSON 与 Base64/JWT 的组合解析
- **CMD/Scheme 兼容性增强**: 补充 hash route 参数、分号分隔参数、camelCase command 字段和短 Base64 JSON 参数解析，提升对常见客户端 schema 的识别覆盖
- **CMD/Scheme 结构化参数名解析**: 支持 `items[]=a&items[]=b`、`items[0].id=1` 和 `user.name=xx` 等点号/括号参数名展开，提升复杂 CMD 可读性
- **CMD/Scheme 表单编码兼容**: 查询参数、hash 参数和 CMD 参数中的 `+` 会按表单编码语义还原为空格，同时保留 `%2B` 表示的字面加号
- **CMD/Scheme HTML 转义分隔符兼容**: 支持解析从 HTML 或日志页面复制出的 `&amp;` / `&#38;` 参数分隔符
- **CMD/Scheme Unicode 转义分隔符兼容**: 支持解析日志中以 `\u0026` 表示 `&` 的 CMD 参数串，减少复制 JSON 日志时漏拆参数
- **CMD/Scheme 字符串化 JSON 解析**: 参数值如果是 `JSON.stringify` 后的 JSON/URL/CMD 字符串，会自动拆掉字符串字面量并继续递归解析
- **CMD/Scheme JSON-like 参数解析**: 参数值支持保守解析 `{nid:123,title:'标题'}` 等常见日志对象写法，提升与内部 schema 调试工具的兼容性
- **CMD/Scheme 运行时占位符识别**: 支持识别 `__CONVERT_CMD__`、`__WEBPANEL_CMD__` 等运行时占位符并展示所在路径，避免真实广告链路中未替换字段被误认为解析失败
- **CMD/Scheme 业务占位符说明**: 补充 `__AD_EXTRA_PARAM_ENCODE_1__`、`__EXT_RENDER_AFD__`、`__REWARD_NUM__`、`__CLICK_ID__` 等真实广告 response 常见占位符说明，便于区分运行时替换字段和解析失败
- **CMD/Scheme 短 Base64 识别**: Scheme 面板支持直接识别短 JSON Base64 和 URL-safe 省略 padding 的短 JSON Base64，减少独立粘贴参数时漏解析
- **Scheme 面板整段 Response 展开**: 独立 Scheme/CMD 面板支持直接粘贴 JSON response，并递归展开其中的 CMD/Scheme、Base64 JSON 和运行时占位符
- **Scheme 面板整段 Response 性能保护**: 整段 JSON response 内部递归展开增加字符串预算护栏，超长字段会保留原值并提示可单独解析
- **Scheme 面板整段 Response E2E 覆盖**: 补充真实 response 抽取链路和超长字段性能保护的界面级回归，防止粘贴整段广告 response 的解析能力退化
- **Scheme 面板大 Response 输入响应优化**: 独立 Scheme 面板解析改为低优先级追赶输入，粘贴或编辑大 response 时优先保证输入框响应，并避免解析未完成时复制旧结果
- **Scheme 面板大 Response 解码 Worker 化**: 独立 Scheme 面板粘贴大 response 时将递归解码放入 Worker，减少真实广告 response 展开期间的主线程卡顿
- **Scheme 面板大 Response 摘要 Worker 化**: 大 response 的 Base64 元信息和 CMD 摘要随解码 Worker 一起生成，避免返回结果后主线程再次解析整段 JSON
- **Scheme 面板复制文本懒生成**: 路径和值、cmdHandler 风格 CMD 结构改为点击复制时再生成，减少大 response 解析完成后的额外主线程计算
- **Scheme 面板序列化与校验懒计算**: 大 response 解码结果未编辑时跳过重复 JSON 校验，序列化结果改为点击复制时再生成，减少 Worker 返回后的主线程计算
- **Scheme 面板主 CMD 聚焦复制**: 整段 response 粘贴到 Scheme 面板后，复制 cmdHandler 风格 CMD 结构会优先聚焦主入口 Scheme，避免把 `errno/data` 外壳一起塞进 `cmdParams`
- **Scheme 面板 Top CMD Schema 摘要**: 整段 response 粘贴到 Scheme 面板后，会基于原始 source 对齐并展示 Top CMD Schema 与来源路径，便于快速确认主链路是否被识别
- **CMD 结构 schema 字段对齐**: `schema=...` 这类常见 CMD 字段会在摘要和 cmdHandler 风格复制中按 `cmdSchema/source` 包装，和底层递归解析规则保持一致
- **真实 Response convert/监测链路回归**: 根据真实广告 response 补充 `convert.button_scheme` 与 `ad_monitor_url.click_url` 脱敏回归，防止按钮转换链路和监测 URL schema 解析退化
- **真实 Response CMD 容器回归**: 补充脱敏真实 response 中 `cmd_policy`、`common_info`、`panel`、`callbackUrl` 链路回归，防止常见广告 CMD 容器和 callback 占位符解析退化
- **CMD/Scheme 内部 Base64 片段解析**: 支持只读解析带内部头的 Base64 JSON 片段，提升真实广告 response 中 extraParam 等扩展字段的可读性
- **CMD/Scheme 内部 Base64 后缀保留**: 带内部头的 Base64 JSON 片段如果在 padding 后继续拼接后缀，会在解析结果中展示 `_base64_prefix` / `_base64_suffix`，避免真实 extraParam 后缀信息被隐藏
- **CMD/Scheme 内部 Base64 后缀解析**: 内部 Base64 JSON 片段的后缀如果还能解出参数串，会额外展示 `_base64_suffix_decoded`，方便直接查看真实 response 中拼接的 os/ip/ua 等请求上下文
- **CMD/Scheme 内部 Base64 后缀降噪**: 真实 extraParam 后缀 query 后继续拼接 JSON 残片时，会避免把残片污染到 `_base64_suffix_decoded` 参数值里，保留更干净的 os/ip/akey 等上下文
- **文件读写错误提示优化**: 打开文件、读取文件、自动保存、另存为、保存预览和 Scheme 应用修改失败时会展示底层错误原因，方便定位权限、句柄失效或 JSON Pointer 写入问题
- **后台请求错误提示优化**: 管理后台请求层会统一展示后端标准错误、HTTP 状态、超时、网络断开和 blob 下载错误体的具体原因，并减少文件管理操作的重复错误提示
- **AI 修复敏感值保护**: AI 修复发送前会识别 token、sign、cookie、密钥和设备标识等敏感字段，覆盖多层 URL 编码与内部 Base64 片段，默认阻止发送原文并提示先脱敏
- **AI 修复本地规则优先**: 常见尾逗号、单引号、未加引号 key、注释和字符串内原始换行会先在本地确定性修复，能修好时不依赖 API Key 且不发送到模型
- **草稿恢复性能保护**: 未保存草稿持久化改为防抖写入，并在页面隐藏/关闭前静默兜底保存；超大草稿会停止写入本地存储并清理旧快照，避免大 response 反复触发 localStorage 配额和主线程压力
- **Scheme 大 Response 解析可取消**: 独立 Scheme 面板在大内容 Worker 解析期间提供取消入口，可立即终止当前解析任务，避免误粘贴超大 response 后只能等待解析完成
- **深度解析问题样本复制**: 深度解析报告新增一键复制问题样本，汇总待检查、性能保护跳过和运行时占位符来源的路径、原因、下一步和原始值，便于沉淀解析规则回归样本
- **深度解析问题样本 JSON**: 深度解析报告支持复制结构化样本 JSON，保留问题类型、路径、业务字段、原因、下一步和原始值，方便把真实 response 问题沉淀为回归用例
- **深度解析样本回归模板**: 新增 `samples:to-regression` 脚本，可将报告复制出的样本 JSON 转成 Vitest TODO 模板，降低真实 response 问题沉淀为回归测试的整理成本
- **深度解析样本敏感值提示**: `samples:to-regression` 会提示样本原始值中疑似 token、sign、cookie 或设备标识的字段，减少真实 response 回归沉淀时误提交敏感内容的风险
- **深度解析样本脱敏模板**: `samples:to-regression` 支持 `--redact` 生成脱敏回归模板，自动替换命中敏感字段的 `originalValue` 并保留命中提示
- **深度解析样本脱敏复制**: 深度解析报告新增「复制脱敏 JSON」，可在界面侧直接生成已替换敏感原始值的样本 JSON
- **CMD 结构差异报告**: 新增 `cmd:diff` 脚本，可对比本工具导出的 CMD 结构与内部 cmdHandler 结果，快速定位缺失路径、额外路径和值差异
- **CMD 结构对比包输入**: `cmd:diff` 支持单个 `{ actual, expected }` JSON 文件或 stdin 输入，减少从内部 cmdHandler 页面复制结果后的本地整理成本
- **CMD 结构对比包复制**: 深度解析报告中的单条 CMD 结构支持复制 `actual/expected` 对比包，可直接接入 `cmd:diff -- --stdin`
- **CMD 结构页面内对比**: 深度解析报告支持粘贴内部 cmdHandler 输出直接对比当前 CMD 结构，页面内展示 schema、source、缺失路径、额外路径和值差异
- **占位符回填模板复制**: 深度解析报告支持复制运行时占位符回填模板，按占位符分组生成空 replacement 与来源摘要，便于向上游补齐真实 CMD
- **占位符回填模板应用**: 模板填充支持识别占位符回填模板，填写 replacement 后可递归替换当前 JSON 中的运行时占位符
- **占位符回填模板预填**: 深度解析报告可一键将回填模板送入模板填充面板，减少复制、打开、粘贴的手动步骤
- **占位符回填质量对比**: 应用占位符回填模板后会展示并支持复制解析质量前后变化，包含覆盖率、CMD 结构、内部字段、占位符、待检查和跳过数量
- **CMD 结构参数概览**: 深度解析报告对可复制的 cmdHandler 结构展示 `cmdSchema` 与 `cmdParams` 顶层参数摘要，便于快速对照内部解析结果
- **深度解析诊断摘要复制**: 深度解析报告新增诊断摘要复制，汇总解析覆盖、CMD Schema Top、内部 CMD 字段、占位符与待处理样例，便于对照内部 cmdHandler 或发给协作者排查
- **深度解析协作排查报告**: 深度解析报告新增一键复制协作排查报告，合并诊断摘要、质量快照要点和当前页面内 cmdHandler 差异，减少真实 response 排查时的多次复制整理
- **深度解析排查归档包**: 深度解析报告支持复制不含原始 response 的归档包，打包诊断摘要、质量快照、脱敏问题样本、占位符回填模板和 corpus 沉淀清单
- **深度解析回归模板复制**: 深度解析报告可直接复制脱敏 Vitest TODO 回归模板，把真实 response 中的待检查、跳过和占位符样本更快沉淀为解析质量评测集
- **深度解析质量快照复制**: 深度解析报告支持复制结构化质量快照 JSON，汇总覆盖率、风险计数、Top CMD Schema、待检查/跳过原因和建议，便于沉淀解析质量基线
- **产品与工程升级评审**: 新增 PM/工程双视角评审文档，梳理当前产品定位、真实 response 解析能力、工程风险、优化方向和新增功能路线
- **解析能力文档同步**: README、架构说明和 Scheme 方案文档补充复杂 response / CMD / Scheme 工作台、Worker 分层、质量快照、corpus 和 cmdHandler 对齐说明
- **解析质量 Corpus 基线**: 新增脱敏广告 response corpus 与 expected snapshot，并提供 `corpus:scheme` 命令固定校验主 CMD Schema、占位符、扫描位置和质量指标
- **解析质量 CI 门禁**: GitHub Actions 与本地 CI 新增独立 Scheme corpus baseline 检查，真实 response 解析退化时可在流水线中单独定位
- **cmdHandler Corpus 对齐**: 脱敏广告 response corpus 增加 cmdHandler expected 子集，并在回归中用差异工具校验关键 CMD Schema 与参数路径
- **真实 Response 业务外壳回归**: 补充贴近真实广告 response 的脱敏回归，覆盖 `supportCMD`、`render_sbox`、`ext_log.ad_extra_param`、`task_policy` 和 extra 数组业务对象
- **CMD Schema 资源分层**: 深度解析报告将视频、图片、lottie 等静态资源 URL 从 CMD 跳转 Schema Top 中拆出，降低真实 response 排查时的热点噪音
- **内部 CMD 字段资源分层**: 深度解析报告将 `video_url`、`poster_image`、`button_icon`、lottie 等静态资源字段从内部 CMD 字段中拆出，并在报告、筛选、质量快照和 UI 中单独展示资源字段分布
- **字符串资源 URL 洞察**: 真实 response 中不带 query 的 `button_icon`、`user_portrait`、`button_image`、lottie 等纯资源 URL 也会进入资源字段和静态资源 URL Top，减少对 cmdHandler 输出的可见性差距
- **解析质量资源字段基线**: 脱敏广告 response corpus 补充资源 URL 样本，并在 expected snapshot 中校验资源字段数量、资源 Schema Top 和资源字段 Top，防止素材字段分层能力回退
- **解析质量快照命令**: 新增 `corpus:snapshot` 命令，可扫描脱敏 Scheme corpus 或通过 `--input` 诊断本地真实 response，并输出覆盖率、CMD/资源热点、占位符和 expected 阈值 pass/fail，便于评审解析质量变化
- **解析质量快照门禁**: 新增 `corpus:snapshot:check` 严格模式并接入 CI，expected 阈值失败时会直接阻断流水线，同时保留可读质量快照输出
- **解析质量快照产物**: `corpus:snapshot` 支持 `--output` 和 `--summary`，CI 会上传 JSON 快照 artifact 并写入 Markdown 摘要，方便 PM/研发查看样本质量变化
- **解析质量趋势对比**: 新增 `corpus:snapshot:diff` 命令，可对比两份质量快照并输出 JSON/Markdown 趋势摘要，strict 模式会拦截覆盖率、CMD/资源字段、待检查、跳过、热点 Schema 和 cmdHandler 对齐退化
- **Scheme 解析性能预算**: 新增 `perf:scheme` 命令，可基于脱敏 corpus 构造 50KB / 250KB response，输出核心解析耗时、覆盖率、CMD 结构、资源字段、占位符、待检查和跳过数量，并支持 strict 模式拦截本地退化
- **匿名工具事件洞察**: 新增 `/api/visitor/events` 与管理后台工具事件聚合，按功能名、状态、输入大小档和耗时档统计使用情况与失败率，不采集 JSON 原文
- **状态栏版本号**: 底部蓝色状态栏新增前端版本号展示，版本来源与 `frontend/package.json` 保持一致
- **状态栏版本号可见性**: 状态栏收口左右布局并补充版本号窄屏回归，避免行列、保存态和校验态信息增多时挤掉版本号
- **源编辑区快操作**: SOURCE 标题栏新增剪贴板粘贴、复制源内容和确认清空入口，减少粘贴调试与重新开始时的操作成本
- **预览结果回写**: PREVIEW 标题栏新增应用到源入口，格式化或深度解析后可确认替换 SOURCE 继续二次处理
- **校验错误快速定位**: SOURCE/PREVIEW 错误条支持定位到解析错误行列并复制错误信息，大 response 排查时不用手动找行号
- **校验错误按钮语义**: 编辑器错误条的定位和复制按钮补充 SOURCE/PREVIEW 上下文，可通过键盘和读屏明确识别正在处理哪一栏错误
- **状态栏字节体积**: 底部状态栏新增当前焦点内容的 UTF-8 字节体积，并让 Length 跟随 SOURCE/PREVIEW 焦点切换
- **状态栏 SOURCE 校验**: 底部状态栏新增 SOURCE 空内容、普通文本、JSON 有效和 JSON 无效状态，无效时展示可定位的错误提示
- **状态栏错误定位**: 点击状态栏 `JSON 无效` 状态可直接跳转到 SOURCE 错误行列，减少从底栏提示到编辑器定位的操作距离
- **复制结果反馈**: SOURCE 与 PREVIEW 复制成功提示补充字符数和 UTF-8 体积，复制大 response 时能确认带走的内容规模
- **SOURCE 替换确认**: 粘贴替换、预览应用和清空确认弹窗展示当前/目标内容规模，成功提示同步展示写入字符数和 UTF-8 体积
- **确认弹窗焦点闭环**: 应用内确认弹窗会把 Tab 焦点限制在取消/确认按钮内，避免高风险操作确认时焦点跑到后台编辑器
- **确认弹窗焦点恢复**: 取消应用内确认弹窗后会把焦点还给触发按钮，减少键盘操作后重新定位的成本
- **Scheme 底部操作语义**: Scheme 面板二维码、复制、序列化和应用按钮会把解析中、空输入、JSON 错误和不可逆等状态同步到可访问名称
- **折叠工具栏语义**: 左侧工具栏折叠后，图标按钮保留明确可访问名称，折叠/展开按钮同步暴露当前展开状态
- **设置弹窗键盘闭环**: 设置弹窗补充 dialog 语义、初始焦点、Escape 关闭和关闭后焦点恢复，减少键盘配置时迷失焦点
- **设置页签键盘语义**: 设置弹窗页签补充 tablist/tab/tabpanel 语义，并支持方向键、Home 和 End 在快捷键、AI 配置、通用设置间切换
- **通用设置开关语义**: 深度格式化自动展开开关补充 switch 语义、当前状态和可见焦点，键盘用户可明确感知开关状态
- **浮动面板焦点闭环**: JSONPath、Scheme、模板填充和深度解析报告面板补充 dialog 语义、关闭按钮初始焦点、Escape 关闭与入口焦点恢复
- **JSONPath 帮助入口语义**: JSONPath 面板标题中的语法帮助图标补充明确可访问名称和可见焦点，折叠/弹窗场景下也能被键盘和读屏识别
- **JSONPath 复制反馈**: JSONPath 复制结果和路径值时会提示复制项数，结果受限时明确是已返回项数
- **JSONPath 结果导航语义**: 查询结果上一个/下一个图标补充明确可访问名称，键盘和读屏用户可直接识别当前导航动作
- **JSONPath 收藏复查**: 点击 JSONPath 收藏或历史记录会直接填入并查询，减少复查常用路径时的二次点击
- **JSONPath 示例直查**: 常用示例点击后会直接填入并查询，和收藏、历史记录入口保持一致
- **JSONPath 空结果恢复**: 未命中结果时提供“清空查询”入口，可一键清掉错误表达式并继续输入
- **JSONPath 列表整理语义**: 收藏和历史记录的删除图标补充包含查询内容的可访问名称，并在键盘聚焦时保持可见
- **JSONPath 操作禁用原因**: 收藏和查询按钮补充动态提示，空表达式、查询中和深度格式化准备中状态下能直接看到当前不可操作原因
- **JSONPath 查询前置提示**: 查询按钮会在 SOURCE 为空或表达式为空时提前展示原因，减少点击后才发现无法查询的试错
- **Scheme 复制反馈**: Scheme 面板复制原始值、解码结果、序列化结果时展示字符数和 UTF-8 体积，复制路径和值时展示条目数
- **Scheme 操作禁用原因**: Scheme 面板底部二维码、复制原始值、复制解码结果、复制 CMD 结构、复制路径值、序列化和应用按钮补充动态提示，空输入、解析中和 JSON 编辑错误时能直接看到原因
- **深度解析复制反馈**: 深度解析报告复制大文本时展示字符数和 UTF-8 体积，复制路径值时展示当前导出的条目数
- **深度解析复制禁用原因**: 深度解析报告的排查报告、质量快照、路径值和问题样本复制按钮会根据筛选中、无报告或无可复制项展示明确提示
- **深度解析复制语义**: 深度解析报告底部复制工具栏会把筛选中、无报告、无路径值和无问题样本等状态同步到可访问名称
- **模板填充操作反馈**: 模板格式化、清空和质量对比复制会给出明确成功提示，禁用按钮会展示当前不可操作原因
- **模板填充可访问提示**: 模板清空、格式化、应用和质量对比复制按钮会把空模板、JSON 错误和 SOURCE 前置条件同步到可访问名称
- **AI 修复摘要复制反馈**: 复制 AI 修复摘要时展示摘要字符数和 UTF-8 体积，方便确认已带走完整排查记录
- **AI 修复处理中提示**: AI 智能修复按钮在请求处理中会展示“请等待当前任务完成”的可访问名称和悬浮提示，避免用户误以为按钮失效
- **AI 连接测试中提示**: 设置弹窗的测试连接按钮在请求处理中会展示“AI 连接测试中，请稍候”，避免配置验证等待期间误重复操作
- **AI 修复文件状态同步**: 打开文件后执行 AI 修复会同步标记当前标签为未保存，避免修复内容在标签切换、关闭或草稿恢复时被旧内容覆盖
- **快捷键冲突提示**: 快捷键设置项改为可聚焦按钮，并在新绑定占用已有快捷键时提示被解除的动作，避免静默丢失配置
- **文件标签键盘导航**: 文件标签补充 tab/tablist 语义、左右/Home/End/Enter/Space 键盘切换、Delete 关闭和关闭按钮可读标签，提升多文件操作可达性
- **文件标签按钮提示**: 新建标签与关闭标签按钮的悬浮提示和可访问名称对齐，未保存标签也会明确提示关闭动作
- **工具栏模式选中态**: 左侧转换工具按钮会高亮当前模式并补充 `aria-pressed` 状态，减少切换格式化、压缩、嵌套解析时的辨认成本
- **浮动面板入口打开态**: JSONPath、Scheme 和模板填充入口会高亮当前打开状态并补充 `aria-pressed`，减少多面板调试时的辨认成本
- **预览编辑锁状态语义**: PREVIEW 锁定/编辑开关补充中文动态提示、可访问名称和当前编辑状态，减少误改预览内容的心智负担
- **编辑器换行开关状态**: SOURCE/PREVIEW 自动换行开关补充 `aria-pressed` 与中文动态提示，长 URL/CMD 排查时状态更清晰
- **标题栏禁用原因提示**: SOURCE 复制/清空与 PREVIEW 应用/复制按钮会按空内容、处理中和内容一致展示禁用原因，减少点不动时的困惑
- **标题栏操作可访问提示**: SOURCE 复制/清空、PREVIEW 应用/复制和深度解析报告按钮的可访问名称会同步当前操作状态，键盘和读屏用户也能直接听到不可用原因
- **自动保存开关状态**: SOURCE 标题栏自动保存补充 `aria-pressed` 与动态 `aria-label`，不可用时仍可点击查看原因提示
- **自动保存回归覆盖**: 自动保存不可用反馈用例覆盖普通点击路径，防止状态提示变成不可操作
- **解析质量基线完整性门禁**: `corpus:snapshot:check` 会识别缺失 expected snapshot 的 corpus 样本并失败，避免新增脱敏样本未配置质量基线却通过 CI
- **cmdHandler 快照对齐门禁**: `corpus:snapshot` 会把 cmdHandler expected 子集对齐结果写入质量快照和 Markdown 摘要，strict 模式在关键路径缺失或 expected 缺失时失败
- **JSONPath 大查询可取消**: JSONPath 查询处理中新增取消入口，会立即终止当前 Worker 并清空旧高亮，避免误查大表达式时只能等待结果返回
- **CMD/Scheme 前导分隔符兼容**: 支持解析 `&cmd=...`、`?&cmd=...` 等日志拼接常见形态，避免前导 `&` 导致整段 CMD 漏解析
- **CMD/Scheme 协议相对 URL 解析**: 支持识别和展开 `//m.baidu.com/path?...` 这类协议相对 URL，嵌套在 CMD 参数中也会继续解析内部 query
- **CMD/Scheme 裸域名 URL 解析**: 支持识别和展开 `m.baidu.com/path?...` 这类省略协议的 URL，嵌套在常见 URL 字段中也会继续解析内部 query
- **CMD/Scheme 深层链路解析**: 默认递归深度提升到 15 层，可展开真实广告 response 中 `rewardImpl -> rewardDialog -> deeplink -> openapp -> landing URL` 等多层跳转链路
- **CMD/Scheme 单参数 camelCase 字段识别**: `h5Url`、`jumpUrl`、`landingUrl` 等常见单参数 URL/CMD 字段会按已有下划线字段同等识别，减少日志片段漏解析
- **CMD/Scheme 广告单字段参数识别**: `task_params`、`convert_cmd`、`panel_cmd`、`ext_policy`、`video_info` 等真实广告 response 高频字段支持单独粘贴解析，减少只复制局部 CMD 时漏展开
- **CMD/Scheme 未编码 URL 字段容错**: `url=https://m.baidu.com/s?word=json&from=feed` 这类未编码 URL 字段会把 `&from` 保留为内层 URL query，并在编辑回写时保持 raw URL 形态
- **CMD/Scheme 未编码分隔符容错**: 参数拆分只在后续片段符合 `key=` 形态时生效，避免 `title=R&D Center&from=feed` 等日志值被误切分
- **CMD/Scheme hash 参数值解析**: 支持 `_hash=%2Fdetail%3Fcmd%3D...`、`next=%23/detail%3F...` 等参数值中的 hash route 片段递归展开
- **CMD/Scheme 跳转字段识别**: `redirectUrl`、`fallbackUrl`、`next`、`deepLink` 等常见单参数跳转字段会按 URL/CMD 字段解析，减少只复制单个字段时漏展开
- **CMD/Scheme App 下载字段识别**: `openAppUrl`、`downloadUrl`、`apkUrl`、`deeplinkUrl` 等常见单参数 App/下载链路字段会自动展开，减少局部复制下载 schema 时漏解析
- **CMD/Scheme 广告按钮字段识别**: `button_cmd`、`convert_btn`、`main_btn`、`ad_monitor_url` 等真实广告局部字段支持单独粘贴解析，减少从完整 response 中只复制按钮或监测配置时漏展开
- **CMD/Scheme 多行参数解析**: 支持解析日志复制出的 `cmd=...\nfrom=...` 多行参数串，减少换行粘贴时漏展开
- **CMD/Scheme 字符串字面量兼容**: 独立 Scheme 面板和深度格式化支持解析 `"cmd=..."`、`"https://..."` 等 JSON 字符串字面量包裹的链路，并在回写时保留外层字面量
- **CMD/Scheme JSON 斜杠转义兼容**: 支持解析日志中 `baiduboxapp:\/\/...` 这类 JSON 斜杠转义 URL，并在编辑回写时保留原转义形态
- **深度格式化 CMD/Scheme 展开**: 「自动展开 CMD/Scheme 字符串」开启后，深度格式化可直接展开 JSON 字段中的 `cmd=...&from=...` 参数串和 `baiduboxapp://...?...` URL Scheme，并在未编辑时精确还原原始字符串
- **深度格式化默认展开体验**: 新用户默认开启「自动展开 CMD/Scheme 字符串」，粘贴真实 response 后无需先进设置即可看到深层 CMD、URL 与 Base64 结构
- **深度格式化 Base64 Scheme 展开**: 「自动展开 CMD/Scheme 字符串」开启后，深度格式化会同步展开 Base64 JSON 和带内部头的 Base64 JSON 片段，整段真实广告 response 可直接看到 extraParam 结构
- **深度格式化累计解析保护**: 自动展开 CMD/Scheme 时增加累计字符串解析预算，避免大量中长字符串叠加导致深度格式化耗时过高，并在预览中提示跳过位置
- **首屏引导依赖瘦身**: 新手引导与功能引导改为按需加载 `driver.js` 和样式，并单独拆分 `vendor-driver` 产物，减少主页面首次预加载的工具库体积
- **AI 连接测试依赖瘦身**: 设置弹窗打开时不再静态加载 AI SDK，点击「测试连接」时才按需加载连接测试逻辑，减少快捷键和通用设置场景的额外网络请求
- **首屏预加载依赖收敛**: Vite 动态导入预加载助手固定拆入 `vendor-runtime`，避免主页面首屏误预加载后台图表相关 AntV/AntD chunk，缩小 `index.html` 预加载边界
- **首屏预加载防回归**: CI 和镜像构建增加构建产物检查，阻止主页面 `modulepreload` 重新带入 AI、引导、后台图表等按需重依赖
- **首屏 JS 体积预算**: 首屏构建检查增加初始 JS raw/gzip 预算，防止主入口和预加载依赖在后续迭代中静默变胖
- **访问统计按需加载**: 移除默认 Google Analytics 占位脚本，仅在构建时配置真实 `VITE_GA_MEASUREMENT_ID` 后动态加载，减少默认首屏第三方请求
- **深度解析占位符状态**: 覆盖提示遇到运行时占位符时改为展示“结构解析完成 · 占位符 N”，并补充筛选和来源排查建议，避免真实 response 中把占位符误读为完全解析结果
- **深度格式化真实广告链路展开**: 嵌套解析复用 Scheme 面板的 15 层默认深度，整段广告 response 也能展开多层跳转字段到最终落地页参数
- **深度格式化 Scheme 还原增强**: 修复 URL Scheme 内含二级 URL 时，未编辑预览回写无法优先还原父级原始字符串的问题
- **深度解析跳过记录定位**: 深度解析报告中的性能保护跳过记录支持一键复制路径，便于在真实 response 中快速回到源字段排查
- **深度解析 cmdHandler 式线索**: 深度解析报告会展示 `cmdSchema`、嵌套 `cmd解析` 字段和 `ad_extra_param` / `extInfo` 等 `ext解析` 线索，贴入真实广告 response 后更容易对齐内部 CMD 调试工具的阅读方式
- **CMD 结构复制 source 对齐**: 复制 cmdHandler 风格 CMD 结构时同步带上原始 `source` 串，方便和内部 CMD 解析工具对照排查真实 response
- **CMD 结构嵌套 source 对齐**: 复制 cmdHandler 风格 CMD 结构时，嵌套 `*_cmd` / `*_scheme` 字段会保留各自的 `cmdSchema`、`cmdParams` 和 `source`
- **CMD 结构 URL 字段 source 对齐**: 复制 cmdHandler 风格 CMD 结构时，嵌套 `appUrl`、`url`、`webUrl` 等常见跳转字段也会保留 `cmdSchema`、`cmdParams` 和 `source`
- **CMD 结构复制懒生成**: 深度解析报告改为点击复制时再生成大体积 cmdHandler 结构，打开报告和筛选真实 response 时不再提前拼接整段复制文本
- **CMD 结构隐藏记录复制**: 深度解析报告即使只展示前 200 条展开记录，也能复制当前筛选下的 CMD 结构，避免大 response 中靠后的 CMD 复制入口消失
- **Scheme 面板 URL 回写增强**: Scheme 解析面板编辑完整 URL/Scheme 后可按原 query、hash route 和 `_hash` 分区重建链接，避免应用修改时退化成 JSON 字符串
- **Scheme 面板序列化复制**: 独立 Scheme 解析面板支持将当前编辑后的解码结果重新编码并复制，补齐解析后快速回写 CMD/URL 的工作流
- **Scheme 面板精确回写**: Scheme 图标弹窗应用修改时改用 JSON Pointer 定位，修复 key 包含点号、斜杠或波浪线时可能写错字段的问题
- **Scheme 结构化参数回写**: 编辑 `items[0].id`、`ext[scene]` 等展开后的参数时，回写会保留原点号/括号参数形态，避免退化成单个 JSON 字符串参数
- **Scheme 编辑防误写**: 解码结果为 JSON 时会实时校验编辑内容，非法 JSON 会阻止应用修改并展示错误提示，避免误写坏原字段
- **JWT 识别准确性**: JWT 检测改为校验 header/payload JSON 对象，避免 `1.2.3` 等版本号或普通三段字符串误触发 Scheme 解析
- **Base64 编解码**: 新增 Base64 编码 / Base64 解码转换模式，支持 UTF-8 中文内容、URL-safe Base64 与预览编辑器反向同步
- **URL 编解码**: 新增 URL 编码 / URL 解码 转换模式，支持对输入内容进行 `encodeURIComponent` / `decodeURIComponent`，预览编辑器支持反向同步
- **嵌套解析自动展开 Scheme**: 深度格式化（嵌套解析）新增 `autoExpandScheme` 选项，启用后自动检测并展开 URL 编码的 CMD/Scheme 字符串值
- **通用设置面板**: 设置弹窗新增「通用设置」Tab，包含「嵌套解析时自动展开 CMD/Scheme 字符串」toggle 开关，设置自动持久化到 localStorage
- **Scheme 面板应用回写**: 独立模式 Scheme 解析面板新增「应用修改」回调，编辑解码结果后可一键写入源编辑器
- **Scheme 路径值复制**: Scheme 解析结果为 JSON 时支持一键复制 `JSONPath = 值` 明细，单独排查 CMD 字段时可直接带走关键字段和值
- **深度解析路径值复制**: 深度解析报告支持复制当前筛选命中的内部 `JSONPath = 值`，隐藏在大对象后面的字段也能直接带走排查
- **深度解析原始值复制**: 展开记录、未展开线索、跳过记录和占位符来源支持直接复制原始字段值，便于对比外部 CMD 解析器或沉淀规则样本
- **深度解析占位符聚焦**: 运行时占位符汇总项支持点击后自动筛选报告，大 response 中可快速聚焦同一类占位符来源和路径
- **深度解析报告轻量化**: 占位符来源的悬浮提示改用短预览，避免真实 response 中超长 Scheme/CMD 原文重复写入 DOM
- **深度解析筛选轻量化**: 报告筛选优先匹配路径、业务标签、占位符值和说明，长 Scheme/CMD 原文改为兜底匹配，减少真实 response 输入筛选时的无谓扫描
- **深度解析筛选响应优化**: 报告面板筛选输入改为延迟更新结果列表，并在结果同步前暂停筛选复制，降低真实 response 中快速输入筛选条件时的卡顿感
- **深度解析筛选空状态**: 报告筛选无匹配时展示明确空状态并支持一键清空，避免真实 response 排查时误以为报告没有生成
- **AI 修复差异摘要**: AI 修复成功后展示修复前后差异摘要，支持复制摘要，帮助用户快速判断修复结果是否可信
- **AI 连接测试**: AI 配置页新增连接测试，可在保存前验证 API Key、Base URL 与模型是否可用，配置变更后会清空旧测试结果
- **AI Base URL 兼容性**: OpenAI 兼容接口调用会自动处理 Base URL 尾部斜杠，避免用户复制地址后拼出双斜杠请求路径
- **AI 修复空状态提示**: 源编辑器为空时点击 AI 修复会提示先输入 JSON 内容，避免按钮点击后无反馈
- **AI 修复配置引导**: 未配置 API Key 时点击 AI 修复会自动打开 AI 配置页，减少首次使用时的查找成本
- **JSONPath 查询收藏**: JSONPath 面板新增常用查询收藏、取消收藏和一键回填，便于复用高频调试表达式
- **JSONPath 结果复制**: JSONPath 查询命中后支持一键复制全部匹配值，多结果按格式化 JSON 数组输出，方便直接带走调试结果
- **JSONPath 路径值复制**: JSONPath 查询命中后可一键复制 `JSONPath = 值` 明细，便于把真实 response 的命中字段和值发给协作者排查
- **JSONPath 结果预览**: 查询命中后在面板内展示结果值列表，支持点击单条结果跳转对应 PREVIEW 高亮，减少只靠计数和复制判断结果的成本
- **JSONPath 查询空状态**: 查询无命中时展示独立空状态并保留查询表达式，避免真实 response 排查时误以为查询未执行或解析出错
- **JSONPath 结果业务标签**: 查询结果预览会展示命中路径，并识别 `k/v`、`key/value` 形态下的 `extraParam` 等业务标签，减少 `$..v` 这类查询命中后难以区分来源的问题
- **业务字段标签兼容增强**: JSONPath 结果、Scheme 图标和深度解析报告补齐 `key/v`、`k/value`、`field/content` 等常见日志字段形态，减少真实 response 排查时字段来源丢失
- **JSONPath 大结果预览轻量化**: 查询命中根节点、大对象或大数组时优先展示结构摘要，避免真实 response 结果面板重复生成整段预览文本
- **深度解析报告一键定位**: 展开记录、内部路径、未展开线索、运行时占位符和跳过记录支持直接填入 JSONPath 面板并查询，减少真实 response 排查时复制路径后的手动跳转
- **深度解析内部路径片段复制**: 报告中的内部路径支持一键复制 `JSONPath = 值` 片段，便于把真实 response 的关键字段和值直接发给协作者排查
- **深度解析隐藏路径筛选展示**: 报告筛选命中默认隐藏的深层内部路径时，会优先展示命中的路径和值，避免只看到来源记录却看不到目标字段
- **深度解析隐藏路径索引提示**: 展开记录存在更多内部路径时展示已索引数量，并提示可搜索字段名翻出隐藏路径，降低真实 response 首次排查成本
- **深度解析内部路径总量提示**: 展开记录会展示内部路径显示数和总量，真实大 CMD 只显示前 12 条时也能看出已解析出的整体字段规模
- **深度解析隐藏路径批量复制**: 复制路径值会使用当前筛选下已索引的内部路径，未筛选时也能带走默认折叠的隐藏字段
- **深度解析路径值复制性能**: 路径值复制文本改为点击时生成，避免报告筛选或渲染时提前拼接大量隐藏路径文本
- **深度解析隐藏路径懒序列化**: 内部路径搜索索引不再提前序列化隐藏字段值，真实大 response 打开报告和输入筛选时减少无用 `JSON.stringify`
- **深度解析内部 CMD 字段懒序列化**: `appUrl`、`panel_cmd` 等内部 CMD 字段索引保留原始值，点击复制时再生成片段文本，减少报告构建开销
- **深度解析报告联动 Scheme**: 展开记录支持直接把原始值填入 Scheme 面板继续拆解，减少从报告复制路径、再手动取字段值的排查成本
- **深度解析诊断联动 Scheme**: 未展开线索和性能保护跳过记录支持直接把原始值填入 Scheme 面板，贴入真实 response 后可从诊断项继续单字段拆解
- **深度解析占位符联动 Scheme**: 运行时占位符支持直接打开来源字段原始 CMD/Scheme，便于从 `__CONVERT_CMD__` 等占位符反查完整来源链路
- **深度解析报告筛选复制**: 报告面板筛选后可只复制当前命中的展开记录、占位符、未展开线索和跳过记录，便于把单个业务字段或占位符排查结果发给协作者
- **深度解析风险计数快捷筛选**: 报告顶部的 `待检查`、`占位符`、`跳过` 计数支持点击筛选，真实 response 中可快速聚焦问题类别
- **深度解析不可逆计数筛选**: 报告顶部的 `不可逆` 计数支持点击筛选，方便从真实 response 中快速定位只读解析的 Base64 字段
- **深度解析类型计数筛选**: 报告顶部的 `CMD`、`URL`、`Base64` 计数支持点击筛选，贴入真实 response 后可按解析类型快速缩小排查范围
- **深度解析占位符专项复制**: 运行时占位符区新增一键复制当前筛选占位符汇总和明细，方便把真实 response 中的 `__CONVERT_CMD__`、`__AD_EXTRA_PARAM_ENCODE_1__` 等来源路径发给协作者
- **深度解析 CMD 结构复制**: 展开记录支持直接复制 cmdHandler 风格的 `cmdSchema` / `cmdParams` 结构，整段 response 中定位到的 CMD 字段可直接带走协作排查
- **深度解析 CMD 结构批量复制**: 报告面板支持一键复制当前筛选下所有 cmdHandler 风格 CMD 结构，多条广告 CMD 可一次性发给协作者排查
- **深度解析 CMD 结构计数**: 报告顶部和底部会展示可复制 CMD 结构数量，URL Scheme 形态的广告跳转也能一眼看到可带走的 cmdHandler 结果
- **深度解析 CMD 结构快捷筛选**: 点击报告顶部 `CMD结构` 计数即可只看可复制的 cmdHandler 记录，真实 response 多层字段排查时更快定位目标 CMD
- **深度解析 CMD Schema 分布**: 报告顶部新增 `cmdSchema` 聚合，展示根 CMD 与嵌套 CMD 的 schema 出现次数并支持点击筛选，便于先判断 response 涉及哪些跳转能力再下钻
- **深度解析 CMD 来源分布**: 报告顶部新增 `cmdSchema` 来源聚合，按 `https://domain`、`baiduboxapp://v7`、`nadcorevendor://vendor` 等来源快速归类，并修正嵌套 schema 筛选命中
- **深度解析 CMD Schema 明细**: 展开记录新增 `CMD Schema路径` 明细，筛选来源或嵌套 schema 后可直接看到命中的具体路径并复制定位
- **深度解析内部 CMD 字段计数**: 报告会统计根 CMD 结构内解析出的内部 CMD/Scheme 字段数量，并支持点击筛选，避免真实 response 中 1 条根结构隐藏多层 CMD 时被低估
- **深度解析内部 CMD 字段分布**: 报告顶部新增高频内部 CMD 字段聚合，展示 `appUrl`、`panel_cmd`、`convert_cmd` 等字段出现次数并支持点击筛选，大 response 中可先看主要链路分布再下钻
- **深度解析广告字段识别**: 内部 CMD 字段明细补齐 `convert_btn`、`main_btn`、`ad_monitor_url` 等广告按钮和监测字段，已解析出的局部结构也能在报告、筛选和复制中直接看见
- **深度解析内部 CMD 筛选降噪**: 搜索 `convert_btn` 等字段名时不再因为父级对象摘要包含该 key 而误命中父容器，聚焦复制会更贴近实际命中路径
- **深度解析内部 CMD 计数口径**: 未聚焦筛选时按真实解析总数展示内部 CMD 字段数量，避免大 response 中已索引数量和总量混用导致 `200/300` 这类误导
- **深度解析内部 CMD 字段明细**: 报告会展示内部 CMD/Scheme 字段的具体路径和预览值，搜索 `appUrl`、`panel_cmd` 等字段时可直接翻出默认隐藏的深层 schema
- **深度解析内部 CMD 筛选口径**: 搜索命中深层 CMD/Scheme 字段后，报告计数和 CMD 结构复制会按命中字段收敛，避免筛选后仍展示整条根链路的内部 CMD 总数
- **深度解析 CMD 聚焦复制**: 搜索命中 `appUrl`、`panel_cmd` 等内部 CMD 字段后，复制 CMD 结构会导出命中字段投影后的 `cmdParams`，协作排查时不用再手动裁剪整条根链路
- **深度解析聚焦复制提示**: 筛选命中内部 CMD 字段时，报告和按钮会明确标记“聚焦复制”，复制文本也会说明 `cmdParams` 已按命中字段裁剪，避免误当完整根链路
- **深度解析路径值聚焦复制**: 筛选命中 `appUrl`、`panel_cmd` 等内部 CMD 字段时，复制路径值优先带出命中的内部 CMD 字段片段，避免混入同一根 CMD 下的普通叶子路径
- **深度解析内部路径聚焦复制**: 搜索命中 `cmd.nid`、`category` 等普通内部路径时，复制 CMD 结构也会按命中路径裁剪 `cmdParams`，避免把同一 CMD 下的无关参数一起带出
- **深度解析普通路径筛选收敛**: 搜索普通内部路径时，报告不再混入同一根 CMD 下未命中的内部 CMD 字段明细，筛选结果、聚焦复制和复制报告口径更一致
- **深度解析内部路径索引扩容**: 内部路径搜索索引从 200 条提升到 1000 条，真实大 response 中靠后的 `category`、`task_id` 等字段也能被筛选翻出，同时默认展示仍保持轻量
- **深度解析路径值复制截断提示**: 内部路径超过搜索索引上限时，复制路径值会明确提示还有更多内部路径未复制，避免大 response 排查时误以为已完整带走
- **真实广告 response 回归覆盖**: 补充整段广告 response 的脱敏回归样本，覆盖 `rewardImpl`、`rewardWebPanel`、`rewardDialog`、`deeplink`、`openapp`、落地页 URL、运行时占位符和 `extraParam` Base64 后缀，防止 CMD 解析能力后续退化
- **深度解析占位符筛选降噪**: 搜索 `panel_cmd`、`video_url` 等短字段名时，占位符列表不再因为原始整段 CMD 命中而误带同源占位符；长原文片段仍可作为兜底定位
- **深度解析诊断筛选降噪**: 未展开线索和跳过记录复用短字段名降噪策略，避免筛选 `panel_cmd` 等字段时被长原文误命中，同时保留长片段和 `key=` 原文兜底
- **深度解析占位符来源预览**: 运行时占位符卡片和复制报告会展示来源字段原始值预览，多个占位符来自同一 CMD 时可先扫读来源再决定是否打开
- **深度解析占位符聚合摘要**: 运行时占位符会按占位符值和来源聚合展示，真实 response 中出现二十多个占位符时可先看类型分布和主要来源再展开明细
- **Scheme 面板占位符聚合摘要**: 独立 Scheme 解析会按占位符值聚合展示出现次数，单独粘贴 CMD 时可快速看出 `__CONVERT_CMD__`、`__WEBPANEL_CMD__` 等运行时字段分布
- **Scheme 面板提示轻量化**: 参数、路径和内部 Base64 元信息的悬浮提示改用短预览，避免真实长 CMD/URL/Base64 值重复写入 DOM
- **Scheme 参数数组预览优化**: 多值参数的短预览改为增量截断，避免真实 response 中大量重复参数先完整拼接再裁剪
- **深度解析报告覆盖提示**: 报告顶部新增解析覆盖率、风险说明和未展开原因分级，区分已解码但未结构化、疑似规则缺口和性能保护跳过，便于判断真实 response 下一步排查方向
- **深度解析 URL 编码容错**: 真实日志中出现半截 UTF-8 或异常 `%` 编码时不再中断整段深度解析，会保留原值并在未展开线索里提示解码失败原因
- **深度解析跳过原因说明**: 跳过记录会区分单字段长度保护和累计预算保护，并给出单独粘贴 Scheme 面板或缩小 response 的下一步建议，避免把性能护栏误认为解析失败
- **复制失败原因提示**: PREVIEW、JSONPath、Scheme、深度解析报告和 AI 修复摘要复制失败时会展示浏览器拒绝或环境不支持等具体原因，便于用户自行排查剪贴板权限问题
- **模板填充格式化**: JSON 模板填充面板新增「格式化模板」，便于粘贴压缩模板后快速检查结构再应用
- **浮动面板布局重置**: 设置面板新增一键恢复 JSONPath、Scheme 和模板面板位置/尺寸，方便外接屏或分屏切换后自助恢复
- **配置备份导入导出**: 设置面板新增配置备份能力，支持迁移快捷键、通用设置、JSONPath 收藏/历史、模板和面板布局，导出文件默认不包含 AI Key
- **批量打开文件**: 文件选择器和拖拽入口均支持一次打开多个 JSON/文本文件，已有无文件草稿会先保留为 Untitled 标签
- **JSON Lines 基础支持**: 校验、压缩和 Key 排序支持一行一个 JSON 的 `.jsonl` 内容，方便处理日志和埋点数据
- **JSONPath 查询 JSON Lines**: JSONPath 面板支持把 `.jsonl` 输入按虚拟数组查询，并将命中结果高亮回原始行
- **JSON Lines 格式化回写**: 格式化模式会将 `.jsonl` 预览为可读 JSON 数组，预览编辑同步时再恢复为一行一个 JSON
- **JSON Lines 深度格式化**: 嵌套解析支持展开 `.jsonl` 每行对象中的 JSON 字符串和 CMD/Scheme 字段，并在回写时恢复 JSONL 形态
- **JSON Lines 行级错误提示**: 校验 `.jsonl` 时会标明具体失败行号，便于快速定位日志中的坏行
- **JSON 家族文件打开增强**: 文件选择器和文本文件识别补充 `.ndjson`、`.har`、`.geojson`、`.webmanifest`、`.map` 等常见调试文件，并兼容 `application/*+json` MIME
- **JSON 家族后台上传增强**: 管理后台上传白名单和部署默认配置同步支持 `.ndjson`、`.har`、`.geojson`、`.webmanifest`、`.map` 等 JSON 调试文件
- **真实粘贴 JSON 提取**: 格式化、压缩、Key 排序、深度格式化和校验支持从 Markdown JSON 代码块、JS 赋值和 JSONP 回调中提取 JSON，减少复制 response 后手动删外壳的成本
- **XSSI Response 外壳提取**: 格式化、压缩、Key 排序、深度格式化和校验支持 `while(1);`、`for(;;);`、`)]}',` 等安全前缀包装的真实接口 response，预览编辑回写时保留原前缀
- **包装 JSON 回写保真**: FORMAT 模式预览编辑回写时会保留原始 JS 赋值、JSONP 回调和 Markdown 代码块外壳，仅替换内部 JSON 内容
- **深度格式化包装回写保真**: 深度格式化提取包装 JSON 后会在预览编辑同步时保留原始外壳，并按内部 JSON payload 判断回写缩进

### 🎨 界面优化
- **侧边栏分组合并**: 将「转义处理」和「编码转换」两个工具组合并为「编码 / 转义」，侧边栏由 5 组缩减为 4 组，布局更紧凑
- **文件选择器类型补齐**: 打开和另存为文件选择器复用文本文件白名单，补齐日志、SQL、YAML、XML、JSONL 和 CSV 等常见开发文本类型
- **上传文本类型一致性**: 管理后台上传控件、后端上传白名单和部署默认配置补齐同一批开发文本扩展名，并兼容无点号扩展名配置
- **管理后台加载优化**: 后台页面与图表库改为按需加载，拆分稳定 vendor chunk，降低后台首包体积并消除生产构建大 chunk 警告
- **管理后台统计稳定性**: 地区分布最大值计算改为线性遍历，避免数据量异常时数组展开造成调用栈溢出
- **大文件交互优化**: JSONPath 数据源改为面板打开时再深度格式化，状态栏行列统计改为单次扫描，减少大文本输入时的同步计算和内存峰值
- **大文件状态栏轻量化**: 超大内容下状态栏行列统计改为采样提示，避免辅助统计在每次编辑时扫描完整文本影响输入流畅度
- **大文件打开防护**: 打开文件与拖拽文件新增 50 MB 大小上限提示，避免超大文本一次性读入导致页面卡死或崩溃
- **文件打开类型防护**: 打开文件与拖拽文件会拒绝图片、压缩包、PDF 等明显非文本文件，避免误选二进制内容拖垮编辑器
- **大文件转换 Worker 化**: 大输入下的格式化、压缩、深度格式化和 Key 排序改为 Web Worker 异步执行，降低主线程卡顿风险并保护处理中预览不被复制或保存
- **大字段深度解析护栏**: 深度格式化遇到超长字符串时会跳过递归展开并在 PREVIEW 显示提示，避免单个大字段拖慢真实 response 解析
- **JSONPath 查询 Worker 化**: JSONPath 查询、深度格式化和高亮范围映射迁移到 Worker，避免大 JSON 查询时主线程重复解析和卡顿
- **JSONPath 查询解析瘦身**: 标准 JSON 查询复用 source map 的解析结果和指针映射，避免查询与高亮阶段重复解析同一份大 JSON
- **JSONPath 大结果保护**: JSONPath 查询默认返回前 1000 个命中用于高亮、预览和复制，超过上限会提前停止并提示截断，避免 `$..*` 等查询一次性扫描和回传海量数据
- **JSONPath 关闭清理**: 关闭 JSONPath 面板时会终止未完成查询并清除 PREVIEW 高亮，避免面板关闭后残留查询状态
- **JSONPath 输入容错**: 查询前自动裁剪表达式，空表达式给出中文提示，避免复制表达式带空格或误清空时暴露底层错误
- **大文件校验 Worker 化**: Source 与 PREVIEW 大 JSON 校验改为防抖后异步执行，减少 `JSON.parse` 校验造成的主线程阻塞
- **JSON 校验链路收敛**: Source、PREVIEW 与预览回写前校验统一复用同一套清理和异步校验逻辑，降低大 JSON 编辑时的重复 Worker 管理和竞态风险
- **E2E 启动稳定性**: 主应用冒烟、自动保存和刷新保护用例复用统一 Monaco 就绪等待，降低生产构建中编辑器懒加载波动造成的误报
- **大文件 Scheme 扫描 Worker 化**: PREVIEW 区大 JSON 的 Scheme 图标检测迁移到 Worker，避免旁路扫描抢占主线程
- **Scheme 扫描解析瘦身**: Scheme 图标扫描复用 source map 的解析结果，避免同一份 PREVIEW JSON 重复 `JSON.parse`，降低大 response 扫描成本
- **Scheme 图标扫描保护**: PREVIEW 中 Scheme 图标默认最多标出前 1000 个，超过上限时提示已跳过后续结果，避免海量 URL/CMD 装饰拖慢编辑器
- **单行 Scheme 精确点击**: Scheme 扫描记录字符串列范围，PREVIEW 中压缩成一行的真实 response 也可直接点击具体 URL/CMD 打开对应解析
- **Scheme 图标定位准确性**: JSON 内 Scheme 扫描改用 source map 定位，修复数组项或特殊 key 下解析图标可能落到错误行的问题
- **Scheme 扫描依赖瘦身**: 将 JSON source map 定位逻辑从通用 Scheme 编解码工具拆出，避免格式化和校验 Worker 被动打包扫描依赖
- **大文件脏 Diff 防护**: 超大文件编辑时跳过行级脏 Diff 装饰计算，避免辅助视觉效果长时间占用主线程
- **语言识别高频路径优化**: 编辑器语言识别优先通过前缀判断大 JSON，减少每次输入时的完整字符串裁剪开销
- **浮动面板可见性防护**: 读取历史位置、尺寸和窗口缩放时自动拉回可见范围，避免 JSONPath、Scheme 和模板面板打开到屏幕外
- **后台统计切换稳定性**: 后台流量统计请求增加序号保护，避免快速切换时间范围时旧响应覆盖最新数据
- **后台概览加载稳定性**: Dashboard 统计概览请求增加卸载保护，避免页面切走后旧响应继续回写状态
- **文件管理加载稳定性**: 文件列表和预览请求增加序号保护，避免快速搜索、翻页或连续预览时旧响应覆盖当前内容
- **用户管理加载稳定性**: 用户列表请求增加序号保护，避免快速搜索、翻页或刷新时旧响应覆盖当前用户数据
- **未保存退出保护**: 存在脏标签或无文件草稿时，刷新/关闭页面会触发浏览器离开确认，降低误丢数据风险
- **未保存标签关闭确认**: 关闭有修改的标签时改用应用内确认弹窗，替代浏览器原生 confirm，并支持取消后继续编辑
- **未保存工作区恢复**: 自动缓存未保存标签和无文件草稿，刷新或崩溃后可恢复未保存内容，降低误操作数据丢失风险
- **无文件另存状态同步**: 无活动标签的 Source 草稿另存成功后自动生成已保存标签，避免保存后仍触发未保存退出保护
- **预览保存取消体验**: 保存 PREVIEW 内容时用户取消系统保存框不再提示失败，下载模式下延后释放临时 URL，降低偶发下载丢失风险
- **文件操作控制台收口**: 打开文件取消、保存成功和自动保存成功不再输出调试日志，减少桌面版与浏览器控制台噪声
- **自动保存状态反馈**: 自动保存开关新增开启、关闭和未打开文件时的明确提示，提升文件安全状态的可感知性
- **状态栏保存态提示**: 底部状态栏新增草稿、未保存、已保存、等待自动保存和自动保存已同步状态，并阻止未保存标签误开启自动保存
- **复制可靠性增强**: 预览内容、JSONPath 结果、Scheme 解码结果和 AI 修复摘要复制统一支持传统 textarea 回退，降低剪贴板权限异常导致的复制失败
- **模板填充前置提示**: 模板填充面板会提前提示 SOURCE 为空或不是合法 JSON，并禁用应用按钮，减少点击后才报错的试错成本
- **隐私模式引导容错**: 本地存储读取被浏览器阻止时自动跳过新手引导，避免无法记住完成状态时反复弹窗干扰编辑器加载
- **AI 自定义配置校验**: 选择自定义 OpenAI 兼容服务时，缺少 Base URL 会在设置页阻止保存和连接测试，避免保存不可用配置后才失败
- **Hash Route CMD 解析**: Scheme 面板支持直接解析 `#/detail?cmd=...&from=...` 这类独立 hash route 参数串，贴入线上跳转片段也能展开内部 CMD
- **Scheme 参数来源展示**: Scheme 面板会按 Query 参数和 Hash 参数分区展示来源与参数预览，便于快速判断复杂 URL/CMD 的外层和内层参数
- **Scheme CMD 结构摘要**: Scheme 面板会展示 `cmdSchema`、`cmdParams` 数量、嵌套 `cmd解析` 与 `ext解析` 字段，单独粘贴真实 CMD 时也能快速对齐内部调试工具的阅读方式
- **Scheme CMD 结构复制**: Scheme 面板新增「复制 CMD 结构」，可导出 cmdHandler 风格的 `cmdSchema` / `cmdParams` JSON，便于和内部 CMD 调试工具、协作排查口径对齐
- **Scheme 内部 Base64 提示**: Scheme 面板会把 `_base64_*` 元信息提升为可扫读提示，直接展示内部头、拼接后缀和后缀解析出的 os/ip/ua 等参数摘要
- **Scheme 面板操作区自适应**: 底部操作按钮支持在窄面板下自动换行，避免真实大链路编辑后「复制序列化结果」和「应用修改」被挤出面板
- **Scheme 扫描路径安全性**: PREVIEW 中 Scheme 图标识别到特殊 key 时改用 JSONPath bracket 写法展示路径，避免 `a.b`、`x/y` 等字段被误读成多级路径
- **Scheme 来源路径复制**: 从 PREVIEW Scheme 图标打开解析面板时支持一键复制来源 JSONPath，便于继续粘贴到 JSONPath 面板定位同一字段
- **Scheme 扫描业务标签**: PREVIEW 中识别 `k/v` 与 `key/value` 形态的真实 response 字段时，会在 hover 和 Scheme 面板展示 `extraParam` 等业务标签，同时保持 JSONPath/Pointer 精确定位不变
- **深度格式化解析摘要**: PREVIEW 顶部新增深度解析摘要，展示本次展开的路径数量、CMD/URL/Base64/嵌套 JSON 数量和不可逆片段数量，便于快速判断真实 response 的展开覆盖度
- **深度解析报告面板**: PREVIEW 新增「报告」入口，可查看每个展开路径的转换类型、原始值预览、不可逆标记和性能跳过记录，便于复盘真实 response 的解析覆盖情况
- **深度解析报告业务标签**: 深度解析报告会继承 `k/v` 与 `key/value` 字段的业务标签，支持按 `extraParam` 等名称筛选和复制报告，减少真实 response 中只看 `v` 字段路径的理解成本
- **深度解析诊断业务标签**: 深度解析报告中的未展开线索、运行时占位符和跳过记录也会展示并支持筛选业务标签，便于在大 response 中快速定位 `extraParam` 等来源字段
- **深度解析报告操作区自适应**: 报告面板底部统计和复制报告按钮支持窄宽度自动换行，避免计数较多时挤压操作按钮
- **深度解析报告筛选**: 解析报告支持按路径、类型和原始值筛选，并限制首屏渲染条数，避免真实大 response 的海量展开记录拖慢面板
- **深度解析报告深层搜索**: 报告筛选会检索受限隐藏索引中的内部解析路径，真实大 Scheme 即使只展示前 12 个内部路径，也能按更深层 key 快速命中来源记录
- **深度解析结果预览**: 解析报告每条记录新增解析结果摘要，并支持按解析后的 key 搜索，减少真实 response 中巨大 CMD 字段需要反复展开定位的成本
- **深度解析路径复制**: 解析报告每条展开记录支持一键复制路径，便于把真实 response 中定位到的字段继续用于 JSONPath 查询或协作排查
- **深度解析路径安全性**: 解析报告中包含点号、空格或短横线等特殊 key 的字段改用 JSONPath bracket 写法，复制路径后可直接用于 JSONPath 查询
- **深度解析内部路径展示**: 解析报告会展示并支持复制解析结果内部字段路径，真实广告 response 中多层 CMD 展开后可直接定位到最终叶子字段
- **深度解析未展开线索**: 解析报告会标出疑似 CMD/URL 编码但未展开成结构化对象的字段，方便判断真实 response 中剩余长字段是否需要继续补解析规则
- **深度解析运行时占位符**: 解析报告会展示 `__CONVERT_CMD__` 等运行时占位符的展开后路径和来源字段，便于区分“解析缺失”和“服务端占位待替换”
- **深度解析线索路径复制**: 未展开线索和运行时占位符支持一键复制路径，方便继续用于 JSONPath 查询、排查记录或协作沟通
- **深度解析占位符来源复制**: 运行时占位符支持一键复制来源字段路径，便于从真实 response 的占位符叶子节点快速回到原始 Scheme 字段

### 🏗️ 工程化
- **功能引导类型收口**: 移除 `useFeatureTour` 中对 driver.js 的 `@ts-ignore`，改为直接复用当前依赖提供的 `Driver` 类型，降低后续升级时的类型盲区
- **CMD/Scheme 样本回归覆盖**: 新增真实 CMD/Scheme 粘贴样本测试集，覆盖编码 URL、未编码 URL、裸域名 URL、JSON-like 参数、hash route、HTML 分隔符和短 Base64 参数，降低后续解析优化回归风险
- **真实 Response 脱敏回归**: 新增脱敏广告 response 结构样本，覆盖多层跳转链路、extraParam 内部 Base64 JSON、后缀 query 解析和未编辑精确回写，降低真实粘贴场景回归风险
- **真实 Response 奖励按钮回归**: 脱敏样本补充 `bottom_button_scheme`、`task_params`、`ext_policy` 和奖励占位符解析断言，覆盖真实广告 response 中的奖励按钮链路
- **本地配置容错**: 启动时安全读取设置、AI 配置、快捷键、模板和面板布局缓存，避免 localStorage 损坏导致页面崩溃
- **本地存储读取容错**: 本地存储读取被浏览器拦截或抛异常时降级为空配置，避免隐私模式/权限异常导致主应用或后台启动失败
- **本地存储写入容错**: 主应用配置、快捷键、模板、JSONPath、面板布局和引导状态写入失败时降级为内存态，避免隐私模式或配额异常打断核心操作
- **后台统计查询优化**: IP/路径排行改为数据库分页取 Top N，地理、设备、浏览器和来源分布改为按 IP/UA/Referer 聚合后再解析分类，停留时长改为只查询 IP/时间字段并按数据库排序后流式切分会话，降低日志增长后的后台查询压力
- **生产安全收口**: 移除固定默认管理员账号，改为显式 `ADMIN_BOOTSTRAP_*` 初始化，并强制校验 JWT 密钥配置
- **文件上传防护**: 管理后台上传新增文件大小、预览大小、扩展名白名单和文件名清理校验
- **AI 修复可信度**: AI 返回结果写回编辑器前强制提取并校验有效 JSON，避免解释文本或无效内容覆盖源数据
- **AI 修复超时保护**: AI 修复请求新增 30 秒超时，OpenAI 兼容接口会主动终止请求，避免服务无响应时界面一直处于处理中
- **CI/CD 流水线建设**: 新增根目录 GitHub Actions CI/CD，覆盖前端检查、后端 Maven、Docker 构建和 SSH/rsync 远程部署
- **CI Docker 构建抗抖**: Docker 镜像构建新增自动重试，降低 Docker Hub 临时 5xx 或元数据拉取失败导致的 CI 偶发失败
- **部署脚本**: 新增本机 SSH 部署脚本与远程 Docker Compose 发布脚本，支持不依赖远端 git pull 的服务器发布
- **Docker 部署优化**: Docker Compose 参数化数据库/JWT 配置，生产部署强制配置关键密钥，增加后端上传目录持久化和服务重启策略
- **Actions Runtime 预适配**: GitHub Actions 提前启用 Node 24 action runtime，并升级官方 Actions 主版本，规避 Node 20 runtime 即将下线的兼容风险
- **版本号同步**: 同步 `frontend/package.json` 与 `package-lock.json` 的项目版本号至 v1.8.0
- **Browserslist 数据更新**: 更新 `caniuse-lite` 与 baseline browser mapping 数据，消除生产构建中的 Browserslist 过期提示
- **类型检查修复**: 修复 Ant Design、Monaco 与 ErrorBoundary 的既有 TypeScript 类型检查问题
- **类型检查脚本**: 新增 `npm run typecheck`，便于本地和 CI 复用完整类型检查
- **E2E 冒烟测试**: 新增 Playwright 浏览器冒烟测试，覆盖主应用加载、格式化、压缩、JSONPath 查询、CMD/Scheme 参数解析、AI 修复写回和文件打开保存关键路径，并接入 GitHub Actions
- **E2E 稳定性**: 固定 Playwright 串行 worker，收敛页面加载等待，并补充自动保存状态一致性和未保存退出保护回归用例
- **E2E 慢环境容错**: 提高单条端到端用例超时时间，避免包含二次刷新和 Monaco 初始化的容错用例在慢环境下误报失败
- **首屏性能优化**: Scheme 解析面板改为首次打开时按需加载，减少主应用初始包对二维码与解析面板代码的依赖
- **JSONPath 按需加载**: JSONPath 查询面板改为首次打开时加载，进一步减少主编辑器首屏需要解析和执行的面板代码
- **模板填充按需加载**: 模板填充面板改为首次打开时加载，减少未使用模板功能时的首屏 JavaScript 体积
- **AI 与设置按需加载**: AI 修复服务和设置弹窗改为用户触发时加载，减少未使用 AI/设置功能时的首屏依赖
- **AI 摘要按需加载**: AI 修复摘要计算和展示组件改为修复成功后加载，避免未使用 AI 时加载差异计算逻辑
- **依赖安全收口**: 升级 Axios、Vite、Vitest、Rollup、DOMPurify 等前端依赖解析版本，清零 `npm audit` 全量漏洞，并收敛 Ant Design 运行时分包循环
- **测试覆盖**: 补充 URL 编解码、Base64 编解码、Key 排序、CMD 参数递归解析和反向转换单元测试

## v1.7.0 (2026-03-28) - 模板填充、拖拽开文件与多项体验优化
### ✨ 新特性
- **JSON 模板填充**: 新增模板填充面板，支持定义 JSON 模板并一键深度合并到当前编辑器 JSON 中，保留未涉及字段不变，模板自动持久化到 localStorage
- **拖拽打开文件**: 支持将文件直接拖入编辑区打开，带有高亮遮罩提示
- **JSON Key 排序**: 新增 Key 排序转换模式，递归按字母序排列 JSON 对象键
- **状态栏光标位置**: 底部状态栏实时显示当前光标位置 (Ln/Col)
- **PREVIEW 复制按钮**: 预览编辑器标题栏新增一键复制按钮

### 🐛 Bug 修复
- 修复 JSONPath 查询按钮动态说明覆盖按钮可访问名称的问题，按钮仍保持“查询”名称并通过描述暴露不可查询原因
- 修复自动保存成功后标签仍显示未保存、关闭时仍提示丢失修改的问题
- 修复无文件草稿状态下新建标签会覆盖当前草稿的问题，现在会先保留为未保存 Untitled 标签
- 修复无文件草稿状态下打开或拖入文件会覆盖当前草稿的问题
- 修复 `documentStats` 在大文件时因 `Math.max(...spread)` 导致的栈溢出，改用 `reduce` 循环
- 修复 DraggablePanel 可被拖出屏幕的问题，添加视口边界检查（保证至少 80px 可见）
- 修复 DraggablePanel ESC 全局关闭问题，现在仅在面板内聚焦时响应 ESC

### 🏗️ 工程化
- **Toast 统一**: 提取 `toast.ts` 工具模块，统一全局 Toast 通知样式
- **监听器优化**: `useLayout` 的 mousemove/mouseup 监听器改为仅在拖拽时挂载，减少不必要的全局事件
- **代码清理**: 移除废弃的 `smartInverse` 函数及相关死代码
- **测试覆盖**: 新增 `deepMergeTemplate` / `applyTemplate` 单元测试（9 用例），总测试数达 82 个

## v1.6.0 (2026-03-07) - AI 配置集成与体验优化
### ✨ 新特性
- **AI 工具配置文件**: 添加 AI 工具配置文件，支持 AI 编程助手集成
- **状态栏增强**: 状态栏添加深度格式化模式功能说明
- **统一提示组件**: 统一使用 react-hot-toast 组件进行用户提示
- **Scheme 二维码**: Scheme 支持生成二维码

### 🐛 Bug 修复
- 修复 Preview 保存后 Source 标签仍显示未保存状态的问题

### 🏗️ 工程化
- 添加 Error Boundary 全局错误处理
- 配置 Vitest 测试框架，添加核心工具函数单元测试
- 清理死代码和遗留组件
- 同步 package.json 版本号至 v1.6.0

## v1.5.0 (2026-01-15) - Scheme 解析面板
### ✨ 新特性
- **Scheme 解析面板** (大版本):
  - Scheme 解析面板独立，加入侧边栏
  - Scheme 解析面板样式优化
  - Scheme 解析面板代码展示替换为 SimpleEditor
  - 新增 Scheme 解析工具
- **可拖动面板重构**:
  - 重构拖拽面板组件，优化体验
  - 可拖动面板支持 ESC 关闭（仅焦点在面板内时生效）
- **JSONPath 面板**: 添加 JSONPath 语法学习链接（问号图标）

### 🐛 Bug 修复
- 修复 ESC 关闭拖拽面板失效的问题
- 修复 path 过长挤压关闭按钮的问题

## v1.4.8 (2026-01-13)
### ✨ 新特性
- **UI 优化**: icon 升级

### 🐛 Bug 修复
- 修复柱状图显示异常问题，用 @ant-design/charts 替代手搓后台组件
- 修复 JWT Token 过期导致的后台页面加载错误
- 解决本地开发的跨域问题
- 解决本地不存在 SSL 证书导致的 docker 无法启动问题

## v1.4.7 (2026-01-12)
### 🐛 Bug 修复
- 修复行号指示器失效问题
- 后台仪表盘和流量统计数据不一致问题修复
- 修复后台 IP 地址无法解析问题

## v1.4.6 (2026-01-11)
### ✨ 新特性
- **Docker 增强**: docker 环境增加 nginx https

## v1.4.5 (2026-01-10)
### 🎨 UI 优化
- 前端样式优化

## v1.4.4 (2026-01-08)
### 🐛 Bug 修复
- 通过转换路径录制机制修复修改深度格式化结果保存与原始格式不一致问题

## v1.4.3 (2026-01-07)
### ✨ 新特性
- **流量统计增强**:
  - 流量统计优化
  - 流量统计添加访客地区

### 🏗️ 架构与基础设施
- 精简业务代码，增加 RULES 文件

## v1.4.2 (2026-01-06)
### ✨ 新特性
- **流量统计**: 新增流量统计功能

## v1.4.1 (2026-01-04)
### ✨ 新特性
- **后台管理系统**:
  - 引入 AntDesign 后台
  - 后台登录功能

## v1.4.0 (2026-01-04)
### ✨ 新特性
- **版本对比增强**:
  - 增加 SOURCE 区域版本对比指示器
  - 版本对比指示器现在显示新增/删除状态
- **Docker 支持**: 新增 Docker 部署支持

## v1.3.3 (2025-12-27)
### ✨ 新特性
- **流量统计**: 新增流量统计功能
- **HTTPS 支持**: 添加 HTTPS 支持
- **CICD**: 
  - CICD 脚本与流程优化

### 🐛 Bug 修复
- **Monica 插件兼容**: 隐藏 Monica 搜索面板按钮 tooltip，修复遮挡操作按钮问题
- **文件操作**: 修复非 HTTPS 环境下降级 openFile 函数

### 🎨 UI/UE 优化
- 专项优化 UI 与用户体验

## v1.3.2 (2025-12-17)
### ✨ 新特性
- **Tab 标签页增强**:
  - SOURCE 区 TAB 标签支持保存状态展示
  - SOURCE 区 TAB 标签支持鼠标中键关闭
- **JSONPath 面板**: 支持持久化面板位置和大小

### 🐛 Bug 修复
- **编辑器交互**:
  - 修复撤销操作 TAB 粘连问题
  - 修复保存失效问题
- **构建修复**: 解决构建产物时报的异常

## v1.3.1 (2025-12-13)
### 🏗️ 架构与基础设施
- **前后端架构拆分**: 实现前后端架构分离
- **依赖更新**: 升级 Monaco Editor 适配 React 19 (部署环境差异修复)

### 🐛 Bug 修复
- **预览同步**: 修复 PREVIEW 同步竞态条件时机延长

## v1.3.0 (2025-12-12)
### ✨ 新特性
- **首次用户引导**:
  - 新用户首次访问时自动显示交互式引导教程
  - 8 个步骤覆盖所有主要功能(源编辑器、工具栏、预览编辑器、JSONPath、文件操作、AI 修复、设置)
  - 支持步骤导航(上一步/下一步)和进度显示
  - 使用 localStorage 记录完成状态,避免重复显示
  - 基于 driver.js 实现,轻量级且与 React 19 兼容

- **功能级引导系统**:
  - 为特定功能添加首次使用时的上下文教程
  - 支持的功能: JSONPath 查询、AI 智能修复、嵌套解析、转义/反转义、Unicode 转换
  - 自动检测首次使用并触发引导,完成后不再显示
  - 独立的状态管理,每个功能单独追踪
  - 为 JSONPath 面板添加多步骤引导(面板介绍、输入框、示例、历史记录)

## v1.2.5 (2025-12-11)
### 🎨 UI 优化
- **JSONPath 查询面板优化**:
  - 压缩结果显示区域高度，为历史记录腾出更多空间
  - 减少内边距和间距，使界面更紧凑
  - 优化导航按钮大小

## v1.2.4 (2025-12-10)
### ✨ 新特性
- **集成 React Hot Toast**: 
  - 替换原有 Toast 实现，解决多次保存时提示重叠消失的问题
  - 优化提示样式，支持暗色主题

### 🐛 Bug 修复
- **错误提示优化**:
  - 明确区分业务错误与语法错误
  - 业务逻辑错误（如 API Key 缺失、网络错误）使用 Toast 提示，不再占用编辑器错误区域
  - 编辑器错误区域仅显示 JSON 语法错误

### 🎨 UI 优化
- **左侧工具栏滚动条优化**:
  - 采用悬停显示 (Hover) + 不占空间 (Overlay) 设计
  - 解决滚动条出现导致布局偏移的问题
  - 支持鼠标拖动滚动
- **状态栏增强**:
  - 底部状态栏文件标签支持悬停显示完整文件路径 (Electron 环境)

## v1.2.3 (2025-12-02)
### ✨ 新特性
- **JSONPath 查询增强**:
  - 支持多字段查询

## v1.2.2 (2025-11-29)
### ✨ 新特性
- **正式更名为 JSONUtils - 专业版** (2025-11-28)

### 🐛 Bug 修复
- **修复多标签模式持久化问题**: 切换标签时现在能正确保存和恢复每个标签的转换模式（如 DEEP_FORMAT、FORMAT 等）
- **优化标签关闭行为**: 关闭标签时的切换逻辑现在符合 VS Code 行为，优先切换到右侧的下一个标签，如果没有则切换到左侧的前一个标签

### 🎨 UI 优化
- **优化 SOURCE 区标签间距**: 减小标签的左右间距，使标签更紧凑，减少折叠情况
  - 水平内边距从 12px 减少到 6px
  - 图标与文字间距从 8px 减少到 6px
- **新增行号指示器**: 
  - 添加代码行号显示支持

## v1.2.1 (2025-11-24)
### ✨ 新特性
- **分工作区保存**: 支持根据当前光标焦点分别保存内容
  - 光标在 SOURCE 区时，保存源文件
  - 光标在 PREVIEW 区时，保存为预览结果
  - 新增保存成功提示 (Toast)

### 🐛 Bug 修复
- 修复在预览区快速删除内容时，导致左侧源文件被错误覆盖的问题
- 禁止预览区存在语法错误时同步回源文件，防止代码损坏
- 修复源文件保存时错误写入预览内容的问题 (Sync Issue)
- 优化保存逻辑：未打开文件时 Ctrl+S 触发"另存为"

## v1.2.0 (2025-11-24)
### ✨ 新特性
- **Electron 桌面端支持**: 正式支持打包为桌面应用程序

## v1.1.1 (2025-11-25)
### ✨ 新特性
- **新建空白页功能**: 支持创建新的空白标签页 (2025-11-25)
- **面板风格统一**: 统一设置面板和快捷键面板的视觉风格 (2025-11-26)
- **标签行为优化**: 改进多标签切换和管理体验 (2025-11-26)

### 🐛 Bug 修复
- **修复新标签创建问题**: 修复当已有文件打开时无法创建新空白标签的 bug
- **修复标签栏滚动条**: 优化标签栏自定义滚动条的显示和交互行为
  - 默认隐藏，鼠标悬停时显示
  - 使用 overlay 样式，不影响布局

### 🎨 UI 优化
- **标签栏样式优化**:
  - 调整文件图标大小，使其更醒目
  - 优化图标与标题之间的间距
  - 统一标签栏元素的视觉大小
- **JSONPath 面板增强**:
  - 支持调整面板大小（右下角拖拽）
  - 优化查询结果高亮的背景强度，提升可读性
  - 关闭面板时自动清除高亮
  - 支持删除单条查询历史记录
  - 修复嵌套 JSON 查询失败的问题

## v1.1.0 (2025-11-23)
### 🚀 优化与改进
- **JSONPath 面板增强**:
  - 支持面板宽度左右拖拽调整
  - 新增快捷键支持
  - 支持单条历史记录清除
  - 修复查询历史滚动条问题
- **UI 优化**:
  - 优化工具栏字体显示
  - 提升代码可读性与健壮性

## v1.0.0 (2025-11-22)
### 🎉 重大更新
- **新增 JSONPath 查询工具**: 
  - 支持使用 JSONPath 语法深度查询 JSON 数据
  - 支持高亮显示查询结果
  - 自动记录查询历史

### 🐛 Bug 修复
- 修复 PREVIEW 区快速输入导致的 SOURCE 区竞态条件问题

### 🛠️ 架构调整
- 重构项目目录结构

## v0.2.0 (2025-11-22)
### ✨ 新特性
- **多标签页支持**: 支持同时打开和编辑多个文件
- **AI 模型配置**: 支持切换不同的大模型提供商
- **UI 细节优化**:
  - 工具栏滚动条样式优化
  - 醒目化当前视图状态
  - 支持工具栏收起/展开

## v0.1.0 (2025-11-21)
### 🌱 初始版本
- **核心功能**:
  - 支持 JSON 格式化、压缩、转义/反转义
  - 支持嵌套 JSON 字符串格式化
  - 支持预览区编辑并反向同步（保持格式）
- **文件操作**:
  - 支持打开本地文件
  - 支持保存预览区内容
  - 支持源文件自动保存
