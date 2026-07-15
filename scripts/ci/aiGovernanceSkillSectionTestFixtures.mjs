export const COMPLETE_CODEX_SKILL_SECTION_BODIES = {
  '## 必读文件': [
    'AGENTS.md',
    'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md',
  ].join('\n'),
  '## 按任务读取': [
    'ai_decision_summary',
    'ai_asset_inventory',
    'docs/AI-ASSET-REGISTRY.md',
    'docs/AI-GOVERNANCE-DECISIONS.md',
  ].join('\n'),
  '## 工作流': [
    'git status --short --branch',
    '子 Agent 委派',
    'frontend/package.json',
    'CHANGELOG.md',
    '规则/skill 回写',
    '决策记录',
    '回写追踪',
    '锁定测试',
  ].join('\n'),
  '## 常用验证命令': [
    'node scripts/ci/check-version-consistency.mjs',
    'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-maintainability-budgets.mjs',
    'npm run build',
  ].join('\n'),
  '## 重点边界': [
    'dispatchChunkLoadRecoveryEvent',
    'Content-Type',
    '本地规则优先',
    'node scripts/ci/check-ai-governance.mjs',
  ].join('\n'),
};
