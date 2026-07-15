# AI 协作基建演进 Playbook

本文定义 rules、skills、MCP、Agent 委派与治理门禁如何基于证据持续进化。它补充 `docs/AI-ENGINEERING-PLAYBOOK.md` 的执行闭环，重点回答“这次改动是否真的让 AI 协作结果更好”，而不只检查文件存在、引用同步或单文件行数。

## 核心原则

- 项目 source of truth、workspace/index/HEAD 分发证据及 lifecycle 授权以 `rules/code-style.md` 的“AI 规则资产更新”为准；`.agents/plugins/marketplace.json` 是索引，`plugins/` 才是插件包。分发或本机 cache 不建立 registration/runtime/signer trust。
- 把静态治理视为控制面，把 eval、outcome、feedback 和 provenance 视为数据面；两者缺一不可。
- 先记录失败信号和代表性 case，再修改长期 rule 或 skill，避免一次性偏好直接膨胀成永久规范。
- 优先使用代码、文件状态、测试和命令结果等确定性 grader；只有主观质量才使用模型或人工 grader。
- 行为不确定时诚实输出 `unknown` 或 `warn`，不能用“资产已登记、测试已存在”代替效果证据。
- 全局事实和 bounded 展示必须分层；`top`、`limit` 只能裁剪返回样本，不能改变 scorecard 的计数、状态或下一步焦点。
- 不保存隐藏推理、原始敏感 prompt、密钥或完整工具输入输出；只记录稳定 case ID 和脱敏摘要。
- MCP 始终保持固定、只读、bounded 输出，不为评测开放任意 shell、任意路径或通用日志读取。

## 数据模型

### 评测用例

`evals/ai-governance/cases.json` 保存版本化代表任务集。每条 case 至少包含：

- 稳定 `id` 和被测 `subject`，明确是 rule、skill、MCP、hook、delegation 还是 validation。
- corpus 使用 `corpusVersion` 标识整套语料来源；每条 case 使用正整数 `caseVersion` 标识自身预期语义，并用安全的 `subject.version` 绑定被测 rule、skill 或 MCP 实现。只有 case 的输入、预期或 grader 语义变化时才递增 caseVersion，实现变化则更新 subject version。
- `mode` 区分正例、负例、对抗例或协议边界；`coverageClass` 显式区分 `behavior` 与 `component-boundary`。行为覆盖分母只统计前者，后者禁止 active outcome。
- 脱敏输入、预期结果、grader、标签和一手来源。
- 可重复的确定性检查；随机模型行为应使用多次 trial，不用单次结果下结论。

### 结果账本

`evals/ai-governance/outcomes.jsonl` 只追加脱敏 outcome：v1 仅作 legacy，既有 `schemaVersion: 2` 保留为可评分历史，v3 激活后只追加 v3。v2/v3 必须绑定版本、真实 validation 与 `evals/ai-governance/trial-receipts.jsonl`；receipt v1 用于 fixed replay，v2 内嵌无签名单 trial observable trace，v3 再内嵌 DSSE/in-toto proof，不复制第三份账本。字段、哈希与 supersession 以 `evals/ai-governance/README.md` 为准。链路为：

```text
signal -> case -> expected/observed -> verdict -> feedback -> provenance
       -> decision/writeback -> actual validation result
```

receipt 绑定 case/subject、trial、validation 和 revision。v1 限固定即时重放；v2 无签名；v3 只有仓外受保护 signer proof 才可评分，未知 signer unverified，坏签名/绑定 rejected。字段与隐私契约见 `evals/ai-governance/README.md`。

model/human/hybrid 的 fail/partial 保留在 `unverifiedOutcomes`；v2 和 proof 未验证的 v3 推动 `verify-agent-trace`，不计 confirmed coverage。

当前 revision 使用域分离的 source-state v2 `worktree-<sha256>`：绑定 tracked 与未忽略 untracked 的非账本 path/type/mode/原始字节，显式排除 `outcomes.jsonl` 和 `trial-receipts.jsonl`，不混入 HEAD。因此 ledger-only 追加、暂存或提交元数据不会让结果自我失效，任一非 ledger 源状态变化仍会使旧 active outcome 失效。HEAD 另行进入 sealed manifest 审计和 Git 分发门禁；revision 本身仍不是签名或可信 builder attestation。

