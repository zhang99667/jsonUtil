# AI 演进结果账本契约

本文是 `evals/ai-governance/feedback-inbox.jsonl`、`experiments.json`、`outcomes.jsonl` 与 `trial-receipts.jsonl` 的字段级契约。日常任务先读 `docs/AI-EVOLUTION-PLAYBOOK.md`；只有新增 case、写入 signal/outcome/receipt、设计 experiment、修改 checker 或调查账本失败时才读本文。

## 覆盖类别

- 每个 case 必须显式声明 `coverageClass=behavior|component-boundary`；带 `component-only` tag 的 case 只能是后者。
- behavior coverage 的分母只是 `behavior` case；`component-boundary` 只验证组件契约，任何 active outcome 都 fail closed。外部 blocker 单列 `blockedFocus`，可执行 `nextFocus` 排除依赖该前置的 case 后再从未覆盖 behavior case 中选择。
- 项目 Agent profile 的静态 TOML 契约和项目 MCP 配置审计插件的合成隐私测试都只是 component evidence；不得因为 profile 存在、插件安装、缓存启动或安全报告通过就追加 behavior outcome。
- `rule-project-ai-asset-ownership@v5` 按仓库最终状态、Git workspace/index/HEAD 与合成用户态生命周期评分：项目 marketplace 索引、完整插件树/content lock、必需/引用/发现/实现/测试/eval/CI-control machine universe、原始字节/blob/type/mode 分发门禁、Git 旁路红队、required CI command 可达性、严格 CLI 参数、不发出 lifecycle mutation 的诊断、显式 apply/write-lock 及冲突/禁用/特殊路径/版本负例全部通过才可形成 deterministic outcome；工作树或 index 不能冒充 clone-visible，且即使 HEAD 通过也不证明任意真实用户已安装、当前任务 registry、runtime isolation 或 signer trust。source-state v2 已排除双 ledger 并与 HEAD 分离，可防止追加结果自我失效；但 ownership v5 仍须先由真实 index/HEAD 证据通过，不得用 workspace 通过代替。

## 反馈与实验

