# AI 工具配置状态

本文记录当前项目面向 AI 编程助手的入口文件和维护方式。它不是一次性完成总结，而是帮助维护者判断“新增规则应该写到哪里、哪些文件必须同步、哪些检查必须运行”的索引。

## 当前入口

| 工具或场景 | 入口文件 | 维护方式 |
| --- | --- | --- |
| Codex / 通用 coding agent | `AGENTS.md` | 项目主入口，说明结构、技术栈、常见任务和 AI 协作边界 |
| Claude Code | `CLAUDE.md`、`.claude/skills/jsonutils-maintainer/SKILL.md`、`.claude/skills/jsonutils-ai-infra-evolver/SKILL.md`、`.claude/agents/ai-infra-auditor.md` | `CLAUDE.md` 与 `AGENTS.md` 保持同源；skill adapter 固定路由 canonical，Agent adapter 提供只读 AI 基建审计 |
| Claude 配置目录 | `.claude/README.md`、`.claude/ai-tools-guide.md`、`.claude/skills/`、`.claude/agents/` | README 说明目录边界，guide 说明跨工具使方式，skills 保存逐字节派生入口，agents 保存受契约的项目 Agent |
| Codex 项目资产 | `.codex/README.md`、`.codex/config.toml`、`.codex/hooks.json`、`.codex/hooks/session-start-governance.mjs`、`.codex/rules/default.rules`、`.codex/agents/*.toml`、`.agents/skills/jsonutils-maintainer/`、`.agents/skills/jsonutils-ai-infra-evolver/` | `.codex/` 保存原生 MCP 配置、三个通用 profile、AI 基建 auditor、hooks 和 command policy；`.agents/skills/` 是 Codex/Copilot 直接发现且全项目唯一可编辑的 skill 语义源 |
| Codex 原生治理 MCP | `.codex/config.toml`、`scripts/ci/aiGovernanceCodexProjectMcpConfig.mjs` | trusted project 的首选入口；无 shell Node bootstrap 支持从根/子目录启动，固定 `required=true`、超时和 11 工具 allowlist，不修改用户 plugin 启停 |
| Codex 项目插件 | `.agents/plugins/marketplace.json`、`.agents/plugins/plugin-lock.json`、`plugins/*`、`scripts/ci/manage-project-plugins.mjs` | 仓库交付 Codex 可读取的 repo marketplace、源码和 content lock，但仓库本身不是 plugin；当前 `AVAILABLE` 条目只建立插件目录可发现性，不会自动安装、启用或热加载。默认 `--check` 只诊断，维护者明确同意后才 `--apply` 并新建任务 |
| Git 分发门禁 | `scripts/ci/check-ai-asset-distribution.mjs`、`scripts/ci/aiGovernanceAssetDistributionReadiness.mjs` | 覆盖项目资产、AI 实现/测试、eval 数据和 CI/local-ci 控制面；`--workspace` 检查未 ignore 普通文件候选，`--index`/`--head` 直接核对原始字节、Git blob 类型和执行位。只读就绪度聚合在同一报告中分开 workspace candidate、next commit 与 HEAD clone 三层，前后重读 source/Git inventory 并对 drift/unavailable fail closed；不 stage/commit，不读取或修改用户安装状态，不建立 runtime trust |
| GitHub Copilot | `.github/copilot-instructions.md`、`.github/agents/ai-infra-auditor.agent.md` | instructions 是仓库级薄入口；custom agent 只开放 `read`/`search` 并路由 canonical evolver skill |
| 定时 AI 治理 | `.github/workflows/ai-governance.yml` | 每周运行治理脚本单测、MCP 测试和治理 artifact 产出，并保留手动触发 |
| Cursor | `.cursorrules`、`.cursor/rules/**/*.mdc` | 薄入口，转发到主规范和 Playbook |
| 跨工具 MCP 配置 | `.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json` | 其它工具的项目级 MCP server 能力边界，精确文件进入治理，并校验 JSON 结构、命令路径和敏感字段 |
| 本地治理 MCP | `scripts/mcp/jsonutils-governance-server.mjs`、`scripts/mcp/jsonutils-governance-session.mjs`、`scripts/mcp/jsonutils-governance-cancellation.mjs`、`scripts/mcp/jsonutils-governance-jsonrpc.mjs`、`scripts/mcp/jsonutils-governance-runtime-freshness.mjs`、`scripts/mcp/jsonutils-governance-tool-definitions.mjs`、`scripts/mcp/jsonutils-governance-tool-input.mjs`、`scripts/mcp/jsonutils-governance-tools.mjs`、`scripts/mcp/jsonutils-governance-tool-worker-contract.mjs`、`scripts/mcp/jsonutils-governance-tool-worker-client.mjs`、`scripts/mcp/jsonutils-governance-tool-worker.mjs`、`scripts/mcp/jsonutils-governance-tool-runtime.mjs`、`scripts/mcp/jsonutils-governance-report-tool.mjs`、`scripts/mcp/jsonutils-governance-scorecard-tool.mjs`、`scripts/mcp/jsonutils-governance-assets.mjs`、`scripts/mcp/jsonutils-governance-evaluations.mjs`、`scripts/mcp/jsonutils-governance-context.mjs`、`scripts/mcp/jsonutils-governance-decisions.mjs`、`scripts/mcp/jsonutils-governance-handoff.mjs`、`scripts/mcp/jsonutils-governance-validation-plan.mjs`、`scripts/mcp/jsonutils-governance-validation-rules.mjs`、`scripts/mcp/jsonutils-governance-worktree.mjs` | v0.6.0 严格解码 UTF-8，使用 newline-delimited JSON-RPC 和有序初始化状态；常驻 controller 对 import closure 做启动/请求前后指纹，工具每次在 768 KiB 闭字段 fresh worker 中载入当前 transitive ESM 实现，controller 漂移后固定要求 restart。ready 请求按 typed ID 异步执行，`notifications/cancelled` 可抢占 POSIX worker 进程组，取消后零原请求响应、会话可恢复，stdin 断开 abort-all。initialize 继续返回固定 510-byte instructions，工具仍为只读闭世界；wire/component 回归不证明客户端采纳、task registration、受保护 runtime、signer trust 或 Agent outcome |
| AI 行为评测 | `docs/AI-EVOLUTION-PLAYBOOK.md`、`evals/ai-governance/cases.json`、`evals/ai-governance/feedback-inbox.jsonl`、`evals/ai-governance/experiments.json`、`evals/ai-governance/outcomes.jsonl`、`evals/ai-governance/trial-receipts.jsonl`、`scripts/ci/check-ai-evolution-evals.mjs`、`scripts/ci/prepare-ai-registration-canary.mjs`、`scripts/ci/prepare-ai-registration-canary-snapshot.mjs`、`scripts/ci/review-ai-registration-canary-results.mjs`、`scripts/ci/run-ai-codex-fixed-mcp-trial.mjs`、`scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs`、`scripts/ci/record-ai-evolution-paired-outcome.mjs` | 用显式 behavior/component-boundary case、脱敏 signal、paired experiment、内容寻址 snapshot、盲分 review 和 outcome 补足行为证据；writer 均默认 preview。paired v4 已锁 pre-execution assignment、baseline/candidate treatment 和三角色 proof，但仓内验签仍只是 unwitnessed component evidence，当前零 behavior outcome/ledger mutation |
| 跨工具执行闭环 | `docs/AI-ENGINEERING-PLAYBOOK.md` | 子 Agent 委派、验证矩阵、规则进化和治理校验的权威文档 |
| 配置分层说明 | `docs/AI-CONFIG-INTEGRATION.md` | 说明入口、rules、skills、本机配置和显式豁免的关系 |
| AI 资产注册表 | `docs/AI-ASSET-REGISTRY.md` | 登记关键协作资产、治理门禁和显式豁免文件 |
| AI 治理决策账本 | `docs/AI-GOVERNANCE-DECISIONS.md` | 记录 rules、skills 和治理门禁变化的触发条件、反例、回写追踪和锁定测试 |

