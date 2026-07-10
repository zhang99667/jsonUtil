# AI 协作资产注册表

本文是 AI 协作资产的人工账本。`node scripts/ci/check-ai-governance.mjs` 会校验必需文件、自动发现资产和已存在的显式豁免文件是否都在本文登记，避免 rules、skills、工具入口或本机配置边界变成无人维护的隐性资产。

## 登记规则

- 协作资产必须说明职责、权威来源和验证方式。
- 每个资产路径必须以反引号写在 `资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据` 表格的 `资产` 列中，且 `状态`、`责任人`、`复核节奏`、`最近复核`、`类型`、`维护契约` 和 `治理证据` 不可为空；正文里随手提到路径或放进其它表格不算登记。
- `治理证据` 的每个分隔片段都必须是认可标记，例如 `必需文件`、`入口引用规则`、`自动发现规则`、`资产发现规则`、`Codex skill 契约检查`、`资产注册表结构化校验`、`显式豁免列表`、`可维护性预算` 或发布/运行时引用规则；“人工看过”这类无法指向门禁的自由文本不算有效证据，也不能混在有效标记旁边。
- `必需文件`、`自动发现规则`、`资产发现规则`、`显式豁免列表`、`可维护性预算` 和结构化/契约类证据会反查实际治理集合；不能把自动发现资产伪装成必需文件，也不能把协作资产伪装成本机豁免、预算登记、章节检查或 skill 契约。
- 入口、docs/AI、工具入口、PR 模板、Claude README 和 skill 的文件级引用规则证据会反查实际 `referenceRules.file`，发布/运行时这类目标引用证据会反查实际被引用的脚本路径；不能只在注册表里写“引用规则”却不接入治理脚本。
- 同一个资产只能登记一次；重复登记会让维护责任和豁免边界变得含糊。
- 表格里登记的资产必须属于必需文件、自动发现资产或已存在的显式豁免文件；删除或移出治理面的资产要同步移除登记，避免留下陈旧账本。
- 工具入口保持薄入口，权威规则优先沉淀到 `rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md` 或 `.codex/skills/jsonutils-maintainer/SKILL.md`。
- 工具薄入口不得维护独立更新记录，历史追踪统一由 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md` 承载。
- 本机私有配置只允许作为显式豁免登记，不承载项目级规则、skills 或验证流程。
- 新增 `.claude/`、`.codex/`、`.cursor/rules/**/*.mdc`、MCP 配置（`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`.comate/`、`.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/prompts/**/*.prompt.md`、`.github/agents/**/*.agent.md`、`.github/chatmodes/**/*.chatmode.md`、`docs/AI-*.md` 或 `rules/ai-*.md` 资产时，先更新本文，再补治理规则或豁免说明。

## 责任与状态约定

- 维护责任: 责任人只能写 `项目维护者`、`AI 助手协同` 或 `本机用户`；项目维护者负责最终判断，AI 助手修改资产时必须同步本注册表、CHANGELOG 和匹配的治理测试。
- 状态分类: `协作资产`、`权威流程`、`决策账本`、`工具薄入口`、`可迁移技能`、`治理门禁`、`显式豁免`。没有状态说明的 AI 相关文件不应进入长期维护面，状态值必须落在这些约定分类里。
- 复核节奏: 只允许 `变更时复核`、`发布前复核`、`季度复核`；`显式豁免` 必须使用 `本机用户` 和 `季度复核`，`本机用户` 责任人只能用于显式豁免，`治理门禁` 必须使用 `项目维护者` 和 `发布前复核`。
- 最近复核: 使用真实有效且不晚于当前日期的 `YYYY-MM-DD` 记录最近一次人工或 AI 协同复核日期；它只证明账本行被复核过，不承担到期提醒或自动调度职责。
- 治理证据: 每个资产至少需要被必需文件、引用规则、自动发现规则、负向测试或显式豁免之一覆盖，并在表格中写入 `scripts/ci/aiGovernanceAssetRegistryEvidence.mjs` 认可且来源匹配的证据标记；文件级引用规则还必须存在对应 `referenceRules.file`，核心入口优先同时具备自动检查和人工 PR checklist。
- 豁免边界: 显式豁免只说明为什么不承载共享规则，不等于允许长期配置漂移。