- feedback inbox v1 只接受精确紧凑、闭字段、`redacted` 的 `opened/open` 事件；物理 `sequence`、直接前一事件 `previousHash` 和当前事件 SHA-256 必须一致。首条 project MCP 注册信号固定使用 `unknown-mcp-server`、`codex-task-registry`、`self-observed-unverified`，并声明未调用模型、未自动写 ledger、不可生成 outcome。
- feedback inbox 是 trial 前置条件失败的排队层，不是第三种 outcome。当前 schema 不支持自动 resolve/dismiss；关闭前必须先设计显式新版本和 transition 负例。Git 基线缺失时其完整性仍为 `unknown`，本地 hash 不建立身份或可信时间。
- experiment manifest v1 使用互斥 train/validation/holdout；当前 case 必须在 validation，`mcp-fixed-tool-selection` 保留为 holdout。paired A/B 的 arms 固定 baseline/candidate，各至少 3 次，trial ID 唯一且未执行时只能 `planned`、`receiptId=null`。
- task/fixture/base environment 只在 experiment 全局声明，不能让 arms 偷换输入；Agent projection 只含 `input.request/context`，grader projection 独立，candidate 不得读取 grader。未封存 snapshot 或未执行 trial 时，execution 保持 `blocked/new-task-required`，pass@1、`passPower3`（pass^3）、均值、标准差、paired delta、timing 和 cost 全部为 `unavailable`。
- `prepare-ai-evolution-feedback.mjs` 只从固定 profile 生成 candidate 到 stdout；禁止写 inbox、receipt、outcome 或长期 rule。项目插件的本机安装和 server 冒烟只算注册候选，必须在新任务的实际工具清单中完成 canary。
- `prepare-ai-registration-canary.mjs` 只输出 `agent|grader|host` 中一个闭字段 launch projection。Agent 视图不得含 arm、treatment、plugin 状态、expectedOutcome 或 graders；grader 视图不得含 arm/treatment；host 视图绑定交替 trial 顺序、case/experiment/MCP/hook/worktree、三个 ledger 端点、base-environment 摘要和 external single-use lease。64 位 host nonce 只参与 domain-separated blind alias/lease hash，不进入输出。packet 始终是 `prepared/external-preflight-required`、`modelInvoked=false`、`executionObserved=false`、`automaticLedgerWrites=false`、`outcomeEligible=false`；fresh task、arm 隔离、lease 和实际 registry observation 未由仓外 host 完成前，experiment 继续 blocked。
- `prepare-ai-registration-canary-snapshot.mjs` 在 checkout 外生成 `repository-source-unreviewed` snapshot：hermetic Git、稳定 descriptor 与增量上限绑定 tracked/untracked、HEAD 审计元数据、精确 executable bits、deleted entry、摘要、environment 与 source-state v2 revision；双 ledger 参与快照/封存却不进入 revision。拒绝 symlink/特殊文件、真实 `.env`、私钥 marker、用户产物和 TOCTOU 漂移。失败 snapshot 与末态空 runtime home 均 owner-only 保留，不自动递归删除。verifier 从实际 `0400 | executableBits` 文件、`0500` 目录和 `0400` manifest 重建 revision。CLI 只返三视图摘要；有界 stdio 复核双轨结果、stderr count/nonEmpty 与前后摘要。模型/写账未请求且 descendant/home cleanup/absence 未验证，外部信任均 false。
- `review-ai-registration-canary-results.mjs` 只从 stdin 执行 `blind|seal|checkpoint|unblind`。Blind result 是至多 512 KiB 的精确紧凑闭字段 JSON，只绑定 Agent/grader packet digest、当前 case、fixture/environment、observation、observable trace 与唯一 response digest；不含 host/lease，也不接受 arm/trial/order/plugin、caller verdict、正文、敏感字段或 trace 值侧信道。盲评只区分 `graded pass|fail` 与 `ungradable` infrastructure，且锁定 verdict/score/reason 一致性；六条 grade 先按 alias 排序并计算 `gradeSetSha256` commitment。`checkpoint` 再生成闭字段 detached request，精确绑定 grade-set 紧凑字节、六条 alias/result/grade digest、当前 case/experiment/policy、fixture/environment 与 rubric，禁止 host disclosure、arm/trial/pair/order/plugin/treatment/lease、caller verified 和自报 timestamp；产物固定 `external-anchor-required`、`component-only`、`trustedSigners=0`、顺序/不可替换未验证。`unblind` 必须提交同一 request 的精确紧凑 JSON 和闭字段 packet/grade/host record/context，由绑定器内部重建 review，拒绝 caller review、跨 grade-set/experiment 嫁接和 pass/outcomeEligible/writeback 升级，再检查固定 trial 映射、唯一 single-use lease、fresh task、无 retry、顺序、plugin 和 binding。request 只是供仓外 stateful signer/transparency log 使用的确定 subject，本地可重算且没有 anchor receipt 时不证明揭盲前顺序、身份、可信时间、inclusion 或 non-equivocation。输出永远是 `external-json-unverified` 的 review-only preview，`passPower3`（pass^3）、timing、cost 不可用，且自动 experiment/feedback/receipt/outcome 写入全部为 false。
- 锚定协议第一版将后续证据拆成三段：`anchor receipt` 用 DSSE/in-toto 精确绑定 checkpoint 原始 UTF-8 字节、由 protocol/experiment/batch/purpose 派生的唯一 key 和 `absent→anchored 0→1`；`disclosure authorization` 必须同时接收六条 blind grade，逐 alias 核对 checkpoint 的 result/grade digest、fixture/environment/rubric 与 host 中 Agent/grader 投影，再构造只含排序 alias/host digest 的 commitment，并固定 `anchored→authorized 1→2`、audience/action、Ed25519 SPKI sender constraint；`consumption receipt` 绑定闭字段 redemption request，固定 `authorized→consumed 2→3`。host 预分配 anchor expected bindings 贯穿 authorization/consumption 高层报告，已观察 receipt 按签名 `proofSha256` 而非 transport JSON 去重。authorization/consumption 的稳定 CAS state key 不含 caller 可变 grant/nonce，可变输入只进入 binding digest。仓内模块只构造 Statement、解析并验证闭字段/签名数学/已观察 receipt 集，不生成或读取私钥、不保存状态、不释放 host disclosure、不写 ledger，也不接入只读治理 MCP。
- `signature-verified-unwitnessed` 只表示 caller 提供的 Ed25519 公钥通过数学验证；`keyid` 只是未签 hint，角色隔离比较真实 SPKI 指纹，consumer 签名公钥还必须匹配 grant thumbprint，`trustedSigners=0`。同一输入集中的双 anchor、双 grant、双 consume、状态回滚、跨批链接和角色公钥复用会 fail closed，但隐藏 fork、跨实例 at-most-once、first-write-wins、身份、可信时间、inclusion、consistency 与 host commitment 的预存在性仍需 checkout 外共享原子状态、固定 trust policy、真实 RFC 9942/等价 inclusion receipt 和独立 monitor/witness。仓内 JSON、进程内 Set、短 expiry、`maxUses=1`、自报 sequence/time 或 Sigstore bundle 外形均不能补足这些证据；三份签名数学通过最多称 `consumed-signature-bound-unwitnessed`，未验签只能称 `claimed-consumed-signature-unchecked`，writeback/signal/behavior coverage 不变。

