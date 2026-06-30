export const governanceTransformPanelHelperSupportCopyMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-copy-rules.mjs',
    maxLines: 40,
    reason: '深度解析面板复制 helper 预算规则应保持短表，新增复制规则先按 title/payload/metrics 分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-copy-workflow-rules.mjs',
    maxLines: 45,
    reason: '深度解析面板复制 workflow 预算规则应独立维护，避免复制 helper 总表回涨',
  },
];
