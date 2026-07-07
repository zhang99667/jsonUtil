export const AI_ENTRY_SHARED_SNIPPETS = [
  '- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。',
  '- 跨模块排查、复杂重构或多条验证链路并行时先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。',
  '- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。',
  '- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验。',
];

export const AI_ENTRY_SHARED_SNIPPET_FILES = [
  '.claude/ai-tools-guide.md',
  '.codex/README.md',
  '.github/copilot-instructions.md',
  '.cursorrules',
  '.comate/rules/code-style.md',
];
