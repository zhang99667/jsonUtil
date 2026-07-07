const appTemplateFillBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appTemplateFillMaintainabilityBudgets = [
  appTemplateFillBudget('frontend/src/components/TemplateFillPanel.tsx', 280, '模板填充面板只维护模板状态、校验、导入同步和 UI 装配，占位符回填模板解析、摘要、表单、footer 操作和 replacement 更新应留在独立 helper/组件'),
  appTemplateFillBudget('frontend/src/components/TemplateFillFooterActions.tsx', 90, '模板填充底部操作只维护清空、格式化、应用模板按钮的禁用态、title 和无障碍文案'),
  appTemplateFillBudget('frontend/src/components/TemplateFillFooterActions.test.tsx', 120, '模板填充底部操作测试只锁定按钮文案、禁用态、title、aria 和点击回调'),
  appTemplateFillBudget('frontend/src/components/TemplateFillPlaceholderForm.tsx', 100, '模板填充占位符表单只维护占位符行、replacement 输入、候选采用和来源文案渲染'),
  appTemplateFillBudget('frontend/src/components/TemplateFillPlaceholderForm.test.tsx', 110, '模板填充占位符表单测试只锁定行渲染、候选禁用态、replacement 输入和采用候选回调'),
  appTemplateFillBudget('frontend/src/utils/templateFillPanelModel.ts', 25, '模板填充面板模型门面只维护模板大小文案和占位符回填模型兼容导出'),
  appTemplateFillBudget('frontend/src/utils/placeholderFillTemplateContract.ts', 45, '模板填充占位符回填模板契约只维护模板 kind 常量、草稿摘要、来源、候选和详情类型'),
  appTemplateFillBudget('frontend/src/utils/templateFillPlaceholderDraftModel.ts', 180, '模板填充占位符回填模型只维护草稿解析、摘要统计和 replacement 更新'),
  appTemplateFillBudget('frontend/src/utils/templateFillPanelModel.test.ts', 160, '模板填充模型测试只锁定回填模板解析兼容性、摘要统计、replacement 更新和大小文案'),
];