## 必读顺序

AI 助手开始修改代码前，应优先读取：

1. `AGENTS.md` 或 `CLAUDE.md`
2. `rules/code-style.md`
3. `docs/AI-ASSET-REGISTRY.md`
4. `docs/AI-ENGINEERING-PLAYBOOK.md`
5. 涉及 AI 协作基建时读取 `docs/AI-EVOLUTION-PLAYBOOK.md`
6. 通过治理 MCP `ai_decision_summary` 读取最近决策；只有回写规则或追溯反例时全量读取 `docs/AI-GOVERNANCE-DECISIONS.md`
7. 任务相关源码、测试和部署脚本
8. `CHANGELOG.md`

涉及 Codex 项目维护流程时，再读取 `.codex/README.md` 和 `.agents/skills/jsonutils-maintainer/SKILL.md`。涉及跨工具入口或 MCP 配置变更时，同时检查 `.claude/README.md`、`.claude/ai-tools-guide.md`、`.claude/skills/*/SKILL.md`、`.claude/agents/*.md`、`.github/copilot-instructions.md`、`.github/agents/**/*.agent.md`、`.cursorrules`、`.cursor/rules/**/*.mdc`、`.codex/agents/*.toml`、`.codex/config.toml`、`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`、`docs/AI-ASSET-REGISTRY.md` 和 `docs/AI-GOVERNANCE-DECISIONS.md`。

