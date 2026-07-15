# Codex 项目配置

本目录存放 Codex 的项目级配置、agent profiles、hooks、command rules 和说明；项目 skills 的唯一源码位于 `.agents/skills/`，由 Codex 在仓库上下文中直接发现。

仓库本身仍是 JSONUtils 项目，只有 `plugins/<name>/` 是可分发 plugin package。受信任项目以 `.codex/config.toml` 作为 `jsonutils-governance` 的 Codex 原生主入口：无 shell Node bootstrap 支持从仓库根或子目录启动，`required=true` 且只开放固定 11 个工具，无需先安装治理 MCP 插件。clone/open 本身不执行配置，仍需信任项目并新建任务；项目配置也不修改用户的 plugin 启停状态。项目插件以 `.agents/plugins/marketplace.json`、`.agents/plugins/plugin-lock.json` 和 `plugins/` 为版本化 source of truth；`AVAILABLE` catalog 可见不等于自动安装、启用或加载。先运行 `node scripts/ci/manage-project-plugins.mjs --check`，明确同意后才用 `--apply`；用户 marketplace/cache 只是派生状态。

## 内容

- `.agents/skills/jsonutils-maintainer/SKILL.md`: JSONUtils 项目维护技能，用于让 Codex 在性能优化、重构、Scheme 解析和部署排查时走统一闭环。
- `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`: AI 协作基建演进技能，用于 rules、skills、MCP、evals、outcomes 和反馈学习，不接管普通产品功能。
- `config.toml`: trusted project 的 Codex 原生 MCP 入口，以无 shell Node bootstrap 向上定位项目根，固定 `required=true`、启动超时、工具超时和 11 项 allowlist。
- `agents/explorer.toml`、`agents/worker.toml`、`agents/verifier.toml`: 三个通用执行 profile，分别承担只读调查、白名单实现和只验证不修复。
- `agents/ai-infra-auditor.toml`: AI 基建专项只读审计 profile，与 Claude/GitHub Copilot 同名 adapter 精确同源，统一路由 canonical evolver skill。
- `hooks.json`、`hooks/session-start-governance.mjs`: 单一只读 `SessionStart` 治理 handoff，固定有界 context，不读取敏感 lifecycle 正文或扩大执行能力。
- `rules/default.rules`: trusted project 启动时读取的实验性 sandbox 外审批策略；只增加 `prompt`，不增加 `allow`，覆盖 Git 写操作、插件生命周期、治理 writer、validation executor 与 opaque shell wrapper。

## 使用方式

当前项目以根目录 `AGENTS.md` 作为通用入口，并以 `.agents/skills/` 作为项目 skill 的唯一版本化 source。维护者 clone 后无需把 skills 或治理 MCP 复制到个人目录；信任项目并新建任务后由项目发现。不要再在 `.codex/skills/` 放同名副本，否则当前 Codex 会把两份 skill 同时注入。

分发证据不要混用：全集覆盖项目 AI 资产、治理实现/测试、eval 数据和 CI/local-ci 控制面；本地 `node scripts/ci/check-ai-asset-distribution.mjs --workspace` 要求当前普通文件候选存在且未 ignore，暂存后的 `--index` 与 PR/定时 CI 的 `--head` 直接核对当前原始字节、Git blob 类型和执行位，只有 HEAD 证明所测提交可 clone；插件安装状态仍由 `manage-project-plugins.mjs --check` 独立诊断。

维护规则：

