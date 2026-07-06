import { describe, expect, it } from 'vitest';
import {
  activeContext,
  actualCandidate,
  qualitySnapshot,
  report,
  reportView,
} from './transformReportPanelCopyWorkflowTestData';
import { buildTransformReportPanelCopyWorkflowState } from './transformReportPanelCopyWorkflowState';

describe('buildTransformReportPanelCopyWorkflowState', () => {
  it('从面板模型投影复制 workflow 所需状态', () => {
    const panelState = {
      activeContext,
      report,
      reportView,
      deferredQuery: 'CMD',
      isFilterPending: true,
      qualitySnapshot,
      qualityBaselineDeltaText: 'quality-delta',
      placeholderFillTemplateJsonText: '{"placeholder":true}',
      issueSampleCopyText: 'issue-sample',
      issueSampleJsonCopyText: 'issue-json',
      redactedIssueSampleJsonCopyText: 'redacted-json',
      issueRegressionTemplateCopyText: 'regression-template',
      hasPathValueCopyItems: true,
      hasCmdStructureCopyItems: false,
      hasFocusedCmdStructureCopyItems: true,
    };
    const state = buildTransformReportPanelCopyWorkflowState({
      ...panelState,
      cmdComparisonState: {
        expectedText: 'expected-cmd',
        ignoreExtraPaths: true,
        actualCandidate,
      },
    });

    expect(state).toEqual({
      ...panelState,
      cmdComparisonExpectedText: 'expected-cmd',
      cmdComparisonIgnoreExtraPaths: true,
      cmdComparisonActualCandidate: actualCandidate,
    });
  });
});