## 维护要求

新增或修改 AI 协作规则时，按以下顺序处理：

1. 判断规则是否来自重复踩坑、用户纠偏、验证缺口或可复用实践。
2. 先把信号转为代表 case，运行后才记录脱敏 outcome、provenance 和实际 validation result。
3. 工程规则写入 `rules/code-style.md` 或 `docs/AI-ENGINEERING-PLAYBOOK.md`，AI 基建演进同步到 `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`。
4. 入口文件只保留必要引用，不复制长规则。
5. 更新 `docs/AI-GOVERNANCE-DECISIONS.md`、`CHANGELOG.md` 和 `docs/AI-ASSET-REGISTRY.md`，并按阶段运行 `check-ai-asset-distribution.mjs --workspace|--index`；CI 再以 `--head` 锁定提交分发。不得用 workspace 就绪替代 index/HEAD，或为得到绿色报告自动 stage/commit。
6. 再补 `check-ai-governance` 引用规则或负向测试，让漂移可被发现。

本机私有配置不承载协作规则。`.claude/settings.local.json` 这类文件若存在，只能作为本机配置或显式豁免；需要共享的流程必须迁移到入口文档、Playbook、rules 或 skill。当前该路径仍在 Git index/HEAD，ignore 已准备但迁移未完成；维护者明确移出 index 并提交前保持 blocked。项目治理只核对 Git 路径元数据，不读取该本机私有文件正文。

Codex 中的 `jsonutils-governance` 首选 `.codex/config.toml` 这个项目原生入口，本仓库维护者不需先安装同名插件。配置使用无 shell Node bootstrap 向上定位仓库根，固定 `required=true`、超时与 11 工具 allowlist；clone/open 本身不执行，必须信任项目并新建任务。当前 upstream 源码表明同名 direct config 优先于 plugin server，但这仅是 component inference；在 fresh task 真实观察前不声称已注册。项目配置绝不写入、禁用或覆盖用户 plugin 状态。

项目专用插件以 `.agents/plugins/marketplace.json`、`.agents/plugins/plugin-lock.json` 和 `plugins/` 为受版本控制的完整 source of truth。`.agents/plugins/marketplace.json` 是 Codex 可读取的 repo marketplace catalog；当前策略为 `AVAILABLE`，因此刷新/重启后可在插件目录浏览，但不会自动安装、启用或加载。`.agents/plugins/plugin-lock.json` 精确绑定三个 `@jsonutils-project` selector 的 manifest 版本、完整文件集、Git mode、size、文件 SHA-256 和 tree digest。仓库不是单个 plugin，只有 `plugins/<name>/` 是独立包；`plugins/jsonutils-governance-mcp` 仅为兼容/可分发包。项目 rules、skills、原生 MCP 与 hooks 由各自的项目发现和信任机制加载，入口文件只提供地图。插件内 MCP 的 manifest 字段名为 `mcpServers`，但其引用的 `.mcp.json` 必须是官方 direct server map 或 `mcp_servers` 包装；本项目固定使用 direct map，拒绝 companion 顶层 `mcpServers`。

