import { describe, expect, it } from 'vitest';
import {
  betterRecord,
  buildModel,
  currentRecord,
  emptyReportView,
} from './transformReportPanelCopyWorkflowModelTestFixture';

describe('buildTransformReportPanelCopyWorkflowModel', () => {
  it('装配 copy workflow、active CMD 文本和候选记录 getter', () => {
    const { model, state, effects, capturedState, capturedEffects, workflow } = buildModel();

    expect(model.copyWorkflow).toBe(workflow);
    expect(capturedState).toBe(state);
    expect(capturedEffects).toEqual(expect.objectContaining(effects));
    expect(capturedEffects.buildActiveCmdComparisonReportText()).toContain('CMD 结构差异报告');
    expect(capturedEffects.buildActiveCmdComparisonCandidateText()).toContain('建议优先切到 $.better');
    expect(model.getCmdComparisonCandidateRecords()).toEqual([currentRecord, betterRecord]);

    const fallback = buildModel({
      copyWorkflowState: { report: null, reportView: emptyReportView },
      cmdComparisonState: { recordPath: '$.better' },
    });
    expect(fallback.capturedEffects.buildActiveCmdComparisonReportText()).toContain('CMD 结构差异报告');
    expect(fallback.model.getCmdComparisonCandidateRecords()).toEqual([currentRecord, betterRecord]);
  });
});
