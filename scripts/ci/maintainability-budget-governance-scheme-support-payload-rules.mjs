export const governanceSchemeSupportPayloadMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-payload-rules.mjs',
    maxLines: 40,
    reason: 'Scheme payload helper 预算规则应保持短表，新增载荷规则先评估主流程拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-payload-normalization-rules.mjs',
    maxLines: 25,
    reason: 'Scheme payload 归一化预算规则应独立成短表，避免 payload 主规则继续贴边',
  },
];
