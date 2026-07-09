# Codex 项目配置

本目录存放面向 Codex / OpenAI coding agent 的项目级协作资产。

## 内容

- `skills/jsonutils-maintainer/SKILL.md`: JSONUtils 项目维护技能模板，用于让 Codex 在性能优化、重构、Scheme 解析和部署排查时走统一闭环。

## 使用方式

当前项目仍以根目录 `AGENTS.md` 作为 Codex 自动读取入口。本目录里的 skill 是可迁移资产，适合在需要更强项目专用触发能力时复制或安装到本机 Codex skills 目录。

维护规则：

- 项目工程规则以 `AGENTS.md`、`CLAUDE.md`、`rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md` 和 `docs/AI-ASSET-REGISTRY.md` 为准。
- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。
- 涉及 `scripts/deploy/*.sh`、`.github/scripts/*.sh`、`scripts/ci/local-ci.sh` 或 `.github/workflows/*.yml` 的 `workflow run` 块时，需要运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，先用 `bash -n` 拦截外层脚本、内联 run 和 `REMOTE_SCRIPT heredoc` 远端片段语法错误。
- 涉及手动懒加载 `import()`、相关 catch 或 `dispatchChunkLoadRecoveryEvent` 时，需要运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`，避免旧 chunk 加载失败被业务 catch 吞掉。
- 涉及前端 Docker、Compose、Nginx 或静态资源发布策略时，需要运行 `node scripts/ci/check-frontend-static-retention.mjs`，确认旧 hash assets 保留机制未失效。
- 公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs <baseUrl>`，确认当前入口 HTML、main/admin JS、CSS `url(...)` 引用和 CSS `@import` 链路里的静态资源都能访问，并校验 JS/CSS `Content-Type` 没有被 fallback 成 HTML 伪装成成功。
- 用户反馈旧 chunk URL 时，给公网资源巡检追加 `--extra-asset <url-or-path>` 纳入同一轮 404 和 MIME 诊断。
- 跨模块排查、复杂重构或多条验证链路并行时先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。
- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验。
- 项目级 skill 必须保留可迁移结构：frontmatter 至少包含 `name`、`description`、`version` 和 `tags`，正文保留 `## 必读文件`、`## 工作流`、`## 常用验证命令` 和 `## 重点边界`，让 Codex 能稳定发现、触发、版本化和执行。
- 修改本目录后，同步更新 `.claude/ai-tools-guide.md`，保持 Claude Code 与 Codex 的上下文一致，并运行 `node scripts/ci/check-ai-governance.mjs` 和 `node scripts/ci/check-maintainability-budgets.mjs`。
