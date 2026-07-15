# JSONUtils 专业版 - AI 助手指引

本文件是 Codex/Ducc 的项目入口，只保留任务开始时必须知道的地图和不变量；详细协议不在入口重复展开。

## 必读顺序

1. `AGENTS.md`：项目地图与不可违反的协作边界。
2. `rules/code-style.md`：编码、提交、发布和 CHANGELOG 规范。
3. `docs/AI-ENGINEERING-PLAYBOOK.md`：按改动类型选择执行与验证闭环。
4. 涉及 rules、skills、MCP、plugins、hooks、evals 或治理成熟度时，再读 `docs/AI-EVOLUTION-PLAYBOOK.md`。
5. 变更 AI 协作资产时，按需查询 `docs/AI-ASSET-REGISTRY.md` 和 `docs/AI-GOVERNANCE-DECISIONS.md`；不要把两个历史账本全量注入普通任务。
6. 涉及架构、部署或数据流时读 `ARCHITECTURE.md` 和相关源码/测试。

## 项目地图

- 前端：`frontend/`，React 19、Vite 6、TypeScript 5、Tailwind CSS 3；管理后台使用 Ant Design 6，编辑器封装为 @monaco-editor/react 4，Electron 入口位于 `frontend/electron/`。
- 后端：`backend/`，Spring Boot 3、Java 17、Spring Data JPA + PostgreSQL、Spring Security。
- 业务核心：`frontend/src/components/`、`frontend/src/utils/transformations.ts`、`frontend/src/services/aiService.ts`、`frontend/src/admin/`。
- AI 协作资产：`.agents/skills/`、`.codex/`、`.claude/agents/`、`.github/agents/`、`.mcp.json`、`plugins/`、`evals/ai-governance/`、`rules/`、`docs/AI-*.md` 与 `scripts/ci/aiGovernance*.mjs`。

## AI 协作与子 Agent 委派

- 跨模块排查、影响面分析、复杂重构或多条验证链路并行时，先判断是否需要子 Agent 委派；委派任务说明读写范围、排除项、期望输出和未覆盖风险，只读调查优先交给默认 `read-only` 的 explorer，限定写入交给 worker，构建/测试复核交给 verifier。profile 的 `sandbox_mode` 只是角色默认值，父任务实时 permission override 可能重新应用；无论实际权限如何都必须遵守角色职责。主线程负责拆分边界、保护上下文、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
- AI 基建专项只读审计可路由项目 `ai-infra-auditor`：Codex、Claude 和 GitHub Copilot 分别使用 `.codex/agents/`、`.claude/agents/`、`.github/agents/` 中的同名 adapter，统一读取 `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`。它不编辑文件、不调用 MCP 或网络，也不读用户配置、环境、prompt 或 transcript。
- 静态 profile/adapter、角色选择或有界状态样本都不证明强隔离或零写入；需要声称子 Agent 零写入时，主线程必须比较委派前后完整 `path/type/mode/content` workspace manifest。
- 子 Agent 只回传 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`，不堆大段中间日志；worker 只写父任务白名单，verifier 不修改源码。
- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，更新 `docs/AI-GOVERNANCE-DECISIONS.md` 的决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验；一次性偏好和未验证猜测不固化。
- JSONUtils AI 基建必须入库并以项目为 source of truth。仓库不是 plugin，只有 `plugins/<name>/` 是插件包。受信任项目的 `.codex/config.toml` 直接注册固定治理 MCP；维护者 clone 后需信任项目并新建任务，但不需先安装治理 MCP 插件。`.agents/plugins/marketplace.json` 只是 repo catalog；`AVAILABLE` 不会自动安装、启用或加载插件。`.agents/skills/` 是唯一可编辑 skill 语义源码，`.claude/skills/*/SKILL.md` 只是由它逐字节派生的项目发现适配器，静态存在不证明 Claude 已真实选择或加载。先运行 `node scripts/ci/manage-project-plugins.mjs --check`，维护者明确同意后才 `--apply`；个人 cache/config 只是派生状态。
- 项目源码、trusted project config 加载、marketplace 可发现、插件安装/启用、新任务实际注册、受保护 runtime/signer 是六层独立证据；配置存在或安装成功都不证明 task/runtime/signer trust。不得从 hook、CI 或 postinstall 静默安装、覆盖异源或删除个人 selector。
- AI 基建先建代表 case；只有脱敏、可追溯且与当前版本匹配的真实 outcome 才能评分。component evidence、未验信 trace 或静态契约不得冒充 behavior 通过；没有 outcome 时保持 `unknown`。
- Codex 项目 lifecycle 只允许 `.codex/hooks.json` 的单一只读 `SessionStart` advisory，source 限 `startup|resume|clear|compact`；项目与定义都需显式信任，不得读取 prompt/transcript/环境、联网、写入、阻断或绕过 trust，组件回归不证明真实 lifecycle 触发。
- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。

## 实现与收尾不变量

- 修改前先看 `git status --short --branch`、相关约束、同类实现和测试；保护用户及其它 Agent 的现有改动，只做任务范围内的最小变更。
- TypeScript/React 使用函数组件与 Hooks，避免 `any`；Java 保持 Controller → Service → Repository 分层；代码注释使用中文。
- API 统一返回 `code`、`message`、`data`；前端错误使用现有 toast，后端异常走统一处理器。
- 每次代码修改同步更新 `CHANGELOG.md`；内部 AI 基建若不影响前端产物，不递增前端版本。
- 验证强度与风险相称：优先跑相关单测，再跑类型/lint/构建或专项门禁；失败、跳过和未覆盖风险必须如实报告。
- AI 资产修改至少运行：

```bash
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all
node scripts/ci/check-ai-asset-distribution.mjs --workspace
```

- 准备提交时由维护者暂存目标文件后运行 `--index`；PR/定时 CI 用 `--head`。未经明确授权，不 stage、commit、push、安装插件或写 outcome/receipt ledger。
