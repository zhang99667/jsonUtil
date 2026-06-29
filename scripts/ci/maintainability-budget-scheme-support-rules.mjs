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
    maxLines: 220,
    reason: 'Scheme 弹窗诊断摘要和参数来源 helper 不应继续膨胀',
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
