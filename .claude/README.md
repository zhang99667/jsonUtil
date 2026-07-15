# AI 工具配置目录

本目录包含针对 Claude Code 等 AI 编程助手的配置和文档。

## 文件说明

### ai-tools-guide.md
AI 工具使用指南，包含:
- 支持的 AI 工具列表
- 各工具的配置方法
- 使用建议和最佳实践
- 文档维护指南

## 目录用途

`.claude/` 目录是 Claude Code 的项目配置目录:

- **memory/**: AI 的持久化记忆文件 (跨会话保留)
- **settings.json**: 项目共享设置，需共享时审计后提交到 Git
- **settings.local.json**: 本机私有配置，仅作显式豁免，不承载项目协作规则
- **skills/**: 提交到 Git 的 Claude 项目 skill 发现适配器；由 `.agents/skills/` 唯一语义源码按固定模板派生，不独立维护规则
- **agents/**: 提交到 Git 的 Claude 项目 Agent；`ai-infra-auditor.md` 只读审计 AI 基建并路由 canonical evolver skill
- **session-history/**: 会话历史 (不提交到 Git)
- **ai-tools-guide.md**: AI 工具使用文档 (提交到 Git)

## Git 版本控制

- ✅ **提交**: 文档文件 (*.md)
- ✅ **提交**: `.claude/skills/*/SKILL.md` 派生适配器，并由治理脚本逐字节校验
- ✅ **提交**: `.claude/agents/*.md` 项目 Agent 契约
- ✅ **提交**: `.claude/settings.json` 项目共享设置（存在时）
- ✅ **提交**: 记忆文件 (memory/)
- ❌ **显式豁免**: 本机私有配置 (.claude/settings.local.json)，不要把项目级 rules、skills 或验证流程写入该文件
- ❌ **忽略**: 会话历史 (session-history/)
- ❌ **忽略**: 临时文件 (tmp/, *.log)

迁移尚未完成：当前历史 Git index 与 HEAD 仍跟踪 `.claude/settings.local.json`。ignore 只影响未跟踪文件，不会取消已跟踪状态；在维护者备份/复核本机配置、明确授权执行 `git rm --cached -- .claude/settings.local.json` 并提交该删除前，治理门禁保持阻断。项目治理只读取该路径的 Git 元数据，不读取本机私有正文。

## 相关文件

- `AGENTS.md` - Codex、OpenAI Codex CLI 和通用 coding agent 的项目入口
- `/CLAUDE.md` - Claude Code 的主要项目指引文件
- `rules/code-style.md` - 编码风格、提交格式和 CHANGELOG 要求
- `docs/AI-ENGINEERING-PLAYBOOK.md` - AI 工程闭环、规则/skill 回写和治理校验流程
- `docs/AI-ASSET-REGISTRY.md` - AI 协作资产、治理证据和显式豁免账本
- `.claude/ai-tools-guide.md` - Claude 等工具适配说明
- `/.cursorrules`、`/.cursor/rules/**/*.mdc` - Cursor AI 的薄入口和项目规则文件
- `/.codex/config.toml`、`/.mcp.json`、`/.cursor/mcp.json`、`/.vscode/mcp.json` - 项目级 MCP 配置，按精确文件纳入治理
- `/ARCHITECTURE.md` - 详细架构文档

修改本目录内提交到 Git 的 AI 文档、skill adapter 或 Agent 后，运行 `node scripts/ci/check-ai-governance.mjs` 确认入口和 canonical 映射没有漂移。adapter 静态通过只算 component evidence，真实 Claude 发现、选择和加载仍需新会话观察。

---

💡 **提示**: 本目录由 AI 助手自动管理，通常不需要手动修改。
