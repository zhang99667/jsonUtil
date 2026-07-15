# JSONUtils Comate AI 入口

本文件是 Comate 的薄入口，完整规范以仓库主文档为准，避免 `.comate` 目录复制旧规则后和主规范漂移。

JSONUtils AI 基建必须是项目资产；`.agents/plugins/marketplace.json` 和 `plugins/` 是项目插件的 source of truth，用户安装缓存不是权威源。

## 必读文件

- `AGENTS.md`: Codex 和通用 coding agent 项目入口。
- `CLAUDE.md`: Claude Code / Ducc 项目入口。
- `rules/code-style.md`: 完整编码规范、提交规范、CHANGELOG 与 AI 规则资产要求。
- `docs/AI-ENGINEERING-PLAYBOOK.md`: 跨 AI 工具共享的执行闭环。
- `docs/AI-ASSET-REGISTRY.md`: AI 协作资产、治理证据和显式豁免账本，新增入口或 skill 前先同步登记。
- `.cursorrules`: Cursor 薄入口，需与本文件保持同源引用。

## 核心规则

- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。
- 跨模块排查、复杂重构或多条验证链路并行时先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。
- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验。
- 修改 AI 入口、Playbook、rules 或 skill 后，运行 `node scripts/ci/check-ai-governance.mjs` 和 `node scripts/ci/check-maintainability-budgets.mjs`。

## 发布与资源验证

- 部署 shell、本地 CI、GitHub shell helper 或 `.github/workflows/*.yml` 的 `workflow run` 块改动后运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，覆盖外层脚本、内联 run 和 `REMOTE_SCRIPT heredoc` 远端片段。
- 手动懒加载 `import()`、相关 catch 或 `dispatchChunkLoadRecoveryEvent` 改动后运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`。
- 前端 Docker、Compose、Nginx 或静态资源发布改动后运行 `node scripts/ci/check-frontend-static-retention.mjs`。
- 公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs <baseUrl>`，校验 JS/CSS `Content-Type`，防止缺失资源 fallback 成 HTML，并递归检查 CSS `url(...)` 与 CSS `@import` 链路；用户反馈旧 chunk URL 时追加 `--extra-asset <url-or-path>`。
