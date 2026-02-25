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

- `/CLAUDE.md` - Claude Code/Ducc 的主要项目指引文件
- `/.cursorrules` - Cursor AI 的规则文件
- `/ARCHITECTURE.md` - 详细架构文档

---

💡 **提示**: 本目录由 AI 助手自动管理，通常不需要手动修改。
