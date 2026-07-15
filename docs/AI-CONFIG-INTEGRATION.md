# AI 配置整合说明

本文说明项目 AI 协作资产的分层关系。目标是让规则、skills、入口文档和治理脚本形成同一套可进化系统，避免多个工具各写一份旧规范后逐渐漂移。

## 分层原则

AI 协作资产按职责分层维护：

| 层级 | 代表文件 | 职责 |
| --- | --- | --- |
| 项目入口 | `AGENTS.md`、`CLAUDE.md` | 让 AI 助手快速理解项目结构、技术栈、常见任务和协作边界 |
| 权威规范 | `rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md`、`docs/AI-EVOLUTION-PLAYBOOK.md`、`docs/AI-ASSET-REGISTRY.md`、`docs/AI-GOVERNANCE-DECISIONS.md` | 维护编码规范、验证闭环、行为评测与 outcome lineage、规则/skill 回写、资产与决策账本 |
| 工具入口 | `.claude/ai-tools-guide.md`、`.codex/README.md`、`.github/copilot-instructions.md`、`.cursorrules`、`.cursor/rules/**/*.mdc`、`.comate/rules/code-style.md` | 针对不同 AI 工具提供薄入口，转发到权威规范 |
| 项目 Agent | `.codex/agents/{explorer,worker,verifier}.toml`、`.codex/agents/ai-infra-auditor.toml`、`.claude/agents/ai-infra-auditor.md`、`.github/agents/ai-infra-auditor.agent.md` | 通用执行角色与跨客户端 AI 基建只读审计责任；锁定工具、父权限覆盖边界、写入白名单、隐私与回传模板，不以静态配置证明真实发现、委派、强隔离或零写入 |
| Codex command policy | `.codex/rules/default.rules` | trusted project 启动时加载的实验性 sandbox 外审批策略；固定 prompt-only，不新增 allow，不替代 sandbox、managed requirements、CI 或真实 runtime 证据 |
| Codex 项目 MCP | `.codex/config.toml`、`scripts/ci/aiGovernanceCodexProjectMcpConfig.mjs` | trusted project 的原生治理 MCP 主入口；固定无 shell Node bootstrap、`required=true`、根/子目录定位和 11 工具 allowlist，不触碰用户 plugin 状态 |
| 跨工具 MCP 配置 | `.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`、`scripts/mcp/*.mjs` | 管理其它项目级 MCP server 声明和固定 MCP 工具能力边界，按精确文件或 MCP 脚本发现规则进入治理，并校验 JSON 结构、命令路径和敏感字段 |
| Codex lifecycle | `.codex/hooks.json`、`.codex/hooks/session-start-governance.mjs` | 单一只读 `SessionStart` advisory；项目与定义需显式信任，固定短 timeout、闭字段、无 prompt/transcript/环境/网络/写入/阻断能力 |
| 自动化门禁 | `.github/workflows/ai-governance.yml`、`.github/workflows/ci.yml`、`scripts/ci/local-ci.sh` | 运行 CI、local-ci 和定时 AI 治理巡检，固定产出治理 artifact 并反查关键命令 |
| 项目技能 | `.agents/skills/jsonutils-maintainer/`、`.agents/skills/jsonutils-ai-infra-evolver/`、`.claude/skills/*/SKILL.md` | `.agents/skills` 是唯一可编辑语义源码；Codex/Copilot 直接发现，Claude 通过逐字节派生的普通文件薄 adapter 读取 canonical，静态入口不证明真实加载 |

原则是“权威规则只沉淀一处，工具入口只做路由和关键提醒”。常规工程流程写入 `docs/AI-ENGINEERING-PLAYBOOK.md` 或 `.agents/skills/jsonutils-maintainer/SKILL.md`；rules、skills、MCP、evals 和反馈学习写入 `docs/AI-EVOLUTION-PLAYBOOK.md` 或 `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`，再让入口文档引用它。

## 权威关系

`rules/code-style.md` 是编码规范、提交格式和 CHANGELOG 规则的权威来源。涉及代码风格、注释、Git 提交和版本说明时，以该文件为准。

