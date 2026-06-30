export const transformSummaryCopyMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportCopyPayloads.ts',
    maxLines: 80,
    reason: '深度解析复制 payload 组装应保持纯函数小模块，避免回流到报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformReportCopyTexts.ts',
    maxLines: 85,
    reason: '深度解析复制文本入口只维护路径值、占位符复制文案和 CMD 文案 re-export，避免复制文本职责重新混合',
  },
  {
    file: 'frontend/src/utils/transformReportCopyCmdStructureText.ts',
    maxLines: 85,
    reason: '深度解析 CMD 结构复制文本应独立维护版本、筛选、聚焦裁剪和内部字段摘要格式',
  },
];
