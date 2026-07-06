const appJsonPathComponentPanelBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentPanelMaintainabilityBudgets = [
  appJsonPathComponentPanelBudget('frontend/src/components/JsonPathPanel.tsx', 420, 'JSONPath 面板组件只维护输入、保存查询、导航、复制和区域装配，查询 worker 生命周期、结果状态、结果工具条、预览项、查询建议、查询输入和状态提示等逻辑应下沉到 hook/helper/子组件'),
  appJsonPathComponentPanelBudget('frontend/src/components/JsonPathPanelTitle.tsx', 35, 'JSONPath 面板标题只维护标题文案和语法帮助入口'),
];
