# AI 配置整合说明

本文说明项目 AI 协作资产的分层关系。目标是让规则、skills、入口文档和治理脚本形成同一套可进化系统，避免多个工具各写一份旧规范后逐渐漂移。

## 分层原则

AI 协作资产按职责分层维护：

| 层级 | 代表文件 | 职责 |
| --- | --- | --- |
| 项目入口 | `AGENTS.md`、`CLAUDE.md` | 让 AI 助手快速理解项目结构、技术栈、常见任务和协作边界 |
| 权威规范 | `rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md`、`docs/AI-EVOLUTION-PLAYBOOK.md`、`docs/AI-ASSET-REGISTRY.md`、`docs/AI-GOVERNANCE-DECISIONS.md` | 维护编码规范、验证闭环、行为评测与 outcome lineage、规则/skill 回写、资产与决策账本 |
| 工具入口 | `.claude/ai-tools-guide.md`、`.codex/README.md`、`.github/copilot-instructions.md`、`.cursorrules`、`.cursor/rules/**/*.mdc`、`.comate/rules/code-style.md` | 针对不同 AI 工具提供薄入口，转发到权威规范 |
| 项目 Specialist | `.codex/agents/explorer.toml`、`.codex/agents/worker.toml`、`.codex/agents/verifier.toml` | 固定 Codex 子 Agent 的职责、sandbox、写入白名单前置条件、隐私与回传模板；不以配置存在性证明真实委派效果 |
| 工具配置 | `.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`、`scripts/mcp/*.mjs` | 管理项目级 MCP server 和固定 MCP 工具能力边界，按精确文件或 MCP 脚本发现规则进入治理，并校验 JSON 结构、命令路径和敏感字段 |
| Codex lifecycle | `.codex/hooks.json`、`.codex/hooks/session-start-governance.mjs` | 单一只读 `SessionStart` advisory；项目与定义需显式信任，固定短 timeout、闭字段、无 prompt/transcript/环境/网络/写入/阻断能力 |
| 自动化门禁 | `.github/workflows/ai-governance.yml`、`.github/workflows/ci.yml`、`scripts/ci/local-ci.sh` | 运行 CI、local-ci 和定时 AI 治理巡检，固定产出治理 artifact 并反查关键命令 |
| 项目技能 | `.agents/skills/jsonutils-maintainer/`、`.agents/skills/jsonutils-ai-infra-evolver/` | 唯一版本化源码；SKILL、eval 与 `agents/openai.yaml` 分别封装常规维护和 AI 基建演进流程，Codex 在仓库新任务中直接发现 |

原则是“权威规则只沉淀一处，工具入口只做路由和关键提醒”。常规工程流程写入 `docs/AI-ENGINEERING-PLAYBOOK.md` 或 `.agents/skills/jsonutils-maintainer/SKILL.md`；rules、skills、MCP、evals 和反馈学习写入 `docs/AI-EVOLUTION-PLAYBOOK.md` 或 `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`，再让入口文档引用它。

## 权威关系

`rules/code-style.md` 是编码规范、提交格式和 CHANGELOG 规则的权威来源。涉及代码风格、注释、Git 提交和版本说明时，以该文件为准。

`docs/AI-ENGINEERING-PLAYBOOK.md` 是 AI 工程闭环的权威来源。涉及子 Agent 委派、验证命令、规则进化、skill 回写、治理校验和显式豁免时，以该文件为准。

`docs/AI-EVOLUTION-PLAYBOOK.md` 是 AI 协作基建效果闭环的权威来源。涉及 eval corpus、outcome、feedback、provenance、scorecard 行为维度或批准回写时，以该文件和 `node scripts/ci/check-ai-evolution-evals.mjs` 为准。

`.agents/skills/jsonutils-maintainer/SKILL.md` 是 Codex 项目维护技能。它不替代 Playbook，而是把必读文件、工作流、常用验证命令和重点边界压缩成可迁移入口。

`.agents/skills/jsonutils-ai-infra-evolver/SKILL.md` 是 rules、skills、MCP、evals 与反馈学习的专用技能入口，必须使用显式 profile 和 `evals/evals.json`，不能静默回退通用契约。