- 项目工程规则以 `AGENTS.md`、`CLAUDE.md`、`rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md` 和 `docs/AI-ASSET-REGISTRY.md` 为准。
- AI 基建效果闭环以 `docs/AI-EVOLUTION-PLAYBOOK.md` 为准；运行 `node scripts/ci/check-ai-evolution-evals.mjs`，没有真实 outcome 时不把静态治理当成行为通过。
- 项目源码、trusted project config 加载、marketplace 可发现、插件安装/启用、新任务实际注册与 runtime/signer 分开取证；`.codex/config.toml` 是 Codex 的项目原生入口，`plugins/jsonutils-governance-mcp@0.2.1` 只保留为兼容分发包。当前 upstream 源码表明同名 direct config 优先于 plugin server，但这仍只是 component inference；在 fresh task 实际观察前保持 behavior unknown。
- 项目插件 `plugins/codex-mcp-config-auditor@0.2.1` 只在用户本机显式运行时审计敏感静态 MCP header 名称；返回值固定不含配置值、hash、长度、preview、原始错误或环境值。源码与测试是项目资产，本机 finding 不是行为通过证据。
- 真实 Codex trial 前先运行 `node scripts/ci/run-ai-evolution-cases.mjs --case codex-external-controller-topology-boundary --json` 锁定 external-controller topology 组件契约；case 通过仍不代表真实容器、mount、网络或 signer 已隔离。
- 项目插件 0.5.0 的三 fake workload runtime probe 使用 `node scripts/ci/run-ai-evolution-cases.mjs --case codex-external-controller-runtime-probe-boundary --json` 锁定本机安装副本自报边界；审核镜像政策落地前禁用 runtime，`not-run` 或未来的 `passed-subset` 都不证明 runtime/controller/user namespace/signer 隔离，不产生 outcome。
- macOS Seatbelt v2 使用对应 case 锁 OpenAI code identity、source 零变更与 disposable mirror；attested preflight case 再锁双角色 DSSE、七角色 UID/GID/namespace、派生 state/challenge 与 pre-runtime 注入。仓内 Node 的 root-owned path candidate 仍只算 component；受保护 launcher/service 未落地前不启动 registration trial。
- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。
- 涉及 `scripts/deploy/*.sh`、`.github/scripts/*.sh`、`scripts/ci/local-ci.sh` 或 `.github/workflows/*.yml` 的 `workflow run` 块时，需要运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，先用 `bash -n` 拦截外层脚本、内联 run 和 `REMOTE_SCRIPT heredoc` 远端片段语法错误。
- 涉及手动懒加载 `import()`、相关 catch 或 `dispatchChunkLoadRecoveryEvent` 时，需要运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`，避免旧 chunk 加载失败被业务 catch 吞掉。
- 涉及前端 Docker、Compose、Nginx 或静态资源发布策略时，需要运行 `node scripts/ci/check-frontend-static-retention.mjs`，确认旧 hash assets 保留机制未失效。
- 公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs <baseUrl>`，确认当前入口 HTML、main/admin JS、CSS `url(...)` 引用和 CSS `@import` 链路里的静态资源都能访问，并校验 JS/CSS `Content-Type` 没有被 fallback 成 HTML 伪装成成功。
- 用户反馈旧 chunk URL 时，给公网资源巡检追加 `--extra-asset <url-or-path>` 纳入同一轮 404 和 MIME 诊断。
- 跨模块排查、复杂重构或多条验证链路并行时先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
- Codex 通用执行委派优先路由 explorer、worker、verifier；AI 基建专项只读审计可路由 `ai-infra-auditor`。客户端权限配置只是默认值，父任务覆盖不放宽职责；auditor 禁止写入、MCP、网络和用户级上下文。静态 profile/adapter 只算 component evidence，不证明真实选择、强隔离或零写入；零写入必须比较完整 workspace manifest。
- Codex project hook 只允许 `.codex/hooks.json` 的单一 `SessionStart` event，source 限 `startup|resume|clear|compact`；项目与当前定义都需显式信任，禁止 bypass trust、其它事件、prompt/transcript/环境读取、网络、写入和阻断。配置、runtime 直跑与单测只算 component evidence，四种 source 尚未在受信任 fresh task 分别观察前 behavior 为 unknown。
- Codex project command rules 只允许 `.codex/rules/default.rules` 的 canonical prompt-only policy。它仅在项目 `.codex/` layer 受信任且新任务启动加载后约束 sandbox 外执行请求；运行 `node --test scripts/ci/aiGovernanceCodexCommandRules.test.mjs` 和 component case 只证明仓库契约。Codex binary 可用时再用 `codex execpolicy check --pretty --rules .codex/rules/default.rules -- <command>` 验证引擎决策，不能把静态测试、clone/open 或当前任务热加载冒充 runtime behavior。
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。
- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验。
- 项目级 skill 必须保留可迁移结构：frontmatter 使用 `name`、`description` 与 `metadata.version`/`metadata.tags`，`agents/openai.yaml` 提供 UI 元数据，正文保留 `## 必读文件`、`## 工作流`、`## 常用验证命令` 和 `## 重点边界`，让 Codex 能稳定发现、触发、版本化和执行。
- 修改 `.codex/` 或 `.agents/skills/` 后，同步更新 `.claude/ai-tools-guide.md`，保持 Claude Code 与 Codex 的上下文一致，并运行 `node scripts/ci/check-ai-governance.mjs` 和 `node scripts/ci/check-maintainability-budgets.mjs`。
