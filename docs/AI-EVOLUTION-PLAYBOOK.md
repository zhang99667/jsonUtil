# AI 协作基建演进 Playbook

本文定义 rules、skills、MCP、Agent 委派与治理门禁如何基于证据持续进化。它补充 `docs/AI-ENGINEERING-PLAYBOOK.md` 的执行闭环，重点回答“这次改动是否真的让 AI 协作结果更好”。这里只保留决策不变量与任务路由。

## 按需字段协议

通用首读只到本 Playbook。修改或排查 grader、ledger、outcome/receipt、checker、trace、runner 或 controller 的字段、状态或协议时，必须再读 `evals/ai-governance/README.md`；普通治理任务不注入该 README。

## 核心原则

- 项目 source of truth、workspace/index/HEAD 分发证据与 lifecycle 授权以 `rules/code-style.md` 为准。仓库不是 plugin，只有 `plugins/<name>/` 是插件包；trusted `.codex/config.toml` 是固定治理 MCP 主路径，`.agents/plugins/marketplace.json` 只是 repo catalog。源码、项目配置加载、catalog 可发现、插件安装/启用、fresh task 注册与 runtime/signer trust 是六层独立证据，任一层都不能代替其余层。
- 项目插件的 content lock、完整树 identity lint 与 Skill 语义契约必须独立 fail closed，并消费同一份有界、无 symlink 逃逸、前后稳定的原始字节快照。`--check` 只诊断；只有维护者明确授权才能 `--apply` 或 `--write-lock`，且必须先过 source-only 契约、再读 Git inventory。通过仅是 component evidence，不证明安装、加载或 Agent behavior。
- `distribution-readiness` 在同一次只读聚合中分别核验 workspace、index 和 HEAD，并复核 source/Git inventory 前后稳定；它不会 stage、commit、安装或改写个人 selector。
- 跨客户端 skill 只维护 `.agents/skills/` 一份 canonical 语义：Codex/Copilot 直接发现，Claude 使用固定派生的 `.claude/skills/*/SKILL.md` 普通文件薄 adapter。静态发现同样不证明真实选择、加载或遵循。
- 项目 Agent 的通用执行角色固定 explorer/worker/verifier；AI 基建专项只读审计另允许三端 `ai-infra-auditor` adapter，统一路由 canonical evolver skill，禁止写入、MCP、网络与用户级上下文。静态 adapter 只算 component evidence，真实发现、选择和零写入保持 unknown。
- 把静态治理视为控制面，把 eval、outcome、feedback 和 provenance 视为数据面；两者缺一不可。
- 先记录失败信号和代表性 case，再修改长期 rule 或 skill，避免一次性偏好直接膨胀成永久规范。
- 优先使用代码、文件状态、测试和命令结果等确定性 grader；只有主观质量才使用模型或人工 grader。
- 自动 grader 必须绑定 identity/version、实际 import 与 fixture 的固定仓库路径、无祖先 symlink 的当前字节、固定 case/policy ID 和摘要，并用不被生产 grader 导入的版本化 gold、near-miss 与 adversarial corpus 校准。确定性 grader 必须逐 reason 覆盖完整 failure taxonomy，label、reason、macro-F1、各类 recall、三次重放和 mutation sensitivity 门槛均为 100%；校准只形成 `component-only grader-health`，不得增加 Agent behavior coverage。
- 行为不确定时诚实输出 `unknown` 或 `warn`，不能用“资产已登记、测试已存在”代替效果证据。
- 全局事实和 bounded 展示必须分层；`top`、`limit` 只能裁剪返回样本，不能改变 scorecard 的计数、状态或下一步焦点。
- 不保存隐藏推理、原始敏感 prompt、密钥或完整工具输入输出；只记录稳定 case ID 和脱敏摘要。
- MCP 始终保持固定、只读、bounded 输出，不为评测开放任意 shell、任意路径或通用日志读取。

## 数据模型

### Eval case

`evals/ai-governance/cases.json` 保存版本化代表任务集。每条 case 至少包含：

- 稳定 `id` 和被测 `subject`，明确是 rule、skill、MCP、hook、delegation 还是 validation。
- corpus 使用 `corpusVersion` 标识整套语料来源；每条 case 使用正整数 `caseVersion` 标识自身预期语义，并用安全的 `subject.version` 绑定被测 rule、skill 或 MCP 实现。只有 case 的输入、预期或 grader 语义变化时才递增 caseVersion，实现变化则更新 subject version。
- `mode` 区分正例、负例、对抗例或协议边界；`coverageClass` 显式区分 `behavior` 与 `component-boundary`。行为覆盖分母只统计前者，后者禁止 active outcome。
- 脱敏输入、预期结果、grader、标签和一手来源。
- 可重复的确定性检查；随机模型行为应使用多次 trial，不用单次结果下结论。