## 协作入口与权威规则

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `AGENTS.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 项目入口 | Codex 和通用 coding agent 入口，AI 协作章节与 `CLAUDE.md` 保持同源，并直接指向资产注册表 | 必需文件、入口引用规则、同源章节漂移检查 |
| `CLAUDE.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 项目入口 | Claude Code / Ducc 入口，AI 协作章节与 `AGENTS.md` 保持同源，并直接指向资产注册表 | 必需文件、入口引用规则、同源章节漂移检查 |
| `rules/code-style.md` | 权威流程 | 项目维护者 | 变更时复核 | 2026-07-10 | 权威规则 | 编码规范、提交规范、CHANGELOG 和 AI 资产治理规则来源 | 必需文件、入口引用规则、版本一致性检查引用 |
| `docs/AI-ENGINEERING-PLAYBOOK.md` | 权威流程 | 项目维护者 | 变更时复核 | 2026-07-10 | 权威流程 | 子 Agent 委派、验证矩阵、规则进化和治理校验闭环 | 必需文件、入口引用规则、章节级引用检查 |
| `docs/AI-GOVERNANCE-DECISIONS.md` | 决策账本 | 项目维护者 | 变更时复核 | 2026-07-10 | 决策账本 | 记录 AI rules、skills 和治理脚本变更的触发条件、反例、回写追踪和锁定测试，并要求回写追踪包含账本自身 | 必需文件、docs/AI 引用规则、资产发现规则 |
| `docs/AI-CONFIG-INTEGRATION.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 分层说明 | 说明入口、rules、skills、本机配置和显式豁免关系 | 必需文件、docs/AI 引用规则、资产发现规则 |
| `docs/AI-TOOLS-SETUP.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 工具索引 | 说明各 AI 工具入口、同步边界和必跑检查 | 必需文件、docs/AI 引用规则、资产发现规则 |
| `docs/AI-ASSET-REGISTRY.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 资产账本 | 登记所有关键 AI 协作资产、治理脚本和显式豁免文件 | 必需文件、资产注册表结构化校验、资产发现规则 |
| `.github/PULL_REQUEST_TEMPLATE.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-09 | 人工门禁 | 要求 PR 说明 AI 资产注册表、决策账本、CHANGELOG、治理校验、可维护性预算、负向测试、显式豁免以及 Copilot 根入口、Cursor rules、MCP 配置、instructions / prompt / custom agent / chatmode 入口处理 | 必需文件、PR 模板引用规则 |
| `.github/workflows/ai-governance.yml` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-10 | 定时治理 | 每周运行 AI 治理脚本单测、MCP 测试和治理 artifact 产出，保留手动触发入口，防止 AI 资产长期不改时静默漂移 | 必需文件、资产注册表结构化校验 |

