# AI 工程协作 Playbook

本文档用于让 Claude Code、Codex、Ducc 等 AI 编程助手在本项目中形成稳定的自闭环工作方式。它不替代 `AGENTS.md`、`CLAUDE.md` 和 `rules/code-style.md`，而是把“怎么判断做得对”沉淀成可执行流程。

## 目标

- 让 AI 助手先理解业务边界，再改代码。
- 让性能优化、重构和功能补充都能被测试或脚本验证。
- 让长期维护者可以从文档、测试、CHANGELOG 和构建门禁还原每次变更的意图。
- 让反复出现的协作经验完成复盘沉淀、规则/skill 回写和治理校验，推动 AI 协作资产持续进化。

## 必读顺序

1. `AGENTS.md` 或 `CLAUDE.md`: 获取项目结构、技术栈、常见任务路径。
2. `rules/code-style.md`: 获取编码风格、提交规范和 CHANGELOG 规则。
3. `docs/AI-ASSET-REGISTRY.md`: 涉及 AI 协作资产、工具入口、rules 或 skills 时确认登记和治理证据。
4. `docs/AI-GOVERNANCE-DECISIONS.md`: 涉及规则沉淀、skill 契约或治理脚本变化时确认历史决策、反例和锁定测试。
5. `ARCHITECTURE.md`: 涉及前后端边界、部署、数据流时阅读。
6. 相关源码和测试: 先找同类实现，再做最小改动。
7. `CHANGELOG.md`: 修改代码后补充用户可理解的变更记录。

## 标准执行闭环

AI 基建的项目 source of truth、插件包边界、workspace/index/HEAD 分发证据与 lifecycle 授权以 `rules/code-style.md` 的“AI 规则资产更新”为准。仓库不是 plugin，只有 `plugins/<name>/` 是插件包；治理 MCP 以 trusted `.codex/config.toml` 为项目原生主入口，无需先安装兼容插件，但 clone/open 不执行配置，仍需信任项目并新建任务。`.agents/plugins/marketplace.json` 是 Codex 可读取的 repo catalog；当前 `AVAILABLE` 只建立插件目录可发现性，不等于自动安装、启用或当前任务加载，也不自动证明 registration/runtime/signer trust。项目 plugin lifecycle CLI 不得硬编码个人 Codex 路径；POSIX 终止点必须回收独立进程组，Windows 只作 parent best effort，命令失败诊断不得泄露路径或 stderr。

### 0. 判断子 Agent 委派

