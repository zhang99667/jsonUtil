# GitHub Copilot Instructions

本文件是 GitHub Copilot 的仓库级薄入口。完整规范以仓库主文档为准，避免 Copilot 单独维护一份会漂移的规则。

## 必读入口

- `AGENTS.md`: Codex 和通用 coding agent 项目入口。
- `CLAUDE.md`: Claude Code / Ducc 项目入口，与 `AGENTS.md` 保持同源 AI 协作章节。
- `rules/code-style.md`: 编码规范、提交格式、CHANGELOG 和 AI 协作资产治理要求。
- `docs/AI-ENGINEERING-PLAYBOOK.md`: 子 Agent 委派、验证矩阵、规则/skill 回写和治理校验流程。
- `.codex/skills/jsonutils-maintainer/SKILL.md`: Codex 可迁移项目维护技能。

## 工作要求

- 遵循现有代码风格和模块边界，优先复用已有 helper、组件、service 和测试模式。
- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。
- 跨模块排查、复杂重构或多条验证链路并行时，按 Playbook 判断是否需要子 Agent 委派；委派结果必须保留可追溯证据和验证结论。
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。
- 新增或修改 AI 入口、rules、skills、Playbook、`docs/AI-*.md` 或 `rules/ai-*.md` 后，运行 `node scripts/ci/check-ai-governance.mjs` 和 `node scripts/ci/check-maintainability-budgets.mjs`。

## 验证闭环

- 子 Agent 委派必须说明读写范围、排除项、期望输出和未覆盖风险；主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
- 子 Agent 结果使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板。
- 部署 shell、GitHub shell helper、本地 CI 或 `.github/workflows/*.yml` 的 `workflow run` 块改动后运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，覆盖 `REMOTE_SCRIPT heredoc`。
- 手动懒加载 `import()`、相关 catch 或 `dispatchChunkLoadRecoveryEvent` 改动后运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`。
- 前端 Docker、Compose、Nginx 或静态资源发布策略改动后运行 `node scripts/ci/check-frontend-static-retention.mjs`；公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs https://jsonutils.markz.fun`，确认 JS/CSS `Content-Type`、缺失资源没有 fallback 成 HTML，并递归检查 CSS `url(...)` 与 CSS `@import` 链路；旧 chunk 反馈追加 `--extra-asset`。
- 规则沉淀必须来自复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再做规则/skill 回写和治理校验。

本机私有配置不承载协作规则；需要共享的经验应沉淀到 Playbook、rules、入口文档或 `.codex/skills/jsonutils-maintainer/SKILL.md`。
