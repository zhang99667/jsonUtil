export const transformPlaceholderFillMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformPlaceholderFillTemplate.ts',
    maxLines: 70,
    reason: '运行时占位符回填模板导出应独立于深度解析报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformPlaceholderFillTemplateDetails.ts',
    maxLines: 70,
    reason: '运行时占位符回填明细构建应只处理组字段、建议和来源字段映射',
  },
  {
    file: 'frontend/src/utils/transformPlaceholderFillTemplateDetails.test.ts',
    maxLines: 100,
    reason: '运行时占位符回填明细测试应锁定 suggestion 与来源字段可选输出契约',
  },
];
