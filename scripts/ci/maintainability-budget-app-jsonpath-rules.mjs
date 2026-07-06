const appJsonPathBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathMaintainabilityBudgets = [
  appJsonPathBudget('frontend/src/components/JsonPathPanel.tsx', 990, 'JSONPath 面板组件继续承载 UI、worker 和面板状态，复制格式化等纯逻辑应下沉到 helper'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelCopy.ts', 35, 'JSONPath 面板复制 helper 只维护查询值、路径和值和数量文案格式化'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelCopy.test.ts', 60, 'JSONPath 面板复制测试只锁定字符串、结构化值、多结果、路径行和值数量文案'),
];
