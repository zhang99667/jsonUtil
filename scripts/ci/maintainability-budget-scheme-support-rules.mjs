import { schemeSupportBase64MaintainabilityBudgets } from './maintainability-budget-scheme-support-base64-rules.mjs';
import { schemeSupportLogMaintainabilityBudgets } from './maintainability-budget-scheme-support-log-rules.mjs';
import { schemeSupportPayloadMaintainabilityBudgets } from './maintainability-budget-scheme-support-payload-rules.mjs';
import { schemeSupportQueryMaintainabilityBudgets } from './maintainability-budget-scheme-support-query-rules.mjs';
import { schemeSupportQuerySyntaxMaintainabilityBudgets } from './maintainability-budget-scheme-support-query-syntax-rules.mjs';
import { schemeSupportStructuredDecodeMaintainabilityBudgets } from './maintainability-budget-scheme-support-structured-decode-rules.mjs';
import { schemeSupportStructuredQueryMaintainabilityBudgets } from './maintainability-budget-scheme-support-structured-query-rules.mjs';
import { schemeSupportTokenMaintainabilityBudgets } from './maintainability-budget-scheme-support-token-rules.mjs';

export const schemeSupportMaintainabilityBudgets = [
  ...schemeSupportBase64MaintainabilityBudgets,
  ...schemeSupportLogMaintainabilityBudgets,
  ...schemeSupportPayloadMaintainabilityBudgets,
  ...schemeSupportQueryMaintainabilityBudgets,
  ...schemeSupportQuerySyntaxMaintainabilityBudgets,
  ...schemeSupportStructuredDecodeMaintainabilityBudgets,
  ...schemeSupportStructuredQueryMaintainabilityBudgets,
  ...schemeSupportTokenMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/schemeViewerDiagnostics.ts',
    maxLines: 30,
    reason: 'Scheme 弹窗诊断门面只 re-export 参数来源、摘要 chips 和详情判断 helper',
  },
  {
    file: 'frontend/src/utils/schemeViewerParamSections.ts',
    maxLines: 55,
    reason: 'Scheme 弹窗参数来源 helper 只维护 Query/Hash 参数计数、entries 和 section 构建',
  },
  {
    file: 'frontend/src/utils/schemeViewerDiagnosticSummaryItems.ts',
    maxLines: 120,
    reason: 'Scheme 弹窗诊断摘要 helper 只维护摘要 chip 顺序、文案和跳过计数汇总',
  },
  {
    file: 'frontend/src/utils/schemeViewerDiagnosticDetails.ts',
    maxLines: 60,
    reason: 'Scheme 弹窗详情可见性 helper 只维护诊断来源是否存在的布尔判断',
  },
  {
    file: 'frontend/src/utils/schemeViewerActionTitles.ts',
    maxLines: 130,
    reason: 'Scheme 弹窗操作标题状态矩阵应保持短小可测试',
  },
  {
    file: 'frontend/src/utils/schemeViewerFormatters.ts',
    maxLines: 130,
    reason: 'Scheme 弹窗展示格式化 helper 应保持短小可测试',
  },
];
