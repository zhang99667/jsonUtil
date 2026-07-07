# AI 配置整合说明

本文说明项目 AI 协作资产的分层关系。目标是让规则、skills、入口文档和治理脚本形成同一套可进化系统，避免多个工具各写一份旧规范后逐渐漂移。

## 分层原则

AI 协作资产按职责分层维护：

| 层级 | 代表文件 | 职责 |
| --- | --- | --- |
| 项目入口 | `AGENTS.md`、`CLAUDE.md` | 让 AI 助手快速理解项目结构、技术栈、常见任务和协作边界 |
| 权威规范 | `rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md`、`docs/AI-ASSET-REGISTRY.md`、`docs/AI-GOVERNANCE-DECISIONS.md` | 维护编码规范、验证闭环、规则/skill 回写、资产账本、决策账本和收尾门禁 |
| 工具入口 | `.claude/ai-tools-guide.md`、`.codex/README.md`、`.github/copilot-instructions.md`、`.cursorrules`、`.cursor/rules/**/*.mdc`、`.comate/rules/code-style.md` | 针对不同 AI 工具提供薄入口，转发到权威规范 |
| 工具配置 | `.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json` | 管理项目级 MCP server 能力边界，按精确文件进入治理，不递归 IDE 配置目录 |
| 可迁移技能 | `.codex/skills/jsonutils-maintainer/SKILL.md` | 将项目维护流程封装为可复用 skill，方便 Codex 在类似任务中稳定触发 |

原则是“权威规则只沉淀一处，工具入口只做路由和关键提醒”。如果某条经验要长期生效，优先写入 `docs/AI-ENGINEERING-PLAYBOOK.md` 或 `.codex/skills/jsonutils-maintainer/SKILL.md`，再让入口文档引用它。

## 权威关系

`rules/code-style.md` 是编码规范、提交格式和 CHANGELOG 规则的权威来源。涉及代码风格、注释、Git 提交和版本说明时，以该文件为准。

`docs/AI-ENGINEERING-PLAYBOOK.md` 是 AI 工程闭环的权威来源。涉及子 Agent 委派、验证命令、规则进化、skill 回写、治理校验和显式豁免时，以该文件为准。

`.codex/skills/jsonutils-maintainer/SKILL.md` 是 Codex 项目维护技能模板。它不替代 Playbook，而是把必读文件、工作流、常用验证命令和重点边界压缩成可迁移入口。

`docs/AI-ASSET-REGISTRY.md` 是 AI 协作资产账本。新增入口、rules、skills、治理门禁或显式豁免文件时，先在注册表登记职责和维护契约，再补自动发现、必需文件或引用规则。

`docs/AI-GOVERNANCE-DECISIONS.md` 是 AI rules、skills 和治理门禁的决策账本。规则沉淀、skill 契约或治理脚本变化时，需要写清触发条件、反例、回写追踪和锁定测试，并同步 `CHANGELOG.md`。

`.claude/ai-tools-guide.md` 是跨工具说明。它面向 Claude Code、Ducc、Codex、GitHub Copilot、Cursor、Comate 等工具说明如何进入同一套规范。

## 本机配置与显式豁免

`.claude/settings.local.json` 属于本机私有配置，不是协作资产。它可能包含本机路径、临时权限或个人工具偏好，因此仅作为显式豁免文件存在。

不要把项目级 rules、skills、验证流程或长期协作约定写入 `.claude/settings.local.json`。需要共享的内容应迁移到 `AGENTS.md`、`CLAUDE.md`、`rules/code-style.md`、`docs/AI-ENGINEERING-PLAYBOOK.md`、`.claude/ai-tools-guide.md` 或 `.codex/skills/jsonutils-maintainer/SKILL.md`。

新增本机私有配置时，必须明确它是否进入 Git、是否属于协作资产、是否需要显式豁免。没有明确边界的 AI 配置文件不应默认提交。

## 治理校验

修改 AI 入口、rules、skills、Playbook 或 `docs/AI-*.md` 后，运行：

```bash
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-maintainability-budgets.mjs
```

`check-ai-governance` 会检查：

- 必需 AI 协作资产是否存在。
- 入口文档是否引用权威规范和关键验证命令。
- AGENTS/CLAUDE、Cursor/Comate 这类同源入口是否漂移。
- `.codex/skills/*/SKILL.md` 是否保留可迁移契约。
- 必需文件、自动发现资产和显式豁免文件是否登记到 `docs/AI-ASSET-REGISTRY.md`。
- `docs/AI-*.md` 索引是否能指向 `docs/AI-GOVERNANCE-DECISIONS.md`，避免决策账本游离在入口之外。
- `.claude/`、`.codex/`、`.cursor/rules/**/*.mdc`、MCP 配置（`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json`）、`.comate/`、`.github/instructions/**/*.instructions.md`、`.github/prompts/**/*.prompt.md`、`.github/agents/**/*.agent.md`、`.github/chatmodes/**/*.chatmode.md`、`docs/AI-*.md` 和 `rules/ai-*.md` 新增资产是否进入治理清单、引用规则或显式豁免。

## 维护流程

新增 AI 工具或入口时：

1. 先判断它是协作资产、本机私有配置，还是一次性说明。
2. 协作资产先登记到 `docs/AI-ASSET-REGISTRY.md`，再进入必需文件清单和引用规则。
3. 本机私有配置进入显式豁免，并在文档里说明边界。
4. 可复用经验写入 Playbook 或 skill，并登记到 `docs/AI-GOVERNANCE-DECISIONS.md` 与 `CHANGELOG.md`。
5. 同步薄入口和 `docs/AI-ASSET-REGISTRY.md`。
6. 补治理脚本或负向测试，让后续漂移被 CI 拦住。

如果只是临时实验记录，不要放进 AI 协作资产目录；需要保留时应标注状态，并在稳定后转成规则、skill 或删除。