## 工具入口与可迁移技能

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.claude/README.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 目录索引 | 说明 Claude 配置目录边界，必须指向 Playbook、资产注册表和治理命令 | 必需文件、Claude README 引用规则、自动发现规则 |
| `.claude/ai-tools-guide.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 工具说明 | 说明 Claude、Codex、Copilot、Cursor、Comate 如何复用同一套规范，并保持共享核心规则片段同源且可反查权威来源 | 必需文件、入口引用规则、同源片段漂移检查、自动发现规则 |
| `.codex/README.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 目录索引 | 说明 Codex 项目资产边界和旧 chunk / 部署验证入口，并保持共享核心规则片段同源且可反查权威来源 | 必需文件、入口引用规则、同源片段漂移检查、自动发现规则 |
| `.codex/skills/jsonutils-maintainer/SKILL.md` | 可迁移技能 | 项目维护者 | 变更时复核 | 2026-07-10 | 可迁移技能 | 保留与目录一致的 frontmatter name、可追踪 version、可检索 tags、必读文件、工作流、常用验证命令和重点边界，当前 name/version 必须可从 CHANGELOG 同行追溯，并确保命令块里的工作目录与脚本可达 | Codex skill 契约检查、skill 引用规则、自动发现规则 |
| `.mcp.json` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 项目级 MCP 配置 | 暴露 `jsonutils-governance` 本地 MCP server，配置只使用 `node` 直连仓库内脚本，不携带明文凭据或 shell 包装命令 | 必需文件、自动发现规则、资产注册表结构化校验 |
| `scripts/mcp/jsonutils-governance-server.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 服务 | 只读暴露 AI Playbook、资产注册表、决策账本和 maintainer skill，并只提供固定治理报告、scorecard、上下文、asset inventory、decision summary、handoff brief、artifact freshness、worktree snapshot 和 validation plan 工具，不开放任意 shell | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-tool-definitions.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护固定治理报告、预算报告、scorecard、上下文、asset inventory、decision summary、handoff brief、artifact freshness、worktree snapshot 和 validation plan 工具名称、顺序和 input schema | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-tools.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护固定治理报告、预算报告、scorecard、上下文、asset inventory、decision summary、handoff brief、artifact freshness、worktree snapshot 和 validation plan 工具分发与固定脚本调用，server 只调用该 helper | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-report-tool.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 组合固定治理报告和预算报告，把 `ai_governance_report` 的成熟度 scorecard 与 `ai_governance_scorecard` 保持同源，不开放任意 shell | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-scorecard-tool.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 复用治理 context 构造固定 `ai_governance_scorecard` 载荷，保证 scorecard schema 与 context 同源，不开放任意 shell | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-assets.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 复用资产注册表 Markdown 表解析器，bounded 输出 AI 协作资产清单、状态/类型/责任人计数和治理证据，不开放任意路径读取 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-decisions.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 复用决策账本 Markdown 表解析器，bounded 输出最近治理决策、回写文件和锁定命令，供 MCP agent 快速理解规则演进脉络 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-handoff.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立组合治理上下文、成熟度焦点、AI 基建清零状态、worktree snapshot 和交接风险，产出 bounded handoff brief，不新增任意命令或文件读取能力 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-validation-plan.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 根据完整 changed-file 集合匹配建议验证命令，同时 bounded 返回命中规则、样本覆盖范围和未分类文件，不执行命令或开放任意 shell | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-worktree.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护固定 `git status --porcelain=v1 --branch` worktree snapshot、分支 ahead/behind 解析和受限文件样本，不读取文件内容或开放任意 git 命令 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-resources.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护治理 MCP 的只读资源 URI、文件映射和读取边界，server 只调用该 helper，不开放任意路径读取 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-context.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 组合固定治理/预算 JSON 报告、版本、最新决策和下一步命令，产出给 AI 助手消费的紧凑上下文快照 | 必需文件、自动发现规则、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-context-builder.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护治理 context schema 装配，项目摘要和报告摘要由专用 helper 提供 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-project-summary.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立读取项目 package、CHANGELOG 顶部版本和决策账本最新记录，供治理 context 复用 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/mcp/jsonutils-governance-report-summary.mjs` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 本地 MCP 支撑 | 独立维护治理失败计数、预算热点、成熟度 scorecard 和下一步命令摘要，供治理 context 复用 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `.github/copilot-instructions.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 工具薄入口 | GitHub Copilot 仓库级 instructions，转发到主规范、Playbook 和 skill，并保持共享核心规则片段同源且可反查权威来源 | 必需文件、工具入口引用规则、同源片段漂移检查、自动发现规则 |
| `.cursorrules` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 工具薄入口 | Cursor 入口，与 `.comate/rules/code-style.md` 保持共享核心片段同源且可反查权威来源 | 必需文件、工具入口引用规则、同源片段漂移检查 |
| `.comate/rules/code-style.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-09 | 工具薄入口 | Comate 入口，与 `.cursorrules` 保持共享核心片段同源且可反查权威来源 | 必需文件、工具入口引用规则、同源片段漂移检查 |