fixed runner 只重放当前 case 且永不写账。`record-ai-evolution-deterministic-outcomes.mjs` 默认 preview，从当前 corpus/runner/source-state v2/ledger 尾部派生记录；仅本地人工显式 `--write`，禁止调用方自报字段、手改 JSONL 或 CI/hook/postinstall 写入。细则见 `evals/ai-governance/README.md`。

`record-ai-evolution-unverified-trace-outcome.mjs` 只收至多 64 KiB 精确紧凑的闭字段 `redacted` stdin，默认 preview，字段从当前 corpus/policy/source/ledger 派生。仅本地显式 `--write`；结果永为 `trace-bound-unverified`，不覆盖 confirmed 或计入 coverage。该 CLI 属于项目，输入/事务细则见 `evals/ai-governance/README.md`。

两个 writer 共用 owner-only lock/journal 的 receipt-first 可恢复事务；端点、source 或前缀漂移均 fail closed。它只是本地合作式恢复，不是原子事务或外部可信证明；细则见 `evals/ai-governance/README.md`。

两个 JSONL 对 Git 基线做严格非空行前缀审计；v3 再锁定物理 sequence、完整 legacy 前缀/直接前驱 hash、精确紧凑行、direct supersession 与禁止降级。缺 Git 基线仍为 `unknown`；本地前缀/hash 只称仓库内篡改可见，不证明身份、时间、发布完整性或 non-equivocation，也不冒充 JCS、transparency log 或可信 attestation。CI 保留完整历史；并发 PR 基于最新尾部重算。

当前 case/subject 只由 latest v2/v3 计分；v3 用 sequence 和同 lineage direct supersession 将 fail/partial 标为 `open`、修复 pass 标为 `resolved`、其它 pass 标为 `none`。旧尝试保留为 superseded/stale/retired history，未来版本失败；其它 case 升级 corpus 不使未变 case 失效。writeback 拒绝仓外路径与 symlink 逃逸，receipt 不得复用或孤立。

### Feedback inbox 与实验 manifest

`evals/ai-governance/feedback-inbox.jsonl` 接收尚未满足 trial 前置条件、因此不能诚实写成 outcome 的脱敏信号。v1 只接受 `opened/open` 事件，按物理行序绑定 `previousHash` 与精确紧凑事件 hash；它只称本地篡改可见，Git 基线缺失时保持 `unknown`。`scripts/ci/prepare-ai-evolution-feedback.mjs` 只输出固定 profile candidate，不自动追加 inbox、receipt、outcome 或长期规则。

`evals/ai-governance/experiments.json` 独立于 outcome ledger 维护实验设计：train/validation/holdout 必须互斥，baseline/candidate 共用 task、fixture 和基础环境，随机行为至少 3 个 paired repetitions；Agent 只接收 `input.request/context`，grader 字段隔离。未封存 fixture/environment、未执行 trial 时，执行状态和 pass@1、`passPower3`（pass^3）、均值、标准差、paired delta、timing/cost 必须显式 `blocked` / `unavailable`，不能用 0 冒充实测。

Learning report 将可执行 `nextFocus` 与 `blockedFocus` 分开：仓外 Linux 管理平面、受保护 digest-pinned runtime、non-caller bindings、外部 signer/witness/state authority 或 zero-model adversarial preflight 缺失时，registration 链继续 `blocked/external-provisioning` 并列出恢复前置；scorecard 同时从未覆盖 behavior cases 中排除被该前置阻断的 registration/tool-selection 依赖，选择可在仓内诚实推进的焦点。不得隐藏 blocker，也不得让任意 open signal 把仓内焦点永久覆盖。

Registration 先用 `prepare-ai-registration-canary.mjs` 隔离 Agent/grader/host 投影，再用 `prepare-ai-registration-canary-snapshot.mjs` 生成 hermetic、owner-only、失败保留的 checkout 外 snapshot。packet、snapshot、缓存或插件冒烟都只是 `component-only`；fresh task、arm/plugin 隔离、外部 single-use lease、task registry 和相同 base environment 未观察前保持 blocked，不自动写 feedback、receipt 或 outcome。

