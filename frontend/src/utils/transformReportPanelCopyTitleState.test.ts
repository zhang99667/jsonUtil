import { describe, expect, it } from 'vitest';
import {
  buildTransformReportPanelCopyTitleState,
  buildTransformReportPanelCopyTitles,
} from './transformReportPanelCopyTitleState';

const baseInput = {
  hasReportView: true,
  isFilterPending: false,
  hasActiveContext: true,
  copyAvailability: {
    hasPathValueCopyItems: false,
    hasCmdStructureCopyItems: false,
    hasFocusedCmdStructureCopyItems: false,
  },
  issueCopyTexts: {
    issueSampleCopyText: '',
    issueSampleJsonCopyText: '',
    redactedIssueSampleJsonCopyText: '',
    issueRegressionTemplateCopyText: '',
  },
  qualityState: {
    qualitySnapshot: null,
    qualityBaselineDeltaText: '',
  },
};

describe('transformReportPanelCopyTitleState', () => {
  it('把派生模型状态映射成复制标题布尔矩阵', () => {
    expect(buildTransformReportPanelCopyTitleState({
      ...baseInput,
      copyAvailability: {
        hasPathValueCopyItems: true,
        hasCmdStructureCopyItems: true,
        hasFocusedCmdStructureCopyItems: true,
      },
      issueCopyTexts: {
        issueSampleCopyText: 'issue',
        issueSampleJsonCopyText: 'json',
        redactedIssueSampleJsonCopyText: 'redacted',
        issueRegressionTemplateCopyText: 'template',
      },
      qualityState: {
        qualitySnapshot: null,
        qualityBaselineDeltaText: 'delta',
      },
    })).toMatchObject({
      hasFilteredReport: true,
      hasQualityBaselineDeltaText: true,
      hasPathValueCopyItems: true,
      hasFocusedCmdStructureCopyItems: true,
      hasIssueRegressionTemplateCopyText: true,
    });
  });

  it('复用复制标题文案矩阵', () => {
    const titles = buildTransformReportPanelCopyTitles({
      ...baseInput,
      isFilterPending: true,
    });

    expect(titles.filteredReport).toBe('筛选结果仍在更新，请稍后复制');
    expect(titles.fullReport).toBe('复制完整深度解析报告');
  });
});