## 本机配置与显式豁免

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.claude/.gitignore` | 显式豁免 | 本机用户 | 季度复核 | 2026-07-09 | 显式豁免 | 只维护本机配置目录的忽略规则，不承载协作规范 | 显式豁免列表、资产注册表结构化校验 |
| `.claude/settings.local.json` | 显式豁免 | 本机用户 | 季度复核 | 2026-07-09 | 显式豁免 | 本机私有配置，不承载项目级 rules、skills 或验证流程 | 显式豁免列表、资产注册表结构化校验 |

## 治理门禁

| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scripts/ci/check-ai-governance.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | AI 治理入口 | 聚合文件存在、引用规则、同源入口与薄入口权威源、MCP 配置契约、AI 修复安全证据与跳过检测、项目事实与版本事实、skill 契约、skill 引用契约、CI 契约和资产注册表检查，并支持人读与 JSON 摘要失败分组 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/write-ai-governance-artifacts.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-10 | CI 产物 | 在 CI 和 local-ci 中固定写出 AI 治理 JSON、可维护性预算 JSON、带生成时间的治理 context/scorecard 快照和 Markdown summary，并提供 `--check` 拦截旧产物漂移 | 必需文件、资产注册表结构化校验、可维护性预算 |
| `scripts/ci/check-version-consistency.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 发布门禁 | 校验前端版本、锁文件、CHANGELOG 顶部版本区块、条目数量和发布说明结构 | 必需文件、运行时引用规则、可维护性预算 |
| `scripts/ci/check-maintainability-budgets.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 可维护性门禁 | 校验模块行数预算，防止治理脚本继续堆成大文件 | 必需文件、运行时引用规则、可维护性预算 |
| `scripts/ci/check-deploy-shell-syntax.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 部署门禁 | 校验部署 shell、workflow run 和 REMOTE_SCRIPT heredoc 语法 | 必需文件、发布引用规则、可维护性预算 |
| `scripts/ci/check-chunk-load-recovery-catches.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 运行时门禁 | 校验手动懒加载 catch 和 `dispatchChunkLoadRecoveryEvent` 恢复能力 | 必需文件、运行时引用规则、可维护性预算 |
| `scripts/ci/check-frontend-static-retention.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 静态资源门禁 | 校验前端发布保留近期旧 hash 资产 | 必需文件、发布引用规则、可维护性预算 |
| `scripts/ci/check-production-frontend-assets.mjs` | 治理门禁 | 项目维护者 | 发布前复核 | 2026-07-09 | 公网巡检 | 校验 JS/CSS `Content-Type`、CSS `url(...)`、CSS `@import` 和 fallback 成 HTML 风险 | 必需文件、发布引用规则、可维护性预算 |

## 更新流程

1. 新增 AI 入口、rules、skills、项目级 MCP 配置、`docs/AI-*.md` 或 `rules/ai-*.md` 时，先判断它是协作资产、本机私有配置还是临时实验。
2. 协作资产写入上方对应表格，更新最近复核日期，并纳入必需文件、引用规则或自动发现规则。
3. 本机私有配置写入显式豁免表格，并说明为什么不能承载共享规则。
4. 补负向测试，证明漏登记、漏引用或错误豁免会被 `check-ai-governance` 拦住。
5. 运行 `node scripts/ci/check-ai-governance.mjs`、`node scripts/ci/check-maintainability-budgets.mjs` 和 `git diff --check`。