### Grader calibration

`evals/ai-governance/grader-calibration.json` 使用不被生产 grader 导入的版本化 gold、near-miss 和 adversarial corpus，绑定 grader identity/version、实际 import/fixture、当前普通文件字节摘要、完整 failure taxonomy 与固定 mutation。runner 必须实际调用生产 grader，对 agreement、macro-F1、逐类 recall、reason code、确定性与 mutation sensitivity 全量校准；任一绑定漂移都在零 grader invocation 时 fail closed。

校准只形成 `component-only` grader health，不写账、不增加 behavior coverage。失败进入现有 suite/scorecard/artifact 的 `contractFailures`，不另建平行 CI；模型或人工 grader 没有独立专家 gold 与实际 agreement 前保持 `unknown`。字段和 mutation 目录以 `evals/ai-governance/README.md` 为准。

### Outcome ledger

`evals/ai-governance/outcomes.jsonl` 只追加脱敏 outcome：v1 仅作 `legacy`，既有 `schemaVersion: 2` 保留为可评分历史，当前只追加 v3。活跃 outcome 必须绑定当前 case/subject、真实 validation 与 `evals/ai-governance/trial-receipts.jsonl`；固定 receipt 只限即时重放，未验签 trace 只能进入 unverified，paired/DSSE 只有仓外受保护 assignment、signer 和 witness 才可评分。精确 schema、哈希、lineage 与 proof 契约按任务读取 `evals/ai-governance/README.md`。链路为：

```text
signal -> case -> expected/observed -> verdict -> feedback -> provenance
       -> decision/writeback -> actual validation result
```

当前 revision 使用域分离的 source-state，绑定 tracked 与未忽略 untracked 的非账本 path/type/mode/原始字节，显式排除两个 ledger 且不混入 HEAD。ledger-only 追加或 Git 元数据不会让 outcome 自我失效，任一其它源状态变化都会使旧 active outcome 失效；revision 本身不是签名、可信时间或 builder attestation。

评测契约、当前 runner 与证据时效是三层独立事实。旧 outcome stale 不得跳过当前重放；当前 runner 通过也不会自动刷新旧账、增加 behavior coverage 或变成 active outcome。报告必须分开 `contractFailures`、`currentRunFailures` 和 `evidenceFreshness`。

fixed runner 只在 hermetic 环境重放当前 case，缺少固定依赖时 fail closed，永不写账。所有 writer 默认 preview，只能从当前 corpus/policy/source-state/ledger 派生；仅本地维护者明确 `--write` 才可进入可恢复追加，禁止调用者自报字段、手改 JSONL 或 CI/hook/postinstall 写入。unverified writer 恒为 `trace-bound-unverified`，paired writer 在保护授权缺失时必须零 ledger mutation。recovery 的 status、journal 清理或 `already-current` 不得推断 mutation，只以本次 receipt/outcome 真实 append 为准。

两个 JSONL 必须保持 Git 前缀、物理顺序、精确紧凑行、直接前驱 hash 与 direct supersession；缺 Git 基线仍为 `unknown`。本地 hash 只提供仓内篡改可见性，不证明身份、时间、发布完整性或 non-equivocation。旧尝试保留为 history，不改写；writeback 拒绝仓外路径、symlink 逃逸、receipt 复用与孤立记录。

### Feedback inbox 与实验 manifest

`evals/ai-governance/feedback-inbox.jsonl` 只接收脱敏、未满足 trial 前置的信号，不得冒充 outcome。新事件精确绑定当前 case/subject 与物理 hash chain；旧事件只能用预登记 ID + hash + 原 tuple 识别，禁止用版本大小推断历史。feedback preparer 只生成 candidate，不自动追加 inbox、receipt、outcome 或长期规则；Git 基线缺失时保持 `unknown`。

`evals/ai-governance/experiments.json` 独立维护实验设计。baseline/candidate 必须共用 task、fixture 和 base environment，train/validation/holdout 互斥，随机行为做 paired repetitions，Agent 与 grader 输入隔离。无 `contractVersion` 的 registration 是 `compatibility-plugin` 历史实验，当前主路径是 `.codex/config.toml`；不改写历史。缺少 protected assignment/environment/trust 时，execution 只是 prepared，ingestion 和 metrics 为 `unavailable`。