## 版本与写入顺序

- outcome v1 只作 legacy history，不计行为分数；既有 v2 保留为可评分历史。
- 首个 v3 写入后，后续只能追加 v3；v1/v2 降级、删除、改写、插入或重排均失败。
- `chain.sequence` 等于 outcome 文件中从 1 开始的物理非空行序号，是同日与跨日尝试的唯一显式顺序。
- 每行 v3 必须精确等于 `JSON.stringify(outcome)`。这是项目内紧凑字节契约，不是 RFC 8785/JCS canonicalization。

### 确定性写入

- fixed runner 只重放当前版本 case，不写 `trial-receipts.jsonl` 或 `outcomes.jsonl`。`record-ai-evolution-deterministic-outcomes.mjs` 默认 preview；只有本地维护者复核候选后才可显式 `--write`。CI、GitHub Actions、hook、postinstall 与 validation plan 均不得生成该写入参数，也不得手工构造、复制或修改 JSONL 行。
- writer 不接受 caller 提供的 verdict、score、revision、validation、receipt hash、sequence、previousHash 或 predecessor；它从当前 corpus/descriptor、固定 runner 实际结果、source-state v2 和双 ledger 尾部派生全部字段。已有同 revision 的有效 pass 为幂等 no-op；ownership 在当前 index/HEAD 分发前置未成立时禁止直接入账，component/unknown case 始终拒绝。
- 真实写入先在 Git control dir 建立 `0700` 目录与 `0600` O_EXCL lock/journal，仅接受普通单链接 ledger，绑定 inode/mode/nlink/size/hash/mtime/ctime，按 receipt-first 经 temp、fsync、rename 和目录 fsync 追加。恢复只允许 base/exact-prefix/expected 状态，结尾额外字节、symlink/hardlink/同 inode、活锁、journal tamper 或 source/endpoint 漂移全部 fail closed，绝不 truncate。receipt 已开始时恢复会补齐 pair 并标记 stale；postcheck 失败显式报 `committed-but-postcheck-failed` 并保留 journal。
- 这些保证是合作式本地串行化、崩溃恢复与仓内 tamper evidence，不是跨文件原子事务，也不证明执行者身份、可信时间、完整发布、at-most-once 或 non-equivocation。

### 未验证轨迹写入

