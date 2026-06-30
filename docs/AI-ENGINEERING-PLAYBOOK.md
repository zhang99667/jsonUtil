# AI 工程协作 Playbook

本文档用于让 Claude Code、Codex、Ducc 等 AI 编程助手在本项目中形成稳定的自闭环工作方式。它不替代 `AGENTS.md`、`CLAUDE.md` 和 `rules/code-style.md`，而是把“怎么判断做得对”沉淀成可执行流程。

## 目标

- 让 AI 助手先理解业务边界，再改代码。
- 让性能优化、重构和功能补充都能被测试或脚本验证。
- 让长期维护者可以从文档、测试、CHANGELOG 和构建门禁还原每次变更的意图。

## 必读顺序

1. `AGENTS.md` 或 `CLAUDE.md`: 获取项目结构、技术栈、常见任务路径。
2. `rules/code-style.md`: 获取编码风格、提交规范和 CHANGELOG 规则。
3. `ARCHITECTURE.md`: 涉及前后端边界、部署、数据流时阅读。
4. 相关源码和测试: 先找同类实现，再做最小改动。
5. `CHANGELOG.md`: 修改代码后补充用户可理解的变更记录。

## 标准执行闭环

### 1. 定义变更边界

- 先用 `git status --short --branch` 确认工作树状态。
- 用 `rg`、`rg --files`、`find` 定位相关文件，不做无关重构。
- 判断改动属于功能、Bug、性能、架构、文档还是测试。

### 2. 选择验证方式

| 变更类型 | 推荐验证 |
| --- | --- |
| JSON / Scheme 解析 | `npm run test -- src/utils/xxx.test.ts`，必要时跑 `npm run corpus:scheme` |
| 首屏性能 / 分包 | `npm run build`、`npm run check:preloads` |
| JSONPath / 结构导航性能 | `npm run perf:jsonpath`、相关单测 |
| Scheme 解码性能 | `npm run perf:scheme`、相关 corpus 测试 |
| 构建配置 / Vite 分包 | `npm run lint`、`npm run test -- config/xxx.test.ts`、`npm run build`、`npm run check:preloads` |
| 前端组件交互 | 相关 Vitest 单测，必要时跑 `npm run test:e2e` |
| 后端 API | `mvn test`，并检查 `docs/BACKEND-API-MATRIX.md` |
| 部署脚本 | `node scripts/ci/check-deploy-shell-syntax.mjs`、`node scripts/ci/check-frontend-static-retention.mjs`；公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs <baseUrl>` 或远端健康检查脚本，确认深层 chunk、CSS `url(...)` 二级资源、CSS `@import` 链路可达且 JS/CSS `Content-Type` 正确 |
| AI 协作资产 | `node scripts/ci/check-ai-governance.mjs` |
| 可维护性预算 | `node scripts/ci/check-maintainability-budgets.mjs` |

### 3. 编码约束

- 优先复用现有工具函数、worker、服务层和测试风格。
- 大模块只能逐步切分，每次切分必须保持行为等价并补测试。
- 性能相关规则要抽成纯函数或脚本，避免只靠人工记忆维护。
- 所有新增注释使用中文，且只解释边界条件或复杂业务意图。

### 4. 收尾检查

每次代码改动至少完成：

- 运行和改动范围匹配的测试或说明无法运行的原因。
- 涉及前端 TypeScript 源码时运行 `npm run lint` 或说明未运行原因。
- 涉及 `scripts/deploy/*.sh`、`.github/scripts/*.sh`、`scripts/ci/local-ci.sh` 或 `.github/workflows/*.yml` 的 `workflow run` 块时运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，先用 `bash -n` 拦截发布脚本语法错误，并单独检查 `REMOTE_SCRIPT heredoc` 这类远端脚本片段。
- 涉及前端 Docker、Compose、Nginx 或发布静态资源时运行 `node scripts/ci/check-frontend-static-retention.mjs`。
- 公网资源巡检不能只看 2xx；`node scripts/ci/check-production-frontend-assets.mjs <baseUrl>` 还会校验 JS/CSS `Content-Type`，并递归检查 CSS `url(...)` 二级资源和 CSS `@import` 链路，防止缺失 chunk fallback 成 HTML。排查用户反馈的旧 chunk URL 时，追加 `--extra-asset <url-or-path>` 纳入同一轮递归巡检。
- 涉及大模块或新增 helper 时运行 `node scripts/ci/check-maintainability-budgets.mjs`。
- 更新 `CHANGELOG.md` 当前版本区块。
- 用 `git diff --check` 检查空白错误。
- 最终汇报列出已验证命令和仍未覆盖的风险。

## AI 资产维护

- `AGENTS.md`: Codex、OpenAI Codex CLI 和通用 coding agent 的项目入口。
- `CLAUDE.md`: Claude Code / Ducc 的项目入口。
- `.claude/ai-tools-guide.md`: AI 工具适配说明。
- `.codex/skills/jsonutils-maintainer/SKILL.md`: Codex 可迁移的项目维护技能模板。
- `docs/AI-ENGINEERING-PLAYBOOK.md`: 跨 AI 工具共享的执行闭环。

新增 AI 工具或流程时，优先更新本文件和 `.claude/ai-tools-guide.md`，避免同一规则散落在多个地方。
修改 AI 入口、Playbook 或 skill 后，运行 `node scripts/ci/check-ai-governance.mjs` 确认关键引用没有断链。