`node --test scripts/ci/aiGovernanceProjectPluginLock.test.mjs scripts/ci/aiGovernanceProjectPlugins.test.mjs` 校验项目源。`node scripts/ci/manage-project-plugins.mjs --check` 诊断 marketplace、安装/启用版本和项目 lock，但不发出 marketplace/plugin add/remove/enable/disable 或 lock 写入；外部 Codex CLI 仍可能创建自身 scratch/cache，因此不将诊断夸大为绝对零文件系统写入。只有维护者明确同意时才运行 `--apply`，由 Codex CLI 注册当前仓库并安装缺失或过期 selector，完成后新建任务。命令不会删除/禁用个人 selector，遇到同名异源、已启用同名个人 selector、用户已禁用必需插件或 CLI/JSON 异常时拒绝继续；不得从 SessionStart、postinstall 或 CI 隐式调用。

Codex [插件构建文档](https://learn.chatgpt.com/docs/build-plugins#how-the-chatgpt-desktop-app-uses-marketplaces) 将本地安装副本定义为 `~/.codex/plugins/cache/<marketplace>/<plugin>/local`；当前客户端历史状态还可能保留 manifest-version leaf，因此项目只兼容这两种单一布局。每个 plugin root 必须恰有一个允许 leaf 且零额外目录或文件，`CODEX_HOME` 以下逐级拒绝 symlink、非目录和 realpath 逃逸；项目 lock 必须先通过固定 selector allowlist，禁止把 selector 当路径遍历 cache。Codex 列出的 `jsonutils-project` installed/available 必须是三个 selector 的完整互斥闭集合，unknown、missing、duplicate、跨数组重复和 available 版本漂移均 fail closed；check 连续读取两次 CLI/cache 规范投影，mutation 前重证 action 仍适用，command 后立即复核 CLI installed/enabled/version、cache/content 与此前已安装路径，首个失败不得计入 succeeded 或继续后续插件。根据 [plugin add JSON 契约](https://learn.chatgpt.com/docs/developer-commands#codex-plugin)，返回的 `installedPath` 还必须 canonicalize 到唯一允许 leaf，立即通过 content lock，并与最终双重查保持同一路径；项目源码在初检、每次 mutation 前后和最终复查绑定稳定 snapshot。插件源码变化须先递增 manifest 版本，再显式 `--write-lock` 原子更新 lock；`node scripts/ci/check-project-plugin-installation.mjs` 仍只比较本机 cache 内容。用户目录与 Codex 插件缓存只承载安装/运行副本，不得反向成为项目权威来源；匹配状态固定为 `installed-copy-matched-unverified`，并显式保持 task registration、runtime、signer、attestation 和 outcome 全部未验证。安装后仍需新建任务，不能把 cache 匹配冒充当前任务已加载。

当项目 manifest 已升版而本机只保留唯一旧 semver leaf 时，结构检查允许其进入诊断，但 content lock 仍判定 mismatch，`--check` 只能返回 `needs-apply`；它不是 ready 或可信副本。多个 leaf、非版本目录、symlink、额外文件或边界逃逸继续直接拒绝，且不得为了修复诊断自动删除 cache 或执行 `--apply`。

若 `PATH` 中的 `codex` 缺失、过旧、损坏或与当前命令不兼容，可用 `CODEX_BIN="<codex-absolute-path>" node scripts/ci/manage-project-plugins.mjs --check` 显式选择本机二进制；`CODEX_BINARY` 仅作兼容别名，优先级为 `CODEX_BIN` > `CODEX_BINARY` > `codex`，项目源码不得硬编码某位维护者的应用路径。exit 127、ENOENT、ENOTDIR 或 EACCES 统一映射为不携带路径/错误正文的 `CODEX_COMMAND_BINARY_UNAVAILABLE`。命令固定使用参数数组与有界输出/超时；POSIX 为每次调用建立独立进程组，并在成功、失败、超时或输出超限的终止点强制回收整组，避免失败 doctor/apply 遗留仍可修改个人 cache 的后代；Windows 只承诺 parent best effort。这些约束只解决 CLI 定位和本机资源回收，不改变诊断/显式授权边界，也不提升安装副本的可信等级。

真实未验信 trace observation 使用项目入口 `scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs`，而不是写入 `.agents/plugins/marketplace.json`。stdin 必须是闭字段、精确紧凑、`redacted` JSON；默认只生成 preview。只有维护者明确复核后才可在本机显式 `--write`，CI/GitHub Actions 禁写；写入复用 receipt-first 可恢复双 ledger 事务，但派生的 receipt v2/outcome v3 永远保持 `trace-bound-unverified`，不提升 scored、confirmed 或 behavior coverage。

Feedback 旧行不因 skill 升版被改写，也不用版本数值范围放宽。未登记新事件必须精确绑定当前 case/subject；legacy event ID 只有在登记 event hash 和原 tuple 同时命中时可接受。`experiments.json` 的预登记 registration v1 只接受登记 ID、原 caseRef 与完整 experiment SHA-256，未登记 experiment 和 v2 才绑定当前 tuple；未知、超前、非数字或形状异常版本不得伪装历史。

项目通用执行角色固定 explorer、worker、verifier；AI 基建专项只读审计另允许 Codex、Claude 和 GitHub Copilot 的 `ai-infra-auditor` adapter。auditor 只允许读取/搜索项目治理资产，禁止写入、MCP、网络、用户配置、环境、prompt 与 transcript；父任务覆盖不放宽职责。静态 profile/adapter 只算 component evidence，不证明真实发现、选择、强隔离或零写入；零写入必须比较完整 `path/type/mode/content` workspace manifest。

Codex lifecycle 只允许 `.codex/hooks.json` 的单一 `SessionStart` event，source 限 `startup|resume|clear|compact`。项目和当前 hook 定义都需审阅信任；定义变化后重新审阅，不使用 bypass trust。runtime 只校验治理入口并返回固定 context，不读 prompt/transcript/环境/用户配置，不联网、不写入、不阻断。运行 `node --test scripts/ci/aiGovernanceCodexHooks.test.mjs`、runtime 直跑与 component case 只能证明组件；四种 source 尚未在受信任 fresh task 分别观察前 `codex-project-session-start-hook-observed` 保持 unknown。

Codex command policy 位于 `.codex/rules/default.rules`，是项目资产而不是 plugin package。当前策略只为 Git 状态变更、插件 `--apply/--write-lock`、治理 writer、validation `--run` 和不可拆分 shell wrapper增加 sandbox 外 `prompt`，不配置任何 `allow`。项目 `.codex/` layer 必须 trusted，规则只在启动时扫描；先运行 `node --test scripts/ci/aiGovernanceCodexCommandRules.test.mjs` 与 `node scripts/ci/run-ai-evolution-cases.mjs --case codex-project-command-rules-boundary --json` 锁定 component contract。Codex binary 可用后再以 `codex execpolicy check --pretty --rules .codex/rules/default.rules -- <command>` 验证真实引擎；此前不声明已加载、已拦截、热更新或不可绕过。

既有 Registration canary 是针对 compatibility plugin 的历史实验，原生 `.codex/config.toml` 已取代它成为当前主路径；case/ledger 迁移属于后续独立工作，本轮不改写历史记录。旧启动包仍由外部 host 调用 `scripts/ci/prepare-ai-registration-canary.mjs`，用同一 64 位 base-environment SHA-256、每次不同且不进入输出的 64 位随机 nonce，分别生成 `agent`、`grader`、`host` 投影。只把 `agent` 投影交给 fresh task；host 投影用于核对 baseline 项目插件 disabled、candidate enabled、交替顺序、single-use lease 与当前 worktree/ledger 端点。生成器成功或 component case 通过都不表示 MCP 已进入当前 task registry，experiment 与指标继续 blocked/unavailable。

外部 result 回收使用 `scripts/ci/review-ai-registration-canary-results.mjs --stage blind|seal|checkpoint|unblind`，四个阶段必须分开调用：先在不知道 host/lease/arm 的条件下摄取并评分，再计算六条 grade digest commitment；随后生成只绑定盲态 grade set、case/experiment/policy、fixture/environment/rubric 的 detached checkpoint request，交由仓外有状态 signer 或 transparency log 锚定；最后提交同一 request 的精确紧凑 JSON 与 host-only run record，由绑定器从闭字段原始输入重建 review。禁止传入 caller review，也不得跨 grade-set/experiment 嫁接或升级 outcome/writeback。仓库不生成或读取密钥，request 固定 `external-anchor-required`、`trustedSigners=0`，没有外部 receipt 时不证明先后、身份或不可替换；任一 retry、lease/task reuse、固定 trial 映射、顺序/plugin/ledger 漂移都使批次拒绝或基础设施无效。输出仍是未验信 component preview，不修改任何治理账本，不能把 timing/cost 缺失写成 0。

仓外控制面可复用 `aiGovernanceRegistrationCanaryAnchorReceipt.mjs`、`aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs` 与 `aiGovernanceRegistrationCanaryDisclosureConsumption.mjs` 构造待签 Statement，并在仓内执行闭字段/精确字节/签名数学/状态链验证。disclosure 链必须携带 checkpoint 对应的六条 blind grade，逐 alias 验证 result/grade digest、fixture/environment/rubric 与 Agent/grader 投影；host 预分配 anchor expected bindings 可贯穿高层报告，已观察 receipt 按签名 proof 去重。生产模块没有 signer、state store 或 host release API，也不暴露为项目 MCP 写工具。`keyid` 仅为 hint；验证器比较三角色 Ed25519 SPKI 指纹、sender thumbprint、稳定 state key 与可变 binding digest，并把 envelope hash 仅作为 transport digest。报告中的 `signature-verified-unwitnessed`、`authorized-signature-bound-not-consumed`、`consumed-signature-bound-unwitnessed` 都保持 `trustedSigners=0`，未验签消费降为 `claimed-consumed-signature-unchecked`；只有 checkout 外 first-write-wins 状态服务、独立角色 key、共享 CAS、固定 trust policy、真实 inclusion/consistency receipt 和 monitor/witness 才能逐级升级，Sigstore bundle 不得称为 RFC 9942 SCITT receipt。

## 必跑检查

修改 AI 入口、rules、skills、Playbook 或 `docs/AI-*.md` 后运行：

```bash
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-ai-evolution-evals.mjs
node scripts/ci/check-maintainability-budgets.mjs
node scripts/ci/write-ai-governance-artifacts.mjs --check --json
node --test scripts/mcp/*.test.mjs
node scripts/ci/check-ai-validation-whitespace.mjs
```

需要给 CI artifact、子 Agent 或审计脚本消费结构化结果时，再显式运行会写仓库的 `node scripts/ci/write-ai-governance-artifacts.mjs`；它会写出治理 JSON、预算 JSON、evolution eval JSON、带 `generatedAt` 的成熟度 scorecard、治理 context 快照和 Markdown summary。scorecard schema v2 的第六维 `distribution-readiness` 只消费稳定的 workspace/index/HEAD 只读聚合：缺报告为 `unknown`，结构非法、workspace 失败、drift 或 unavailable 为 `fail`，仅 index/HEAD 未就绪为 `warn`，三层稳定全通过才为 `pass`。读取已有 `artifacts/ai-governance/*` 前先运行 `node scripts/ci/write-ai-governance-artifacts.mjs --check --json`，确认产物没有落后于当前治理报告；单独调试治理报告时可运行 `node scripts/ci/check-ai-governance.mjs --json`。这个维度只评估 Git 项目分发阶段，不证明插件安装、当前 task registry 或 runtime/signer trust。

`node scripts/ci/run-ai-validation-execution.mjs --json` 默认只生成零执行 component preflight；只有维护者明确使用 `--run` 才启动固定只读命令。manual/unclassified/raw state/registry 任一 blocker 都保持 `launchAttemptCount=0`；该字段只计调用尝试，不证明子进程已创建。直接 exit 0 不证明后代进程静默、主机隔离、零 ledger 写入或 Agent behavior。

固定 Codex CLI 仍只做无密钥 preflight。项目插件本机安装副本的 Seatbelt v2.1 在执行前锁 OpenAI Developer ID code identity，两个 capability call 都受 Seatbelt 约束；真实 sealed snapshot 只读并前后复核，write/chmod 控制与 deny 只作用 disposable mirror，同时绑定 child/Node/launcher 与 postflight。通过仍只是同 UID component。

下一 component verifier 为 `check-ai-external-controller-preflight.mjs`：stdin 只接闭字段 Linux host record、caller expected bindings 与 signer/witness DSSE；checkout 外 root-owned、digest-pinned、当前 verifier 不可写且 ancestor 受保护的 policy path 也只标 candidate。真实 `NODE_OPTIONS --import` 负例证明仓内 Node 无法自证启动链，故 `trustedSigners=0`、runtime/registration blocked。下一 gate 需 checkout 外受保护 launcher/service 固定 clean env、Node/verifier bundle、policy 和 non-caller bindings；当前 macOS 无独立 UID/PID namespace，因此不运行模型 trial。

治理报告把这条外部前置放在 `blockedFocus`，固定标记 `blocked/external-provisioning` 并列出 Linux 管理平面、digest-pinned runtime、non-caller bindings、外部 signer/witness/state authority 和 zero-model adversarial preflight。顶层 `nextFocus` 继续选择不依赖该链的仓内 behavior case；不得通过继续增加 Seatbelt/attested component case 来伪造进展。

`.codex/config.toml` 是治理 MCP 的项目原生主入口；`plugins/jsonutils-governance-mcp@0.2.2` 只是可选的兼容/分发层，安装它不是本仓库维护者的前置。用户安装缓存不是 trust root，配置存在、插件安装成功或从缓存启动 server 都只算 component evidence。信任项目并新建任务后，仍要在实际 tool registry 中确认 `jsonutils-governance/ai_governance_scorecard`，再进入 `mcp-fixed-tool-selection`；未观察前不写 selection outcome。

项目插件 `plugins/codex-mcp-config-auditor@0.2.2` 只在用户本机显式运行时审计 `mcp_servers.*.http_headers` 的敏感静态 header 名称，并要求实际 `python3` 为 3.11+（使用标准库 `tomllib`）；合成门禁从受保护固定路径选择兼容解释器，不依赖 hermetic case runner 偶然解析到的 macOS Python 3.9。权威源码和测试是项目资产；运行 finding 仍是本机证据。它只返回有界 server、fieldPath、固定 riskCode 和 remediation，绝不返回配置值、hash、长度、preview、原始错误、环境值或绝对路径；静态 `$ENV` 仍需告警并迁移到 `env_http_headers`、`bearer_token_env_var` 或 OAuth。安装、缓存 MCP 冒烟和 finding 不产生 behavior outcome。

准备提交或发布前，还要按变更范围运行：

```bash
node scripts/ci/check-version-consistency.mjs
node scripts/ci/check-deploy-shell-syntax.mjs
node scripts/ci/check-chunk-load-recovery-catches.mjs
node scripts/ci/check-frontend-static-retention.mjs
```

前端上线后运行公网资源巡检：

```bash
node scripts/ci/check-production-frontend-assets.mjs https://jsonutils.markz.fun
```

如果用户反馈旧 chunk URL，给公网资源巡检追加 `--extra-asset <url-or-path>`。

## 防漂移清单

- `AGENTS.md` 和 `CLAUDE.md` 的 AI 协作章节必须保持一致。
- `.github/copilot-instructions.md`、`.codex/README.md`、`.claude/ai-tools-guide.md` 和 `.cursorrules` 的共享核心规则片段必须保持一致。
- `.github/copilot-instructions.md` 只能作为薄入口，关键规则仍以主规范、Playbook 和 skill 为准；新增 `.github/instructions/**/*.instructions.md` 路径级指令、`.github/prompts/**/*.prompt.md` prompt file、`.github/agents/**/*.agent.md` custom agent 或 `.github/chatmodes/**/*.chatmode.md` legacy chat mode 时也必须进入治理清单、引用规则或显式豁免。
- `.agents/skills/*/SKILL.md` 是项目 skill 唯一可编辑语义源码，必须保留 frontmatter `name`、`description`、`metadata.version`、`metadata.tags`、`agents/openai.yaml`、必读文件、工作流、常用验证命令和重点边界；`metadata` 遵循 Agent Skills 的 string→string map，`tags` 固定为带引号的非空逗号分隔字符串，禁止 YAML 数组；禁止在 `.codex/skills/` 放同名副本。`.claude/skills/*/SKILL.md` 只允许普通文件薄 adapter，逐字节派生 canonical name/description 和读取路径，不能独立维护或冒充真实行为。
- 项目 Agent 只能包含三个通用执行角色与三端 `ai-infra-auditor` adapter，并必须通过精确文件集合/字节、闭字段/工具、只读职责、隐私、完整 manifest 零写入前置和固定回传模板负例。
- `.codex/hooks.json` 只能注册单一 `SessionStart` event 的 `startup|resume|clear|compact` 四个 source，runtime 必须通过闭字段、摘要、普通文件、重复确定性、输入上限、隐私、路径和扩权负例；配置、trust 状态或脚本直跑不等于 behavior。
- `.github/workflows/ai-governance.yml` 必须保留 weekly schedule、workflow_dispatch、治理脚本单测、MCP 测试和 artifact 上传。
- `.claude/`、`.codex/`、`.cursor/rules/**/*.mdc`、MCP 配置（`.codex/config.toml`、`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`docs/AI-*.md` 和 `rules/ai-*.md` 新增协作资产必须进入 `docs/AI-ASSET-REGISTRY.md`、治理清单、引用规则或显式豁免。
- `.codex/config.toml` 必须保持 canonical 无 shell Node bootstrap、`required=true`、固定超时和 11 工具 allowlist；其它 MCP JSON 配置必须声明 `mcpServers` 或 `servers`，避免 shell 包装命令、绝对路径、上跳路径、缺失本地脚本和敏感字段明文；`jsonutils-governance` server 严格解码 UTF-8、使用 newline-delimited JSON-RPC，并要求 initialize → initialized notification 后才开放带只读 annotations 的固定资源与工具，initialize instructions 必须固定且不超过 512 bytes，包含脱敏 `ai_evaluation_summary`，以 `-32602` 拒绝非法工具参数、以 `-32002` 拒绝未就绪请求；server 返回 instructions 不等于客户端注入、模型读取或 Agent 遵循。
- 用户级 Codex TOML 不复用项目 JSON 的 `$ENV` 约定：`http_headers` 始终按静态值处理，只有 `env_http_headers`、`bearer_token_env_var` 或 OAuth 承担凭据引用；仓库治理 MCP 不读取该用户配置。
- `ai_evaluation_summary` 同时暴露全局 behavior coverage、feedback chain/Git baseline、paired experiment 计划和 verified outcome；`limit` 只裁剪 signal/experiment/outcome 样本。feedback producer 只按 own-property 闭合白名单输出 profile candidate；维护者纠偏必须绑已存在的 behavior case，只作零 experiment triage，不自动改任何 ledger；reader 拒绝 event/signal 任一重复，避免状态投影静默覆盖。
- rules、skills 或治理脚本变更必须能从 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md` 反查触发原因与锁定测试，且决策账本回写追踪必须包含账本自身。
- CHANGELOG 和版本文件必须通过 `check-version-consistency` 校验。

## 相关文档

- `docs/AI-CONFIG-INTEGRATION.md`: AI 配置分层和显式豁免说明。
- `docs/AI-ASSET-REGISTRY.md`: AI 协作资产账本和治理门禁登记。
- `docs/AI-GOVERNANCE-DECISIONS.md`: AI rules、skills 和治理门禁的决策账本。
- `docs/AI-ENGINEERING-PLAYBOOK.md`: AI 工程协作闭环。
- `docs/AI-EVOLUTION-PLAYBOOK.md`: AI 协作基建的 eval、outcome、feedback、provenance 与回写闭环。
- `rules/code-style.md`: 编码规范、提交规范和 CHANGELOG 要求。
- `.claude/ai-tools-guide.md`: 跨工具适配说明。
- `.codex/README.md`: Codex 项目资产说明。
