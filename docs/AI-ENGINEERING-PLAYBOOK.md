# AI 工程协作 Playbook

本文档用于让 Claude Code、Codex、Ducc 等 AI 编程助手在本项目中形成稳定的自闭环工作方式。它不替代 `AGENTS.md`、`CLAUDE.md` 和 `rules/code-style.md`，而是把“怎么判断做得对”沉淀成可执行流程。

## 目标

- 让 AI 助手先理解业务边界，再改代码。
- 让性能优化、重构和功能补充都能被测试或脚本验证。
- 让长期维护者可以从文档、测试、CHANGELOG 和构建门禁还原每次变更的意图。
- 让反复出现的协作经验完成复盘沉淀、规则/skill 回写和治理校验，推动 AI 协作资产持续进化。

## 必读顺序

1. `AGENTS.md` 或 `CLAUDE.md`: 获取项目结构、技术栈、常见任务路径。
2. `rules/code-style.md`: 获取编码风格、提交规范和 CHANGELOG 规则。
3. `docs/AI-ASSET-REGISTRY.md`: 涉及 AI 协作资产、工具入口、rules 或 skills 时确认登记和治理证据。
4. `docs/AI-GOVERNANCE-DECISIONS.md`: 涉及规则沉淀、skill 契约或治理脚本变化时确认历史决策、反例和锁定测试。
5. `ARCHITECTURE.md`: 涉及前后端边界、部署、数据流时阅读。
6. 相关源码和测试: 先找同类实现，再做最小改动。
7. `CHANGELOG.md`: 修改代码后补充用户可理解的变更记录。

## 标准执行闭环

### 0. 判断子 Agent 委派

- 遇到跨模块排查、影响面分析、复杂重构或多条验证链路并行时，先判断是否需要子 Agent 委派。
- 主线程负责拆分边界、保护上下文、整合证据和最终验证；只读调查可交给 explorer，限定写入可交给 worker，构建、测试或日志复核可交给 verifier。
- 委派任务必须说明读写范围、排除项、期望输出和未覆盖风险；子 Agent 只回传结论、证据定位、修改文件和验证结果，避免堆叠大段中间输出。
- 子 Agent 回传必须使用固定模板，包含 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`；worker 任务必须填写 `修改文件：`，证据需给出可追溯路径、行号、命令或日志定位。
- 如果当前工具不可委派，主线程应收窄 `rg`、测试和日志输出，继续完成本地闭环。

```text
任务：
结论：
证据：
修改文件：
验证：
未覆盖：
下一步建议：
```

### 1. 定义变更边界

- 先用 `git status --short --branch` 确认工作树状态。
- 用 `rg`、`rg --files`、`find` 定位相关文件，不做无关重构。
- 判断改动属于功能、Bug、性能、架构、文档还是测试。

### 2. 选择验证方式

| 变更类型 | 推荐验证 |
| --- | --- |
| JSON / Scheme 解析 | `npm run test -- src/utils/xxx.test.ts`，必要时跑 `npm run corpus:scheme` |
| 首屏性能 / 分包 | `npm run build`、`npm run check:preloads` |
| 发布恢复 / 手动懒加载 catch | `node scripts/ci/check-chunk-load-recovery-catches.mjs`，必要时追加 `npm run build`、`npm run check:preloads` |
| JSONPath / 结构导航性能 | `npm run perf:jsonpath`、相关单测 |
| Scheme 解码性能 | `npm run perf:scheme`、相关 corpus 测试 |
| 构建配置 / Vite 分包 | `npm run lint`、`npm run test -- config/xxx.test.ts`、`npm run build`、`npm run check:preloads` |
| 版本 / CHANGELOG | `node scripts/ci/check-version-consistency.mjs` |
| 前端组件交互 | 相关 Vitest 单测，必要时跑 `npm run test:e2e` |
| 后端 API | `mvn test`，并检查 `docs/BACKEND-API-MATRIX.md` |
| 部署脚本 | `node scripts/ci/check-deploy-shell-syntax.mjs`、`node scripts/ci/check-frontend-static-retention.mjs`；公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs <baseUrl>` 或远端健康检查脚本，确认深层 chunk、CSS `url(...)` 二级资源、CSS `@import` 链路可达且 JS/CSS `Content-Type` 正确 |
| AI 协作资产 | `node scripts/ci/check-ai-governance.mjs` |
| 可维护性预算 | `node scripts/ci/check-maintainability-budgets.mjs` |

### 3. 编码约束

- 优先复用现有工具函数、worker、服务层和测试风格。
- 大模块只能逐步切分，每次切分必须保持行为等价并补测试。
- 性能相关规则要抽成纯函数或脚本，避免只靠人工记忆维护。
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并用测试、脚本或可复核日志形成可验证闭环。
- 所有新增注释使用中文，且只解释边界条件或复杂业务意图。