外部结果只走 `review-ai-registration-canary-results.mjs` 的 `blind→seal→checkpoint→unblind`：先盲评并封存六条 grade，再生成 `external-anchor-required` detached subject，最后用 host-only record 揭盲。caller trust、自报时间、缺失 trial、跨批嫁接或基础设施漂移不得计 behavior；无仓外 signer/CAS/witness 时固定 `trustedSigners=0`、`external-json-unverified`，`passPower3`、timing/cost 为 `unavailable`。精确字段、anchor/disclosure 状态链和隐私负例按任务读取 `evals/ai-governance/README.md`。

MCP 的项目声明、当前任务注册发现和 Agent 工具选择分别评分；unknown server 进入 registration signal，不回填 tool-selection fail。用户配置安全插件只输出 value-free finding，不让项目读取用户配置，也不以安装、报告或缓存冒烟自证 behavior。

### 固定 case runner

`scripts/ci/run-ai-evolution-cases.mjs` 只执行已审计的 case ID 和 Node 参数白名单，不接受任意 shell、路径或命令。每个 descriptor 同时绑定 `caseVersion` 和 `subjectVersion`，corpus 漂移后 fail closed：

```bash
node scripts/ci/run-ai-evolution-cases.mjs --list
node scripts/ci/run-ai-evolution-cases.mjs --case mcp-readonly-shell-rejection --json
node scripts/ci/run-ai-evolution-cases.mjs --all --json
```

- `deterministic-case` 表示固定检查已满足该 case 的客观 grader，仍需在 ledger 记录实际执行结果。
- `component-only` 只证明工具、契约或回归可用；Agent 是否主动选对工具、保护脏工作树或做出合理回写，必须由真实 trace 和模型/人工/hybrid trial 补齐，不能凭 deterministic evidence 直接记 pass。
- Codex lifecycle hook 必须拆成 `codex-project-session-start-hook-boundary` component case 与 `codex-project-session-start-hook-observed` behavior case。前者只锁单一事件、闭字段配置、有界只读 runtime、固定 advisory 与隐私/路径/超限负例；项目/定义 trust、`/hooks` 可见、脚本直跑和单测都不能关闭后者。只有全新受信任任务真实触发、零写入快照与重复/延迟证据齐全时才可设计 outcome；即使通过也只是 advisory，不是 sandbox、admin policy、CI 或不可绕过 enforcement。
- `codex-project-agent-profile-boundary` 只锁定三个项目 profile 的文件集合、闭字段、sandbox、职责、隐私与回传模板；它不证明 Codex 在真实任务中选择了对应 profile。`codex-user-mcp-static-header-safety` 已归类为 `component-boundary`，只锁合成 TOML/stdio 隐私协议；项目插件的本机安装、缓存冒烟或 finding 均不能自证 Agent behavior outcome。
- Registration 的 snapshot、launch packet、result ingestion 与 grade checkpoint cases 只锁封存、三视图、盲评/揭盲、闭字段绑定和零写入；生成成功不证明 fresh task registry、外部时序、trial 或 behavior，也不关闭 signal、更新 experiment 或覆盖 hook observation。
- Anchor/disclosure cases 只验证 checkpoint 的 DSSE/in-toto 字节绑定、角色隔离和 `absent→anchored→authorized→consumed` 状态链。没有仓外 first-write-wins authority、固定 identity policy、共享 CAS、真实 inclusion/consistency receipt 与 witness 时，签名最多是 unwitnessed component evidence，不证明 at-most-once、non-equivocation、可信时间或可写回结果。
- `codex-external-controller-seatbelt-sentinel-boundary` v2 只锁 OpenAI code identity 下的 Codex Seatbelt capability、source 零变更与 disposable mirror；同 UID 不越过 namespace/signer/registry。
- `codex-external-controller-attested-runtime-preflight-boundary` 锁 host record、双角色 DSSE、七角色 UID/GID/namespace、派生 state/challenge、state witness、policy path candidate 与 pre-runtime 注入；仓内 Node 固定不建立 trust，不能启动 trial 或写 outcome。
- 固定 changed-file fixture 只能证明 validation planner 组件行为，未绑定当前完整 worktree manifest、实际 plan、`unclassified=0` 和全部执行结果时，`validation-change-matrix` 保持 `component-only`。

### Codex JSONL 适配器

