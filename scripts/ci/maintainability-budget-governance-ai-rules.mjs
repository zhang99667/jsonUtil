export const governanceAiMaintainabilityBudgets = [
  {
    file: 'scripts/ci/check-ai-governance.mjs',
    maxLines: 45,
    reason: 'AI 治理检查 CLI 应只负责执行报告和输出错误，规则与收集逻辑放在独立模块',
  },
  {
    file: 'scripts/ci/aiGovernanceChecks.mjs',
    maxLines: 80,
    reason: 'AI 治理缺失收集应只负责文件内容检查和 report 组装，规则构造放在独立模块',
  },
  {
    file: 'scripts/ci/aiGovernanceRules.mjs',
    maxLines: 100,
    reason: 'AI 治理规则构造应集中维护必需文件和关键引用清单，便于单测覆盖',
  },
  {
    file: 'scripts/ci/aiGovernanceReferenceGroups.mjs',
    maxLines: 40,
    reason: 'AI 治理公共引用组应独立维护，避免规则构造文件随着关键词增长而回涨',
  },
];
