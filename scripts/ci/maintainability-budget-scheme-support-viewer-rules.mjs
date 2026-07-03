const schemeSupportViewerBudget = (file, maxLines, reason) => ({
  file: `frontend/src/utils/${file}`,
  maxLines,
  reason,
});

export const schemeSupportViewerMaintainabilityBudgets = [
  schemeSupportViewerBudget(
    'schemeViewerDiagnostics.ts',
    30,
    'Scheme 弹窗诊断门面只 re-export 参数来源、摘要 chips 和详情判断 helper'
  ),
  schemeSupportViewerBudget(
    'schemeViewerParamSections.ts',
    55,
    'Scheme 弹窗参数来源 helper 只维护 Query/Hash 参数计数、entries 和 section 构建'
  ),
  schemeSupportViewerBudget(
    'schemeViewerDiagnosticSummaryItems.ts',
    35,
    'Scheme 弹窗诊断摘要门面只维护跳过计数汇总和摘要 item builder 转发'
  ),
  schemeSupportViewerBudget(
    'schemeViewerDiagnosticSummaryItemBuilders.ts',
    115,
    'Scheme 弹窗诊断摘要 item builder 只维护摘要 chip 顺序、文案和计数来源'
  ),
  schemeSupportViewerBudget(
    'schemeViewerDiagnosticSummaryTypes.ts',
    35,
    'Scheme 弹窗诊断摘要类型文件只维护摘要 item 与 builder 入参类型'
  ),
  schemeSupportViewerBudget(
    'schemeViewerDiagnosticDetails.ts',
    60,
    'Scheme 弹窗详情可见性 helper 只维护诊断来源是否存在的布尔判断'
  ),
  schemeSupportViewerBudget(
    'schemeViewerActionTitles.ts',
    130,
    'Scheme 弹窗操作标题状态矩阵应保持短小可测试'
  ),
  schemeSupportViewerBudget(
    'schemeViewerFormatters.ts',
    130,
    'Scheme 弹窗展示格式化 helper 应保持短小可测试'
  ),
];