- `record-ai-evolution-unverified-trace-outcome.mjs` 从 stdin 只接受至多 64 KiB 的精确紧凑 JSON。根对象固定为 `schemaVersion`、`artifactType=ai-evolution-unverified-trace-observation`、`dataClass=redacted`、`caseId`、`method=model|human|hybrid`、`trace`；`trace` 只含 `adapter`、`capture`、`events`。敏感字段、额外字段、非连续事件和 caller 提供的 validation event 一律拒绝。
- writer 只接受当前带注册 trace policy 的 behavior case，并从当前 corpus/policy、source-state v2 和双 ledger 尾部派生 policy/case digest、revision、固定 validation、receipt/outcome ID、receipt v2、outcome v3、sequence/hash 与 direct supersession；调用者不得自报 verdict、score、proof、信任、时间或链字段。相同当前 observation 幂等，不同 observation 只可直接接续同 lineage 的未验信前序；已有 confirmed current outcome 时拒绝降级覆盖。
- 默认只 preview 且复核 live ledger 未变化；只有本地维护者显式 `--write` 才复用 deterministic writer 的 owner-only lock/journal、receipt-first 和精确前缀恢复事务。CI、GitHub Actions、hook、postinstall 与 validation plan 禁止该写入参数，也不得手工改 JSONL。
- 派生记录即使 policy 通过且字段为 `pass/100`，证据状态仍固定 `trace-bound-unverified`：只进入 `traceBoundOutcomes` / `unverifiedOutcomes`，不得进入 scored、fixed replay、trace verified 或 confirmed coverage。当前 authoring-window revision 不证明原始执行身份、环境、时间、完整捕获或外部 signer；writer 是项目资产，不属于插件 marketplace。

## 哈希链

所有哈希均为 SHA-256，并对 UTF-8 domain 与输入逐项使用 8-byte big-endian 长度前缀，避免连接歧义：

- legacy prefix domain：`jsonutils.ai-evolution.outcome-legacy-prefix/v1`。
- v3 line domain：`jsonutils.ai-evolution.outcome-line/v3`。
- 首个 v3 的 `chain.previousHash` 依次绑定它之前每条精确非空 outcome 行。
- 后续 v3 的 `chain.previousHash` 只绑定直接前一个精确 v3 行；递归链已覆盖全部历史。
- `headSha256` 使用 v3 line domain 哈希最后一条精确 v3 行。并发 PR 争用相同 sequence 时，后合入者必须基于最新尾部重算。

## 系谱与反馈处置

系谱键为 `(caseId, caseVersion, subjectVersion)`：

- `supersession.previousOutcomeId` 必须指向同 lineage 的直接前序；没有前序时为 `null`。
- 当前 verdict 为 fail/partial 时，`feedbackDisposition` 必须为 `open`。
- pass 直接修复前序 fail/partial 时必须为 `resolved`；其它 pass 必须为 `none`。
- `supersession.summary` 保存 1–500 字符的脱敏处置摘要。关闭反馈不会删除旧结果；旧尝试继续作为 superseded/stale/retired history 可追溯。

## 回执、重放与隐私

- receipt v1 保留 fixed-runner 兼容；v2 内嵌无签名单 trial observable trace；v3 在同一精确 JSON 行内再嵌 DSSE/in-toto proof，不新建第三个 ledger。每个 v2/v3 outcome 精确引用一个 receipt ID 和它的 JSON 行 SHA-256，receipt 不得复用或成为孤儿。
- receipt 与 outcome 必须精确匹配 case/corpus/subject、method、runner、revision、trial、verdict/score 和有序 validations。
- v1 deterministic receipt 只有在 caseVersion 与 subjectVersion 同当前 descriptor 一致时才按当前 runner 重放；历史版本保持追加式 stale/superseded history，不用新命令追溯改写，也不参与当前 behavior coverage。
- receipt v1 的 deterministic active outcome 只接受固定白名单 `deterministic-case`、单 trial、`gradeTarget=outcome`、当前 worktree manifest，并由 checker 即时重放。
- receipt v2/v3 必须单 trial、`gradeTarget=trace|both`。v2 结构合法只表示 trace-bound；v3 proof 必须精确绑定 receipt sans proof、trace、Codex stdout/binary digest 和固定执行事实。未知 signer 只是 valid-but-unverified，坏签名或任一绑定漂移直接 rejected；只有由待测 worktree 外的受保护 trust root 验签才可继续评分。
- model/human/hybrid 的 v1 pass 继续失败；fail/partial 保持 unverified 可见。不得保存原始 prompt、prompt hash、隐藏推理、密钥、环境变量、完整工具参数/结果/stdout 或回答正文。

## 可观测轨迹第一版

