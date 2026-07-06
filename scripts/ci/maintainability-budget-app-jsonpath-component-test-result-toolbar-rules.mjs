const appJsonPathComponentTestResultToolbarBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestResultToolbarMaintainabilityBudgets = [
  appJsonPathComponentTestResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbar.test.tsx', 60, 'JSONPath 结果工具条测试只锁定状态组件和动作列表接线'),
  appJsonPathComponentTestResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarStatus.test.tsx', 55, 'JSONPath 结果工具条状态测试只锁定计数文案、命中上限提示和无障碍状态属性'),
  appJsonPathComponentTestResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarActionList.test.tsx', 95, 'JSONPath 结果工具条动作列表测试只锁定按钮配置、禁用态、图标组件和点击接线'),
  appJsonPathComponentTestResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarIcon.test.tsx', 55, 'JSONPath 结果工具条图标测试只锁定 SVG 外壳和复合图标路径数量'),
  appJsonPathComponentTestResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarTestFixture.ts', 55, 'JSONPath 结果工具条测试夹具只维护默认 props、回调和渲染 helper'),
];
