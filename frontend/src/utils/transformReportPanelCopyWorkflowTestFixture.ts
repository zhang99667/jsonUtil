import { vi } from 'vitest';
import './transformReportPanelCopyWorkflowTestMocks';
import {
  buildTransformReportPanelCopyWorkflow,
  type TransformReportPanelCopyWorkflowEffects,
  type TransformReportPanelCopyWorkflowState,
} from './transformReportPanelCopyWorkflow';
import {
  activeContext,
  actualCandidate,
  qualitySnapshot,
  report,
  reportView,
} from './transformReportPanelCopyWorkflowTestData';

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
