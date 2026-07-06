const appJsonPathComponentPanelBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentPanelMaintainabilityBudgets = [
  appJsonPathComponentPanelBudget('frontend/src/components/JsonPathPanel.tsx', 630, 'JSONPath 面板组件继续承载 worker、面板状态和区域装配，复制格式化、结果工具条、预览项派生、结果预览、导航、查询建议、查询输入、保存查询、状态提示和标题文案等逻辑应下沉到 helper/子组件'),
];
