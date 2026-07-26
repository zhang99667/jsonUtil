import { schemeSupportBase64MaintainabilityBudgets } from './maintainability-budget-scheme-support-base64-rules.mjs';
import { schemeSupportLogMaintainabilityBudgets } from './maintainability-budget-scheme-support-log-rules.mjs';
import { schemeSupportMetadataContextMaintainabilityBudgets } from './maintainability-budget-scheme-support-metadata-context-rules.mjs';
import { schemeSupportMetadataDeepTestMaintainabilityBudgets } from './maintainability-budget-scheme-support-metadata-deep-test-rules.mjs';
import { schemeSupportMetadataMaintainabilityBudgets } from './maintainability-budget-scheme-support-metadata-rules.mjs';
import { schemeSupportPayloadMaintainabilityBudgets } from './maintainability-budget-scheme-support-payload-rules.mjs';
import { schemeSupportQueryMaintainabilityBudgets } from './maintainability-budget-scheme-support-query-rules.mjs';
import { schemeSupportQuerySyntaxMaintainabilityBudgets } from './maintainability-budget-scheme-support-query-syntax-rules.mjs';
import { schemeSupportStructuredDecodeMaintainabilityBudgets } from './maintainability-budget-scheme-support-structured-decode-rules.mjs';
import { schemeSupportStructuredQueryMaintainabilityBudgets } from './maintainability-budget-scheme-support-structured-query-rules.mjs';
import { schemeSupportTokenMaintainabilityBudgets } from './maintainability-budget-scheme-support-token-rules.mjs';
import { schemeSupportViewerMaintainabilityBudgets } from './maintainability-budget-scheme-support-viewer-rules.mjs';

export const schemeSupportMaintainabilityBudgets = [
  ...schemeSupportBase64MaintainabilityBudgets,
  ...schemeSupportLogMaintainabilityBudgets,
  ...schemeSupportMetadataContextMaintainabilityBudgets,
  ...schemeSupportMetadataDeepTestMaintainabilityBudgets,
  ...schemeSupportMetadataMaintainabilityBudgets,
  ...schemeSupportPayloadMaintainabilityBudgets,
  ...schemeSupportQueryMaintainabilityBudgets,
  ...schemeSupportQuerySyntaxMaintainabilityBudgets,
  ...schemeSupportStructuredDecodeMaintainabilityBudgets,
  ...schemeSupportStructuredQueryMaintainabilityBudgets,
  ...schemeSupportTokenMaintainabilityBudgets,
  ...schemeSupportViewerMaintainabilityBudgets,
];
