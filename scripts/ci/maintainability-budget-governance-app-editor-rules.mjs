export const governanceAppEditorMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-app-editor-rules.mjs',
    maxLines: 25,
    reason: 'App 编辑区预算规则应只维护编辑区外壳组件预算，继续增长时按 source/preview 拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-editor-preview-rules.mjs',
    maxLines: 20,
    reason: 'App PREVIEW 编辑区预算规则应只维护 PREVIEW pane 和 CodeEditor 预算',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-editor-source-rules.mjs',
    maxLines: 25,
    reason: 'App SOURCE 编辑区预算规则应只维护 SOURCE pane 及错误动作预算',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-app-editor-rules.mjs',
    maxLines: 30,
    reason: 'App editor 治理预算规则应只维护 editor 子表自身预算',
  },
];
