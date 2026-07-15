---
name: jsonutils-maintainer
description: JSONUtils 项目维护技能。用于优化性能、重构可维护性较差的模块、补充 Scheme/CMD 解析能力、维护前后端测试门禁、更新 AI 协作规范和部署排查流程。
metadata:
  version: "0.1.39"
  tags: "jsonutils,governance,ai-infra,maintenance"
---

# JSONUtils Maintainer

在 JSONUtils 项目中进行代码修改时使用。本技能依赖仓库内规则文件，不替代它们。

## 必读文件

1. `AGENTS.md`: Codex 项目入口和模块说明。
2. `rules/code-style.md`: 代码风格、提交格式和 CHANGELOG 要求。
3. `docs/AI-ENGINEERING-PLAYBOOK.md`: AI 自闭环执行流程。
4. 与任务相关的源码、测试和文档。

## 按任务读取

- 普通业务改动默认通过治理 MCP 的 `ai_decision_summary` 获取最近决策，不把完整历史账本塞入每次任务上下文。
- 先用治理 MCP `ai_asset_inventory` 获取 bounded 摘要；新增、修改或审计 AI 协作资产时再完整读取 `docs/AI-ASSET-REGISTRY.md`。
- 修改 AI rules、skills、MCP 或治理门禁，或需要追溯历史反例时，再完整读取 `docs/AI-GOVERNANCE-DECISIONS.md`。

## 工作流

