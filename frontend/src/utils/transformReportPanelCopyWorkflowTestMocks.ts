import { vi } from 'vitest';

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
