# AI 协作资产注册表

本文是 AI 协作资产的人工账本。`node scripts/ci/check-ai-governance.mjs` 会校验必需文件、自动发现资产和已存在的显式豁免文件是否都在本文登记，避免 rules、skills、工具入口或本机配置边界变成无人维护的隐性资产。

## 登记规则

- 每个协作资产在下方主表且只登记一次；路径用反引号，八列均非空，正文提及不算登记。
- `治理证据` 只使用 `scripts/ci/aiGovernanceAssetRegistryEvidence.mjs` 认可的 required/discovery/exempt/budget、引用或结构契约标记；文件引用须有 `referenceRules.file`，证据须能反查真实集合或脚本。
- 资产必须属于必需文件、自动发现或已存在的显式豁免；移出治理面时同步删除登记。
- 工程规则写入 `rules/code-style.md` 或工程 Playbook，AI 基建效果规则写入 evolution Playbook/skill；工具入口保持薄，历史只写决策账本与 CHANGELOG。
- 本机私有配置只作显式豁免，不承载共享 rules、skills 或验证流程。新增 AI 入口、`.agents/skills/`、`.claude/`、`.codex/`、Cursor/Comate、MCP 配置、GitHub instructions/prompts/agents/chatmodes、`docs/AI-*.md` 或 `rules/ai-*.md` 时先更新本文。

## 责任与状态约定

- 责任人只能是 `项目维护者`、`AI 助手协同` 或 `本机用户`；修改资产同步注册表、CHANGELOG 和治理测试。
- 状态只能是 `协作资产`、`权威流程`、`决策账本`、`工具薄入口`、`可迁移技能`、`治理门禁` 或 `显式豁免`。
- 节奏只能是 `变更时复核`、`发布前复核` 或 `季度复核`；豁免用本机用户+季度复核，治理门禁用项目维护者+发布前复核。
- 最近复核用不晚于当前日期的 `YYYY-MM-DD`，只作审计证据；显式豁免不等于允许配置漂移。

