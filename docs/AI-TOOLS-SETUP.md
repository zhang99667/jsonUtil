# AI 工具配置状态

本文记录当前项目面向 AI 编程助手的入口文件和维护方式。它不是一次性完成总结，而是帮助维护者判断“新增规则应该写到哪里、哪些文件必须同步、哪些检查必须运行”的索引。

## 当前入口

| 工具或场景 | 入口文件 | 维护方式 |
| --- | --- | --- |
| Codex / 通用 coding agent | `AGENTS.md` | 项目主入口，说明结构、技术栈、常见任务和 AI 协作边界 |
| Claude Code / Ducc | `CLAUDE.md` | 与 `AGENTS.md` 保持同源 AI 协作章节，避免工具间语义漂移 |
| Claude 配置目录 | `.claude/README.md`、`.claude/ai-tools-guide.md` | README 说明目录边界，guide 说明跨工具使用方式 |
| Codex 项目资产 | `.codex/README.md`、`.codex/hooks.json`、`.codex/hooks/session-start-governance.mjs`、`.codex/agents/*.toml`、`.agents/skills/jsonutils-maintainer/`、`.agents/skills/jsonutils-ai-infra-evolver/` | `.codex/` 保存 profiles/hooks；`.agents/skills/` 是直接发现的唯一项目 skill 源，SKILL、eval 与 `agents/openai.yaml` 锁定流程、触发基线和 UI 元数据 |
| Codex 项目插件 | `.agents/plugins/marketplace.json`、`.agents/plugins/plugin-lock.json`、`plugins/*`、`scripts/ci/manage-project-plugins.mjs` | 仓库交付项目内插件目录清单/索引、源码和 content lock，但仓库本身不是 plugin，clone/open 也不会自动安装；默认 `--check` 是不执行 lifecycle mutation 的诊断，维护者明确同意后才 `--apply` 本机注册/安装并新建任务 |
| Git 分发门禁 | `scripts/ci/check-ai-asset-distribution.mjs` | 覆盖项目资产、AI 实现/测试、eval 数据和 CI/local-ci 控制面；`--workspace` 检查未 ignore 普通文件候选，`--index`/`--head` 直接核对原始字节、Git blob 类型和执行位，只有 PR/定时 CI 的 HEAD 证明所测提交可被 clone；不读取或修改用户安装状态 |
| GitHub Copilot | `.github/copilot-instructions.md` | 仓库级 Copilot instructions 薄入口，转发到主规范和 Playbook |
| 定时 AI 治理 | `.github/workflows/ai-governance.yml` | 每周运行治理脚本单测、MCP 测试和治理 artifact 产出，并保留手动触发 |
| Cursor | `.cursorrules`、`.cursor/rules/**/*.mdc` | 薄入口，转发到主规范和 Playbook |
| MCP 配置 | `.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json` | 项目级 MCP server 能力边界，精确文件进入治理，并校验 JSON 结构、命令路径和敏感字段 |
| 本地治理 MCP | `scripts/mcp/jsonutils-governance-server.mjs`、`scripts/mcp/jsonutils-governance-jsonrpc.mjs`、`scripts/mcp/jsonutils-governance-tool-definitions.mjs`、`scripts/mcp/jsonutils-governance-tools.mjs`、`scripts/mcp/jsonutils-governance-report-tool.mjs`、`scripts/mcp/jsonutils-governance-scorecard-tool.mjs`、`scripts/mcp/jsonutils-governance-assets.mjs`、`scripts/mcp/jsonutils-governance-evaluations.mjs`、`scripts/mcp/jsonutils-governance-context.mjs`、`scripts/mcp/jsonutils-governance-decisions.mjs`、`scripts/mcp/jsonutils-governance-handoff.mjs`、`scripts/mcp/jsonutils-governance-validation-plan.mjs`、`scripts/mcp/jsonutils-governance-validation-rules.mjs`、`scripts/mcp/jsonutils-governance-worktree.mjs` | 使用 newline-delimited JSON-RPC 和版本协商，以只读 annotations、output schema 和结构化输出暴露固定治理工具；validation plan 只返回单源命令建议，执行交给显式 CLI/local-ci/CI；client 限 stdout buffer/queue、校验 response id，child-derived 错误固定脱敏，不开放任意 shell或通用文件读取 |
| AI 行为评测 | `docs/AI-EVOLUTION-PLAYBOOK.md`、`evals/ai-governance/cases.json`、`evals/ai-governance/feedback-inbox.jsonl`、`evals/ai-governance/experiments.json`、`evals/ai-governance/outcomes.jsonl`、`evals/ai-governance/trial-receipts.jsonl`、`scripts/ci/check-ai-evolution-evals.mjs`、`scripts/ci/prepare-ai-registration-canary.mjs`、`scripts/ci/prepare-ai-registration-canary-snapshot.mjs`、`scripts/ci/review-ai-registration-canary-results.mjs`、`scripts/ci/run-ai-codex-fixed-mcp-trial.mjs`、`scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs` | 用显式 behavior/component-boundary case、脱敏 signal、paired experiment、内容寻址 snapshot、盲分 review 和 outcome 补足行为证据；未验信 trace 入口只接受闭字段 redacted observation，默认 preview，结果不进入 confirmed coverage |
| Comate | `.comate/rules/code-style.md` | 薄入口，和 Cursor 保持共享核心片段 |
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

