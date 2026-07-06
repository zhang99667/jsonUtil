const appJsonPathComponentTestSupportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestSupportMaintainabilityBudgets = [
  appJsonPathComponentTestSupportBudget('frontend/src/components/JsonPathPanelSavedQueryList.test.tsx', 65, 'JSONPath 保存查询列表测试只锁定列表容器、行 props 和选择删除回调'),
];
