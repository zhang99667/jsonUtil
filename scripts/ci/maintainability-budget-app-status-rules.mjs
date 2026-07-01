const statusBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStatusMaintainabilityBudgets = [
  statusBudget('frontend/src/components/StatusBar.tsx', 95, '状态栏组件应只负责 view model 调用和左/右状态区装配，状态派生留在纯 helper'),
  statusBudget('frontend/src/components/StatusBarLeftInfo.tsx', 45, '状态栏左侧信息组件应只负责内容统计与状态 badge 组装配，具体展示交给子组件'),
  statusBudget('frontend/src/components/StatusBarLeftInfoTypes.ts', 35, '状态栏左侧信息类型契约应独立维护，避免展示组件被 props 声明撑大'),
  statusBudget('frontend/src/components/StatusBarStatusBadges.tsx', 35, '状态栏左侧状态 badge 组应只负责文件、保存和 SOURCE 校验 badge 装配'),
  statusBudget('frontend/src/components/StatusBarContentMetrics.tsx', 70, '状态栏内容统计组件应只维护编码、长度、字节、光标和行列统计展示'),
  statusBudget('frontend/src/components/StatusBarActiveFileBadge.tsx', 35, '状态栏当前文件 badge 应只负责文件名截断、路径提示和文件图标展示'),
  statusBudget('frontend/src/components/StatusBarSaveStatusBadge.tsx', 30, '状态栏保存状态 badge 应只负责保存文案、样式和提示展示'),
  statusBudget('frontend/src/components/StatusBarSourceValidationBadge.tsx', 65, 'SOURCE 校验状态 badge 应只负责普通展示、错误定位和 Scheme 打开三态渲染'),
  statusBudget('frontend/src/components/StatusBarViewStatus.tsx', 30, '状态栏右侧视图状态组件应只负责本地处理、模式标签和版本入口装配'),
  statusBudget('frontend/src/components/StatusBarLocalProcessingBadge.tsx', 35, '状态栏本地处理 badge 应只维护本地处理 tone 到样式的展示矩阵'),
  statusBudget('frontend/src/components/StatusBarModeBadge.tsx', 35, '状态栏模式 badge 应只维护当前模式标签和深度格式化说明'),
  statusBudget('frontend/src/components/StatusBarVersionBadge.tsx', 45, '状态栏版本标识应只负责静态版本展示和更新日志入口按钮'),
  statusBudget('frontend/src/utils/statusBarState.ts', 170, '状态栏状态 helper 应只维护保存、校验和模式文案矩阵，增长时按状态域拆分'),
  statusBudget('frontend/src/utils/statusBarFileState.ts', 55, '状态栏文件状态 helper 应只维护当前文件查找和保存状态构造'),
  statusBudget('frontend/src/utils/statusBarFileState.test.ts', 70, '状态栏文件状态测试只覆盖当前文件查找、已保存文件和草稿状态'),
  statusBudget('frontend/src/utils/statusBarViewModelTypes.ts', 35, '状态栏 view model 输入契约应独立维护，避免聚合实现被类型声明撑大'),
  statusBudget('frontend/src/utils/statusBarSourceValidationActionTypes.ts', 35, '状态栏 SOURCE 校验动作类型契约应独立维护，避免展示组件依赖动作生成 helper'),
  statusBudget('frontend/src/utils/statusBarSourceValidationAction.ts', 45, '状态栏 SOURCE 校验动作 helper 应只维护错误定位与 Scheme 面板入口优先级'),
  statusBudget('frontend/src/utils/statusBarViewModel.ts', 80, '状态栏 view model 只聚合文件状态、SOURCE 校验动作和本地处理状态'),
];
