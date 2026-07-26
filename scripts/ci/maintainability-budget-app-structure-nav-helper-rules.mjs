const appStructureNavHelperBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStructureNavHelperMaintainabilityBudgets = [
  appStructureNavHelperBudget('frontend/src/utils/jsonTreePresentation.ts', 80, '结构导航展示 helper 只维护类型标签、展示样式、Pointer 文案和数组下标识别'),
  appStructureNavHelperBudget('frontend/src/utils/jsonValueSemantics.ts', 210, '字符串语义入口只组合 URL、资源、JWT、Base64 和标量提示'),
  appStructureNavHelperBudget('frontend/src/utils/jsonValueScalarSemantics.ts', 145, '标量语义 helper 只维护电话、时间、标识符、日期和颜色检测'),
  appStructureNavHelperBudget('frontend/src/utils/jsonValueSemantics.test.ts', 290, '字符串语义测试只锁定地址、资源、敏感值和非法输入边界'),
];