`.codex/agents/*.toml` 是项目级 Codex specialist 契约。v1 只允许 explorer、worker、verifier 三个闭字段 profile：explorer 只读，worker 只写父任务白名单，verifier 的可写 sandbox 只服务测试临时/忽略产物且禁止修复源码；新增 profile 或扩展 model、MCP、skills 字段必须先补安全 case。静态 profile 测试只算 component evidence，真实行为仍需可验证委派 trace/outcome。

`.codex/hooks.json` 是项目级 Codex lifecycle 注册，不能与同层 `[hooks]` TOML 重复声明。v1 只允许 `SessionStart` 的 `startup|resume` 与固定仓内 runtime；项目必须 trusted，非 managed hook 还需审阅当前定义。它只补充治理入口提示，不替代 sandbox、approval、managed requirements、rules 或 CI；配置/单测不生成 behavior outcome，定义变化后需重新审阅。

`docs/AI-ASSET-REGISTRY.md` 是 AI 协作资产账本。新增入口、rules、skills、治理门禁或显式豁免文件时，先在注册表登记职责和维护契约，再补自动发现、必需文件或引用规则。

`docs/AI-GOVERNANCE-DECISIONS.md` 是 AI rules、skills 和治理门禁的决策账本。规则沉淀、skill 契约或治理脚本变化时，需要写清触发条件、反例、回写追踪和锁定测试；回写追踪必须同时包含决策账本自身和 `CHANGELOG.md`。

`.claude/ai-tools-guide.md` 是跨工具说明。它面向 Claude Code、Ducc、Codex、GitHub Copilot、Cursor、Comate 等工具说明如何进入同一套规范。

## 本机配置与显式豁免

`.claude/settings.local.json` 属于本机私有配置，不是协作资产。它可能包含本机路径、临时权限或个人工具偏好，因此仅作为显式豁免文件存在。

不要把项目级 rules、skills、验证流程或长期协作约定写入 `.claude/settings.local.json`。需要共享的内容应迁移到 `AGENTS.md`、`CLAUDE.md`、`rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md`、`.claude/ai-tools-guide.md` 或 `.agents/skills/jsonutils-maintainer/SKILL.md`。

新增本机私有配置时，必须明确它是否进入 Git、是否属于协作资产、是否需要显式豁免。没有明确边界的 AI 配置文件不应默认提交。

JSONUtils 仓库本身不是 plugin，只有 `plugins/<name>/` 是独立插件包；其 source of truth 是 `.agents/plugins/marketplace.json`、`.agents/plugins/plugin-lock.json` 和 `plugins/`。clone/open 只取得项目内插件目录清单、content lock 与源码，不自动写用户配置；先用 `node scripts/ci/manage-project-plugins.mjs --check` 诊断状态（不执行 marketplace/plugin add/remove/enable/disable 或 lock 写入），用户明确同意后才运行 `--apply`，并在新任务加载。用户目录中的 marketplace 或 cache 只是安装状态，异源或禁用冲突必须人工处理，项目命令不得删除个人 selector。

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
- `.agents/skills/*/` 是否保持唯一项目源码、官方 metadata/UI 契约且没有 `.codex/skills/` 同名副本。
- `.codex/agents/` 是否只包含固定 explorer、worker、verifier，且保持闭字段、sandbox、职责、隐私和固定回传模板契约。
- 必需文件、自动发现资产和显式豁免文件是否登记到 `docs/AI-ASSET-REGISTRY.md`。
- `docs/AI-*.md` 索引是否能指向 `docs/AI-GOVERNANCE-DECISIONS.md`，避免决策账本游离在入口之外。
- `.claude/`、`.codex/`、`.cursor/rules/**/*.mdc`、MCP 配置（`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`.comate/`、`.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/prompts/**/*.prompt.md`、`.github/agents/**/*.agent.md`、`.github/chatmodes/**/*.chatmode.md`、`docs/AI-*.md` 和 `rules/ai-*.md` 新增资产是否进入治理清单、引用规则或显式豁免。
- 项目级 MCP 配置是否为合法 JSON，是否声明 `mcpServers` 或 `servers`，每个 server 是否声明 `command` 或 `url`，是否避免 shell 包装命令、仓库外路径、缺失脚本和敏感字段明文。
- 本地治理 MCP server 是否按 newline-delimited JSON-RPC 协商版本，保留只读 annotations、结构化输出与固定 evaluation summary，并继续禁止任意 shell 和通用路径读取。
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