`docs/AI-ENGINEERING-PLAYBOOK.md` 是 AI 工程闭环的权威来源。涉及子 Agent 委派、验证命令、规则进化、skill 回写、治理校验和显式豁免时，以该文件为准。

`docs/AI-EVOLUTION-PLAYBOOK.md` 是 AI 协作基建效果闭环的权威来源。涉及 eval corpus、outcome、feedback、provenance、scorecard 行为维度或批准回写时，以该文件和 `node scripts/ci/check-ai-evolution-evals.mjs` 为准。

`.agents/skills/jsonutils-maintainer/SKILL.md` 是 Codex 项目维护技能。它不替代 Playbook，而是把必读文件、工作流、常用验证命令和重点边界压缩成可迁移入口。

`.agents/skills/jsonutils-ai-infra-evolver/SKILL.md` 是 rules、skills、MCP、evals 与反馈学习的专用技能入口，必须使用显式 profile 和 `evals/evals.json`，不能静默回退通用契约。

`.claude/skills/jsonutils-maintainer/SKILL.md` 与 `.claude/skills/jsonutils-ai-infra-evolver/SKILL.md` 只承担 Claude 原生项目 skill 发现。两者的 name、description、canonical 相对路径和正文都由固定模板派生，必须保持普通文件并通过逐字节校验；不得独立维护版本或规则，也不得用静态 adapter 冒充 Claude 会话行为证据。

项目 Agent 契约 v1.2 保留 explorer、worker、verifier 三个通用执行角色，并增加跨 Codex/Claude/GitHub Copilot 的 `ai-infra-auditor`。auditor 三个 adapter 由 `scripts/ci/aiGovernanceProjectAiInfraAuditor.mjs` 精确派生，只读取/搜索项目治理资产并路由 canonical evolver skill，禁止写入、MCP、网络、用户配置、环境、prompt 与 transcript。客户端 sandbox/permission 只是默认值，父任务覆盖不放宽职责；新增 profile/adapter 或扩展 model、MCP、skills/tools 字段必须先补安全 case。静态契约只算 component evidence，不证明真实发现、选择、强隔离或零写入；零写入需委派前后完整 `path/type/mode/content` workspace manifest。

`.codex/hooks.json` 是项目级 Codex lifecycle 注册，不能与同层 `[hooks]` TOML 重复声明。v1.1 只允许单一 `SessionStart` event 的 `startup|resume|clear|compact` 四个 source 与固定仓内 runtime；项目必须 trusted，非 managed hook 还需审阅当前定义。它只补充治理入口提示，不替代 sandbox、approval、managed requirements、rules 或 CI；配置、runtime 直跑与单测不生成 behavior outcome，四种 source 尚未在受信任 fresh task 分别观察前保持 unknown，定义变化后需重新审阅。

`.codex/rules/default.rules` 是项目级 Codex command policy，不是插件内容或个人配置。它只对 trusted project layer 启动后提出的 sandbox 外命令请求生效，当前固定为 prompt-only，并用 `match`/`not_match` 保存引擎内联样例；静态 Node 契约只算 component evidence。真实加载与决策必须在可用 Codex binary 和新任务中用 `codex execpolicy check` 复核，不能把规则文件存在、clone/open 或治理通过称为运行时 enforcement。

`.codex/config.toml` 是本仓库 `jsonutils-governance` 的 Codex 原生项目入口，不是 plugin manifest。它以无 shell Node bootstrap 从当前根或子目录向上定位仓库，固定 `required=true`、超时与 11 项工具 allowlist。clone/open 本身不执行该配置；只有信任项目并新建任务后才能观察真实 registry。当前 upstream 源码表明同名 direct project server 优先于 plugin server，但这只是 component inference，fresh-task 验证前不作 behavior 结论；项目配置也绝不修改用户 plugin 的启停。

`docs/AI-ASSET-REGISTRY.md` 是 AI 协作资产账本。新增入口、rules、skills、治理门禁或显式豁免文件时，先在注册表登记职责和维护契约，再补自动发现、必需文件或引用规则。

