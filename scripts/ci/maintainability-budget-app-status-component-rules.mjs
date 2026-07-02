const statusComponentBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStatusComponentMaintainabilityBudgets = [
  statusComponentBudget('frontend/src/components/StatusBar.tsx', 95, '状态栏组件应只负责 view model 调用和左/右状态区装配，状态派生留在纯 helper'),
  statusComponentBudget('frontend/src/components/StatusBarLeftInfo.tsx', 45, '状态栏左侧信息组件应只负责内容统计与状态 badge 组装配，具体展示交给子组件'),
  statusComponentBudget('frontend/src/components/StatusBarLeftInfoTypes.ts', 35, '状态栏左侧信息类型契约应独立维护，避免展示组件被 props 声明撑大'),
  statusComponentBudget('frontend/src/components/StatusBarStatusBadges.tsx', 35, '状态栏左侧状态 badge 组应只负责文件、保存和 SOURCE 校验 badge 装配'),
  statusComponentBudget('frontend/src/components/StatusBarContentMetrics.tsx', 70, '状态栏内容统计组件应只维护编码、长度、字节、光标和行列统计展示'),
  statusComponentBudget('frontend/src/components/StatusBarActiveFileBadge.tsx', 35, '状态栏当前文件 badge 应只负责文件名截断、路径提示和文件图标展示'),
  statusComponentBudget('frontend/src/components/StatusBarSaveStatusBadge.tsx', 30, '状态栏保存状态 badge 应只负责保存文案、样式和提示展示'),
  statusComponentBudget('frontend/src/components/StatusBarSourceValidationBadge.tsx', 65, 'SOURCE 校验状态 badge 应只负责普通展示、错误定位和 Scheme 打开三态渲染'),
  statusComponentBudget('frontend/src/components/StatusBarViewStatus.tsx', 30, '状态栏右侧视图状态组件应只负责本地处理、模式标签和版本入口装配'),
  statusComponentBudget('frontend/src/components/StatusBarLocalProcessingBadge.tsx', 35, '状态栏本地处理 badge 应只维护本地处理 tone 到样式的展示矩阵'),
  statusComponentBudget('frontend/src/components/StatusBarModeBadge.tsx', 35, '状态栏模式 badge 应只维护当前模式标签和深度格式化说明'),
  statusComponentBudget('frontend/src/components/StatusBarVersionBadge.tsx', 45, '状态栏版本标识应只负责静态版本展示和更新日志入口按钮'),
];