涉及 Codex 项目维护流程时，再读取 `.codex/README.md` 和 `.agents/skills/jsonutils-maintainer/SKILL.md`。涉及跨工具入口或 MCP 配置变更时，同时检查 `.claude/README.md`、`.claude/ai-tools-guide.md`、`.github/copilot-instructions.md`、`.cursorrules`、`.cursor/rules/**/*.mdc`、`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`、`.comate/rules/code-style.md`、`docs/AI-ASSET-REGISTRY.md` 和 `docs/AI-GOVERNANCE-DECISIONS.md`。

## 维护要求

新增或修改 AI 协作规则时，按以下顺序处理：

1. 判断规则是否来自重复踩坑、用户纠偏、验证缺口或可复用实践。
2. 先把信号转为代表 case，运行后才记录脱敏 outcome、provenance 和实际 validation result。
3. 工程规则写入 `rules/code-style.md` 或 `docs/AI-ENGINEERING-PLAYBOOK.md`，AI 基建演进同步到 `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`。
4. 入口文件只保留必要引用，不复制长规则。
5. 更新 `docs/AI-GOVERNANCE-DECISIONS.md`、`CHANGELOG.md` 和 `docs/AI-ASSET-REGISTRY.md`，并按阶段运行 `check-ai-asset-distribution.mjs --workspace|--index`；CI 再以 `--head` 锁定提交分发。
6. 再补 `check-ai-governance` 引用规则或负向测试，让漂移可被发现。

本机私有配置不承载协作规则。`.claude/settings.local.json` 这类文件若存在，只能作为本机配置或显式豁免；需要共享的流程必须迁移到入口文档、Playbook、rules 或 skill。

项目专用插件以 `.agents/plugins/marketplace.json`、`.agents/plugins/plugin-lock.json` 和 `plugins/` 为受版本控制的完整 source of truth。`.agents/plugins/marketplace.json` 只是项目内插件目录清单/索引文件；`.agents/plugins/plugin-lock.json` 精确绑定三个 `@jsonutils-project` selector 的 manifest 版本、完整文件集、Git mode、size、文件 SHA-256 和 tree digest。仓库不是单个 plugin，只有 `plugins/<name>/` 是独立包；直接 rules、skills、MCP 和 hooks 仍由项目入口加载。

