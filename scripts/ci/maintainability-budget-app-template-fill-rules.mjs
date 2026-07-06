const appTemplateFillBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appTemplateFillMaintainabilityBudgets = [
  appTemplateFillBudget('frontend/src/components/TemplateFillPanel.tsx', 390, '模板填充面板只维护模板状态、校验、导入同步和 UI 装配，占位符回填模板解析、摘要和 replacement 更新应留在纯模型 helper'),
  appTemplateFillBudget('frontend/src/utils/templateFillPanelModel.ts', 220, '模板填充模型 helper 只维护回填模板草稿解析、摘要统计、replacement 更新和大小文案'),
  appTemplateFillBudget('frontend/src/utils/templateFillPanelModel.test.ts', 160, '模板填充模型测试只锁定回填模板解析兼容性、摘要统计、replacement 更新和大小文案'),
];
