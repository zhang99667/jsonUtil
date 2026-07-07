const appTemplateFillModelBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appTemplateFillModelMaintainabilityBudgets = [
  appTemplateFillModelBudget('frontend/src/utils/templateFillPanelModel.ts', 25, '模板填充面板模型门面只维护模板大小文案和占位符回填模型兼容导出'),
  appTemplateFillModelBudget('frontend/src/utils/placeholderFillTemplateContract.ts', 45, '模板填充占位符回填模板契约只维护模板 kind 常量、草稿摘要、来源、候选和详情类型'),
  appTemplateFillModelBudget('frontend/src/utils/placeholderFillTemplateDraftReaders.ts', 90, '模板填充占位符回填 readers 只维护详情行、候选和来源字段的容错读取'),
  appTemplateFillModelBudget('frontend/src/utils/templateFillPlaceholderDraftModel.ts', 115, '模板填充占位符回填模型只维护草稿解析、摘要统计和 replacement 更新'),
  appTemplateFillModelBudget('frontend/src/utils/templateFillPanelModel.test.ts', 160, '模板填充模型测试只锁定回填模板解析兼容性、摘要统计、replacement 更新和大小文案'),
];