`codex-exec-jsonl@1.2.0` 只有 terminal+EOF+exit+配对+零 drop 才 complete，但仓库生产模块只是纯 projector：不启动 Codex、不读取 HOME/CODEX_HOME，也不把外部执行事实升级为可信证据。固定 trial runner 1.3.0 要求 host-pinned binary SHA-256 与 0700 空认证根下的 keyless `--version`；仓库 CLI 只允许 preflight，携带 Codex/OpenAI key 时在动态导入仓库模块前拒绝。profile 是 `executable=false` component descriptor，不包含 `codex exec` 或同 UID stdio MCP 计划；离线 verifier 只消费闭字段、不可执行、`external-json-unverified` artifact，拒绝 callback 与正文注入。

validation 使用空 HOME/CODEX_HOME；其与 artifact verification 在正常、异常路径都绑定 receipt/outcome ledger 的终点身份、权限、mtime/ctime 和精确 SHA-256。终点一致不等于期间绝无写入，强只读仍需仓外只读挂载或等价审计。真实 run 不能由待测 checkout 持有 key，也不能让 key-bearing Codex 与待测 MCP 共享 UID/PID 可见性：即使 MCP launcher 清空子进程 env，同 UID child 仍可能读取 parent env，且 `--ignore-user-config` 不会把保存登录态变成无凭据。后续只允许仓外受保护 controller、隔离 UID/PID namespace 的 pinned Codex workload、无 key 的 host-owned MCP facade/单次代理凭据与外部 signer；该拓扑未落地前不运行模型、不生成真实 candidate/outcome。

`codex-external-controller-topology@1.0.0` 是上述拓扑的不可执行前置契约：只接受精确紧凑闭字段 JSON 与独立 host expected bindings，固定零模型、零重试、零 ledger 写入，校验六个 workload 的 trust/UID/PID/user/IPC namespace、空认证根、只读 snapshot、最小网络/runtime capability、MCP allowlist、sanitizer 和外部 signer 边界。它不启动 controller、容器、Codex 或 MCP；plan 通过只算 `component-only`，`runtimeIsolationVerified=false`，不能据此生成 candidate、receipt 或 outcome。

`codex-external-controller-runtime-probe@1.1.0` 由项目插件 0.4.0 的本机安装副本从待测 checkout 外生成 preflight，并定义三个 fake workload 的 `credential-snapshot-subset` report 契约：fake Codex 不得获得 checkout/snapshot/认证根，fake MCP 与 validation 只读挂载封存 snapshot，全程零真实 Codex、零模型、零凭据、零 ledger 读写。独立审核的 digest-pinned 镜像政策落地前固定不创建容器，`--run` 只能返回 `runtime-execution-disabled`。项目源码、安装副本、report 和宿主校验仍是未受保护的 component evidence；controller 在 host、三 workload 不是六角色拓扑，因此即使未来出现 `passed-subset` 也固定 runtime/controller/user-namespace/signer/outcome 为 false。Docker daemon 不可用、未验证 ECI/user namespace、缺少封存 snapshot/pinned local image/审核镜像政策时必须保持 `not-run`，不用 preflight 成功冒充 runtime 证据。

`codex-external-controller-seatbelt-sentinel-execution@2.1.0` 先验 OpenAI Codex code identity，再在 Seatbelt 中做 capability probe；source snapshot 永不接受变更探针，write/chmod 只作用 disposable mirror。项目插件的同 UID 安装副本 report 仍只算 component。

`codex-external-controller-attested-runtime-preflight@1.0.0` 纯验证 Linux host record、双角色 DSSE、七角色 UID/GID/namespace、派生 state/challenge 与 state witness。checkout 外 root-owned、当前 verifier 不可写的 digest-pinned path 在仓内 Node 中也只能标 candidate：`NODE_OPTIONS` 可在正文前劫持 fs/stdout/exit，所以 trust/runtime/registration 始终 false。下一里程碑是 checkout 外受保护 launcher/service 固定 clean env、Node/verifier bundle、policy path/digest、run nonce 与 non-caller expected bindings；另建 case 前不解锁 registration，outcome 始终 false。

v3 DSSE/in-toto proof 绑定 receipt/trace/facts；外部 `trustedSigners` 默认为空。同仓 GitHub job 隔离与 detached subject 仍是 component-only；仓外固定 reusable signer、外部 identity policy 和真实 bundle 未验证前不写 Agent outcome。细节见 `evals/ai-governance/README.md`。

