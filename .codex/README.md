# Codex 项目配置

本目录存放面向 Codex / OpenAI coding agent 的项目级协作资产。

## 内容

- `skills/jsonutils-maintainer/SKILL.md`: JSONUtils 项目维护技能模板，用于让 Codex 在性能优化、重构、Scheme 解析和部署排查时走统一闭环。

## 使用方式

当前项目仍以根目录 `AGENTS.md` 作为 Codex 自动读取入口。本目录里的 skill 是可迁移资产，适合在需要更强项目专用触发能力时复制或安装到本机 Codex skills 目录。

维护规则：

- 项目工程规则以 `AGENTS.md`、`rules/code-style.md` 和 `docs/AI-ENGINEERING-PLAYBOOK.md` 为准。
- 修改本目录后，同步更新 `.claude/ai-tools-guide.md`，保持 Claude Code 与 Codex 的上下文一致。