## 协作入口与权威规则

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `README.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目入口 | 区分仓库、项目 skill、plugin package、Git 分发视图和个人安装状态，并指向 AI 工具维护入口 | 必需文件、入口引用规则 |
| `CONTRIBUTING.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-13 | 贡献入口 | 约束 workspace/index/HEAD 原始证据分发、不发出 lifecycle mutation 的插件诊断、显式安装和新任务加载流程 | 必需文件、入口引用规则 |
| `AGENTS.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-15 | 项目入口 | Codex 和通用 coding agent 入口，AI 协作章节与 `CLAUDE.md` 保持同源，并直接指向资产注册表 | 必需文件、入口引用规则、同源章节漂移检查 |
| `CLAUDE.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-15 | 项目入口 | Claude Code / Ducc 入口，AI 协作章节与 `AGENTS.md` 保持同源，并直接指向资产注册表 | 必需文件、入口引用规则、同源章节漂移检查 |
| `rules/code-style.md` | 权威流程 | 项目维护者 | 变更时复核 | 2026-07-13 | 权威规则 | 编码规范、提交规范、CHANGELOG 和 AI 资产治理规则来源 | 必需文件、入口引用规则、版本一致性检查引用 |
| `docs/AI-ENGINEERING-PLAYBOOK.md` | 权威流程 | 项目维护者 | 变更时复核 | 2026-07-12 | 权威流程 | 子 Agent 委派、验证矩阵、规则进化和治理校验闭环 | 必需文件、入口引用规则、章节级引用检查 |
| `docs/AI-EVOLUTION-PLAYBOOK.md` | 权威流程 | 项目维护者 | 变更时复核 | 2026-07-15 | 行为评测流程 | 定义 eval、v3 chain、未验信 trace authoring、反馈、可信边界与回写 | 必需文件、自动发现规则、资产注册表结构化校验 |
| `docs/AI-GOVERNANCE-DECISIONS.md` | 决策账本 | 项目维护者 | 变更时复核 | 2026-07-13 | 决策账本 | 记录 AI rules、skills 和治理脚本变更的触发条件、反例、回写追踪和锁定测试，并要求回写追踪包含账本自身 | 必需文件、docs/AI 引用规则、资产发现规则 |
| `docs/AI-CONFIG-INTEGRATION.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | 分层说明 | 说明入口、rules、skills、本机配置和显式豁免关系 | 必需文件、docs/AI 引用规则、资产发现规则 |
| `docs/AI-TOOLS-SETUP.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 工具索引 | 说明各 AI 工具入口、同步边界和必跑检查 | 必需文件、docs/AI 引用规则、资产发现规则 |
| `docs/AI-ASSET-REGISTRY.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 资产账本 | 登记所有关键 AI 协作资产、治理脚本和显式豁免文件 | 必需文件、资产注册表结构化校验、资产发现规则 |
| `.github/PULL_REQUEST_TEMPLATE.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-09 | 人工门禁 | 要求 PR 说明 AI 资产注册表、决策账本、CHANGELOG、治理校验、可维护性预算、负向测试、显式豁免以及 Copilot 根入口、Cursor rules、MCP 配置、instructions / prompt / custom agent / chatmode 入口处理 | 必需文件、PR 模板引用规则 |
| `.github/workflows/ci.yml` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-13 | PR/push CI 控制面 | 使用完整 Git 历史运行 HEAD 分发与治理命令，required command 不得静态禁用、忽略失败或获得 attestation 特权 | 必需文件、资产注册表结构化校验 |
| `.github/workflows/ai-governance.yml` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-13 | 定时治理 | 使用完整 Git 历史运行 HEAD 分发和定时治理，拒绝 required command 的静态 false/continue-on-error，并隔离 component-only subject 与可选 signer | 必需文件、资产注册表结构化校验 |
| `scripts/ci/local-ci.sh` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-13 | 本地 CI 入口 | 与 GitHub CI 命令契约对齐，fail-fast 运行 workspace 分发、治理、预算和项目验证 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/local-ci-lib.sh` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 本地 CI helper | 只维护有界日志、工作目录切换与 Java/Maven fallback，不吞掉子命令失败 | 必需文件、资产注册表结构化校验、可维护性预算 |

## 工具入口与可迁移技能

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.claude/README.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-10 | 目录索引 | 说明 Claude 配置目录边界，必须指向 Playbook、资产注册表和治理命令 | 必需文件、Claude README 引用规则、自动发现规则 |
| `.claude/ai-tools-guide.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-12 | 工具说明 | 说明 Claude、Codex、Copilot、Cursor、Comate 如何复用同一套规范，并保持共享核心规则片段同源且可反查权威来源 | 必需文件、入口引用规则、同源片段漂移检查、自动发现规则 |
| `.codex/README.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-12 | 目录索引 | 说明 Codex 项目资产、SessionStart hook 信任边界和验证入口，并保持共享核心规则片段同源且可反查权威来源 | 必需文件、入口引用规则、同源片段漂移检查、自动发现规则 |
| `.codex/hooks.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Codex lifecycle 注册 | 只注册 `SessionStart` 的 startup/resume、固定 10 秒 timeout 与 POSIX/Windows 仓库根定位命令；项目和当前定义需显式信任 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `.codex/hooks/session-start-governance.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Codex hook runtime | 至多读取 64 KiB stdin 和三份普通入口文件 metadata，只返回固定有界 advisory；禁止敏感 lifecycle 正文、环境、用户配置、网络、子进程、写入与阻断 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `.codex/agents/explorer.toml` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Codex Agent profile | 固定只读调查职责，禁止编辑、本机配置读取与敏感值回显，只用固定模板向主线程回传有界证据 | 必需文件、自动发现规则、资产注册表结构化校验 |
| `.codex/agents/worker.toml` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Codex Agent profile | 仅在父任务提供读写范围、写入白名单、排除项、成功标准和验证命令后做有界实现，禁止 Git 发布与越界修改 | 必需文件、自动发现规则、资产注册表结构化校验 |
| `.codex/agents/verifier.toml` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Codex Agent profile | 可写 sandbox 只服务验证临时/忽略产物，失败只诊断且不得修改源码、规则、配置、账本或版本 | 必需文件、自动发现规则、资产注册表结构化校验 |
| `.agents/skills/jsonutils-maintainer/SKILL.md` | 可迁移技能 | 项目维护者 | 变更时复核 | 2026-07-14 | 可迁移技能 | v0.1.34 以官方项目目录和 metadata 保存版本化核心章节与可达命令，并补充标准请求校验、认证凭据持久化、版本化密码编码和区域无关归一边界 | Codex skill 契约检查、skill 引用规则、自动发现规则 |
| `.agents/skills/jsonutils-maintainer/agents/openai.yaml` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | skill UI 元数据 | 固定项目维护 skill 的显示名、短描述和显式 `$jsonutils-maintainer` 默认提示 | 必需文件、自动发现规则、Codex skill 契约检查 |
| `.agents/skills/jsonutils-maintainer/evals/evals.json` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-14 | skill 评测语料 | 保留重构、Scheme/CMD、后台认证与用户输入边界正例和只读解释近似负例，锁定常规维护 skill 的触发、标准能力复用与收尾边界 | 必需文件、自动发现规则、资产注册表结构化校验 |
| `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md` | 可迁移技能 | 项目维护者 | 变更时复核 | 2026-07-13 | AI 基建演进技能 | v0.1.29 以官方项目目录和 metadata 路由 skill 唯一源码、Git 分发、仓库/plugin 边界与 preview-first outcome 写账边界 | Codex skill 契约检查、skill 引用规则、自动发现规则 |
| `.agents/skills/jsonutils-ai-infra-evolver/agents/openai.yaml` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | skill UI 元数据 | 固定 AI 基建演进 skill 的显示名、短描述和显式 `$jsonutils-ai-infra-evolver` 默认提示 | 必需文件、自动发现规则、Codex skill 契约检查 |
| `.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | skill 评测语料 | 锁定正/近负例、隔离 A/B、v3、preview-first unverified trace writer、registration、Seatbelt v2、attested preflight/pre-runtime 注入与 hook behavior 边界 | 必需文件、自动发现规则、资产注册表结构化校验 |
| `evals/ai-governance/README.md` | 权威流程 | 项目维护者 | 变更时复核 | 2026-07-15 | outcome 字段规范 | 按任务读取 v3 hash、lineage、receipt、版本化 runner、unverified trace authoring、registration checkpoint/anchor/disclosure review、DSSE proof 与可信边界 | 必需文件、资产注册表结构化校验 |
| `evals/ai-governance/cases.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 版本化 eval corpus | corpus 1.29.0：18 behavior + 16 component-boundary；outcome-chain v2 锁定 preview-first writer 与可恢复双账本事务，ownership v5 仍要求完整 Git 分发证据 | 必需文件、资产注册表结构化校验 |
| `evals/ai-governance/feedback-inbox.jsonl` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 脱敏反馈队列 | v1 只追加 opened/open 事件，物理序列/hash 与 Git 前缀只称篡改可见，不生成 outcome | 必需文件、资产注册表结构化校验 |
| `evals/ai-governance/experiments.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 版本化实验 manifest | 维护互斥 split、paired 3 repetitions、盲分 grader、blocked execution 与 unavailable metrics | 必需文件、资产注册表结构化校验 |
| `evals/ai-governance/outcomes.jsonl` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 追加式 outcome 账本 | v1 legacy/v2 兼容；v3 锁 sequence/hash/supersession，deterministic 与未验信 trace 记录只能由对应 preview-first writer 派生 | 必需文件、资产注册表结构化校验 |
| `evals/ai-governance/trial-receipts.jsonl` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 追加式 trial receipt | v1 replay/v2 trace/v3 proof；两个项目 writer 复用同一本地 receipt-first 可恢复事务，无 signer 仍 unverified | 必需文件、资产注册表结构化校验 |
| `evals/ai-governance/trace-policies.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | 固定 trace policy | 分别绑定 registration discovery 与 fixed selection 的 case/adapter、目标 MCP、结果键、禁用能力和 revision | 必需文件、资产注册表结构化校验 |
| `evals/ai-governance/github-attestation-policy.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | attestation 审计副本 | 固定 candidate 身份与仓外生产要求；自身不受信 | 必需文件、资产注册表结构化校验 |
| `scripts/ci/aiGovernanceEvolutionFeedbackInbox.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | feedback 事件契约 | 校验闭字段、脱敏、case/experiment 绑定、物理 sequence/hash 与不可评分声明 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionFeedbackInbox.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | feedback 负例 | 锁篡改、正文扩展、过度声明、非法关闭与重复 signal | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionExperiments.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | experiment 契约 | 校验互斥 split、paired repetitions、共享绑定、blinding、trial plan 与指标可用性 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionExperiments.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | experiment 负例 | 锁 split 泄漏、单 trial、假零指标与 grader 泄漏 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionLearningReport.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | learning 聚合 | 组合 feedback/experiment，将 registration 外部前置保留为 blockedFocus，同时单独输出不依赖该前置的 actionable nextFocus | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionSuiteReport.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | eval suite 聚合 | 保留 blockedFocus，同时排除其依赖并选择仓内 actionable nextFocus；失败仍优先 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionSuiteReport.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | suite 负例 | 锁 open signal focus、缺 learning 资产 fail closed 与 outcome 分层 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceHermeticGitInventory.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Hermetic Git inventory | 只传 PATH 与固定安全环境，排除 ambient Git/XDG 配置并禁用 replace refs，以 fatal UTF-8、NUL record 和规范相对路径读取 inventory | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceAssetDistribution.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Git 分发契约 | workspace 要求当前普通文件候选存在且未 ignore，index/HEAD 直接将原始字节、blob OID、type 和 mode 绑定到当前版本，失败固定脱敏 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceAssetDistributionGitEvidence.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Git 原始证据 | 校验 stage 0、普通 blob、`100644`/`100755`、当前原始字节的 blob OID、执行位与 ancestor/final symlink 边界 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceAssetDistributionFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | AI 分发资产全集 | 单源合并 required、reference、discovery、AI 实现 namespace、完整 eval data 和 CI/local-ci 控制面 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceAssetDistribution.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | Git 分发负例 | 锁定 workspace 普通候选、formatted index/HEAD evidence、当前版本漂移与 Git 失败 fail closed，不读取个人安装状态 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceAssetDistributionFiles.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | 分发全集负例 | 锁定 namespace、预算子集、近负例、控制面及 AI implementation/eval 非普通文件拒绝 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceAssetDistributionRedteam.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | Git 分发红队 | 锁定 assume-unchanged、symlink、`core.filemode=false`、clean filter 和 replace refs 不能绕过 index/HEAD 证据 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCiContract.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | CI 契约负例 | 拒绝 required command 所在 job/step 的静态 false 和 `continue-on-error: true`，保留正常命令可达 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceProjectCliArgs.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | 项目 AI CLI 参数负例 | 锁定项目 CLI 的 help=0、未知/冲突参数=2，且 help 不读取安装或 ledger 状态 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/check-ai-asset-distribution.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Git 分发 CLI | 从完整 machine universe 输出 workspace/index/HEAD 结构化报告，`--help`=0、未知/冲突参数=2、分发失败=1 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionSnapshotPrimitives.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Snapshot primitives | 用 `jsonutils-evolution-source-state-v2` 域分离 path/type/mode/原始字节 hash，并统一稳定 descriptor 与 stat/realpath 复核 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionSealedWorktreeManifest.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Sealed worktree manifest | strict manifest 2.0 全量重枚举无 Git snapshot，复核 exact set/mode/摘要/deleted，从实际字节重建 source-state v2 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionWorktreeRevision.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Worktree revision resolver | live Git 使用 hermetic inventory 计算排除 outcome/receipt 且不混入 HEAD 的 source-state v2；sealed manifest 保留 HEAD 审计元数据 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanarySnapshotSource.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary snapshot source reader | 稳定读取 tracked/untracked 普通文件，扫描全尺寸私钥 marker、敏感路径与 env 示例，保留精确 executable bits | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Canary snapshot producer | 生成 strict 2.0 repository-source-unreviewed snapshot，HEAD 进 manifest seal 而 source-state v2 排除双 ledger；保留 owner-only/atomic/retention 边界 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/mcpLineDelimitedStdioClient.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Bounded MCP stdio client | newline reader 固定 stdout buffer/queue 上限、response id 与超时，child-derived JSON/EOF/stream 错误均用无正文固定消息 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflight.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary snapshot preflight | 私有 HOME/CODEX_HOME/TMP 末态必须为空并保留；有界 stdio 复核双轨输出，stderr 只返 count/nonEmpty；进程组与临时根 cleanup 均未验证 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | Canary snapshot 负例 | 锁 source-state v2 向量、strict 2.0、core producer→项目 plugin verifier 互操作、mode/篡改/symlink/ambient Git/容量/retention 负例 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/mcpLineDelimitedStdioClient.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-12 | Bounded stdio 负例 | 锁无换行超限、消息队列超限、非法 JSON、EOF、stream、timeout 与 response-id 固定脱敏错误 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflight.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-12 | Canary snapshot MCP 集成 | 复核 live/snapshot packet 等价、CLI 只返 projection digests，并调用真实 stdio scorecard；执行 absence 与外部信任不冒充已验证 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRequiredRegistrationSnapshotFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary snapshot 必需资产 | 独立登记 hermetic inventory、source、manifest、producer、bounded stdio、preflight、CLI、测试与预算 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryPacket.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary launch packet 契约 | 生成 Agent/grader/host 三个闭字段盲分视图，固定 trial→pair/arm/order 并绑定 snapshot、ledger、lease 与不可评分声明 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryPacket.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary packet 负例 | 锁 grader 泄漏、arm 污染、stale alias、未知 trial、隐私、过度声明与零自动写入 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryResult.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary blind result 契约 | 摄取闭字段外部 result，复用 observable trace/policy，隔离 host/arm 并区分 behavior fail 与 infrastructure-invalid | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryReview.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary 揭盲 review | 先计算六条 blind grade commitment，再用 host-only record 校验固定 trial、lease/task/order/plugin/bindings 并输出未验信 preview | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryResult.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary result 负例 | 锁 case/盲态侧信道、grade 语义、adapter/infra、固定 trial、lease/retry/复用、顺序/plugin/ledger 漂移、跨批嫁接与 caller review 越权 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpoint.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary checkpoint request | 生成并复核 grade-set/case/experiment/policy/fixture/environment/rubric detached subject；从原始输入重建 review、拒绝 caller review，固定要求仓外 anchor | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpoint.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary checkpoint 负例 | 锁 partial/混批/reseal/侧信道/过度声明、当前上下文绑定、精确紧凑 JSON 与零写账 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryDsseEnvelope.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary DSSE envelope | 校验精确紧凑 envelope、canonical base64、单 Ed25519 签名和 PAE；公钥只作数学验证 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary anchor receipt verifier | 绑定 checkpoint 精确字节、派生 batch key、外部 controller policy 与 absent→anchored；输出保持 unwitnessed | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary disclosure authorization | 逐 alias 绑 blind grade/checkpoint ref 与 Agent/grader/host 投影，重建脱敏 commitment，绑定 grant、audience/action、sender constraint 与 anchored→authorized | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryDisclosureConsumption.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary disclosure consumption | 校验闭字段 redemption、authorized→consumed、三角色 key 隔离与已观察双授权/双消费；不冒充共享 CAS | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-12 | Canary anchor 测试夹具 | 只在测试构造六条 packet/grade/host record 和临时 Ed25519 receipt 链，生产模块不 keygen | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-12 | Canary anchor 负例 | 锁精确字节、签名、派生 key、状态、闭字段、本地可观察分叉、信任降级与零写入 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-12 | Canary disclosure 负例 | 锁 host commitment、状态链、角色 key、跨批、双授权/双消费、redemption 与零写入 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryDisclosureRedteam.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-12 | Canary disclosure 红队负例 | 锁六条投影嫁接、proof 变体顺序、同 key 改名、sender mismatch、稳定 CAS key、host 深绑定、凭据侧信道与未验签状态 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryCaseDescriptors.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary case descriptors | 集中组合 snapshot、packet、result、checkpoint 与 anchor/disclosure component-only case | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRegistrationCanaryAnchorCaseDescriptors.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary anchor descriptors | 映射 anchor receipt 与 disclosure authorization 两个 component case 的版本、证据和固定测试 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRequiredRegistrationCanaryFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary 必需资产子表 | 组合 snapshot 子表并登记 packet、result、checkpoint、anchor、disclosure、测试、descriptor 与预算，避免满额 learning 清单膨胀 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/review-ai-registration-canary-results.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-12 | Canary result review 入口 | stdin-only 执行 blind、seal、checkpoint、unblind；不启动模型、不读用户配置/密钥、不写 experiment 或 evidence ledger | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/maintainability-budget-governance-ai-registration-result-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary result 预算 | 独立维护 blind result、review、checkpoint、descriptor 与 CLI 的行数预算，避免挤占满额 learning 聚合表 | 可维护性预算、资产注册表结构化校验 |
| `scripts/ci/maintainability-budget-governance-ai-registration-result-test-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary result 测试预算 | 独立维护摄取、盲评、checkpoint、揭盲和零写入测试预算 | 可维护性预算、资产注册表结构化校验 |
| `scripts/ci/maintainability-budget-governance-ai-registration-anchor-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary anchor 预算 | 独立维护 DSSE、anchor、authorization、consumption、required 子表与 descriptor 预算 | 必需文件、可维护性预算、资产注册表结构化校验 |
| `scripts/ci/maintainability-budget-governance-ai-registration-anchor-test-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary anchor 测试预算 | 独立维护测试夹具、anchor receipt 与 disclosure 状态链负例预算 | 必需文件、可维护性预算、资产注册表结构化校验 |
| `scripts/ci/maintainability-budget-governance-ai-registration-snapshot-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary snapshot 预算 | 独立维护 source、manifest、producer、bounded stdio、preflight、CLI、required 子表并组合 anchor 预算 | 必需文件、可维护性预算、资产注册表结构化校验 |
| `scripts/ci/maintainability-budget-governance-ai-registration-snapshot-test-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Canary snapshot 测试预算 | 独立维护 snapshot 篡改/隐私负例与真实 MCP preflight 集成预算 | 必需文件、可维护性预算、资产注册表结构化校验 |
| `scripts/ci/prepare-ai-evolution-feedback.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-11 | feedback candidate 入口 | 只输出固定 mcp-server-unregistered 脱敏 candidate，不写任何 ledger/rule | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/prepare-ai-registration-canary.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-12 | Canary packet 入口 | 稳定读取当前仓库并只向 stdout 输出单个 Agent、grader 或 host 投影；不读取用户配置、不启动模型、不写 ledger | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/prepare-ai-registration-canary-snapshot.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-12 | Canary snapshot 入口 | 在 checkout 外封存并复核 live/snapshot 三视图等价，运行真实 scorecard 后只公开三类 domain-separated projection digest；不领 lease，模型/写账均未请求但 absence 未验证 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/prepare-ai-evolution-feedback.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | producer 负例 | 锁未知参数、固定 profile、不可评分声明与零自动写入 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRequiredEvolutionLearningFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | learning 必需清单 | 组合 feedback、experiment、suite 与独立 registration canary 必需资产子表 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionOutcomeChain.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 行为评测支撑 | 校验 v3 sequence/hash/supersession、反馈与降级；仅称仓库内篡改可见 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Deterministic outcome writer | 默认 preview，只从固定 runner、source-state v2 和双 ledger 尾部派生成对记录；拒绝 ownership/component/unknown 直接入账 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 双账本可恢复事务 | 在 Git control dir 用 owner-only lock/journal 合作式串行化，receipt-first 追加并严格前缀恢复；不宣称跨文件原子性 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | Writer 负例与接线测试 | 锁定 preview 零写入、字段派生、幂等、漂移、CI 禁写、CLI 错误与真实 control-dir 接线 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | 双账本恢复负例 | 锁定 lock 接管、single-link endpoint、durable journal、崩溃前缀、tamper 与 postcheck 失败语义 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/record-ai-evolution-deterministic-outcomes.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-13 | Deterministic outcome CLI | `--help` 不读账，默认只 preview；只有本地人工显式 `--write`，CI/GitHub Actions 禁写 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Unverified trace writer | 从闭字段 redacted observation 与当前 corpus/policy/source/ledger 派生 receipt v2/outcome v3；默认 preview 且不提升 confirmed coverage | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | Unverified writer 负例 | 锁定闭字段/隐私、policy、preview 零写入、幂等/接续、confirmed 降级拒绝、CI 禁写与可恢复事务接线 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-13 | Unverified trace CLI | `--help` 不读 stdin，默认 preview；只有本地人工显式 `--write`，CI/GitHub Actions 禁写，输出不回显事件正文 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionTrace.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | observable trace 契约 | 校验闭字段事件、序列/actor/operation/validation 绑定、隐私与 completeness；自报 complete 不等于可信 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionTraceOutcomes.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | trace outcome 验证 | 绑定当前 case digest、固定 policy 与外部 trusted signer proof；v2 始终 unverified，生产信任根默认为空 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionTracePolicies.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | trace policy grader | 执行工具、结果键、禁用能力与 revision 断言 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionTracePolicies.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | policy 负例 | 锁定额外能力、错误工具、缺结果键和 revision 漂移 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExecTraceAdapter.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Codex JSONL projector | v1.2.0 只投影外部输入，不 spawn 或读认证路径 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExecCaptureRuntime.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Codex preflight runtime | 只做 binary 摘要与显式空认证根 version 探测 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExecTraceProjection.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Codex JSONL 投影 | lifecycle、脱敏与完整性状态机 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrialProfile.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 固定 trial descriptor | runner 1.3.0：0700 隔离、binary 绑定、`executable=false`，无 exec/MCP 启动计划 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrialPreflight.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 固定 trial preflight | 空 HOME/CODEX_HOME 下探测 version 并复核 binary | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrialCapture.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 未验信 artifact parser | 闭字段、正文拒绝与 component descriptor 绑定 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrialLedger.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 双 ledger 终点守卫 | 绑定 dev/ino/mode/size/time/SHA；不冒充期间只读 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrial.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 离线 artifact verifier | 拒绝 callback；空认证根 validation 后只返回 component-only/unverified 报告 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrial.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 固定 verifier 负例 | 锁不可执行 descriptor、binary、空认证根与 ledger 终点 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrialCapture.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | artifact parser 负例 | 锁闭字段、绑定与版本/reason 正文注入 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrialLedger.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | ledger 守卫负例 | 锁 ancestor symlink 与终点漂移 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexFixedMcpTrialCli.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | preflight CLI helper | 固定 root，只接受 preflight/binary/digest/model | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerTopology.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 外部 controller 拓扑契约 | v1.0.0 只校验闭字段 dry-run plan、host binding、六方隔离、MCP facade 与 sanitizer/signer；不证明 runtime | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerTopology.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 拓扑契约负例 | 锁紧凑 JSON、host binding、UID/namespace、凭据、mount/runtime capability、MCP 扩权和 signer 自证 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerRuntimeProbe.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 外部 controller runtime probe verifier | v1.0.0 只验证三个 fake workload 的 credential/snapshot 子集自报、独立 host binding 与固定负声明；不建立 runtime 信任 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerRuntimeProbe.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | runtime probe 负例 | 锁闭字段、绑定、namespace/capability、snapshot/canary、cleanup、脱敏和过度声明 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Seatbelt sentinel verifier | v2 绑定 OpenAI Codex code identity、child/Node/launcher 与 postflight；source snapshot 零变更，disposable mirror 承接 write/chmod 控制组 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerSeatbeltReportShape.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Seatbelt report 值类型契约 | 独立锁 observation/claim boolean、nullable SHA-256、source 零 mutation 与有界 residual count，拒绝路径/对象/数组侧信道 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerSeatbeltSentinel.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Seatbelt sentinel 负例 | 锁闭字段 v2、code identity、source 零变更、mirror、host binding、cleanup 与过度声明 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerRuntimePolicy.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | External runtime policy path checker | 解析双角色 Ed25519 policy；checkout 外 root-owned、当前 verifier 不可写且路径链受保护也只建立 path candidate，不在仓内 Node 建立 trust root | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerAttestedPreflight.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Attested runtime preflight verifier | 复核闭字段 host record、双角色 DSSE、七角色 UID/GID/namespace、派生 state/challenge/isolation/witness；仓内 Node 永不升级可信 claim | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerAttestedCaseDescriptors.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Attested runtime component descriptor | 将 external attested preflight 固定映射为 component-only case，禁止自动写 behavior outcome | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExternalControllerAttestedPreflight.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-12 | Attested runtime 负例 | 锁 caller trust root、policy digest、七角色 UID/GID/namespace、派生 state/challenge、签名/状态嫁接、NODE_OPTIONS 注入、overclaim 与 CLI 脱敏 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/check-ai-external-controller-preflight.mjs` | 协作资产 | 项目维护者 | 发布前复核 | 2026-07-12 | External runtime component CLI | bounded stdin 只消费闭字段 evidence；root-owned path 仅为 candidate，仓内 Node 的 trust/registration/成功 exit 固定 blocked，错误脱敏 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRequiredCodexRuntimeTrustFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Codex runtime trust 必需清单 | 独立组合 Seatbelt v2、attested preflight、policy path candidate、descriptor、component CLI 与测试 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRequiredCodexRuntimeFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Codex runtime 必需清单 | 组合 topology、legacy probe 与 runtime trust 子清单，避免挤占 evolution 聚合入口 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionCodexCaseDescriptors.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Codex case descriptors | 聚合 adapter、fixed trial、external topology/runtime/Seatbelt sentinel 与独立 registration descriptor | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexAgentProfiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Agent profile 契约 | 固定三个 profile 的精确文件集、canonical TOML、sandbox、职责、隐私、昵称和回传模板，拒绝 symlink 与扩权字段 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexAgentProfiles.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Agent profile 负例 | 锁缺失/多余/symlink、名称漂移、错误 sandbox、字段扩权、写入白名单与回传模板缺口 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexAgentCaseDescriptors.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Agent component descriptor | 把项目 profile 契约固定映射为 component-only case，禁止自动生成 behavior outcome | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/maintainability-budget-governance-ai-agent-profile-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | Agent profile 预算 | 独立维护 profile helper、descriptor 与测试行数预算，避免挤占已满的 evolution 聚合文件 | 可维护性预算、资产注册表结构化校验 |
| `scripts/ci/aiGovernanceCodexHooks.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Codex hook 契约 | 锁定 canonical 单事件配置、普通文件、已审计 runtime 摘要、必需片段和禁止能力面 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexHooks.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Codex hook 负例 | 锁子目录/Unicode 路径、输入超限、非法事件、隐私回显、缺失/symlink 入口、配置扩权和 runtime 漂移 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexHookCaseDescriptors.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Hook component descriptor | 将 SessionStart 契约固定映射为 component-only case，禁止自动生成 behavior outcome | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionCorpusSize.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Eval corpus 容量负例 | 允许代表 case 有界增长到 34，并拒绝第 35 个，避免无审计扩容 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/maintainability-budget-governance-ai-hook-contract-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-12 | Hook 契约预算 | 独立维护配置、runtime、契约、descriptor 与测试预算，避免挤占既有满额表 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/run-ai-codex-fixed-mcp-trial.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | preflight CLI 入口 | 动态 import 前拒绝 Codex/OpenAI key；无 run/candidate writer | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/run-ai-codex-fixed-mcp-trial.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | preflight CLI 负例 | 锁 run/root/重复参数、import 前 key guard 与无自动入账 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionTraceProof.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | receipt v3 proof | DSSE 绑定与外部 trust | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceEvolutionTraceProof.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | proof 负例 | 负例契约 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/writeAiGovernanceAttestationSubject.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | attestation subject | 摘要 artifact/ledger 字节并保持 component-only | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceRequiredEvolutionFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | evolution 必需资产清单 | 组合 evolution 资产与生产可达 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceCodexExecTraceAdapter.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | adapter 组件负例 | 锁定版本、完整性、配对、lag、隐私与 component-only 边界 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceValidationChangedSet.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Validation changed set | 只读汇总 HEAD、index、worktree 与 untracked 原始证据，拒绝索引标志、模式或路径异常 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceValidationChangedSet.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Validation changed set 负例 | 锁定原始字节、模式、索引标志、symlink、gitlink、路径与 ambient Git 边界 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceValidationWhitespace.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 三视图空白检查 | 复用 Git 空白语义检查 staged、worktree 与 untracked 原始字节，只返回脱敏计数 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/aiGovernanceValidationWhitespace.test.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 三视图空白检查负例 | 锁定三视图、二进制、CRLF、filter 隔离、状态漂移和 CLI 闭字段输出 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/check-ai-validation-whitespace.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-13 | 本地空白检查入口 | 由 validation plan 与 local-ci 显式调用，不在 MCP 内执行命令，也不以 clean checkout 结果冒充提交范围证据 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `.mcp.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 项目级 MCP 配置 | 暴露 `jsonutils-governance` 本地 MCP server，配置只使用 `node` 直连仓库内脚本，不携带明文凭据或 shell 包装命令 | 必需文件、自动发现规则、资产注册表结构化校验 |
| `scripts/mcp/jsonutils-governance-server.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 服务 | 按 newline-delimited JSON-RPC 和版本协商只读暴露 AI 治理资源，固定工具包含 evaluation summary，并保留只读 annotations、output schema 和结构化输出；非法请求返回标准错误并继续服务，不开放任意 shell | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-jsonrpc.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 单源维护 JSON-RPC 2.0 请求/方法参数校验、notification 识别和 -32700/-32600/-32602/-32603 脱敏错误载荷，避免错误输入杀死 stdio 进程 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-tool-definitions.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护固定治理报告、预算报告、scorecard、上下文、asset inventory、evaluation summary、decision summary、handoff brief、artifact freshness、worktree snapshot 和 validation plan 工具名称、顺序和 input schema | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-tool-input.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 对固定工具逐次校验声明的 input schema，拒绝未知工具、额外字段、错误类型和越界整数，并映射为 -32602 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-tools.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护固定治理报告、预算报告、scorecard、上下文、asset inventory、evaluation summary、decision summary、handoff brief、artifact freshness、worktree snapshot 和 validation plan 工具分发与固定脚本调用，server 只调用该 helper | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-report-tool.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 组合固定治理报告和预算报告，把 `ai_governance_report` 的成熟度 scorecard 与 `ai_governance_scorecard` 保持同源，不开放任意 shell | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-scorecard-tool.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 复用治理 context 构造固定 `ai_governance_scorecard` 载荷，保证 scorecard schema 与 context 同源，不开放任意 shell | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-assets.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 复用资产注册表 Markdown 表解析器，bounded 输出 AI 协作资产清单、状态/类型/责任人计数和治理证据，不开放任意路径读取 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-evaluations.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 本地 MCP 支撑 | bounded 输出覆盖、nextFocus/blockedFocus、paired experiment 与 outcome，limit 不改全局事实 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-evaluation-outcomes.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 本地 MCP 支撑 | 脱敏投影 verified v2/v3、fixed-replay/agent-trace 方法与 v3 链字段，不返回事件正文 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-decisions.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 复用决策账本 Markdown 表解析器，bounded 输出最近治理决策、回写文件和锁定命令，供 MCP agent 快速理解规则演进脉络 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-handoff.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 本地 MCP 支撑 | 独立组合治理上下文、基于完整事实集的 AI 基建状态、worktree 和风险；top 只裁剪展示，真实 stdio 与 scorecard 聚合保持一致 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-validation-plan.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 本地 MCP 支撑 | 基于逐文件完整 changed set 组装命令、人工复核、覆盖范围和未分类摘要；样本或折叠目录不得宣称 all | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-validation-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 本地 MCP 支撑 | 单源维护项目 AI 入口、.agents/plugins、治理、eval、MCP、CI、发布与部署分类；catch-all 不改变领域分类 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-worktree.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 本地 MCP 支撑 | 固定执行 `git status --porcelain=v1 --branch --untracked-files=all`，返回逐文件完整事实与 bounded 样本，不开放任意 git 参数 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-resources.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护治理 MCP 的只读资源 URI、文件映射和读取边界，server 只调用该 helper，不开放任意路径读取 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-context.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 本地 MCP 支撑 | 组合固定治理/预算报告与项目摘要；预算报告保留未截断 scorecardCandidates，全局结论不受 top 展示参数影响 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-context-builder.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护治理 context schema 装配，项目摘要和报告摘要由专用 helper 提供 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-project-summary.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立读取项目 package、CHANGELOG 顶部版本和决策账本最新记录，供治理 context 复用 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-report-summary.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-11 | 本地 MCP 支撑 | 展示层裁剪 highUsage 样本，但成熟度 scorecard 使用预算报告的完整候选事实集，供 context/report/handoff 同源复用 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `.github/copilot-instructions.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 工具薄入口 | GitHub Copilot 仓库级 instructions，转发到主规范、Playbook 和 skill，并保持共享核心规则片段同源且可反查权威来源 | 必需文件、工具入口引用规则、同源片段漂移检查、自动发现规则 |
| `.cursorrules` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 工具薄入口 | Cursor 入口，与 `.comate/rules/code-style.md` 保持共享核心片段同源且可反查权威来源 | 必需文件、工具入口引用规则、同源片段漂移检查 |
| `.comate/rules/code-style.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 工具薄入口 | Comate 入口，与 `.cursorrules` 保持共享核心片段同源且可反查权威来源 | 必需文件、工具入口引用规则、同源片段漂移检查 |

## 项目插件与 Marketplace

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.agents/plugins/marketplace.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目 plugin marketplace | 固定 `jsonutils-project` 与三个项目插件的仓内相对 source；个人 marketplace 不是权威源 | 必需文件、自动发现规则、可维护性预算 |
| `.agents/plugins/plugin-lock.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-15 | 项目 plugin content lock | 绑定 `0.5.1/0.2.1/0.2.1` 三个完整 selector 的 manifest、文件集、Git mode/size/SHA-256/tree digest；不冒充 attestation | 必需文件、自动发现规则、可维护性预算 |
| `plugins/ai-infra-controller-probe/.codex-plugin/plugin.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-15 | 项目 plugin manifest | v0.5.1 保持 source-state v2/strict snapshot 2.0 互操作与 component-only controller probe 边界，并将用户界面文案改为中文 | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/SKILL.md` | 可迁移技能 | 项目维护者 | 变更时复核 | 2026-07-15 | 项目 plugin skill | 区分 source-state revision/HEAD 审计元数据、项目所有权、本机副本和受保护 runtime，禁止模型/凭据；自然语言文档改为中文 | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/agents/openai.yaml` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-15 | skill UI metadata | 与 probe skill 的 component-only 安全边界保持一致，并使用中文显示与默认提示 | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/evals/evals.json` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | plugin skill eval | 锁定触发正例、Docker 近负例和项目所有权不等于 runtime trust | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/references/report-contract.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-15 | probe report contract | 精确记录 plugin 0.5.1 / Seatbelt 2.2 / snapshot 2.0 及 project-plugin-installed-copy-unverified 证据边界，自然语言说明改为中文 | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/controller-probe.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Docker probe producer | v1.1.0 保持零密钥、零模型、零写账和 runtime-execution-disabled | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/controller-probe.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | Docker probe 负例 | 锁定 preflight、绑定、隐私与过度声明拒绝 | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/run-controller-probe.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Docker probe CLI | 只返回有界脱敏摘要 | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/run-seatbelt-sentinel.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Seatbelt CLI | 只返回有界脱敏摘要 | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel-child.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Seatbelt child | 只执行固定合成负例与 Codex capability | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | Seatbelt producer | v2.2.0 重建 source-state v2/snapshot 2.0，继续锁 Codex identity、source 零变更、disposable controls/postflight；本机副本仍 unverified | 必需文件、可维护性预算 |
| `plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | Seatbelt 负例 | 锁 snapshot 2.0/source-state v2、code identity、source 零变更、deny 分类、postflight 与隐私 | 必需文件、可维护性预算 |
| `plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-15 | 项目 MCP plugin manifest | v0.2.1 固定 JSONUtils 项目身份与只读治理能力，用户界面文案改为中文 | 必需文件、可维护性预算 |
| `plugins/jsonutils-governance-mcp/.mcp.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目 MCP 注册 | 只从当前项目根调用固定仓内 launcher，禁止用户绝对路径 | 必需文件、可维护性预算 |
| `plugins/jsonutils-governance-mcp/README.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-15 | plugin 边界说明 | 以中文记录项目所有权、只读边界与新任务注册要求 | 必需文件、可维护性预算 |
| `plugins/jsonutils-governance-mcp/scripts/server.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目 MCP launcher | 验证当前 JSONUtils 项目根后只导入固定 server | 必需文件、可维护性预算 |
| `plugins/codex-mcp-config-auditor/.codex-plugin/plugin.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-15 | 项目安全 plugin manifest | v0.2.1 固定 JSONUtils 项目身份与 value-free 配置审计能力，用户界面文案改为中文 | 必需文件、可维护性预算 |
| `plugins/codex-mcp-config-auditor/.mcp.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目 MCP 注册 | 只从当前项目根调用固定仓内 auditor server | 必需文件、可维护性预算 |
| `plugins/codex-mcp-config-auditor/README.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-15 | plugin 边界说明 | 以中文区分项目所有源与用户本机显式运行，禁止返回配置值 | 必需文件、可维护性预算 |
| `plugins/codex-mcp-config-auditor/scripts/server.py` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | value-free MCP server | 只读固定 Codex 配置路径并返回有界非敏感 finding | 必需文件、可维护性预算 |
| `plugins/codex-mcp-config-auditor/scripts/test_server.py` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | value-free 负例 | 锁定值、hash、长度、preview、原始错误和环境值不外泄 | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceRequiredProjectPluginFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目 plugin 必需清单 | 精确登记 marketplace、content lock、三个插件权威文件与校验入口 | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceProjectPlugins.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目 plugin 契约 | 锁定项目 marketplace、manifest、仓内 MCP 启动、个人路径负例与 content lock 一致性 | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceProjectPlugins.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | 项目 plugin 负例 | 锁 personal marketplace、越界 source、Local developer、绝对路径与缺失资产 | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceProjectPluginLock.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目 plugin 内容身份 | 稳定枚举完整普通文件树、构造 SHA-256 tree lock，并独立比较本机安装副本 | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceProjectPluginLock.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-15 | 项目 plugin lock 负例 | 锁定同版本内容漂移、增删文件、digest 篡改与陈旧安装副本拒绝，cache 路径从 lock 派生当前版本 | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceRequiredProjectPluginLifecycleFiles.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | plugin lifecycle 必需清单 | 独立登记 doctor/apply/write-lock helper、测试与项目根 CLI，避免主清单继续膨胀 | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceProjectPluginLifecycle.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | plugin lifecycle helper | 解析 Codex JSON 状态、区分目录/安装/启用/版本并以显式 argv reconcile；冲突和未知状态 fail closed | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceProjectPluginLifecycle.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-15 | plugin lifecycle 负例 | 用 fake CLI 与临时 HOME 锁空环境、异源/personal/禁用、特殊路径、非法 JSON、幂等与版本化 lock writer，版本路径与递增用例均从 manifest 派生 | 必需文件、可维护性预算 |
| `scripts/ci/manage-project-plugins.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 团队 plugin lifecycle CLI | 默认/`--check` 诊断且不发出 lifecycle mutation；`--apply` 明确修改本机 Codex 状态，`--write-lock` 只更新项目 lock；help=0、未知/冲突参数=2，正常模式输出有界 JSON | 必需文件、可维护性预算 |
| `scripts/ci/aiGovernanceCodexMcpConfigAuditor.test.mjs` | 协作资产 | AI 助手协同 | 变更时复核 | 2026-07-13 | 配置审计 component 桥 | 只通过固定 Python 合成协议/隐私负例验证审计器，不读取真实用户配置 | 必需文件、可维护性预算 |
| `scripts/ci/check-project-plugin-installation.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-13 | 安装副本核验 | 比较本机 jsonutils-project cache 与项目 lock，help=0 且不读 cache、未知参数=2；匹配仅证明 installed-copy-matched-unverified，不证明当前任务注册 | 必需文件、可维护性预算 |
| `scripts/ci/maintainability-budget-governance-ai-project-plugin-rules.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-13 | 项目 plugin 预算 | 显式锁定所有 plugin 源码、测试、manifest、契约与已知大文件热点 | 必需文件、可维护性预算 |

## 本机配置与显式豁免

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.claude/.gitignore` | 显式豁免 | 本机用户 | 季度复核 | 2026-07-09 | 显式豁免 | 只维护本机配置目录的忽略规则，不承载协作规范 | 显式豁免列表、资产注册表结构化校验 |
| `.claude/settings.local.json` | 显式豁免 | 本机用户 | 季度复核 | 2026-07-09 | 显式豁免 | 本机私有配置，不承载项目级 rules、skills 或验证流程 | 显式豁免列表、资产注册表结构化校验 |

