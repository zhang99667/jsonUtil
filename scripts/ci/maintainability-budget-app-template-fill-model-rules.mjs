const appTemplateFillModelBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appTemplateFillModelMaintainabilityBudgets = [
  appTemplateFillModelBudget('frontend/src/utils/templateFillPanelModel.ts', 25, '模板填充面板模型门面只维护模板大小文案和占位符回填模型兼容导出'),
  appTemplateFillModelBudget('frontend/src/utils/placeholderFillTemplateContract.ts', 45, '模板填充占位符回填模板契约只维护模板 kind 常量、草稿摘要、来源、候选和详情类型'),
  appTemplateFillModelBudget('frontend/src/utils/placeholderFillTemplateRecord.ts', 15, '模板填充占位符回填 record guard 只维护 JSON 对象窄化判断'),
  appTemplateFillModelBudget('frontend/src/utils/placeholderFillTemplateFieldReaders.ts', 70, '模板填充占位符回填字段 readers 只维护字符串、候选和来源字段的容错读取'),
  appTemplateFillModelBudget('frontend/src/utils/placeholderFillTemplateDraftReaders.ts', 45, '模板填充占位符回填详情 readers 只维护详情行组装和无效详情过滤'),
  appTemplateFillModelBudget('frontend/src/utils/placeholderFillTemplateReplacement.ts', 45, '模板填充占位符回填 replacement writer 只维护 placeholders 和详情行 replacement 写回'),
  appTemplateFillModelBudget('frontend/src/utils/placeholderFillTemplateReplacement.test.ts', 65, '模板填充占位符回填 replacement writer 测试只锁定写回同步、未知占位符和非回填模板兼容策略'),
  appTemplateFillModelBudget('frontend/src/utils/templateFillPlaceholderDraftModel.ts', 80, '模板填充占位符回填模型只维护草稿解析、摘要统计和兼容导出'),
  appTemplateFillModelBudget('frontend/src/utils/templateFillPanelModel.test.ts', 140, '模板填充模型测试只锁定回填模板解析兼容性、摘要统计和大小文案'),
];
