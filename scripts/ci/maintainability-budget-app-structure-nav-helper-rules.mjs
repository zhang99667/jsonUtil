const appStructureNavHelperBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStructureNavHelperMaintainabilityBudgets = [
  appStructureNavHelperBudget('frontend/src/utils/jsonTreePresentation.ts', 80, '结构导航展示 helper 只维护类型标签、展示样式、Pointer 文案和数组下标识别'),
];
