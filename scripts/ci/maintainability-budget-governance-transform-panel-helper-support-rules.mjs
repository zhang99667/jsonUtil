export const governanceTransformPanelHelperSupportMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-ui-rules.mjs',
    maxLines: 50,
    reason: '深度解析面板 UI helper 预算规则过多时应继续按行动项和样式拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-copy-rules.mjs',
    maxLines: 40,
    reason: '深度解析面板复制 helper 预算规则应保持短表，新增复制规则先按 title/payload/metrics 分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-cmd-rules.mjs',
    maxLines: 50,
    reason: '深度解析 CMD 对比 helper 预算规则应保持短表',
  },
];