Learning 只有在完整 trace policy、ready paired experiment 与 ready receipt ingestion 同时存在时，才能标记 `fresh-task-observation-ready/actionable`。否则要精确投影 preparation、execution 或 ingestion 缺口；deterministic runner、packet、snapshot、cache、插件冒烟和 canary review 都仅是 `component-only`，不增加 executed trial、behavior coverage 或写账权限。

Registration 的 Agent/grader/host 投影、checkout 外 snapshot 与 `blind→seal→checkpoint→unblind` 只在仓外 signer/CAS/witness、single-use lease、fresh task registry 和相同 base environment 真实观察后才可进入 behavior 评分。否则固定 external-unverified，timing/cost 为 `unavailable`，不写 feedback、receipt 或 outcome。详细状态链和隐私负例见 `evals/ai-governance/README.md`。

MCP 的源码、trusted config 加载、marketplace 发现、插件安装/启用、当前 task registry 与 runtime/signer 仍分层取证，Agent 工具选择另行评分。项目不修改个人 plugin selector，不读用户配置，也不用配置存在、安装或 finding 自证 behavior。

### 固定 case runner

`scripts/ci/run-ai-evolution-cases.mjs` 只执行已审计的 case ID 和 Node 参数白名单，不接受任意 shell、路径或命令。每个 descriptor 同时绑定 `caseVersion` 和 `subjectVersion`，corpus 漂移后 fail closed：

```bash
node scripts/ci/run-ai-evolution-cases.mjs --list
node scripts/ci/run-ai-evolution-cases.mjs --case mcp-readonly-shell-rejection --json
node scripts/ci/run-ai-evolution-cases.mjs --all --json
```

- `deterministic-case` 表示固定检查已满足该 case 的客观 grader，仍需在 ledger 记录实际执行结果。
- `component-only` 只证明工具、契约或回归可用；Agent 是否主动选对工具、保护脏工作树或做出合理回写，必须由真实 trace 和模型/人工/hybrid trial 补齐，不能凭 deterministic evidence 直接记 pass。
- Hook、Agent profile、registration packet/snapshot/checkpoint、anchor/disclosure 和 external-controller case 必须分开 component boundary 与 behavior observation。配置、直跑、单测、本机缓存、数学验签或同 UID sandbox 都不能关闭 behavior case。后者需要 trusted fresh task 真实触发、委派前后完整 `path/type/mode/content` workspace manifest、外部时序与受保护 signer/witness；具体 case 边界以 descriptor 与 `evals/ai-governance/README.md` 为准。
- `validation-change-matrix` 只用固定 changed-file fixture 锁 validation planner、changed-set 与命令注册表的组件契约，保持 `component-boundary`/`component-only`；当前全局治理、artifact freshness 或 ledger 红绿不得污染该 fixture，也不能由其推断真实检查已执行。独立的 `validation-change-execution-observed` behavior case 必须绑定同一次当前完整 worktree manifest、实际 plan、`unclassified=0`、全部必需命令状态与 manual check 可复核结论；任一 manual check 未解决都必须阻断 pass，并透明保留失败、跳过与未覆盖项。fixture、fixed runner 或单独的全局聚合状态都不能替代这组行为证据。
- Execution CLI 默认 preview；`--run` 仍只算 component，不证明后代/nested shell、主机/期间零写入，禁止自动写账或接入 validation registry/case replay DAG，以免递归。

### Codex JSONL adapter

`codex-exec-jsonl` 只有 terminal+EOF+exit+事件配对+零 drop 才是 complete；仓库生产闭包只是纯 projector，不启动 Codex、不读 HOME/CODEX_HOME，也不将外部执行事实升级为可信证据。framing 必须对原始字节、严格 UTF-8、跨 chunk/未终止行、源事件和 trace 事件设有界上限并 fail closed；精确容量和 artifact schema 见 `evals/ai-governance/README.md`。

仓内 trial CLI 只允许 keyless preflight 和不可执行 component descriptor，离线 verifier 只消费闭字段、脱敏、external-unverified artifact。ledger 终点一致不等于期间零写入；清空子进程 env、`--ignore-user-config`、同 UID 或 caller 公钥也不是凭据隔离、runtime trust 或 trusted signer。

真实 run 只能在仓外受保护 controller 中使用 pinned Codex workload、独立 UID/PID/user/IPC namespace、只读 sealed snapshot、host-owned keyless MCP facade/单次代理凭据与外部 signer。topology、runtime probe、Seatbelt sentinel、attested preflight 和 DSSE/in-toto 在仓外 launcher、identity policy、witness/CAS 与真实 bundle 未验证前都只是 `component-only`，不运行模型、不启动 trial、不生成 candidate/receipt/outcome，也不以本机插件 report 冒充 runtime/signer trust。