### 4. 收尾检查

每次代码改动至少完成：

- 运行和改动范围匹配的测试或说明无法运行的原因。
- 用户可见或准备上线的改动先递增 `frontend/package.json` patch 版本、同步 `frontend/package-lock.json`，并新开顶部 `CHANGELOG.md` 版本区块，保持规范分类标题和 `- **标题**: 描述` 条目，运行 `node scripts/ci/check-version-consistency.mjs`，避免一个版本堆积几十条提交或裸 bullet 进入发布说明。
- 涉及前端 TypeScript 源码时运行 `npm run lint` 或说明未运行原因。
- 涉及手动 `import()`、懒加载 helper、`dispatchChunkLoadRecoveryEvent` 或发布恢复 catch 时运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`，确认旧 chunk 加载失败不会被业务 catch 吞掉。
- 涉及 `scripts/deploy/*.sh`、`.github/scripts/*.sh`、`scripts/ci/local-ci.sh` 或 `.github/workflows/*.yml` 的 `workflow run` 块时运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，先用 `bash -n` 拦截发布脚本语法错误，并单独检查 `REMOTE_SCRIPT heredoc` 这类远端脚本片段。
- 涉及前端 Docker、Compose、Nginx 或发布静态资源时运行 `node scripts/ci/check-frontend-static-retention.mjs`。
- 公网资源巡检不能只看 2xx；`node scripts/ci/check-production-frontend-assets.mjs <baseUrl>` 还会校验 JS/CSS `Content-Type`，并递归检查 CSS `url(...)` 二级资源和 CSS `@import` 链路，防止缺失 chunk fallback 成 HTML。排查用户反馈的旧 chunk URL 时，追加 `--extra-asset <url-or-path>` 纳入同一轮递归巡检。
- 涉及大模块或新增 helper 时运行 `node scripts/ci/check-maintainability-budgets.mjs`。
- 更新 `CHANGELOG.md` 当前版本区块。
- 用 `git diff --check` 检查空白错误。
- 最终汇报列出已验证命令和仍未覆盖的风险。

### 5. 规则进化闭环

- 遇到重复踩坑、用户纠偏、子 Agent 协作失效、验证门禁缺口或优秀实践可复用时，先做复盘沉淀，明确触发条件、反例、验证方式和适用边界。
- 能被后续 AI 复用的经验必须做规则/skill 回写：项目通用流程写入本 Playbook，Codex 项目技能写入 `.codex/skills/jsonutils-maintainer/SKILL.md`，跨工具说明同步到 `.claude/ai-tools-guide.md` 或入口文档。
- 规则回写必须写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试：决策记录说明为什么沉淀，回写追踪列出同步到哪些入口或 skill，锁定测试说明由哪个治理脚本、单测或预算规则防止退化。
- 决策账本的触发条件、反例和适用边界不能整格使用弱占位；锁定测试必须同时包含 `node --test ...test.mjs` 和 `node scripts/ci/check-ai-governance.mjs`，证明局部负例和聚合治理门禁都覆盖到。
- 规则改动必须配套治理校验：能用 `check-ai-governance` 锁定的关键词、文件引用或命令要同步加入脚本和测试，不能只依赖人工记忆。
- AI 治理、版本一致性、脚本单测和可维护性预算命令必须保留在 GitHub Actions `run:` 与 `scripts/ci/local-ci.sh` 的 `run_in_root` 可执行入口，并由 `check-ai-governance` 反查，避免门禁只存在于注释、`echo` 或手动习惯。
- AI 治理 helper 和测试都要有预算所有权：新增 `scripts/ci/aiGovernance*.mjs` 或 `scripts/ci/aiGovernance*.test.mjs` 时同步登记可维护性预算，避免治理代码和锁定测试继续膨胀。
- AI 治理 helper 还要有调用所有权：新增 `scripts/ci/aiGovernance*.mjs` 非测试脚本时，必须能从 `scripts/ci/check-ai-governance.mjs` 生产链路或 `scripts/ci/*.test.mjs` 测试链路的静态 import 图到达，避免只登记预算却无人执行。
- 同源入口文档必须成对维护：AGENTS/CLAUDE 的 AI 协作章节、Cursor/Comate 的核心规则片段由治理脚本做漂移检查，避免一边更新、一边残留旧语义。
- 项目事实不能只靠入口文档人工同步：数据库和关键主版本事实必须从后端配置、前后端依赖、前端 lock 和 Compose 文件反查到 AGENTS、CLAUDE 与 `rules/code-style.md`，由 `node scripts/ci/check-ai-governance.mjs` 锁住旧事实漂移。
- Copilot、Codex README、Claude 工具指南、Cursor 和 Comate 的薄入口共享核心规则片段由治理脚本统一检查；新增跨工具核心要求时先更新共享片段，再同步所有薄入口，避免不同助手看到不同版本的发布、委派、安全或规则进化要求。
- 共享核心规则片段必须带权威来源文件和锚点，并由 `node scripts/ci/check-ai-governance.mjs` 反查来源内容，避免薄入口复制了短句却丢失 `rules/code-style.md`、Playbook 或 skill 中的完整规则。
- 工具薄入口只保留当前执行约束和权威文档链接，不维护独立更新记录；历史追踪统一放在 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md`，避免薄入口时间线漂移。
- 新增 AI 助手入口、项目级 MCP 配置或工具配置目录文件时，必须纳入 AI 治理清单；本机私有配置和非协作资产要进入显式豁免列表，避免新增 rules/skills 资产游离在门禁之外。
- AI 资产注册表的每行登记必须维护真实有效的 `YYYY-MM-DD` 最近复核日期；变更资产、责任人、复核节奏或治理证据时同步更新日期，但不引入自动到期提醒。
- 项目级 Codex skill 必须保留可迁移契约：frontmatter 至少包含 `name`、`description`、`version` 和 `tags`，且 `name` 必须等于 skill 目录名、`version` 使用 `x.y.z` 格式、`tags` 使用非空数组；当前 `name` 与 `version` 必须在 `CHANGELOG.md` 同一条记录中可追踪，正文保留 `## 必读文件`、`## 工作流`、`## 常用验证命令` 和 `## 重点边界`，避免经验沉淀退化成不可触发、不可追踪、不可验证的散文。
- 项目级 Codex skill 的具体项目路径、fenced `cd <dir>` 工作目录、`node ...mjs` 验证脚本和 `npm run ...` 脚本必须可解析到真实目标；新增或迁移 skill 引用后运行 `node scripts/ci/check-ai-governance.mjs`，避免 skill 看似完整但实际不可执行。
- 不把一次性偏好、临时绕路或未验证猜测沉淀为规则；沉淀前先确认它能减少未来错误，并且不会和现有规范冲突。

## AI 资产维护

- `AGENTS.md`: Codex、OpenAI Codex CLI 和通用 coding agent 的项目入口。
- `CLAUDE.md`: Claude Code / Ducc 的项目入口。
- `.claude/README.md`: Claude/Ducc 配置目录索引，必须指向主入口、Playbook 和治理命令。
- `.claude/ai-tools-guide.md`: AI 工具适配说明。
- `.claude/settings.local.json`: 本机私有配置，仅作为显式豁免文件存在，不承载项目级 rules、skills 或验证流程。
- `.codex/skills/jsonutils-maintainer/SKILL.md`: Codex 可迁移的项目维护技能模板。
- `.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`: 项目级 MCP 配置，只按精确文件发现，不递归 `.cursor` 或 `.vscode` 目录。
- `.github/copilot-instructions.md`: GitHub Copilot 仓库级薄入口，必须转发到主规范、Playbook 和治理命令。
- `docs/AI-CONFIG-INTEGRATION.md`: AI 入口和规范分层说明。
- `docs/AI-TOOLS-SETUP.md`: AI 工具配置状态和维护清单。
- `docs/AI-ASSET-REGISTRY.md`: AI 协作资产、治理门禁和显式豁免文件的可审计账本。
- `docs/AI-GOVERNANCE-DECISIONS.md`: AI rules、skills 和治理门禁变更的决策记录、回写追踪与锁定测试账本。
- `docs/AI-ENGINEERING-PLAYBOOK.md`: 跨 AI 工具共享的执行闭环。

新增 AI 工具或流程时，优先更新本文件和 `.claude/ai-tools-guide.md`，避免同一规则散落在多个地方。
修改 AI 入口、Playbook 或 skill 后，运行 `node scripts/ci/check-ai-governance.mjs` 确认关键引用没有断链。
新增或调整 `.codex/skills/*/SKILL.md` 时，同一条治理校验还会检查 skill frontmatter 元数据和核心章节契约。
新增、移动或显式豁免 AI 协作资产时，还必须更新 `docs/AI-ASSET-REGISTRY.md`，让资产职责、维护契约和豁免边界可被人工审计。
新增 `.claude/`、`.codex/`、`.comate/` 下的 AI 协作资产，或新增 `.cursor/rules/**/*.mdc`、MCP 配置（`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/prompts/**/*.prompt.md`、`.github/agents/**/*.agent.md`、`.github/chatmodes/**/*.chatmode.md`、`docs/AI-*.md`、`rules/ai-*.md` 协作文档时，同一条治理校验还会检查它是否已纳入必需文件、引用规则或显式豁免。