- 遇到跨模块排查、影响面分析、复杂重构或多条验证链路并行时，先判断是否需要子 Agent 委派。
- 主线程负责拆分边界、保护上下文、整合证据和最终验证；只读调查可交给默认 `read-only` 的 explorer，限定写入可交给 worker，构建、测试或日志复核可交给 verifier。
- 通用执行优先使用 `.codex/agents/explorer.toml`、`worker.toml`、`verifier.toml`；AI 基建专项只读审计可用项目 `ai-infra-auditor`。不得临时增加未审计 profile/adapter、model、MCP 或扩权字段。
- 委派任务必须说明读写范围、排除项、期望输出和未覆盖风险；子 Agent 只回传结论、证据定位、修改文件和验证结果，避免堆叠大段中间输出。
- 子 Agent 回传必须使用固定模板，包含 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`；worker 任务必须填写 `修改文件：`，证据需给出可追溯路径、行号、命令或日志定位。
- 客户端权限配置只是角色默认值，父任务实时 override 不放宽职责；explorer 不编辑，worker 只有收到父任务写入白名单才可写，verifier 的可写能力只服务验证临时/忽略产物，ai-infra-auditor 始终只读且禁止 MCP、网络和用户级上下文。静态 profile/adapter 和有界状态样本都不证明真实选择、强隔离或零写入；零写入声明必须比较委派前后完整 `path/type/mode/content` workspace manifest。
- 如果当前工具不可委派，主线程应收窄 `rg`、测试和日志输出，继续完成本地闭环。

```text
任务：
结论：
证据：
修改文件：
验证：
未覆盖：
下一步建议：
```

### 1. 定义变更边界

- 先用 `git status --short --branch` 确认工作树状态。
- 用 `rg`、`rg --files`、`find` 定位相关文件，不做无关重构。
- 判断改动属于功能、Bug、性能、架构、文档还是测试。

### 2. 选择验证方式

| 变更类型 | 推荐验证 |
| --- | --- |
| JSON / Scheme 解析 | `npm run test -- src/utils/xxx.test.ts`，必要时跑 `npm run corpus:scheme` |
| 首屏性能 / 分包 | `npm run build`、`npm run check:preloads` |
| 发布恢复 / 手动懒加载 catch | `node scripts/ci/check-chunk-load-recovery-catches.mjs`，必要时追加 `npm run build`、`npm run check:preloads` |
| JSONPath / 结构导航性能 | `npm run perf:jsonpath`、相关单测 |
| Scheme 解码性能 | `npm run perf:scheme`、相关 corpus 测试 |
| 构建配置 / Vite 分包 | `npm run lint`、`npm run test -- config/xxx.test.ts`、`npm run build`、`npm run check:preloads` |
| 版本 / CHANGELOG | `node scripts/ci/check-version-consistency.mjs` |
| 前端组件交互 | 相关 Vitest 单测，必要时跑 `npm run test:e2e` |
| 后端 API | `mvn test`，并检查 `docs/BACKEND-API-MATRIX.md` |
| 部署脚本 | `node scripts/ci/check-deploy-shell-syntax.mjs`、`node scripts/ci/check-frontend-static-retention.mjs`；公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs <baseUrl>` 或远端健康检查脚本，确认深层 chunk、CSS `url(...)` 二级资源、CSS `@import` 链路可达且 JS/CSS `Content-Type` 正确 |
| AI 协作资产 | `node scripts/ci/check-ai-governance.mjs`；本地 `node scripts/ci/check-ai-asset-distribution.mjs --workspace|--index`，CI `--head` |
| Codex 项目 MCP 配置 | `node --test scripts/ci/aiGovernanceCodexProjectMcpConfig.test.mjs`；只锁定 `.codex/config.toml` 无 shell 根/子目录 bootstrap、`required=true`、超时和 11 工具 allowlist，fresh-task 注册仍需单独观察 |
| MCP 运行时新鲜度、取消与断开回收 | `node --test scripts/mcp/jsonutils-governance-runtime-freshness.test.mjs scripts/mcp/jsonutils-governance-cancellation.test.mjs scripts/mcp/jsonutils-governance-cancellation-stdio.test.mjs scripts/mcp/jsonutils-governance-protocol-stdio.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case mcp-newline-version-negotiation --json`；锁定工具调用每次 fresh worker、controller import closure 漂移后 restart-required、闭字段 768 KiB 输出、进程组取消、被取消请求零响应、typed ID 隔离、initialize 不可取消、连接关闭 abort-all 与取消后恢复 |
| 项目 Agent profiles/adapters | `node --test scripts/ci/aiGovernanceProjectAiInfraAuditor.test.mjs scripts/ci/aiGovernanceCodexAgentProfiles.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case codex-project-agent-profile-boundary --json` |
| Codex project hook | `node --test scripts/ci/aiGovernanceCodexHooks.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case codex-project-session-start-hook-boundary --json`；真实触发只能在新任务另行观察 |
| MCP registration sealed snapshot | `node --test scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.test.mjs scripts/ci/mcpLineDelimitedStdioClient.test.mjs scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflight.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case mcp-registration-canary-sealed-snapshot-boundary --json`；锁 hermetic Git、稳定 descriptor、owner-only mode、失败 retention、有界脱敏 stdio、projection digest 与 snapshot scorecard；模型/写账未请求但 absence 未验证，也不证明 immutable host、环境封存或当前任务注册 |
| Codex Seatbelt sentinel | `node --test scripts/ci/aiGovernanceCodexExternalControllerSeatbeltSentinel.test.mjs`；锁 Codex code identity/Seatbelt、source 零变更、disposable mirror、binding 与 cleanup，同 UID 仍只算 component |
| Attested runtime preflight | `node --test scripts/ci/aiGovernanceCodexExternalControllerAttestedPreflight.test.mjs`、对应 component case；锁双角色 DSSE、七角色 UID/GID/namespace、派生 state/challenge 与 pre-runtime 注入，仓内 Node/path candidate 永不解锁 registration |
| MCP registration canary packet | `node --test scripts/ci/aiGovernanceRegistrationCanaryPacket.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case mcp-registration-canary-launch-packet-boundary --json`；只证明盲分启动包，不证明实际注册 |
| MCP registration canary result / grader calibration | `node --test scripts/ci/aiGovernanceRegistrationCanaryResult.test.mjs scripts/ci/aiGovernanceRegistrationCanaryGraderCalibration.test.mjs scripts/ci/aiGovernanceRegistrationCanaryGraderCalibrationRedteam.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case mcp-registration-canary-result-ingestion-boundary --json`；独立 17-mutation corpus 绑定实际 import/fixture、固定 ID、无祖先 symlink 当前字节、完整 failure taxonomy 与 operation-ID 参考向量，真实调用生产 grader 51 次并锁 100% 指标，但仍只证明 component health、摄取、盲评、commitment 和揭盲预览边界，不证明外部执行真实性或 Agent behavior |
| MCP registration grade checkpoint | `node --test scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpoint.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case mcp-registration-canary-grade-checkpoint-request-boundary --json`；只证明外部锚定 request 的内容绑定，不证明已在揭盲前锚定 |
| MCP registration anchor receipt | `node --test scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case mcp-registration-canary-anchor-receipt-boundary --json`；只证明精确 DSSE/状态/可观察分叉边界，不证明仓外身份、inclusion 或 first-write-wins |
| MCP registration disclosure authorization | `node --test scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.test.mjs scripts/ci/aiGovernanceRegistrationCanaryDisclosureRedteam.test.mjs`、`node scripts/ci/run-ai-evolution-cases.mjs --case mcp-registration-canary-disclosure-authorization-boundary --json`；只证明 blind grade/checkpoint/Agent-grader-host 投影绑定、host commitment 与 anchor→authorized→consumed 链，缺共享 CAS/witness 时不证明 at-most-once |
| 可维护性预算 | `node scripts/ci/check-maintainability-budgets.mjs` |

