import type { TransformContext } from '../types';
import type {
  TransformReportPanelCopyWorkflow,
  TransformReportPanelCopyWorkflowState,
} from './transformReportPanelCopyWorkflow';
import type {
  TransformContextReport,
  TransformQualitySnapshot,
  TransformReportView,
} from './transformSummary';

export const report = { summary: {} } as unknown as TransformContextReport;
export const reportView = {
  records: [{ path: '$.a' }],
  isRecordTruncated: true,
} as unknown as TransformReportView;
export const activeContext = { timestamp: 1 } as unknown as TransformContext;
export const qualitySnapshot = { score: 1 } as unknown as TransformQualitySnapshot;
export const actualCandidate = { label: '$.candidate' } as unknown as TransformReportPanelCopyWorkflowState['cmdComparisonActualCandidate'];

export const guardedReportViewActionNames: Array<keyof Pick<
  TransformReportPanelCopyWorkflow,
  | 'copyFilteredReport'
  | 'copyDiagnosticSummary'
  | 'copyQualitySnapshot'
  | 'copyArchivePackage'
  | 'copyTroubleshootingRecipe'
  | 'copyPathValueReport'
  | 'copyCmdStructureReport'
  | 'copyPlaceholderReport'
>> = [
  'copyFilteredReport',
  'copyDiagnosticSummary',
  'copyQualitySnapshot',
  'copyArchivePackage',
  'copyTroubleshootingRecipe',
  'copyPathValueReport',
  'copyCmdStructureReport',
  'copyPlaceholderReport',
];