`node --test scripts/ci/aiGovernanceProjectPluginLock.test.mjs scripts/ci/aiGovernanceProjectPlugins.test.mjs` 校验项目源。`node scripts/ci/manage-project-plugins.mjs --check` 诊断 marketplace、安装/启用版本和项目 lock，但不发出 marketplace/plugin add/remove/enable/disable 或 lock 写入；外部 Codex CLI 仍可能创建自身 scratch/cache，因此不将诊断夸大为绝对零文件系统写入。只有维护者明确同意时才运行 `--apply`，由 Codex CLI 注册当前仓库并安装缺失或过期 selector，完成后新建任务。命令不会删除/禁用个人 selector，遇到同名异源、已启用同名个人 selector、用户已禁用必需插件或 CLI/JSON 异常时拒绝继续；不得从 SessionStart、postinstall 或 CI 隐式调用。插件源码变化须先递增 manifest 版本，再显式 `--write-lock` 原子更新 lock；`node scripts/ci/check-project-plugin-installation.mjs` 仍只比较本机 cache 内容。用户目录与 Codex 插件缓存只承载安装/运行副本，不得反向成为项目权威来源；匹配状态固定为 `installed-copy-matched-unverified`，不等于 attestation、当前任务注册或运行时可信。

若 `PATH` 中的 `codex` 缺失、过旧、损坏或与当前命令不兼容，可用 `CODEX_BIN="<codex-absolute-path>" node scripts/ci/manage-project-plugins.mjs --check` 显式选择本机二进制；`CODEX_BINARY` 仅作兼容别名，优先级为 `CODEX_BIN` > `CODEX_BINARY` > `codex`。这只解决 CLI 定位，不改变诊断/显式授权边界，也不提升安装副本的可信等级。

真实未验信 trace observation 使用项目入口 `scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs`，而不是写入 `.agents/plugins/marketplace.json`。stdin 必须是闭字段、精确紧凑、`redacted` JSON；默认只生成 preview。只有维护者明确复核后才可在本机显式 `--write`，CI/GitHub Actions 禁写；写入复用 receipt-first 可恢复双 ledger 事务，但派生的 receipt v2/outcome v3 永远保持 `trace-bound-unverified`，不提升 scored、confirmed 或 behavior coverage。

项目 specialist 只允许 `.codex/agents/` 中的 explorer、worker、verifier。explorer 使用 `read-only`；worker 仅在父任务提供写入白名单时使用；verifier 使用可写 sandbox 只为测试临时/忽略产物，失败时只诊断且不得修改源码、规则、配置、账本或版本。静态 profile 通过只算 component evidence，不增加 behavior coverage。

Codex lifecycle 只允许 `.codex/hooks.json` 的单一 `SessionStart` advisory。项目和当前 hook 定义都需审阅信任；定义变化后重新审阅，不使用 bypass trust。runtime 只校验治理入口并返回固定 context，不读 prompt/transcript/环境/用户配置，不联网、不写入、不阻断。运行 `node --test scripts/ci/aiGovernanceCodexHooks.test.mjs` 与 component case 只能证明组件；真实新任务触发前 `codex-project-session-start-hook-observed` 保持 unknown。

Registration canary 启动包由外部 host 调用 `scripts/ci/prepare-ai-registration-canary.mjs`，用同一 64 位 base-environment SHA-256、每次不同且不进入输出的 64 位随机 nonce，分别生成 `agent`、`grader`、`host` 投影。只把 `agent` 投影交给 fresh task；host 投影用于核对 baseline 项目插件 disabled、candidate enabled、交替顺序、single-use lease 与当前 worktree/ledger 端点。生成器成功或 component case 通过都不表示 MCP 已进入当前 task registry，experiment 与指标继续 blocked/unavailable。

外部 result 回收使用 `scripts/ci/review-ai-registration-canary-results.mjs --stage blind|seal|checkpoint|unblind`，四个阶段必须分开调用：先在不知道 host/lease/arm 的条件下摄取并评分，再计算六条 grade digest commitment；随后生成只绑定盲态 grade set、case/experiment/policy、fixture/environment/rubric 的 detached checkpoint request，交由仓外有状态 signer 或 transparency log 锚定；最后提交同一 request 的精确紧凑 JSON 与 host-only run record，由绑定器从闭字段原始输入重建 review。禁止传入 caller review，也不得跨 grade-set/experiment 嫁接或升级 outcome/writeback。仓库不生成或读取密钥，request 固定 `external-anchor-required`、`trustedSigners=0`，没有外部 receipt 时不证明先后、身份或不可替换；任一 retry、lease/task reuse、固定 trial 映射、顺序/plugin/ledger 漂移都使批次拒绝或基础设施无效。输出仍是未验信 component preview，不修改任何治理账本，不能把 timing/cost 缺失写成 0。