trace 根节点使用闭字段：`schemaVersion`、adapter ID/version、capture 状态、case digest、policy ID/version/digest、before/after revision 和 events。`afterRevision` 必须等于 receipt revision；case digest 使用 `hashEvolutionTraceValue(currentCase)`，仍是项目 `JSON.stringify` 字节契约而非 JCS。

- capture 记录 `complete|partial|unknown`、`all|sampled|unknown`、dropped events/attributes/links 和 flush 状态。`complete` 只是候选声明，不能自行产生信任。
- events 使用从 1 连续递增的 sequence，唯一 `session.start` / `session.finish`，并闭合 child actor、MCP、command 和 validation 生命周期。validation event 只引用 validation index/status；命令正文仍不进入 receipt。
- 允许的可观察事件包括 session、context read、skill decision、agent spawn/finish、MCP/command call-result、无正文 `capability.use`、file change、validation 与 response finish。MCP 只保存工具名、operation ID、参数键和有界结果结构键；command 只保存固定 `shell` 能力标记，不保存命令或 stdout。
- `evals/ai-governance/trace-policies.json` 为版本化固定 policy。policy digest 绑定只是必要条件；checker 还必须实际执行工具名、结果结构键、禁用能力和 revision 断言。仅有 policy 时报告 `policy-ready`，生产 trusted signer registry 仍为空。
- `codex-exec-jsonl@1.2.0` 只是纯 JSONL projector：生产模块不导入 `child_process`、不启动 `codex exec`、不读取 HOME/CODEX_HOME 或登录态。它对 `0.132.0` 与 `0.144.0-alpha.4` 的 terminal、EOF/drain、exit、item 配对、lag/drop/unknown 和隐私投影做 component 级 fail-closed 检查；外部报告的执行事实始终标记为 unverified。
- `codex-fixed-mcp-trial@1.3.0` 的仓库 CLI 只做 host-pinned binary digest 与 0700 空 HOME/CODEX_HOME 下的 keyless `--version` preflight，携带 Codex/OpenAI key 时在导入仓库模块前拒绝。profile 只有 `executable=false` component descriptor，不包含 `codex exec` 或同 UID stdio MCP 启动计划；离线 verifier 只接受至多 2 MiB 的闭字段 JSON artifact，不接受 callback，并以空认证根执行 validation。
- validation 与 artifact verification 在正常、异常路径都复核 receipt/outcome ledger 的终点 dev/ino/mode/size/mtime/ctime 与精确 SHA-256；这只能证明检查终点一致，不是 OS 级期间只读证明。artifact 的 adapter bundle、binary 和执行事实仍是 caller/external self-report；synthetic fixture、policy-verified component report、stdout digest、本地自签名或仓内 trust root 都不能建立身份信任，也不得自动写 receipt/outcome。
- `codex-external-controller-topology@1.0.0` 只校验至多 64 KiB 的精确紧凑闭字段 dry-run plan 与独立 host `expectedBindings`：controller、Codex、MCP、validation、sanitizer、signer 必须分离 trust domain、UID 与 PID/user/IPC namespace，禁 host/privileged/capability/共享可写面；Codex 不挂载 checkout，MCP/validation 使用 digest-pinned 只读 snapshot 和空认证根，facade 只开放固定 scorecard 工具/结果路径。通过后仍固定 `runtimeIsolationVerified=false`、`trustedSigners=0`、`outcomeEligible=false`，不能替代实际容器、mount、网络或 signer attestation。
- `codex-external-controller-runtime-probe@1.1.0` 只校验至多 128 KiB 的精确紧凑闭字段自报和独立 host `expectedBindings`：固定 controller 在 host，只观测 `codex-sentinel`、`mcp-sentinel`、`validation-sentinel` 三 workload 的 `credential-snapshot-subset`，禁止真实 Codex/模型/凭据/candidate/ledger/retry/外网与过度声明。`not-run` 和 `passed-subset` 都始终为 `component-only`，固定 `runtimeIsolationVerified=false`、`controllerIsolationVerified=false`、`userNamespaceVerified=false`、`signerVerified=false`、`trustedSigners=0`、`outcomeEligible=false`；项目插件的本机安装副本与 runtime report 均是未受保护自报，不是外部 attestation。
- `codex-external-controller-seatbelt-sentinel-execution@2.0.0` 只校验至多 128 KiB 的精确紧凑闭字段报告与独立 host `expectedBindings`：除 sealed snapshot revision/manifest/tree、controller/launcher/policy/nonce 外，还绑定 child、Node runtime、Seatbelt binary，以及 Codex binary、OpenAI Team ID/code identity、version/help 和执行前后工件摘要。Codex 的 keyless `--version`/`sandbox --help` 也经显式 Seatbelt profile 执行；真实 source snapshot 只读 manifest 并保持零变更，chmod/write 控制组只攻击 disposable mirror。source-state digest 只要求合法且前后一致，不冒充 snapshot tree digest；独立 verifier 还锁 boolean、nullable SHA-256 与有界 residual count，拒绝路径/对象/数组侧信道。profile parse、DAC 或普通非零退出不得冒充 policy deny；报告不含路径、PID、命令、stdout/stderr、canary 正文或真实凭据。通过最多得到同 UID `component-subset-observed`，immutable mount、PID/user namespace、controller/signer/model absence/current registry/topology/outcome 全部 false，`trustedSigners=0`。
- 项目资产 ai-infra-controller-probe 0.4.0 的旧 Docker probe 继续在镜像政策落地前 fail closed；macOS Seatbelt v2.1 producer 可产生真实 policy-subset report，但本机安装副本、controller、policy 与 verifier 仍未处于受保护控制面。普通 SHA-256、code identity 和 checkout 外路径只是绑定或来源约束，不是独立 controller 身份或 attestation；该 report 不写 receipt/outcome，也不改变 6 planned / 0 executed registration experiment。
- `codex-external-controller-attested-runtime-preflight@1.0.0` 校验至多 256 KiB 的精确紧凑 host record、controller signer/witness 两份 Ed25519 DSSE/in-toto Statement、七角色 trust/UID/GID/空 supplementary groups/namespace 隔离、只读 snapshot、空认证根、无共享可写面、状态 transition 与 caller expected bindings。report 必须绑定实际 policy digest；稳定 state key 以 policy/contract/snapshot/runtime 工件域分离派生且排除 caller nonce，challenge 再绑定 state key、run nonce 与 attempt。直接解析的 policy 即使双签数学正确，也固定 `signature-verified-unprotected-policy`、`trustedSigners=0`、runtime/registration preflight false。
- stdin-only Node CLI 的 checkout 外 root-owned、祖先无 group/other write、当前 verifier 不可写、稳定 stat 与 SHA-256 检查只输出 `policyPathProtectionCandidateObserved`。真实 `NODE_OPTIONS=--import=data:` 负例能在脚本正文前 monkeypatch `node:fs` 并伪造该 candidate；因此仓内 verifier 固定 `trustPolicyProtected=false`、`verifierRuntimeProtected=false`、`preRuntimeInjectionExcluded=false`、`registrationPreflightEligible=false`。真正的 policy path/digest、clean env、Node/verifier bundle、run nonce 与 expected bindings 必须由 checkout 外 root-owned/digest-pinned launcher 或 service 经非 caller channel 固定，后续另建 case。
- witness 只绑定 inclusion/consistency receipt digest，并未验证 receipt 语义、CAS 或 monitor，所以 inclusion、consistency、at-most-once 与 non-equivocation 继续为 false；当前 preflight 也不证明 task registry、模型 absence、真实 trial、behavior outcome 或 automatic writeback。它不是 RFC 9942 receipt 或 transparency log，component case 不写 outcome。
- 真实 run 必须由待测 checkout 外的受保护 controller 执行：key-bearing pinned Codex 与无 key MCP facade/validation 分属独立 UID/PID namespace 或容器，控制面使用 host-owned digest-pinned bridge 或单次代理凭据，并由外部 signer 绑定不可变 workload/snapshot。该拓扑未落地前不调用模型、不产生真实 candidate/outcome，`trustedSigners=0`、Agent 行为覆盖不增加。
- trace-bound outcome 进入 `traceBoundOutcomes`、`unverifiedOutcomes` 和 `verify-agent-trace` 焦点；fixed replay 与未来可信 agent trace 的 verified IDs 才合并为 confirmed coverage。

