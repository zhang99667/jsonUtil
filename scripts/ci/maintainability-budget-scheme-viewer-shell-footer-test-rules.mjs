const schemeViewerShellFooterTestBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerShellFooterTestMaintainabilityBudgets = [
  schemeViewerShellFooterTestBudget(
    'SchemeViewerFooterActions.test.tsx',
    85,
    'Scheme 弹窗底部外壳测试只覆盖状态、关闭入口和动作列表装配'
  ),
  schemeViewerShellFooterTestBudget(
    'SchemeViewerFooterActionList.test.tsx',
    130,
    'Scheme 弹窗底部动作列表测试只覆盖按钮显隐、禁用态、aria/title 和回调透传'
  ),
  schemeViewerShellFooterTestBudget(
    'schemeViewerFooterActionItems.test.tsx',
    100,
    'Scheme 弹窗底部动作 item builder 测试只覆盖显隐顺序、tone 和关键透传语义'
  ),
];