`docs/AI-GOVERNANCE-DECISIONS.md` 是 AI rules、skills 和治理门禁的决策账本。规则沉淀、skill 契约或治理脚本变化时，需要写清触发条件、反例、回写追踪和锁定测试；回写追踪必须同时包含决策账本自身和 `CHANGELOG.md`。

`.claude/ai-tools-guide.md` 是跨工具说明。它面向 Claude Code、Ducc、Codex、GitHub Copilot、Cursor、Comate 等工具说明如何进入同一套规范。

## 本机配置与显式豁免

`.claude/settings.json` 是可提交的 Claude 项目共享设置；项目真正需要共享权限或 hook 时应在审计后入库。`.claude/settings.local.json` 才属于本机私有配置，不是协作资产；它可能包含本机路径、临时权限或个人工具偏好，仅作显式豁免。

不要把项目级 rules、skills、验证流程或长期协作约定写入 `.claude/settings.local.json`。需要共享的内容应迁移到 `AGENTS.md`、`CLAUDE.md`、`rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md`、`.claude/ai-tools-guide.md` 或 `.agents/skills/jsonutils-maintainer/SKILL.md`。

当前仓库中该路径仍是历史已跟踪文件；`.gitignore` 不能取消 Git index/HEAD 跟踪。只有维护者备份/复核本机配置、明确移出 index 并提交，使 index 与 HEAD 都不再包含该路径，迁移才完成；此前治理门禁保持阻断。通用治理只检查脱敏路径元数据，不读取 `settings.local.json` 正文；可公开读取的 `.claude/.gitignore` 才参与共享内容 marker 检查。

新增本机私有配置时，必须明确它是否进入 Git、是否属于协作资产、是否需要显式豁免。没有明确边界的 AI 配置文件不应默认提交。

JSONUtils 仓库本身不是 plugin，只有 `plugins/<name>/` 是独立插件包；其 source of truth 是 `.agents/plugins/marketplace.json`、`.agents/plugins/plugin-lock.json` 和 `plugins/`。`plugins/jsonutils-governance-mcp` 只是治理 MCP 的兼容/可分发包，本仓库维护者使用原生 `.codex/config.toml` 时无需安装它。Codex 可读取 repo marketplace，当前 `AVAILABLE` 条目可在刷新/重启后出现在插件目录；这只建立可发现性，不会自动写用户配置、安装、启用或热加载。先用 `node scripts/ci/manage-project-plugins.mjs --check` 诊断状态（不执行 marketplace/plugin add/remove/enable/disable 或 lock 写入），用户明确同意后才运行 `--apply`，并在新任务加载。用户目录中的 marketplace 或 cache 只是安装状态，异源或禁用冲突必须人工处理，项目配置和项目命令都不得删除、禁用或覆盖个人 selector。

工作树、Git index 与 HEAD 是三种不同分发证据：`check-ai-asset-distribution.mjs --workspace` 覆盖项目资产、AI 治理实现/测试、eval 数据和 CI/local-ci 控制面，只确认当前普通文件候选存在且未被 ignore；`--index` 与 `--head` 直接核对当前原始字节、Git blob 类型和执行位，其中 index 只证明下一次提交候选，PR/定时 CI 的 HEAD 才证明所测提交能被 clone。三者都不等价于个人插件已安装或当前任务已注册。

本机 Codex MCP 配置的敏感静态 header 审计由项目资产 `plugins/codex-mcp-config-auditor` 承担，但只允许用户本机显式运行，不把用户配置读取能力并入通用 `jsonutils-governance`。审计只返回 server 标识、字段路径、固定风险码与固定修复建议；禁止返回值、hash、长度、preview、原始解析错误和环境值。Codex 的 `http_headers` 是静态值，写成 `$TOKEN` 仍不等于环境引用，应迁移到 `env_http_headers`、`bearer_token_env_var` 或 OAuth。

## 治理校验