## 标准演进闭环

1. **建立基线**：运行治理、MCP、预算与 eval 检查，记录当前 commit、skill/server 版本和工作区状态。
2. **捕获信号**：来源可以是用户纠偏、CI 失败、Agent 复盘、外部规范变化或人工评审；先脱敏，再判断是否已满足合法 trial 前置条件。未满足时进入 feedback inbox，不伪造 outcome。
3. **新增 case**：为问题补代表性正例、近似负例或对抗例。没有 case 的长期规则默认仍是候选提案。
4. **比较候选**：skill、instruction 或 MCP 注册变更比较 baseline 与 candidate；同一 task/fixture/base environment 做 paired repetitions，并保留互斥 train/validation/holdout。
5. **执行 grader**：先确认生产 grader 的独立 calibration 通过，再跑确定性 grader并补模型或人工评审。grader 结论必须能追到 identity/version、实现与 corpus 摘要、命令、文件或评审证据。
6. **记录 outcome**：写入 verdict、score、feedback、provenance 和实际 validation；失败或 partial 不能缺少反馈与下一步。
7. **批准回写**：只有稳定证据表明确实减少未来错误时，才更新权威 rule、skill、MCP 或 Agent profile，并登记 `docs/AI-GOVERNANCE-DECISIONS.md`。
8. **锁定回归**：运行 `check-ai-evolution-evals`、MCP stdio、治理、预算和版本门禁；把结果回写 outcome，而不是只登记计划命令。
9. **复核与撤销**：后续反馈推翻假设时，追加 v3 outcome，以 direct supersession 和 `open` / `resolved` / `none` 标记处置；不改旧行，也不继续追加互相冲突的规则。

## Skill 评测

- Trigger eval 同时覆盖应触发、近似但不应触发和与其它 skill 竞争的输入。
- Output eval 使用同一任务比较当前 skill、旧版本或无 skill 基线，至少记录 pass rate、trial 数和可获得的耗时；平台不提供 token 或 timing 时明确写未知。
- A/B 必须使用同一任务目标、输入 fixture 和环境；实施型 assertion 在隔离可写工作区执行，只读 preflight 只能评方案型 assertion，不能冒充改后完成度。
- 保留脱敏 execution transcript、前后状态快照与输出文件，让 grader 能验证读取、写入和命令归属；缺失 token、timing 或 tool-call 时记为 `unavailable`，不把聚合器的 0 占位当成实测。
- 每个显式 profile 的 skill 都由 profile 表自动派生必需 `evals/evals.json`；未分类 skill 不能静默回退合入。eval schema 要求 `skill_name` 与 frontmatter 一致，eval id 与 prompt 唯一，且 prompt、expected output 和 assertions 非空。
- 新 skill 在进入稳定目录前生成可人工复核的 eval viewer；用户反馈优先于模型自评。
- 普通业务功能、一次性文档整理或产品内 Gemini 修复不应误触发 AI 基建演进 skill。

## MCP 协议与工具评测

- stdio 必须遵循 MCP 官方 newline-delimited JSON-RPC 与初始化协商，真实进程测试不得用私有 framing 自证。client 对行、队列、输出和时间都必须有界，校验 response id，并以不含 child stdout/stderr/JSON 正文的固定错误 fail closed。
- 固定只读工具声明 read-only annotations、`outputSchema` 与 `structuredContent`，同时保留 text 兼容输出。
- protocol、工具 schema、资源 URI 或能力面变化必须有 server 版本和 outcome 证据。
- 常驻 Node MCP 不得把 ESM cache 当成当前项目事实：controller 在启动和请求前后复核 transitive import closure，漂移即以固定脱敏错误要求重启。固定工具通过无 shell、固定 cwd、有界闭字段 wire 的一次性 worker 重载当前实现，并在 import/输出边界复核。这仍只是同 UID component 隔离，不建立 task/runtime/signer trust。
- cancellation 必须使用 typed request ID、有序控制通道和至多一个终态响应。POSIX 取消、超时、输出超限或连接关闭要回收独立进程组并抑制原响应；unknown/重复/迟到/malformed 取消静默忽略，Windows 只保证 parent best effort。精确 JSON-RPC code、wire 上限和竞态矩阵由契约测试与 `evals/ai-governance/README.md` 锁定。
- 外部 conformance 或 Inspector 适合作为互操作验证，但不能替代仓库内离线负例与 stdio 冒烟。
- `.codex/config.toml` 只通过 component 契约锁定无 shell 根/子目录 bootstrap、`required=true`、超时和 11 工具 allowlist。当前 upstream 源码表明同名 direct project server 优先于 plugin server，但这只是 component inference；clone/open 不执行配置，必须在 trusted fresh task 检查实际 tool registry。
- 项目源码、trusted config 加载、marketplace 发现、插件安装/启用、当前任务注册和 runtime/signer 分层取证，工具选择另行评分；项目配置不写用户 selector，配置或插件缓存能启动 server 也不等于当前任务已加载。