### 3. 编码约束

- 优先复用现有工具函数、worker、服务层和测试风格。
- 大模块只能逐步切分，每次切分必须保持行为等价并补测试。
- 性能相关规则要抽成纯函数或脚本，避免只靠人工记忆维护。
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并用测试、脚本或可复核日志形成可验证闭环。
- 所有新增注释使用中文，且只解释边界条件或复杂业务意图。

### 4. 收尾检查

每次代码改动至少完成：

- 运行和改动范围匹配的测试或说明无法运行的原因。
- 用户可见或准备上线的改动先递增 `frontend/package.json` patch 版本、同步 `frontend/package-lock.json`，并新开顶部 `CHANGELOG.md` 版本区块，保持规范分类标题和 `- **标题**: 描述` 条目，运行 `node scripts/ci/check-version-consistency.mjs`，避免一个版本堆积几十条提交或裸 bullet 进入发布说明。
- 多 worktree 并行时版本号表示交付，不累加迭代次数。先推送源快照，再从业务侧按业务、AI治理、生成锁、账本分组集成，不整仓选边。outcome/receipt 按包含关系保留，版本/CHANGELOG/锁最终统一。
- 涉及前端 TypeScript 源码时运行 `npm run lint` 或说明未运行原因。
- 涉及手动 `import()`、懒加载 helper、`dispatchChunkLoadRecoveryEvent` 或发布恢复 catch 时运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`，确认旧 chunk 加载失败不会被业务 catch 吞掉。
- 涉及 `scripts/deploy/*.sh`、`.github/scripts/*.sh`、`scripts/ci/local-ci.sh` 或 `.github/workflows/*.yml` 的 `workflow run` 块时运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，先用 `bash -n` 拦截发布脚本语法错误，并单独检查 `REMOTE_SCRIPT heredoc` 这类远端脚本片段。
- 涉及前端 Docker、Compose、Nginx 或发布静态资源时运行 `node scripts/ci/check-frontend-static-retention.mjs`。
- 同机外部业务域名的 Nginx 改动不能只验证 HTTP 200；`/admin.html` 这类历史后台路径要用本域 `/index.html` 承接、清理本域缓存，并用一次性裸域 query 绕过浏览器对 `/` 的旧 301 精确缓存，再把地址栏归位到裸域。
- 公网资源巡检不能只看 2xx；`node scripts/ci/check-production-frontend-assets.mjs <baseUrl>` 还会校验 JS/CSS `Content-Type`，并递归检查 CSS `url(...)` 二级资源和 CSS `@import` 链路，防止缺失 chunk fallback 成 HTML。排查用户反馈的旧 chunk URL 时，追加 `--extra-asset <url-or-path>` 纳入同一轮递归巡检。
- 涉及大模块或新增 helper 时运行 `node scripts/ci/check-maintainability-budgets.mjs`。
- 更新 `CHANGELOG.md` 当前版本区块。
- 空白门禁用 `node scripts/ci/check-ai-validation-whitespace.mjs` 覆盖 staged/worktree/untracked 原始字节；`git diff --check` 不是完整证据。
- 验证收据先运行 `node scripts/ci/run-ai-validation-execution.mjs --json`；阻断项零启动，维护者显式 `--run` 才执行固定只读 descriptor，artifact refresh 另行显式写。
- 最终汇报列出已验证命令和仍未覆盖的风险。

### 5. 规则进化闭环

- AI 协作基建的行为评测、outcome lineage、反馈学习和批准回写以 `docs/AI-EVOLUTION-PLAYBOOK.md` 为权威流程；静态资产、引用和契约通过不等于行为有效。
- outcome revision 漂移时仍须运行当前 fixed runner，并把契约失败、证据时效及当前执行的 `behavior-fail`、`component-fail`、`delivery-blocked`、`infrastructure-invalid` 分开报告；普通非零按 descriptor 的 `evidenceScope` 将 deterministic case 归为 behavior、component-only 归为 component，显式 delivery 与 spawn/binding infrastructure 仍覆盖该默认分类。只有 behavior 进入行为失败统计，四类都不可写 outcome；component 与 infrastructure 使行为质量保持 unknown，delivery 为 warn。当前回归通过不等于旧 outcome 已刷新或 behavior coverage 已增加。
- 重复失败或用户纠偏先转为 `evals/ai-governance/cases.json` 中的脱敏 case，实际执行后才把 outcome、provenance 和 validation result 追加到 `evals/ai-governance/outcomes.jsonl`；Git 基线历史行不得删除、修改或重排，不伪造 token、耗时、commit 或未运行的验证。
- 运行 `node scripts/ci/check-ai-evolution-evals.mjs` 校验 receipt/trace/proof/policy、Git 前缀、v3 chain 与 replay。`component-boundary` 不进 behavior 分母。topology、旧 Docker probe、同 UID Seatbelt、caller-policy 双签名和仓内 Node 的 root-owned path check 都只是 component；只有后续 checkout 外受保护 launcher/service 固定 verifier runtime、clean env、policy 与 non-caller bindings 后，才可在独立 case 评估解除隔离前置，task registry/Agent outcome 仍需真实 trial。
- Codex project hook 只用 `.codex/hooks.json` 的单一 `SessionStart` event，source 限 `startup|resume|clear|compact`：固定 10 秒 timeout，runtime 只校验三份项目入口并返回固定有界 context，不读 prompt、transcript、环境、用户配置，不联网、不写文件、不阻断。项目必须 trusted，非 managed hook 还需审阅当前定义；不得用 `--dangerously-bypass-hook-trust` 作为常规流程。配置、`/hooks` 可见、runtime 直跑和合成测试只证明 component；四种 source 尚未在受信任 fresh task 分别观察前 behavior 保持 unknown。
- Registration canary 的投影隔离、外部 trial 前置和 `blind|seal|checkpoint|unblind` 审查以 `docs/AI-EVOLUTION-PLAYBOOK.md` 为准；component preview 不能自动升级为 behavior 证据或写账权限。
- 遇到重复踩坑、用户纠偏、子 Agent 协作失效、验证门禁缺口或优秀实践可复用时，先做复盘沉淀，明确触发条件、反例、验证方式和适用边界。
- 能被后续 AI 复用的经验必须做规则/skill 回写：项目通用流程写入本 Playbook，Codex 项目技能写入 `.agents/skills/jsonutils-maintainer/SKILL.md`，跨工具说明同步到 `.claude/ai-tools-guide.md` 或入口文档。
- 规则回写必须写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试：决策记录说明为什么沉淀，回写追踪列出同步到哪些入口或 skill，锁定测试说明由哪个治理脚本、单测或预算规则防止退化。
- 决策账本的触发条件、反例和适用边界不能整格使用弱占位；回写追踪必须包含 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md`，锁定测试必须同时包含 `node --test ...test.mjs` 和 `node scripts/ci/check-ai-governance.mjs`，且引用的测试文件必须保留普通可执行 `test(...)` 或 `it(...)` 用例，不能只剩 `skip`、`todo`、`.only` 或空文件，证明局部负例、账本自追踪和聚合治理门禁都覆盖到。
- 规则改动必须配套治理校验：能用 `check-ai-governance` 锁定的关键词、文件引用或命令要同步加入脚本和测试，不能只依赖人工记忆。
- AI 治理、版本一致性、脚本单测和可维护性预算命令必须保留在 GitHub Actions `run:` 与 `scripts/ci/local-ci.sh` 的 `run_in_root` 可执行入口，并由 `check-ai-governance` 反查，避免门禁只存在于注释、`echo` 或手动习惯。
- CI 和 local-ci 必须固定运行 `node scripts/ci/write-ai-governance-artifacts.mjs`，产出治理 JSON、预算 JSON、带 `generatedAt` 的治理成熟度 scorecard、治理 context 快照和 summary，避免 `--json` 能力只停留在手工命令里；读取已有 artifact 前先用 `node scripts/ci/write-ai-governance-artifacts.mjs --check` 查新鲜度，失败后重跑产物脚本。
- `.github/workflows/ai-governance.yml` 必须保留 weekly `schedule`、`workflow_dispatch`、治理脚本单测、MCP 测试、固定 artifact 产出和上传步骤，让 AI 资产在长期不改代码时也能被定时巡检。
- AI 治理 helper 和测试都要有预算所有权：新增 `scripts/ci/aiGovernance*.mjs` 或 `scripts/ci/aiGovernance*.test.mjs` 时同步登记可维护性预算，避免治理代码和锁定测试继续膨胀。
- AI 治理 helper 还要有调用所有权：新增 `scripts/ci/aiGovernance*.mjs` 非测试脚本时，生产契约、规则、引用和失败收集 helper 必须能从 `scripts/ci/check-ai-governance.mjs` 生产链路静态 import 图到达；只有 `*TestFixtures.mjs` 和 `*MissingCases.mjs` 这类测试支撑文件允许只被 `scripts/ci/*.test.mjs` 覆盖，避免治理规则只停留在测试里。
- 治理报告、MCP context 和 CI artifact 需要保留成熟度 scorecard 与可执行 `nextFocus`，让后续 agent 基于确定性缺口排序处理规则、skill、MCP 和维护余量问题，而不是重新人工猜测优先级。依赖仓外管理平面、独立身份或 signer/witness 的工作另列 `blockedFocus`、阻断范围与恢复前置；blocker 继续可见，但不得永久覆盖不依赖它的仓内可执行焦点。
- 机器报告必须把全局聚合事实与 bounded 展示样本分开；`top` / `limit` 只能限制返回明细，不能改变全局候选数、清零状态、scorecard 或 handoff 结论。
- 同源入口文档必须成对维护：AGENTS/CLAUDE 的 AI 协作章节、Cursor/Comate 的核心规则片段由治理脚本做漂移检查，避免一边更新、一边残留旧语义。
- 项目事实不能只靠入口文档人工同步：数据库和关键主版本事实必须从后端配置、前后端依赖、前端 lock 和 Compose 文件反查到 AGENTS、CLAUDE 与 `rules/code-style.md`，由 `node scripts/ci/check-ai-governance.mjs` 锁住旧事实漂移。
- Copilot、Codex README、Claude 工具指南、Cursor 和 Comate 的薄入口共享核心规则片段由治理脚本统一检查；新增跨工具核心要求时先更新共享片段，再同步所有薄入口，避免不同助手看到不同版本的发布、委派、安全或规则进化要求。
- 共享核心规则片段必须带权威来源文件和锚点，并由 `node scripts/ci/check-ai-governance.mjs` 反查来源内容，避免薄入口复制了短句却丢失 `rules/code-style.md`、Playbook 或 skill 中的完整规则。
- 工具薄入口只保留当前执行约束和权威文档链接，不维护独立更新记录；历史追踪统一放在 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md`，避免薄入口时间线漂移。
- 新增 AI 助手入口、项目级 MCP 配置或工具配置目录文件时，必须纳入 AI 治理清单；本机私有配置和非协作资产要进入显式豁免列表，避免新增 rules/skills 资产游离在门禁之外。
- 项目级 MCP 配置必须保持可审计：`.codex/config.toml` 只能使用 canonical 无 shell Node bootstrap，固定 `required=true`、启动/工具超时和 11 工具 allowlist，并支持从根或子目录定位仓库；`.mcp.json`、`.cursor/mcp.json` 和 `.vscode/mcp.json` 使用合法 JSON，且只能包含 `mcpServers` 或 `servers` 其中一个 server map。每个 JSON server 至少声明 `command` 或 `url`，不通过 shell 包装命令、绝对路径、上跳路径或缺失本地脚本隐藏执行边界，敏感字段以及 URL、args、header 字符串里的 token、password、api key 和 authorization 值只能使用环境变量引用。
- `jsonutils-governance` 本地 MCP server 只能暴露只读治理资源和固定治理报告、scorecard、上下文、asset inventory、evaluation summary、decision summary、handoff brief、artifact freshness、worktree snapshot、validation plan 工具；常驻 controller 只保留 framing、lifecycle、工具 schema、输入校验和 fresh worker 调度，工具实现每次从当前 transitive ESM closure 新载入，controller 漂移后必须固定 fail closed。工具必须保留只读 annotations、output schema 和结构化输出，新增 helper 必须纳入必需文件、资产注册表、单测和可维护性预算，不开放任意 shell 或通用文件读取入口。
- MCP server 改动不能只做函数级测试；`node --test scripts/mcp/*.test.mjs` 必须覆盖从项目级 `.mcp.json` 启动真实 stdio 进程、按官方 newline-delimited JSON-RPC 发送消息与协商版本、验证无 `Content-Length` header、工具清单、只读 annotations、治理资源和固定工具真实调用，并用临时 transitive ESM fixture 锁定 fresh worker 与 controller 漂移拒绝，以真实长工具锁定 `notifications/cancelled` 对 worker 进程组的抢占、零响应、会话恢复和 stdin 断开回收，避免 module cache、command/args、stdout 污染、孤儿子进程或协议分帧断裂进入 CI。
- AI 资产注册表的每行登记必须维护真实有效且不晚于当前日期的 `YYYY-MM-DD` 最近复核日期；变更资产、责任人、复核节奏或治理证据时同步更新日期，但不引入自动到期提醒。
- 项目级 Codex skill 只以 `.agents/skills/` 为源码，并保留可迁移契约：frontmatter 包含 `name`、`description`、`metadata.version` 和 `metadata.tags`；按 Agent Skills 规范，`metadata` 必须是 string→string map，本项目 `tags` 使用带引号的非空逗号分隔字符串，不使用 YAML 数组。`agents/openai.yaml` 包含显示名、25-64 字符短描述和引用 `$<skill-name>` 的默认提示；当前 `name` 与 `version` 必须在 `CHANGELOG.md` 同行追踪，正文保留四个核心章节。禁止在 `.codex/skills/` 放同名副本，避免重复注入或不可追踪的散文。
- 项目级 Codex skill 的具体项目路径、fenced `cd <dir>` 工作目录、`node ...mjs` 验证脚本和 `npm run ...` 脚本必须可解析到真实目标；新增或迁移 skill 引用后运行 `node scripts/ci/check-ai-governance.mjs`，避免 skill 看似完整但实际不可执行。
- 不把一次性偏好、临时绕路或未验证猜测沉淀为规则；沉淀前先确认它能减少未来错误，并且不会和现有规范冲突。

## AI 资产维护

- `AGENTS.md`: Codex、OpenAI Codex CLI 和通用 coding agent 的项目入口，必须直接指向 `docs/AI-ASSET-REGISTRY.md`。
- `CLAUDE.md`: Claude Code / Ducc 的项目入口，必须直接指向 `docs/AI-ASSET-REGISTRY.md`。
- `.claude/README.md`: Claude/Ducc 配置目录索引，必须指向主入口、Playbook 和治理命令。
- `.claude/ai-tools-guide.md`: AI 工具适配说明。
- `.claude/settings.local.json`: 本机私有配置，仅作为显式豁免文件存在，不承载项目级 rules、skills 或验证流程。
- `.agents/skills/jsonutils-maintainer/SKILL.md`: Codex 可迁移的项目维护技能模板。
- `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`: rules、skills、MCP、evals 与反馈学习的专用演进 skill。
- `.codex/config.toml`: trusted project 的 Codex 原生治理 MCP 主入口；无 shell bootstrap、`required=true`、超时和 11 工具 allowlist 由专用 component 契约锁定，不证明 fresh-task registry。
- `.codex/hooks.json`、`.codex/hooks/session-start-governance.mjs`: 只读 `SessionStart` 治理 handoff；信任、component/behavior 分层和能力面由专用契约锁定。
- `.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`: 项目级 MCP 配置，只按精确文件发现，不递归 `.cursor` 或 `.vscode` 目录。
- `scripts/mcp/jsonutils-governance-server.mjs`: JSONUtils 本地治理 MCP server，只读暴露 AI 治理文档和固定报告、scorecard、上下文、asset inventory、evaluation summary、decision summary、handoff brief、artifact freshness、worktree snapshot、validation plan 工具。
- `scripts/mcp/jsonutils-governance-jsonrpc.mjs`: JSON-RPC 2.0 请求校验、notification 边界和脱敏标准错误 helper，非法 JSON 值不得杀死 stdio 进程。
- `scripts/mcp/jsonutils-governance-cancellation.mjs`: JSONUtils 治理 MCP in-flight request helper，按原始 string/number ID 管理 `AbortController`、竞态至多一响应与连接关闭 abort-all。
- `scripts/mcp/jsonutils-governance-tool-definitions.mjs`: JSONUtils 治理 MCP 固定工具定义 helper，维护工具名称、顺序和 input schema。
- `scripts/mcp/jsonutils-governance-tool-input.mjs`: JSONUtils 治理 MCP 工具参数校验 helper，拒绝未知工具、额外字段和越界输入并返回 `-32602`。
- `scripts/mcp/jsonutils-governance-tools.mjs`: JSONUtils 治理 MCP 常驻工具 controller，只维护固定 schema、输入校验和 fresh worker 调度。
- `scripts/mcp/jsonutils-governance-runtime-freshness.mjs`: 对 controller 与 worker 的本地 transitive ESM closure 做前后 SHA-256 指纹，漂移时只返回固定 restart-required。
- `scripts/mcp/jsonutils-governance-tool-worker-contract.mjs` 与 `jsonutils-governance-tool-worker-client.mjs`: 单源维护闭字段 worker request/result、768 KiB stdout、16 KiB stderr、30 秒超时与 POSIX 进程组回收。
- `scripts/mcp/jsonutils-governance-tool-worker.mjs` 与 `jsonutils-governance-tool-runtime.mjs`: 每次工具调用在新进程载入当前实现，执行前后复核代码闭包，承载固定只读工具实现。
- `scripts/mcp/jsonutils-governance-report-tool.mjs`: JSONUtils 治理 MCP report helper，组合固定治理报告和预算报告，保证 report 与 scorecard 焦点同源。
- `scripts/mcp/jsonutils-governance-scorecard-tool.mjs`: JSONUtils 治理 MCP scorecard helper，复用治理 context 输出固定 scorecard 载荷。
- `scripts/mcp/jsonutils-governance-assets.mjs`: JSONUtils 治理 MCP asset inventory helper，复用资产注册表解析器输出 bounded 结构化资产清单。
- `scripts/mcp/jsonutils-governance-evaluations.mjs`: JSONUtils 治理 MCP evaluation helper，bounded 输出 case 覆盖、脱敏 outcome provenance 和实际验证计数。
- `scripts/mcp/jsonutils-governance-decisions.mjs`: JSONUtils 治理 MCP decisions helper，bounded 输出最近治理决策和锁定命令。
- `scripts/mcp/jsonutils-governance-handoff.mjs`: JSONUtils 治理 MCP handoff helper，组合治理焦点、AI 基建清零状态、最新决策、worktree snapshot 和交接风险。
- `scripts/mcp/jsonutils-governance-validation-plan.mjs` 与 `jsonutils-governance-validation-rules.mjs`: 以逐文件完整 changed set 单源推导命令、人工复核和未分类摘要；bounded 样本不改全局事实。
- `scripts/mcp/jsonutils-governance-worktree.mjs`: JSONUtils 治理 MCP worktree helper，固定维护 `git status --porcelain=v1 --branch` 的结构化 snapshot。
- `scripts/mcp/jsonutils-governance-resources.mjs`: JSONUtils 治理 MCP 资源目录 helper，固定维护只读资源 URI、文件映射和读取边界。
- `scripts/mcp/jsonutils-governance-context.mjs`: JSONUtils 治理上下文 helper，组合固定治理/预算 JSON 报告、版本、最新决策和下一步命令。
- `.github/copilot-instructions.md`: GitHub Copilot 仓库级薄入口，必须转发到主规范、Playbook 和治理命令。
- `.github/workflows/ai-governance.yml`: AI 治理定时巡检 workflow，固定产出治理 artifact 并保留手动触发入口。
- `docs/AI-CONFIG-INTEGRATION.md`: AI 入口和规范分层说明。
- `docs/AI-TOOLS-SETUP.md`: AI 工具配置状态和维护清单。
- `docs/AI-ASSET-REGISTRY.md`: AI 协作资产、治理门禁和显式豁免文件的可审计账本。
- `docs/AI-GOVERNANCE-DECISIONS.md`: AI rules、skills 和治理门禁变更的决策记录、回写追踪与锁定测试账本。
- `docs/AI-ENGINEERING-PLAYBOOK.md`: 跨 AI 工具共享的执行闭环。
- `docs/AI-EVOLUTION-PLAYBOOK.md`: AI 协作基建的评测、outcome、feedback、provenance 和批准回写闭环。
- `evals/ai-governance/cases.json`、`experiments.json`、`trace-policies.json`、`outcomes.jsonl` 与 `trial-receipts.jsonl`: 版本化 case/paired experiment、registration blind-result policy、v3 chained outcome、receipt v1 fixed replay、v2 observable trace、v3 单 trace proof 和 v4 pre-execution assignment + 三角色 unwitnessed proof 数据面。
- `scripts/ci/check-ai-evolution-evals.mjs`: 行为评测数据面契约门禁。
- `scripts/ci/write-ai-governance-artifacts.mjs`: 固定输出治理/预算/context/scorecard/summary 与 component-only attestation subject，并用 `--check` 查漂移。

新增 AI 工具或流程时，优先更新本文件和 `.claude/ai-tools-guide.md`，避免同一规则散落在多个地方。
修改 AI 入口、Playbook 或 skill 后，运行 `node scripts/ci/check-ai-governance.mjs` 确认关键引用没有断链。
新增或调整 `.agents/skills/*/SKILL.md` 时，同一条治理校验还会检查官方 metadata、`agents/openai.yaml` 和核心章节契约。
新增、移动或显式豁免 AI 协作资产时，还必须更新 `docs/AI-ASSET-REGISTRY.md`，让资产职责、维护契约和豁免边界可被人工审计。
新增 `.claude/`、`.codex/`、`.comate/` 下的 AI 协作资产，或新增 `.cursor/rules/**/*.mdc`、MCP 配置（`.codex/config.toml`、`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/prompts/**/*.prompt.md`、`.github/agents/**/*.agent.md`、`.github/chatmodes/**/*.chatmode.md`、`docs/AI-*.md`、`rules/ai-*.md` 协作文档时，同一条治理校验还会检查它是否已纳入必需文件、引用规则或显式豁免。
