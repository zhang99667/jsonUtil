const statusHelperBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStatusHelperMaintainabilityBudgets = [
  statusHelperBudget('frontend/src/utils/statusBarState.ts', 30, '状态栏状态 helper 入口应只保留兼容导出和字节大小文案'),
  statusHelperBudget('frontend/src/utils/statusBarStateTypes.ts', 45, '状态栏状态类型契约应独立维护保存、SOURCE 校验和 badge 结构'),
  statusHelperBudget('frontend/src/utils/statusBarModeLabels.ts', 35, '状态栏模式文案矩阵应独立维护 TransformMode 到展示文案映射'),
  statusHelperBudget('frontend/src/utils/statusBarSaveStatus.ts', 70, '状态栏保存状态 helper 应只维护草稿、未绑定文件、dirty 和自动保存状态派生'),
  statusHelperBudget('frontend/src/utils/statusBarSourceValidationState.ts', 95, '状态栏 SOURCE 校验状态 helper 应只维护空态、文本、Scheme 和 JSON 校验 badge 派生'),
  statusHelperBudget('frontend/src/utils/statusBarFileState.ts', 55, '状态栏文件状态 helper 应只维护当前文件查找和保存状态构造'),
  statusHelperBudget('frontend/src/utils/statusBarFileState.test.ts', 70, '状态栏文件状态测试只覆盖当前文件查找、已保存文件和草稿状态'),
  statusHelperBudget('frontend/src/utils/statusBarViewModelTypes.ts', 35, '状态栏 view model 输入契约应独立维护，避免聚合实现被类型声明撑大'),
  statusHelperBudget('frontend/src/utils/statusBarSourceValidationActionTypes.ts', 35, '状态栏 SOURCE 校验动作类型契约应独立维护，避免展示组件依赖动作生成 helper'),
  statusHelperBudget('frontend/src/utils/statusBarSourceValidationAction.ts', 45, '状态栏 SOURCE 校验动作 helper 应只维护错误定位与 Scheme 面板入口优先级'),
  statusHelperBudget('frontend/src/utils/statusBarViewModel.ts', 80, '状态栏 view model 只聚合文件状态、SOURCE 校验动作和本地处理状态'),
];
