const appTemplateFillComponentBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appTemplateFillComponentMaintainabilityBudgets = [
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillPanel.tsx', 240, '模板填充面板只维护模板状态、校验、导入同步和 UI 装配，占位符回填模板解析、摘要、表单、footer 操作、质量变化展示和 replacement 更新应留在独立 helper/组件'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillFooterActions.tsx', 90, '模板填充底部操作只维护清空、格式化、应用模板按钮的禁用态、title 和无障碍文案'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillFooterActions.test.tsx', 120, '模板填充底部操作测试只锁定按钮文案、禁用态、title、aria 和点击回调'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillPlaceholderSummary.tsx', 55, '模板填充占位符摘要只维护 replacement、候选和待补数字展示'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillPlaceholderSummary.test.tsx', 75, '模板填充占位符摘要测试只锁定摘要文案和可选候选/待补展示'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillPlaceholderForm.tsx', 100, '模板填充占位符表单只维护占位符行、replacement 输入、候选采用和来源文案渲染'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillPlaceholderForm.test.tsx', 110, '模板填充占位符表单测试只锁定行渲染、候选禁用态、replacement 输入和采用候选回调'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillStatusAlerts.tsx', 65, '模板填充状态提示只维护模板校验错误和 SOURCE 错误展示'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillStatusAlerts.test.tsx', 65, '模板填充状态提示测试只锁定模板错误、空模板隐藏和 SOURCE 错误展示'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillQualityDeltaPanel.tsx', 60, '模板填充质量变化面板只维护质量变化内容、滚动区域和复制入口展示'),
  appTemplateFillComponentBudget('frontend/src/components/TemplateFillQualityDeltaPanel.test.tsx', 70, '模板填充质量变化面板测试只锁定质量文案、data-tour、aria 和复制回调'),
];
