const statusBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStatusMaintainabilityBudgets = [
  statusBudget('frontend/src/components/StatusBar.tsx', 95, '状态栏组件应只负责 view model 调用和左/右状态区装配，状态派生留在纯 helper'),
  statusBudget('frontend/src/components/StatusBarLeftInfo.tsx', 65, '状态栏左侧信息组件应只负责内容统计、文件、保存和 SOURCE 校验状态装配，具体统计展示交给子组件'),
  statusBudget('frontend/src/components/StatusBarContentMetrics.tsx', 70, '状态栏内容统计组件应只维护编码、长度、字节、光标和行列统计展示'),
  statusBudget('frontend/src/components/StatusBarActiveFileBadge.tsx', 35, '状态栏当前文件 badge 应只负责文件名截断、路径提示和文件图标展示'),
  statusBudget('frontend/src/components/StatusBarSourceValidationBadge.tsx', 65, 'SOURCE 校验状态 badge 应只负责普通展示、错误定位和 Scheme 打开三态渲染'),
  statusBudget('frontend/src/components/StatusBarViewStatus.tsx', 30, '状态栏右侧视图状态组件应只负责本地处理、模式标签和版本入口装配'),
  statusBudget('frontend/src/components/StatusBarLocalProcessingBadge.tsx', 35, '状态栏本地处理 badge 应只维护本地处理 tone 到样式的展示矩阵'),
  statusBudget('frontend/src/components/StatusBarModeBadge.tsx', 35, '状态栏模式 badge 应只维护当前模式标签和深度格式化说明'),
  statusBudget('frontend/src/components/StatusBarVersionBadge.tsx', 45, '状态栏版本标识应只负责静态版本展示和更新日志入口按钮'),
  statusBudget('frontend/src/utils/statusBarState.ts', 170, '状态栏状态 helper 应只维护保存、校验和模式文案矩阵，增长时按状态域拆分'),
  statusBudget('frontend/src/utils/statusBarSourceValidationAction.ts', 45, '状态栏 SOURCE 校验动作 helper 应只维护错误定位与 Scheme 面板入口优先级'),
  statusBudget('frontend/src/utils/statusBarViewModel.ts', 95, '状态栏 view model 只聚合当前文件、保存状态、SOURCE 校验动作和本地处理状态'),
];
