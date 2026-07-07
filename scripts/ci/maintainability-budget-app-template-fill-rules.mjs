const appTemplateFillBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appTemplateFillMaintainabilityBudgets = [
  appTemplateFillBudget('frontend/src/components/TemplateFillPanel.tsx', 330, '模板填充面板只维护模板状态、校验、导入同步和 UI 装配，占位符回填模板解析、摘要、表单和 replacement 更新应留在独立 helper/组件'),
  appTemplateFillBudget('frontend/src/components/TemplateFillPlaceholderForm.tsx', 100, '模板填充占位符表单只维护占位符行、replacement 输入、候选采用和来源文案渲染'),
  appTemplateFillBudget('frontend/src/components/TemplateFillPlaceholderForm.test.tsx', 110, '模板填充占位符表单测试只锁定行渲染、候选禁用态、replacement 输入和采用候选回调'),
  appTemplateFillBudget('frontend/src/utils/templateFillPanelModel.ts', 220, '模板填充模型 helper 只维护回填模板草稿解析、摘要统计、replacement 更新和大小文案'),
  appTemplateFillBudget('frontend/src/utils/templateFillPanelModel.test.ts', 160, '模板填充模型测试只锁定回填模板解析兼容性、摘要统计、replacement 更新和大小文案'),
];
