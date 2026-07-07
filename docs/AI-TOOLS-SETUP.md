# AI 工具配置状态

本文记录当前项目面向 AI 编程助手的入口文件和维护方式。它不是一次性完成总结，而是帮助维护者判断“新增规则应该写到哪里、哪些文件必须同步、哪些检查必须运行”的索引。

## 当前入口

| 工具或场景 | 入口文件 | 维护方式 |
| --- | --- | --- |
| Codex / 通用 coding agent | `AGENTS.md` | 项目主入口，说明结构、技术栈、常见任务和 AI 协作边界 |
| Claude Code / Ducc | `CLAUDE.md` | 与 `AGENTS.md` 保持同源 AI 协作章节，避免工具间语义漂移 |
| Claude 配置目录 | `.claude/README.md`、`.claude/ai-tools-guide.md` | README 说明目录边界，guide 说明跨工具使用方式 |
| Codex 项目资产 | `.codex/README.md`、`.codex/skills/jsonutils-maintainer/SKILL.md` | README 解释 Codex 目录，skill 沉淀可迁移维护流程 |
| GitHub Copilot | `.github/copilot-instructions.md` | 仓库级 Copilot instructions 薄入口，转发到主规范和 Playbook |
| Cursor | `.cursorrules` | 薄入口，转发到主规范和 Playbook |
| Comate | `.comate/rules/code-style.md` | 薄入口，和 Cursor 保持共享核心片段 |
| 跨工具执行闭环 | `docs/AI-ENGINEERING-PLAYBOOK.md` | 子 Agent 委派、验证矩阵、规则进化和治理校验的权威文档 |
| 配置分层说明 | `docs/AI-CONFIG-INTEGRATION.md` | 说明入口、rules、skills、本机配置和显式豁免的关系 |
| AI 资产注册表 | `docs/AI-ASSET-REGISTRY.md` | 登记关键协作资产、治理门禁和显式豁免文件 |
| AI 治理决策账本 | `docs/AI-GOVERNANCE-DECISIONS.md` | 记录 rules、skills 和治理门禁变化的触发条件、反例、回写追踪和锁定测试 |

## 必读顺序

AI 助手开始修改代码前，应优先读取：

1. `AGENTS.md` 或 `CLAUDE.md`
2. `rules/code-style.md`
3. `docs/AI-ENGINEERING-PLAYBOOK.md`
4. 任务相关源码、测试和部署脚本
5. `CHANGELOG.md`

涉及 Codex 项目维护流程时，再读取 `.codex/README.md` 和 `.codex/skills/jsonutils-maintainer/SKILL.md`。涉及跨工具入口变更时，同时检查 `.claude/README.md`、`.claude/ai-tools-guide.md`、`.github/copilot-instructions.md`、`.cursorrules`、`.comate/rules/code-style.md`、`docs/AI-ASSET-REGISTRY.md` 和 `docs/AI-GOVERNANCE-DECISIONS.md`。

## 维护要求

新增或修改 AI 协作规则时，按以下顺序处理：

1. 判断规则是否来自重复踩坑、用户纠偏、验证缺口或可复用实践。
2. 把权威规则写入 `rules/code-style.md` 或 `docs/AI-ENGINEERING-PLAYBOOK.md`。
3. 将 Codex 可迁移流程同步到 `.codex/skills/jsonutils-maintainer/SKILL.md`。
4. 入口文件只保留必要引用，不复制长规则。
5. 更新 `docs/AI-GOVERNANCE-DECISIONS.md`、`CHANGELOG.md` 和 `docs/AI-ASSET-REGISTRY.md`。
6. 再补 `check-ai-governance` 引用规则或负向测试，让漂移可被发现。

本机私有配置不承载协作规则。`.claude/settings.local.json` 这类文件若存在，只能作为本机配置或显式豁免；需要共享的流程必须迁移到入口文档、Playbook、rules 或 skill。

## 必跑检查

修改 AI 入口、rules、skills、Playbook 或 `docs/AI-*.md` 后运行：

```bash
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-maintainability-budgets.mjs
git diff --check
```

准备提交或发布前，还要按变更范围运行：

```bash
node scripts/ci/check-version-consistency.mjs
node scripts/ci/check-deploy-shell-syntax.mjs
node scripts/ci/check-chunk-load-recovery-catches.mjs
node scripts/ci/check-frontend-static-retention.mjs
```

前端上线后运行公网资源巡检：

```bash
node scripts/ci/check-production-frontend-assets.mjs https://jsonutils.markz.fun
```

如果用户反馈旧 chunk URL，给公网资源巡检追加 `--extra-asset <url-or-path>`。

## 防漂移清单

- `AGENTS.md` 和 `CLAUDE.md` 的 AI 协作章节必须保持一致。
- `.github/copilot-instructions.md`、`.codex/README.md`、`.claude/ai-tools-guide.md`、`.cursorrules` 和 `.comate/rules/code-style.md` 的共享核心规则片段必须保持一致。
- `.github/copilot-instructions.md` 只能作为薄入口，关键规则仍以主规范、Playbook 和 skill 为准；新增 `.github/instructions/**/*.instructions.md` 路径级指令、`.github/prompts/**/*.prompt.md` prompt file、`.github/agents/**/*.agent.md` custom agent 或 `.github/chatmodes/**/*.chatmode.md` legacy chat mode 时也必须进入治理清单、引用规则或显式豁免。
- `.codex/skills/*/SKILL.md` 必须保留 frontmatter、必读文件、工作流、常用验证命令和重点边界。
- `.claude/`、`.codex/`、`.comate/`、`docs/AI-*.md` 和 `rules/ai-*.md` 新增协作资产必须进入 `docs/AI-ASSET-REGISTRY.md`、治理清单、引用规则或显式豁免。
- rules、skills 或治理脚本变更必须能从 `docs/AI-GOVERNANCE-DECISIONS.md` 和 `CHANGELOG.md` 反查触发原因与锁定测试。
- CHANGELOG 和版本文件必须通过 `check-version-consistency` 校验。

## 相关文档

- `docs/AI-CONFIG-INTEGRATION.md`: AI 配置分层和显式豁免说明。
- `docs/AI-ASSET-REGISTRY.md`: AI 协作资产账本和治理门禁登记。
- `docs/AI-GOVERNANCE-DECISIONS.md`: AI rules、skills 和治理门禁的决策账本。
- `docs/AI-ENGINEERING-PLAYBOOK.md`: AI 工程协作闭环。
- `rules/code-style.md`: 编码规范、提交规范和 CHANGELOG 要求。
- `.claude/ai-tools-guide.md`: 跨工具适配说明。
- `.codex/README.md`: Codex 项目资产说明。