修改 AI 入口、rules、skills、Playbook 或 `docs/AI-*.md` 后，运行：

```bash
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-ai-evolution-evals.mjs
node scripts/ci/check-maintainability-budgets.mjs
```

`check-ai-governance` 会检查：

- 必需 AI 协作资产是否存在。
- 入口文档是否引用权威规范和关键验证命令。
- AGENTS/CLAUDE、Cursor/Comate 这类同源入口是否漂移。
- `.agents/skills/*/` 是否保持唯一可编辑语义源码、官方 metadata/UI 契约且没有 `.codex/skills/` 同名副本；`.claude/skills/*/SKILL.md` 是否仍是普通文件、固定模板和精确 canonical 映射。
- 项目 Agent 是否只包含固定的三个通用执行角色与三端 `ai-infra-auditor` adapter，且保持精确文件、闭字段/工具、只读职责、隐私和固定回传模板契约。
- `.codex/rules/default.rules` 是否保持 canonical prompt-only policy、普通文件、inline examples 与 component-only 证据边界。
- `.codex/config.toml` 是否保持 canonical 普通文件、无 shell 根/子目录 bootstrap、`required=true`、固定超时与 11 工具 allowlist。
- 必需文件、自动发现资产和显式豁免文件是否登记到 `docs/AI-ASSET-REGISTRY.md`。
- `docs/AI-*.md` 索引是否能指向 `docs/AI-GOVERNANCE-DECISIONS.md`，避免决策账本游离在入口之外。
- `.claude/`、`.codex/`、`.cursor/rules/**/*.mdc`、MCP 配置（`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`.comate/`、`.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/prompts/**/*.prompt.md`、`.github/agents/**/*.agent.md`、`.github/chatmodes/**/*.chatmode.md`、`docs/AI-*.md` 和 `rules/ai-*.md` 新增资产是否进入治理清单、引用规则或显式豁免。
- 跨工具 MCP JSON 配置是否声明 `mcpServers` 或 `servers`，每个 server 是否声明 `command` 或 `url`，是否避免 shell 包装命令、仓库外路径、缺失脚本和敏感字段明文。
- 本地治理 MCP server 是否严格拒绝畸形 UTF-8，按 newline-delimited JSON-RPC 有序维护 initialize → initialized notification → operation，协商版本并拒绝越序工具调用和重复 initialize；ready 后普通请求是否以 typed ID 异步执行，`notifications/cancelled` 能否抢占长工具、透传 AbortSignal、抑制原请求响应并在断开时回收全部子进程；initialize 是否对所有支持版本返回不超过 512 bytes 的固定 server-wide instructions，保留只读 annotations、结构化输出与固定 evaluation summary，并继续禁止任意 shell、通用路径读取和写入；wire response 不能冒充客户端注入、runtime trust 或 Agent 遵循。
- `evals/ai-governance/cases.json` 与 `evals/ai-governance/outcomes.jsonl` 是否通过结构、脱敏、provenance 和真实 validation result 校验。
- CI 和 local-ci 是否固定运行 AI 治理产物脚本，避免治理 JSON 与预算 JSON 只停留在手工调试命令里。
- 定时 AI 治理 workflow 是否保留 schedule、workflow_dispatch、治理脚本单测、MCP 测试和 artifact 上传。

## 维护流程

新增 AI 工具或入口时：

1. 先判断它是协作资产、本机私有配置，还是一次性说明。
2. 协作资产先登记到 `docs/AI-ASSET-REGISTRY.md`，再进入必需文件清单和引用规则。
3. 本机私有配置进入显式豁免，并在文档里说明边界。
4. 可复用经验写入 Playbook 或 skill，并登记到 `docs/AI-GOVERNANCE-DECISIONS.md` 与 `CHANGELOG.md`。
5. 同步薄入口和 `docs/AI-ASSET-REGISTRY.md`。
6. 补治理脚本或负向测试，让后续漂移被 CI 拦住。

如果只是临时实验记录，不要放进 AI 协作资产目录；需要保留时应标注状态，并在稳定后转成规则、skill 或删除。
