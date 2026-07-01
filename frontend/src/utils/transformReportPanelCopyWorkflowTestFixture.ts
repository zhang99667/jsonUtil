import { vi } from 'vitest';
import type { TransformContext } from '../types';
import {
  buildTransformReportPanelCopyWorkflow,
  type TransformReportPanelCopyWorkflow,
  type TransformReportPanelCopyWorkflowEffects,
  type TransformReportPanelCopyWorkflowState,
} from './transformReportPanelCopyWorkflow';
import type {
  TransformContextReport,
  TransformQualitySnapshot,
  TransformReportView,
} from './transformSummary';

const mocks = vi.hoisted(() => ({
  transformSummary: {
    formatTransformArchivePackageJsonText: vi.fn(() => 'archive-text'),
    formatTransformCmdStructureComparisonPackageText: vi.fn(() => 'cmd-package-text'),
    formatTransformCmdStructureReportText: vi.fn(() => 'cmd-list-text'),
    formatTransformCollaborationReportText: vi.fn(() => 'collaboration-text'),
    formatTransformContextReportText: vi.fn(() => 'full-report-text'),
    formatTransformDiagnosticSummaryText: vi.fn(() => 'diagnostic-text'),
    formatTransformIssueRegressionTemplateText: vi.fn(() => 'regression-template-text'),
    formatTransformIssueSampleJsonText: vi.fn(() => 'issue-json-text'),
    formatTransformIssueSampleReportText: vi.fn(() => 'issue-sample-text'),
    formatTransformPathValueReportText: vi.fn(() => 'path-value-text'),
    formatTransformPlaceholderReportText: vi.fn(() => 'placeholder-text'),
    formatTransformQualitySnapshotJsonText: vi.fn(() => 'quality-snapshot-text'),
    formatTransformReportViewText: vi.fn(() => 'filtered-report-text'),
    formatTransformTroubleshootingRecipeJsonText: vi.fn(() => 'recipe-text'),
    getTransformRecordCmdStructureCopyText: vi.fn(() => 'cmd-structure-text'),
  },
  copyMetrics: {
    formatCopySuccessMessage: vi.fn((label: string, text: string) => `${label}:${text.length}`),
    formatPathValueCopyCountLabel: vi.fn(() => '2 条，已截断'),
    getPathValueCopyRowCount: vi.fn(() => 2),
    isPathValueCopyLimited: vi.fn(() => true),
  },
  cmdComparison: {
    buildCmdComparisonReportText: vi.fn(() => 'cmd-diff-text'),
  },
}));

vi.mock('./transformSummary', () => mocks.transformSummary);
vi.mock('./transformReportCopyMetrics', () => mocks.copyMetrics);
vi.mock('./transformReportCmdComparison', () => mocks.cmdComparison);

export const getTransformSummaryMocks = () => mocks.transformSummary;
export const getCopyMetricsMocks = () => mocks.copyMetrics;
export const getCmdComparisonMocks = () => mocks.cmdComparison;

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

const buildState = (
  overrides: Partial<TransformReportPanelCopyWorkflowState> = {}
): TransformReportPanelCopyWorkflowState => ({
  activeContext,
  report,
  reportView,
  deferredQuery: 'CMD 参数',
  isFilterPending: false,
  qualitySnapshot,
  qualityBaselineDeltaText: 'quality-delta-text',
  placeholderFillTemplateJsonText: '{"placeholders":{}}',
  issueSampleCopyText: 'issue-sample-copy-text',
  issueSampleJsonCopyText: 'issue-json-copy-text',
  redactedIssueSampleJsonCopyText: 'redacted-json-copy-text',
  issueRegressionTemplateCopyText: 'regression-template-copy-text',
  hasPathValueCopyItems: true,
  hasCmdStructureCopyItems: true,
  hasFocusedCmdStructureCopyItems: true,
  cmdComparisonExpectedText: 'expected-cmd',
  cmdComparisonIgnoreExtraPaths: true,
  cmdComparisonActualCandidate: actualCandidate,
  ...overrides,
});

const buildEffects = (
  overrides: Partial<TransformReportPanelCopyWorkflowEffects> = {}
): TransformReportPanelCopyWorkflowEffects => ({
  copyText: vi.fn(async (_text: string) => undefined),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  setQualityBaseline: vi.fn(),
  showStatusSuccess: vi.fn(),
  openTemplateFill: vi.fn(),
  buildActiveCmdComparisonReportText: vi.fn(() => 'active-cmd-diff'),
  buildActiveCmdComparisonCandidateText: vi.fn(() => 'active-cmd-candidate'),
  ...overrides,
});

export const buildWorkflow = (
  stateOverrides: Partial<TransformReportPanelCopyWorkflowState> = {},
  effectOverrides: Partial<TransformReportPanelCopyWorkflowEffects> = {}
) => {
  const effects = buildEffects(effectOverrides);
  return {
    effects,
    workflow: buildTransformReportPanelCopyWorkflow(buildState(stateOverrides), effects),
  };
};