1. 先执行 `git status --short --branch`，确认工作树是否干净。
2. 对跨模块排查、复杂重构或多条验证链路先做子 Agent 委派判断；Codex 只读调查路由项目 explorer、白名单实现路由 worker、验证复核路由 verifier，AI 基建审计切换 evolver 并可路由 ai-infra-auditor。委派任务说明读写范围、排除项、期望输出和未覆盖风险，worker 额外要求写入白名单；子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
3. 用 `rg` 或 `rg --files` 定位相关实现和测试。
4. 明确成功标准：性能预算、解析 corpus、类型检查、构建门禁或交互测试。
5. 做最小可验证改动，不做无关大重构。
6. JSONUtils AI 基建的 source of truth 必须入库；workspace/index/HEAD 只分别证明未 ignore、下一次提交候选和当前提交可 clone。仓库不是 plugin，只有 `plugins/<name>/` 是插件包；`.agents/plugins/marketplace.json` 只交付目录和源码，不会自动安装，先只读 `--check`，只有用户明确同意才 `--apply`，安装缓存不是权威源。
7. 用户可见或准备上线的改动先递增 `frontend/package.json` patch 版本，同步 `frontend/package-lock.json`，并在 `CHANGELOG.md` 顶部新开版本区块，避免一个版本堆积几十条提交。
8. 多 worktree 版本不累加；快照只备份，按职责重建并校验目标树。outcome/receipt 按包含关系保留，发布资产最后统一。
9. 公开仓库只用中性语料与资产；运行 `node scripts/ci/check-repository-neutrality.mjs`。
10. 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，完成复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，并把稳定经验做规则/skill 回写。deterministic outcome 只能用项目 writer 默认 preview，本地维护者显式 `--write`；不手改双 JSONL，不让 CI/hook 自动写账。
11. 决策账本记录不能用弱占位冒充触发条件、反例或适用边界；回写追踪同时包含 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md`；锁定测试同时写入 `node --test ...test.mjs` 和 `node scripts/ci/check-ai-governance.mjs`，且引用的测试文件必须保留普通可执行 `test(...)` 或 `it(...)` 用例，不能只剩 `skip`、`todo`、`.only` 或空文件。
12. 修改 `.agents/skills/*/SKILL.md` 时保留 frontmatter `name`/`description` 与 `metadata.version`/`metadata.tags`（`name` 必须等于 skill 目录名，`version` 使用 `x.y.z`，`metadata` 所有值使用带引号字符串，`tags` 使用非空逗号分隔字符串），当前 `name` 与 `version` 必须在 `CHANGELOG.md` 同一条记录中可追踪，并保留四个核心章节，确保 skill 仍可发现、可迁移、可版本化、可验证。
13. 运行匹配范围的验证命令，并在最终回复中说明结果。

## 常用验证命令

```bash
node scripts/ci/check-version-consistency.mjs
node scripts/ci/check-repository-neutrality.mjs
node scripts/ci/check-deploy-shell-syntax.mjs
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-ai-evolution-evals.mjs
node scripts/ci/manage-project-plugins.mjs --check
node scripts/ci/check-chunk-load-recovery-catches.mjs
node scripts/ci/check-frontend-static-retention.mjs
node scripts/ci/check-production-frontend-assets.mjs https://jsonutils.markz.fun
# 用户反馈旧 chunk URL 时追加: --extra-asset https://jsonutils.markz.fun/assets/xxx.js
node scripts/ci/check-maintainability-budgets.mjs
node scripts/ci/write-ai-governance-artifacts.mjs
node scripts/ci/write-ai-governance-artifacts.mjs --check
node --test scripts/mcp/*.test.mjs
```

```bash
cd frontend
npm run lint
npm run typecheck
npm run test -- src/utils/schemeUtils.test.ts
npm run corpus:scheme
npm run perf:scheme
npm run build
npm run check:preloads
```

```bash
cd backend
mvn test
```

## 重点边界

- Scheme/CMD 解析要保护 URL 编码、JSON 字符串转义、base64、JWT、嵌套 query、普通 HTTP(S) URL 的区分。
- 首屏性能优化要用构建产物和 preload 检查证明，不凭感觉判断。
- 手动懒加载 `import()` 或相关 catch 改动要运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`，并通过 `dispatchChunkLoadRecoveryEvent` 保留旧 chunk 失效刷新恢复能力。
- 前端 Docker/Compose/Nginx 发布改动要保护旧 hash assets，并用公网资源巡检校验 JS/CSS `Content-Type`、CSS `url(...)` 二级资源和 CSS `@import` 链路，避免长时间打开页面后懒加载 chunk 404 或缺失 chunk fallback 成 HTML。
- 同机外部业务域名的 Nginx 改动不能只验证 HTTP 200；`/admin.html` 这类历史后台路径要用本域 `/index.html` 承接、清理本域缓存，并用一次性裸域 query 绕过浏览器对 `/` 的旧 301 精确缓存，再把地址栏归位到裸域，部署 smoke 需要锁住可执行证据。
- 部署 shell、GitHub shell helper、本地 CI 入口或 `.github/workflows/*.yml` 的 `workflow run` 块改动后先跑 `node scripts/ci/check-deploy-shell-syntax.mjs`，避免外层脚本、内联 run 和 `REMOTE_SCRIPT heredoc` 远端片段语法错误进入上线链路。
- 大输入处理优先走 worker、采样、预算和降级提示。
- AI 修复能力必须明确本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。
- AI 协作规则自身也要可进化：新增或修正流程后同步 Playbook、入口文档和本 skill，并通过 `node scripts/ci/check-ai-governance.mjs` 做治理校验，避免只靠人工记忆传递。
- 项目通用执行角色固定 explorer、worker、verifier，AI 基建专项只读审计另允许跨 Codex/Claude/Copilot 的 ai-infra-auditor；客户端权限配置只是默认值，父任务覆盖不放宽职责。静态 adapter 只算 component evidence，真实选择、强隔离和零写入保持 unknown，零写入需完整 workspace manifest。
- AI 治理、版本一致性、脚本单测和可维护性预算命令必须留在 GitHub Actions `run:` 与 `scripts/ci/local-ci.sh` 的 `run_in_root` 可执行入口，由 `check-ai-governance` 反查，不能只放在注释或 `echo` 里。
- `.github/workflows/ai-governance.yml` 必须保留 weekly schedule、workflow_dispatch、治理脚本单测、MCP 测试和 artifact 上传，用定时巡检覆盖长期不改文件时的 AI 资产漂移风险。
- 新增 `scripts/ci/aiGovernance*.mjs` 或 `scripts/ci/aiGovernance*.test.mjs` 时同步登记可维护性预算，治理 helper 和锁定测试都不能游离在预算所有权之外。
- 新增 `scripts/ci/aiGovernance*.mjs` 非测试 helper 时还要接入调用所有权：生产契约、规则、引用和失败收集 helper 必须进入 `check-ai-governance` 生产 import 图；只有 `*TestFixtures.mjs` 和 `*MissingCases.mjs` 测试支撑文件允许 test-only。
- AI 治理 JSON、MCP context 和 artifact 产物需要保留成熟度 scorecard 与 nextFocus，让后续 agent 先处理明确的规则、skill、MCP 或预算缺口；读取已有 `artifacts/ai-governance/*` 前先运行 `node scripts/ci/write-ai-governance-artifacts.mjs --check`，失败后重跑产物脚本，避免旧 summary/context 误导判断。
- AGENTS/CLAUDE 这类同源入口要成对更新；Copilot、Codex README、Claude 工具指南和 Cursor 的薄入口共享核心规则片段由治理脚本做漂移检查，并在共享片段描述中保留权威来源文件和锚点，避免薄入口硬编码内容脱离权威规则。
- AGENTS/CLAUDE 作为首读核心入口必须直接引用 `docs/AI-ASSET-REGISTRY.md`，新增资产治理规则不能只留在 Playbook 或工具薄入口里。
- AGENTS、CLAUDE 和 `rules/code-style.md` 的技术栈事实要与真实配置对齐；数据库和关键主版本事实由 `check-ai-governance` 从后端配置、前后端依赖、前端 lock 和 Compose 文件反查，避免旧技术栈说明误导后续 agent。
- Claude 工具指南、Codex README、Copilot 和 Cursor 这类工具薄入口不得维护独立更新记录；变更历史统一落到 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md`。
- `CHANGELOG.md` 顶部版本区块必须保留规范分类标题和 `- **标题**: 描述` 条目格式，由 `node scripts/ci/check-version-consistency.mjs` 统一校验版本、条目数量和结构。
- AI 资产注册表每条登记都要维护真实有效且不晚于当前日期的 `YYYY-MM-DD` 最近复核日期；修改资产行时同步更新日期，但不把它扩展成自动提醒系统。
- 新增 `.agents/skills/`、`.claude/`、`.codex/`、`.cursor/rules/**/*.mdc`、项目级 MCP 配置（根 MCP、Cursor MCP、VS Code MCP）、`.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/prompts/**/*.prompt.md`、`.github/agents/**/*.agent.md`、`.github/chatmodes/**/*.chatmode.md`、`docs/AI-*.md` 或 `rules/ai-*.md` 下的 AI 协作资产时，必须同步 `docs/AI-ASSET-REGISTRY.md`，并纳入治理清单、引用规则或显式豁免，防止 rules/skills 文档游离在门禁之外。
- 项目级 MCP 配置必须是合法 JSON，且只能包含 `mcpServers` 或 `servers` 其中一个 server map；每个 server 至少声明 `command` 或 `url`，`command`、`args`、`env` 等常见字段要保持可执行结构，不能用 shell 包装命令或绝对路径，仓库内脚本参数必须存在，token、secret、password、api key、authorization 等敏感字段及 URL/args/header 字符串中的敏感值只能写环境变量引用，不能提交明文。
- `.mcp.json` 默认暴露 `jsonutils-governance` 本地 MCP server；该 server 只能提供只读治理资源和固定治理报告、scorecard、上下文、asset inventory、evaluation summary、decision summary、handoff brief、artifact freshness、worktree snapshot 与 validation plan 工具，禁止扩展成任意 shell 或通用文件读取入口。
- MCP server 或 context helper 改动后，`node --test scripts/mcp/*.test.mjs` 必须覆盖真实 stdio 启动、工具清单、治理资源读取和 `ai_governance_context` / `ai_governance_scorecard` / `ai_asset_inventory` / `ai_evaluation_summary` / `ai_decision_summary` / `ai_handoff_brief` / `ai_worktree_snapshot` / `ai_validation_plan` 调用，避免后续 agent 拿不到治理上下文、成熟度焦点、资产清单、评测覆盖、决策脉络、交接摘要、工作区状态或建议验证命令。
- 项目级 Codex skill 不是普通 Markdown 笔记；必须保持 `## 必读文件`、`## 工作流`、`## 常用验证命令`、`## 重点边界` 结构，且当前 frontmatter `name` 与 `version` 要能从 `CHANGELOG.md` 同一条记录追溯，方便后续 agent 按固定入口执行并判断迁移版本。
- 项目级 Codex skill 中反引号包裹的具体项目路径、fenced `cd <dir>` 工作目录、`node ...mjs` 验证脚本和 `npm run ...` 脚本必须真实存在，迁移或重命名后用 `node scripts/ci/check-ai-governance.mjs` 反查，避免 skill 引用失效。