仓外控制面可复用 `aiGovernanceRegistrationCanaryAnchorReceipt.mjs`、`aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs` 与 `aiGovernanceRegistrationCanaryDisclosureConsumption.mjs` 构造待签 Statement，并在仓内执行闭字段/精确字节/签名数学/状态链验证。disclosure 链必须携带 checkpoint 对应的六条 blind grade，逐 alias 验证 result/grade digest、fixture/environment/rubric 与 Agent/grader 投影；host 预分配 anchor expected bindings 可贯穿高层报告，已观察 receipt 按签名 proof 去重。生产模块没有 signer、state store 或 host release API，也不暴露为项目 MCP 写工具。`keyid` 仅为 hint；验证器比较三角色 Ed25519 SPKI 指纹、sender thumbprint、稳定 state key 与可变 binding digest，并把 envelope hash 仅作为 transport digest。报告中的 `signature-verified-unwitnessed`、`authorized-signature-bound-not-consumed`、`consumed-signature-bound-unwitnessed` 都保持 `trustedSigners=0`，未验签消费降为 `claimed-consumed-signature-unchecked`；只有 checkout 外 first-write-wins 状态服务、独立角色 key、共享 CAS、固定 trust policy、真实 inclusion/consistency receipt 和 monitor/witness 才能逐级升级，Sigstore bundle 不得称为 RFC 9942 SCITT receipt。

## 必跑检查

修改 AI 入口、rules、skills、Playbook 或 `docs/AI-*.md` 后运行：

```bash
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-ai-evolution-evals.mjs
node scripts/ci/check-maintainability-budgets.mjs
node scripts/ci/write-ai-governance-artifacts.mjs
node --test scripts/mcp/*.test.mjs
node scripts/ci/check-ai-validation-whitespace.mjs
```

需要给 CI artifact、子 Agent 或审计脚本消费结构化结果时，运行 `node scripts/ci/write-ai-governance-artifacts.mjs`；它会写出治理 JSON、预算 JSON、evolution eval JSON、带 `generatedAt` 的成熟度 scorecard、治理 context 快照和 Markdown summary。读取已有 `artifacts/ai-governance/*` 前可先运行 `node scripts/ci/write-ai-governance-artifacts.mjs --check`，确认产物没有落后于当前治理报告；单独调试治理报告时可运行 `node scripts/ci/check-ai-governance.mjs --json`。

固定 Codex CLI 仍只做无密钥 preflight。项目插件本机安装副本的 Seatbelt v2.1 在执行前锁 OpenAI Developer ID code identity，两个 capability call 都受 Seatbelt 约束；真实 sealed snapshot 只读并前后复核，write/chmod 控制与 deny 只作用 disposable mirror，同时绑定 child/Node/launcher 与 postflight。通过仍只是同 UID component。

下一 component verifier 为 `check-ai-external-controller-preflight.mjs`：stdin 只接闭字段 Linux host record、caller expected bindings 与 signer/witness DSSE；checkout 外 root-owned、digest-pinned、当前 verifier 不可写且 ancestor 受保护的 policy path 也只标 candidate。真实 `NODE_OPTIONS --import` 负例证明仓内 Node 无法自证启动链，故 `trustedSigners=0`、runtime/registration blocked。下一 gate 需 checkout 外受保护 launcher/service 固定 clean env、Node/verifier bundle、policy 和 non-caller bindings；当前 macOS 无独立 UID/PID namespace，因此不运行模型 trial。

治理报告把这条外部前置放在 `blockedFocus`，固定标记 `blocked/external-provisioning` 并列出 Linux 管理平面、digest-pinned runtime、non-caller bindings、外部 signer/witness/state authority 和 zero-model adversarial preflight。顶层 `nextFocus` 继续选择不依赖该链的仓内 behavior case；不得通过继续增加 Seatbelt/attested component case 来伪造进展。

