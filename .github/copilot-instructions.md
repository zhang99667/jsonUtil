# GitHub Copilot Instructions

本文件是 GitHub Copilot 的仓库级薄入口。完整规范以仓库主文档为准，避免 Copilot 单独维护一份会漂移的规则。

JSONUtils AI 基建必须是项目资产；`.agents/plugins/marketplace.json` 和 `plugins/` 是项目插件的 source of truth，用户安装缓存不是权威源。

## 必读入口

- `AGENTS.md`: Codex 和通用 coding agent 项目入口。
- `CLAUDE.md`: Claude Code 项目入口，与 `AGENTS.md` 保持同源 AI 协作章节。
- `rules/code-style.md`: 编码规范、提交格式、CHANGELOG 和 AI 协作资产治理要求。
- `docs/AI-ENGINEERING-PLAYBOOK.md`: 子 Agent 委派、验证矩阵、规则/skill 回写和治理校验流程。
- `docs/AI-ASSET-REGISTRY.md`: AI 协作资产、治理证据和显式豁免账本，新增入口或 skill 前先同步登记。
- `.agents/skills/jsonutils-maintainer/SKILL.md`: Codex 可迁移项目维护技能。
- `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`: AI 基建治理的 canonical skill。
- `.github/agents/ai-infra-auditor.agent.md`: 仓库级只读 AI 基建审计 Agent，只允许 `read`/`search`。

## 工作要求

- 遵循现有代码风格和模块边界，优先复用已有 helper、组件、service 和测试模式。
- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。
- 跨模块排查、复杂重构或多条验证链路并行时先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
- 审计 rules、skills、MCP、plugins、hooks、evals 或治理证据时可路由 `ai-infra-auditor`；它不编辑文件、不调用 MCP/网络、不读用户配置或敏感上下文。静态 Agent 只算 component evidence，不证明 Copilot 已发现或选择。
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。
- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验。
- 新增或修改 AI 入口、rules、skills、Playbook、`docs/AI-*.md` 或 `rules/ai-*.md` 后，运行 `node scripts/ci/check-ai-governance.mjs` 和 `node scripts/ci/check-maintainability-budgets.mjs`。

## 验证闭环

- 子 Agent 委派必须说明读写范围、排除项、期望输出和未覆盖风险；主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
- 子 Agent 结果使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板。
- 部署 shell、GitHub shell helper、本地 CI 或 `.github/workflows/*.yml` 的 `workflow run` 块改动后运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，覆盖 `REMOTE_SCRIPT heredoc`。
- 手动懒加载 `import()`、相关 catch 或 `dispatchChunkLoadRecoveryEvent` 改动后运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`。
- 前端 Docker、Compose、Nginx 或静态资源发布策略改动后运行 `node scripts/ci/check-frontend-static-retention.mjs`；公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs https://jsonutils.markz.fun`，确认 JS/CSS `Content-Type`、缺失资源没有 fallback 成 HTML，并递归检查 CSS `url(...)` 与 CSS `@import` 链路；旧 chunk 反馈追加 `--extra-asset`。
- 规则沉淀必须来自复盘沉淀，写清触发条件、反例、验证方式和适用边界，再做规则/skill 回写和治理校验。

本机私有配置不承载协作规则；需要共享的经验应沉淀到 Playbook、rules、入口文档或 `.agents/skills/jsonutils-maintainer/SKILL.md`。
