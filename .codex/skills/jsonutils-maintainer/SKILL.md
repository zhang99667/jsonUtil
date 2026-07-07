---
name: jsonutils-maintainer
description: JSONUtils 项目维护技能。用于优化性能、重构可维护性较差的模块、补充 Scheme/CMD 解析能力、维护前后端测试门禁、更新 AI 协作规范和部署排查流程。
---

# JSONUtils Maintainer

在 JSONUtils 项目中进行代码修改时使用。本技能依赖仓库内规则文件，不替代它们。

## 必读文件

1. `AGENTS.md`: Codex 项目入口和模块说明。
2. `rules/code-style.md`: 代码风格、提交格式和 CHANGELOG 要求。
3. `docs/AI-ENGINEERING-PLAYBOOK.md`: AI 自闭环执行流程。
4. 与任务相关的源码、测试和文档。

## 工作流

1. 先执行 `git status --short --branch`，确认工作树是否干净。
2. 对跨模块排查、复杂重构或多条验证链路先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
3. 用 `rg` 或 `rg --files` 定位相关实现和测试。
4. 明确成功标准：性能预算、解析 corpus、类型检查、构建门禁或交互测试。
5. 做最小可验证改动，不做无关大重构。
6. 用户可见或准备上线的改动先递增 `frontend/package.json` patch 版本，同步 `frontend/package-lock.json`，并在 `CHANGELOG.md` 顶部新开版本区块，避免一个版本堆积几十条提交。
7. 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，完成复盘沉淀，写清触发条件、反例、验证方式和适用边界，留下决策记录、回写追踪和锁定测试，并把稳定经验做规则/skill 回写。
8. 修改 `.codex/skills/*/SKILL.md` 时保留 frontmatter `name`/`description` 和四个核心章节，确保 skill 仍可发现、可迁移、可验证。
9. 运行匹配范围的验证命令，并在最终回复中说明结果。

## 常用验证命令

```bash
node scripts/ci/check-version-consistency.mjs
node scripts/ci/check-deploy-shell-syntax.mjs
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-chunk-load-recovery-catches.mjs
node scripts/ci/check-frontend-static-retention.mjs
node scripts/ci/check-production-frontend-assets.mjs https://jsonutils.markz.fun
# 用户反馈旧 chunk URL 时追加: --extra-asset https://jsonutils.markz.fun/assets/xxx.js
node scripts/ci/check-maintainability-budgets.mjs
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
- 部署 shell、GitHub shell helper、本地 CI 入口或 `.github/workflows/*.yml` 的 `workflow run` 块改动后先跑 `node scripts/ci/check-deploy-shell-syntax.mjs`，避免外层脚本、内联 run 和 `REMOTE_SCRIPT heredoc` 远端片段语法错误进入上线链路。
- 大输入处理优先走 worker、采样、预算和降级提示。
- AI 修复能力必须明确本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。
- AI 协作规则自身也要可进化：新增或修正流程后同步 Playbook、入口文档和本 skill，并通过 `node scripts/ci/check-ai-governance.mjs` 做治理校验，避免只靠人工记忆传递。
- AGENTS/CLAUDE、Cursor/Comate 这类同源入口要成对更新；AI 协作章节和核心规则片段由治理脚本做漂移检查。
- 新增 `.claude/`、`.codex/`、`.comate/` 下的 AI 协作资产时，必须纳入治理清单或显式豁免，防止 rules/skills 资产游离在门禁之外。
- 项目级 Codex skill 不是普通 Markdown 笔记；必须保持 `## 必读文件`、`## 工作流`、`## 常用验证命令`、`## 重点边界` 结构，方便后续 agent 按固定入口执行。