项目插件 `plugins/jsonutils-governance-mcp@0.2.1` 可把固定只读 server 注册到 Codex 插件层；它只从当前 JSONUtils 项目根调用仓内 launcher，权威源与 marketplace 都在项目内。用户安装缓存不是 trust root，安装成功和从缓存启动 server 只算 component evidence；插件工具需要新任务加载。新任务先跑 `mcp-project-registration-discovery`，确认实际 tool registry 含 `jsonutils-governance/ai_governance_scorecard`，再进入 `mcp-fixed-tool-selection`。当前任务无法热加载时写 feedback signal 和 blocked experiment，不写 selection outcome。

项目插件 `plugins/codex-mcp-config-auditor@0.2.1` 只在用户本机显式运行时审计 `mcp_servers.*.http_headers` 的敏感静态 header 名称。权威源码和测试是项目资产；运行 finding 仍是本机证据。它只返回有界 server、fieldPath、固定 riskCode 和 remediation，绝不返回配置值、hash、长度、preview、原始错误、环境值或绝对路径；静态 `$ENV` 仍需告警并迁移到 `env_http_headers`、`bearer_token_env_var` 或 OAuth。安装、缓存 MCP 冒烟和 finding 不产生 behavior outcome。

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
- `.github/copilot-instructions.md`、`.codex/README.md`、`.claude/ai-tools-guide.md`、`.cursorrules` 和 `.comate/rules/code-style.md` 的共享核心规则片段必须保持一致。
- `.github/copilot-instructions.md` 只能作为薄入口，关键规则仍以主规范、Playbook 和 skill 为准；新增 `.github/instructions/**/*.instructions.md` 路径级指令、`.github/prompts/**/*.prompt.md` prompt file、`.github/agents/**/*.agent.md` custom agent 或 `.github/chatmodes/**/*.chatmode.md` legacy chat mode 时也必须进入治理清单、引用规则或显式豁免。
- `.agents/skills/*/SKILL.md` 是项目 skill 唯一源码，必须保留 frontmatter `name`、`description`、`metadata.version`、`metadata.tags`、`agents/openai.yaml`、必读文件、工作流、常用验证命令和重点边界；禁止在 `.codex/skills/` 放同名副本。
- `.codex/agents/` 只能包含 explorer、worker、verifier，且必须通过文件集合、闭字段、sandbox、职责、隐私和固定回传模板负例。
- `.codex/hooks.json` 只能注册单一 `SessionStart` advisory，runtime 必须通过闭字段、摘要、普通文件、输入上限、隐私、路径和扩权负例；配置、trust 状态或脚本直跑不等于 behavior。
- `.github/workflows/ai-governance.yml` 必须保留 weekly schedule、workflow_dispatch、治理脚本单测、MCP 测试和 artifact 上传。
- `.claude/`、`.codex/`、`.cursor/rules/**/*.mdc`、MCP 配置（`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`.comate/`、`docs/AI-*.md` 和 `rules/ai-*.md` 新增协作资产必须进入 `docs/AI-ASSET-REGISTRY.md`、治理清单、引用规则或显式豁免。
- MCP 配置必须声明 `mcpServers` 或 `servers`，避免 shell 包装命令、绝对路径、上跳路径、缺失本地脚本和敏感字段明文；`jsonutils-governance` server 使用 newline-delimited JSON-RPC，只暴露带只读 annotations 的固定资源与工具，包含脱敏 `ai_evaluation_summary`，并实际校验 input schema、以 `-32602` 拒绝非法工具参数。
- 用户级 Codex TOML 不复用项目 JSON 的 `$ENV` 约定：`http_headers` 始终按静态值处理，只有 `env_http_headers`、`bearer_token_env_var` 或 OAuth 承担凭据引用；仓库治理 MCP 不读取该用户配置。
- `ai_evaluation_summary` 同时暴露全局 behavior coverage、feedback chain/Git baseline、paired experiment 计划和 verified outcome；`limit` 只裁剪 signal/experiment/outcome 样本。feedback producer 只输出固定 candidate，不自动改任何 ledger。
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