## 标准演进闭环

1. **建立基线**：运行治理、MCP、预算与 eval 检查，记录当前 commit、skill/server 版本和工作区状态。
2. **捕获信号**：来源可以是用户纠偏、CI 失败、Agent 复盘、外部规范变化或人工评审；先脱敏，再判断是否已满足合法 trial 前置条件。未满足时进入 feedback inbox，不伪造 outcome。
3. **新增 case**：为问题补代表性正例、近似负例或对抗例。没有 case 的长期规则默认仍是候选提案。
4. **比较候选**：skill、instruction 或 MCP 注册变更比较 baseline 与 candidate；同一 task/fixture/base environment 做 paired repetitions，并保留互斥 train/validation/holdout。
5. **执行 grader**：先跑确定性 grader，再补模型或人工评审。grader 结论必须能追到命令、文件或评审证据。
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

- stdio 必须遵循 MCP 官方 newline-delimited JSON-RPC 和初始化版本协商，真实进程测试不得用私有 framing 自证；client 必须限制未终止 stdout 与 queued message 数量，校验 response id，并用不含 child stdout/stderr/JSON 正文的固定错误拒绝超限、非法 JSON、EOF、stream failure 与 timeout。
- 固定只读工具声明 read-only annotations、`outputSchema` 与 `structuredContent`，同时保留 text 兼容输出。
- protocol、工具 schema、资源 URI 或能力面变化必须有 server 版本和 outcome 证据。
- 非对象 JSON、错误 `jsonrpc` 或非法 method 返回 `-32600`，解析失败返回 `-32700`，方法或工具参数违反 input schema 返回 `-32602`，内部异常统一脱敏为 `-32603`；合法 notification 不响应，错误输入后进程仍须接受后续请求。单条无换行输入上限为 1 MiB，固定子进程默认 30 秒超时。
- 外部 conformance 或 Inspector 适合作为互操作验证，但不能替代仓库内离线负例与 stdio 冒烟。
- MCP 声明、插件安装、当前任务注册发现和工具选择分别评分；插件缓存能启动 server 不等于当前任务已加载，需在新任务检查实际 tool registry。

## Scorecard 语义

- `unknown`：没有真实 outcome，或无法确认 grader/provenance。
- `warn`：已有部分执行证据，但代表 case 覆盖不足、账本基线未知、存在 confirmed 或 unverified partial/fail，或仍有未闭环 feedback。
- `pass`：结构契约通过，当前 caseVersion 的 latest outcome 覆盖至少 60% `behavior` case，且没有 fail、partial 或未闭环高优先级反馈；`component-boundary` 不进入分母。
- 行为质量维度必须独立于资产覆盖、引用漂移、结构契约和可维护性预算，避免静态全绿后误报“AI 基建已清零”。
- `nextFocus` 按 fail > warn > unknown 的严重度选择；治理报告缺失或无法解析时静态维度 fail closed。artifact 中 governance、context、scorecard 与 summary 必须复用同一份结合预算后的成熟度结论。
- scorecard 使用未截断的 `scorecardCandidates` 事实集；MCP 的 `top` 只限制 `maintainability.highUsage` 样本，`ai_governance_context`、`ai_governance_scorecard` 与 `ai_handoff_brief` 在不同 top 下的全局热点计数必须一致。

## 必跑命令

```bash
node scripts/ci/check-ai-evolution-evals.mjs
node scripts/ci/check-ai-evolution-evals.mjs --json
node scripts/ci/check-ai-asset-distribution.mjs --workspace
node scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs --help
node scripts/ci/prepare-ai-evolution-feedback.mjs --profile mcp-server-unregistered --observed-at 2026-07-11
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

- [OpenAI Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [OpenAI Trace grading](https://developers.openai.com/api/docs/guides/trace-grading)
- [Anthropic Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Agent Skills evaluating skills](https://agentskills.io/skill-creation/evaluating-skills)
- [MCP stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP Conformance Framework](https://github.com/modelcontextprotocol/conformance)
- [Sigstore Rekor transparency log](https://docs.sigstore.dev/logging/overview/)
- [Sigstore security model](https://docs.sigstore.dev/about/security/)
- [in-toto Statement v1](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md)
- [SLSA Build Provenance v1.2](https://slsa.dev/spec/v1.2/build-provenance)