## Scorecard 语义

- `unknown`：没有真实 outcome，或无法确认 grader/provenance。
- `warn`：已有部分执行证据，但代表 case 覆盖不足、账本基线未知、存在 confirmed 或 unverified partial/fail，或仍有未闭环 feedback。
- `pass`：结构契约通过，当前 caseVersion 的 latest outcome 覆盖至少 60% `behavior` case，且没有 fail、partial 或未闭环高优先级反馈；`component-boundary` 不进入分母。
- scorecard schema v2 固定六维：资产覆盖、项目分发就绪、引用漂移、契约锁定、行为质量与维护余量。`distribution-readiness` 报告缺失时为 `unknown`，结构非法、workspace 失败、证据不可读或扫描漂移时为 `fail`，workspace 通过但 index/HEAD 任一未通过时为 `warn`，三层均通过且稳定才为 `pass`。
- 契约锁定维度只接收真实 Skill/评测契约失败；fixed runner 的 `behavior-fail` 使行为质量为 `fail`，`component-fail` 与 `infrastructure-invalid` 为 `unknown`，`delivery-blocked` 为 `warn`，runner 当前通过但 outcome revision stale 为 `warn`，且均不增加 confirmed coverage。case-run、eval 与 MCP evaluation summary 使用 schema v3 分别投影 component 计数与修复焦点；治理静态报告仍是独立的 schema v2，并把执行失败与证据时效投影到 `evolutionEvidenceFailures`，不得借改写旧账或降低门禁换绿。
- 独立 grader calibration 失败属于契约锁定失败；通过只表示当前生产 grader 对固定 project-contract corpus 的 component health，不是模型/人工 grader 校准、Agent trial 或 behavior outcome。
- 行为质量维度必须独立于资产覆盖、项目分发就绪、引用漂移、结构契约和可维护性预算，避免静态全绿后误报“AI 基建已清零”。
- `nextFocus` 按 fail > warn > unknown 的严重度选择；治理报告缺失或无法解析时静态维度 fail closed。artifact 中 governance、context、scorecard 与 summary 必须复用同一份结合预算后的成熟度结论。
- scorecard 使用未截断的 `scorecardCandidates` 事实集；MCP 的 `top` 只限制 `maintainability.highUsage` 样本，`ai_governance_context`、`ai_governance_scorecard` 与 `ai_handoff_brief` 在不同 top 下的全局热点计数必须一致。

## 必跑命令

```bash
node scripts/ci/check-ai-evolution-evals.mjs
node scripts/ci/check-ai-evolution-evals.mjs --json
node scripts/ci/check-ai-asset-distribution.mjs --workspace
node scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs --help
node --test scripts/ci/prepare-ai-evolution-feedback.test.mjs
node scripts/ci/prepare-ai-registration-canary.mjs --trial mcp-registration-p1-baseline --projection agent --run-nonce <64-hex-host-nonce> --environment-sha256 <64-hex-base-environment>
node --test scripts/ci/aiGovernanceRegistrationCanaryResult.test.mjs
node --test scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpoint.test.mjs
node scripts/ci/run-ai-evolution-cases.mjs --all --json
node --test scripts/mcp/*.test.mjs
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all
node scripts/ci/check-version-consistency.mjs
```

## 外部基准

- [Agent Skills specification](https://agentskills.io/specification)
- [OpenAI Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [OpenAI Trace grading](https://developers.openai.com/api/docs/guides/trace-grading)
- [Anthropic Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Agent Skills evaluating skills](https://agentskills.io/skill-creation/evaluating-skills)
- [MCP stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP cancellation](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation)
- [MCP Conformance Framework](https://github.com/modelcontextprotocol/conformance)
- [Sigstore Rekor transparency log](https://docs.sigstore.dev/logging/overview/)
- [Sigstore security model](https://docs.sigstore.dev/about/security/)
- [in-toto Statement v1](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md)
- [SLSA Build Provenance v1.2](https://slsa.dev/spec/v1.2/build-provenance)
