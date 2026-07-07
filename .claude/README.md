# AI 工具配置目录

本目录包含针对 Claude Code/Ducc 等 AI 编程助手的配置和文档。

## 文件说明

### ai-tools-guide.md
AI 工具使用指南，包含:
- 支持的 AI 工具列表
- 各工具的配置方法
- 使用建议和最佳实践
- 文档维护指南

## 目录用途

`.claude/` 目录是 Claude Code 和 Ducc 的标准配置目录:

- **memory/**: AI 的持久化记忆文件 (跨会话保留)
- **settings.json**: 用户特定设置 (不提交到 Git)
- **session-history/**: 会话历史 (不提交到 Git)
- **ai-tools-guide.md**: AI 工具使用文档 (提交到 Git)

## Git 版本控制

- ✅ **提交**: 文档文件 (*.md)
- ✅ **提交**: 记忆文件 (memory/)
- ❌ **忽略**: 用户设置 (settings.json)
- ❌ **忽略**: 会话历史 (session-history/)
- ❌ **忽略**: 临时文件 (tmp/, *.log)

## 相关文件

- `AGENTS.md` - Codex、OpenAI Codex CLI 和通用 coding agent 的项目入口
- `/CLAUDE.md` - Claude Code/Ducc 的主要项目指引文件
- `rules/code-style.md` - 编码风格、提交格式和 CHANGELOG 要求
- `docs/AI-ENGINEERING-PLAYBOOK.md` - AI 工程闭环、规则/skill 回写和治理校验流程
- `.claude/ai-tools-guide.md` - Claude/Ducc 等工具适配说明
- `/.cursorrules` - Cursor AI 的规则文件
- `/ARCHITECTURE.md` - 详细架构文档

修改本目录内提交到 Git 的 AI 文档后，运行 `node scripts/ci/check-ai-governance.mjs` 确认入口引用没有漂移。

---

💡 **提示**: 本目录由 AI 助手自动管理，通常不需要手动修改。