## 治理门禁

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scripts/ci/check-ai-governance.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | AI 治理入口 | 聚合文件存在、引用规则、同源入口与薄入口权威源、MCP 配置契约、AI 修复安全证据与跳过检测、项目事实与版本事实、skill 契约、skill 引用契约、CI 契约和资产注册表检查，并支持人读与 JSON 摘要失败分组 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/check-ai-evolution-evals.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-11 | 行为评测入口 | 校验 corpus、receipt v1/v2/v3、trace/proof 三层状态、Git 前缀、v3 chain、降级与 fixed replay；缺外部受信 signer 不计覆盖 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/run-ai-evolution-cases.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-10 | 行为评测执行入口 | 仅按固定 case ID、Node 参数白名单与 case/subject 版本绑定执行证据；固定 changed-file fixture 只算 component-only，不自动写 outcome/receipt 或开放任意 shell | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/write-ai-governance-artifacts.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-10 | CI 产物 | 在 CI 和 local-ci 中固定写出静态治理、行为 eval、可维护性预算 JSON、带生成时间的 context/scorecard 快照和 Markdown summary，并提供 `--check` 拦截旧产物漂移 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/check-version-consistency.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 发布门禁 | 校验前端版本、锁文件、CHANGELOG 顶部版本区块、条目数量和发布说明结构 | 必需文件、运行时引用规则、可维护性预算 |
| `scripts/ci/check-maintainability-budgets.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-11 | 可维护性门禁 | 校验模块行数预算，并输出未截断 scorecardCandidates 与可截断 highUsage 展示，防止 top 参数污染全局治理事实 | 必需文件、运行时引用规则、可维护性预算 |
| `scripts/ci/check-deploy-shell-syntax.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 部署门禁 | 校验部署 shell、workflow run 和 REMOTE_SCRIPT heredoc 语法 | 必需文件、发布引用规则、可维护性预算 |
| `scripts/ci/check-chunk-load-recovery-catches.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 运行时门禁 | 校验手动懒加载 catch 和 `dispatchChunkLoadRecoveryEvent` 恢复能力 | 必需文件、运行时引用规则、可维护性预算 |
| `scripts/ci/check-frontend-static-retention.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 静态资源门禁 | 校验前端发布保留近期旧 hash 资产 | 必需文件、发布引用规则、可维护性预算 |
| `scripts/ci/check-production-frontend-assets.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 公网巡检 | 校验 JS/CSS `Content-Type`、CSS `url(...)`、CSS `@import` 和 fallback 成 HTML 风险 | 必需文件、发布引用规则、可维护性预算 |

## 更新流程

1. 新增 AI 入口、rules、skills、项目级 MCP 配置、`docs/AI-*.md` 或 `rules/ai-*.md` 时，先判断它是协作资产、本机私有配置还是临时实验。
2. 协作资产写入上方对应表格，更新最近复核日期，并纳入必需文件、引用规则或自动发现规则。
3. 本机私有配置写入显式豁免表格，并说明为什么不能承载共享规则。
4. 补负向测试，证明漏登记、漏引用或错误豁免会被 `check-ai-governance` 拦住。
5. 运行 `node scripts/ci/check-ai-governance.mjs`、`node scripts/ci/check-maintainability-budgets.mjs` 和 `node scripts/ci/check-ai-validation-whitespace.mjs`。