字段命名参考 OpenTelemetry core trace 概念；GenAI semantic conventions 仍处于 Development，本实现只称 repository-defined observable trace，不声称 OTel compliant。路径评分只用于安全、权限、工具选择和委派等显式行为要求，普通任务优先评分真实 end state。参考 [OpenTelemetry GenAI](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/README.md)、[OpenTelemetry Trace SDK](https://opentelemetry.io/docs/specs/otel/trace/sdk/)、[OpenAI Trace grading](https://developers.openai.com/api/docs/guides/trace-grading) 与 [Anthropic Agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)。

## 可信边界

Git 基线前缀加 v3 hash chain 只提供仓库内 tamper-evident（篡改可见）：

- Git 未跟踪账本时 `ledgerIntegrity` 仍为 `unknown`；本地链不能弥补缺失的可信基线。
- 本方案不证明写入者身份、可信时间、完整发布或 non-equivocation，也不是不可篡改存储。
- v3 的 Ed25519 DSSE 单签名只是可验 proof 原语，不自动获得可信时间、身份或非否认性。没有外部 identity policy、Sigstore bundle/Rekor inclusion 或等价受保护控制面时，不得称为 transparency log 或可信 attestation。SCITT 架构与 COSE receipt 已分别成为 RFC 9943/9942；项目 JSON/DSSE receipt 只称 SCITT-informed，不能冒充 RFC 9942 receipt。对标边界见 [DSSE](https://github.com/secure-systems-lab/dsse/blob/master/protocol.md)、[in-toto Statement v1](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md)、[Sigstore bundle](https://docs.sigstore.dev/about/bundle/)、[RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html)、[RFC 9942](https://www.rfc-editor.org/rfc/rfc9942.html) 与 [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html)。

### GitHub/Sigstore 分离式候选件

- `ai-governance-attestation-subject.json` 汇总六份治理 artifact 与两个 receipt/outcome ledger 的精确文件字节 SHA-256，并固定 `evidenceScope=component-only`；它只提供未来外部 checkpoint 的 subject，不替代 receipt、trace、outcome 或 grader。
- `.github/workflows/ai-governance.yml` 顶层零权限；capture 只有 contents read，signer 只有 contents read/OIDC/attestations write，且无 checkout、`run:`、模型凭据或可变 action tag。signer 只接收 raw single-file upload 的 digest，bundle 由 `actions/attest` 输出后原样上传。
- `evals/ai-governance/github-attestation-policy.json` 是仓内可审计副本，不是生产 trust root。同一 workflow 的 job 隔离只能缩小运行时权限，不能建立仓外 signer 身份；仓外固定 reusable workflow、受保护 main/environment、外部 policy、真实 bundle、workflow/source digest、GitHub-hosted runner 与 verified timestamp 未全部核验前，`trustedSigners=0`、`traceVerified=0`，不得追加可信 Agent outcome。
- workflow 还要求仓库变量 `AI_GOVERNANCE_ATTESTATION_ENABLED=true` 才签发；变量只是启用开关，不证明 environment 或 branch 已受保护。验证应使用固定 `gh attestation verify --repo --signer-repo --signer-workflow --signer-digest --source-ref --source-digest --deny-self-hosted-runners --bundle` 参数，并由待测 checkout 外提供期望值。参考 [actions/attest](https://github.com/actions/attest)、[GitHub attestation verify](https://cli.github.com/manual/gh_attestation_verify) 与 [reusable workflow OIDC](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-with-reusable-workflows)。

## 验证

```bash
node --test scripts/ci/aiGovernanceEvolutionFeedbackInbox.test.mjs scripts/ci/aiGovernanceEvolutionExperiments.test.mjs scripts/ci/prepare-ai-evolution-feedback.test.mjs
node --test scripts/ci/aiGovernanceEvolutionOutcomeChain.test.mjs scripts/ci/aiGovernanceEvolutionOutcomeEvidence.test.mjs scripts/ci/aiGovernanceEvolutionOutcomeLineage.test.mjs
node scripts/ci/check-ai-evolution-evals.mjs
node scripts/ci/check-ai-governance.mjs
```
