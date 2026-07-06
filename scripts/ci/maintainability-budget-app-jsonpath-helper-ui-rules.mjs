const appJsonPathHelperUiBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathHelperUiMaintainabilityBudgets = [
  appJsonPathHelperUiBudget('frontend/src/utils/jsonPathPanelUiState.ts', 50, 'JSONPath 面板 UI 状态 helper 只维护结果状态和标题 helper 装配'),
  appJsonPathHelperUiBudget('frontend/src/utils/jsonPathPanelUiState.test.ts', 55, 'JSONPath 面板 UI 状态测试只锁定结果状态、标题和描述 ID 组合装配'),
  appJsonPathHelperUiBudget('frontend/src/utils/jsonPathPanelUiResultState.ts', 50, 'JSONPath 面板结果区 UI 状态 helper 只维护隐藏数量、复制文案和空态/取消态开关'),
  appJsonPathHelperUiBudget('frontend/src/utils/jsonPathPanelUiResultState.test.ts', 75, 'JSONPath 面板结果区 UI 状态测试只锁定复制文案、隐藏数量和状态显示边界'),
  appJsonPathHelperUiBudget('frontend/src/utils/jsonPathPanelUiTitles.ts', 55, 'JSONPath 面板标题 helper 只维护收藏、查询按钮和输入描述 ID 文案决策'),
  appJsonPathHelperUiBudget('frontend/src/utils/jsonPathPanelUiTitles.test.ts', 70, 'JSONPath 面板标题测试只锁定收藏、查询前置状态和描述 ID 文案矩阵'),
];
