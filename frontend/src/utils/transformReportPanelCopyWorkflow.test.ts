import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransformContext } from '../types';
import {
  buildTransformReportPanelCopyWorkflow,
  type TransformReportPanelCopyWorkflowEffects,
  type TransformReportPanelCopyWorkflowState,
} from './transformReportPanelCopyWorkflow';
import type {
  TransformContextReport,
  TransformQualitySnapshot,
  TransformReportRecord,
  TransformReportView,
} from './transformSummary';
import * as transformSummary from './transformSummary';
import * as copyMetrics from './transformReportCopyMetrics';
import * as cmdComparison from './transformReportCmdComparison';

vi.mock('./transformSummary', () => ({
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
}));

vi.mock('./transformReportCopyMetrics', () => ({
  formatCopySuccessMessage: vi.fn((label: string, text: string) => `${label}:${text.length}`),
  formatPathValueCopyCountLabel: vi.fn(() => '2 条，已截断'),
  getPathValueCopyRowCount: vi.fn(() => 2),
  isPathValueCopyLimited: vi.fn(() => true),
}));

vi.mock('./transformReportCmdComparison', () => ({
  buildCmdComparisonReportText: vi.fn(() => 'cmd-diff-text'),
}));

const report = { summary: {} } as unknown as TransformContextReport;
const reportView = {
  records: [{ path: '$.a' }],
  isRecordTruncated: true,
} as unknown as TransformReportView;
const activeContext = { timestamp: 1 } as unknown as TransformContext;
const qualitySnapshot = { score: 1 } as unknown as TransformQualitySnapshot;
const actualCandidate = { label: '$.candidate' } as unknown as TransformReportPanelCopyWorkflowState['cmdComparisonActualCandidate'];

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

const buildWorkflow = (
  stateOverrides: Partial<TransformReportPanelCopyWorkflowState> = {},
  effectOverrides: Partial<TransformReportPanelCopyWorkflowEffects> = {}
) => {
  const effects = buildEffects(effectOverrides);
  return {
    effects,
    workflow: buildTransformReportPanelCopyWorkflow(buildState(stateOverrides), effects),
  };
};

describe('transformReportPanelCopyWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('筛选结果仍在更新时跳过依赖 reportView 的复制动作', async () => {
    const guardedActions: Array<keyof Pick<
      ReturnType<typeof buildTransformReportPanelCopyWorkflow>,
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

    for (const actionName of guardedActions) {
      const { effects, workflow } = buildWorkflow({ isFilterPending: true });
      await workflow[actionName]();
      expect(effects.copyText).not.toHaveBeenCalled();
      expect(effects.showSuccess).not.toHaveBeenCalled();
    }

    expect(transformSummary.formatTransformReportViewText).not.toHaveBeenCalled();
  });

  it('完整报告在 pending 时仍可复制', async () => {
    const { effects, workflow } = buildWorkflow({ isFilterPending: true });

    await workflow.copyReport();

    expect(transformSummary.formatTransformContextReportText).toHaveBeenCalledWith(activeContext);
    expect(effects.copyText).toHaveBeenCalledWith('full-report-text');
  });

  it('复制归档包和协作报告时注入当前 CMD 对比文本', async () => {
    const { effects, workflow } = buildWorkflow();

    await workflow.copyArchivePackage();
    await workflow.copyCollaborationReport();

    expect(transformSummary.formatTransformArchivePackageJsonText).toHaveBeenCalledWith(report, reportView, 'CMD 参数', {
      cmdComparisonReportText: 'active-cmd-diff',
      cmdComparisonCandidateText: 'active-cmd-candidate',
    });
    expect(transformSummary.formatTransformCollaborationReportText).toHaveBeenCalledWith(report, reportView, 'CMD 参数', {
      cmdComparisonReportText: 'active-cmd-diff',
      cmdComparisonCandidateText: 'active-cmd-candidate',
    });
    expect(effects.copyText).toHaveBeenCalledWith('archive-text');
    expect(effects.copyText).toHaveBeenCalledWith('collaboration-text');
    expect(copyMetrics.formatCopySuccessMessage).toHaveBeenCalledWith('归档包', 'archive-text');
    expect(effects.showSuccess).toHaveBeenCalledWith('归档包:12', { duration: 2000 });
  });

  it('质量基线保存空筛选时使用全部并支持清除', () => {
    const { effects, workflow } = buildWorkflow({ deferredQuery: '   ' });

    workflow.setQualityBaseline();
    workflow.clearQualityBaseline();

    expect(effects.setQualityBaseline).toHaveBeenNthCalledWith(1, {
      snapshot: qualitySnapshot,
      filter: '全部',
    });
    expect(effects.showStatusSuccess).toHaveBeenNthCalledWith(1, '已设为临时质量基线', { duration: 1600 });
    expect(effects.setQualityBaseline).toHaveBeenNthCalledWith(2, null);
    expect(effects.showStatusSuccess).toHaveBeenNthCalledWith(2, '临时质量基线已清除', { duration: 1600 });
  });

  it('占位符模板打开受模板、pending 和目标面板保护', () => {
    const missingTemplate = buildWorkflow({ placeholderFillTemplateJsonText: '' });
    missingTemplate.workflow.openPlaceholderFillTemplate();

    const pending = buildWorkflow({ isFilterPending: true });
    pending.workflow.openPlaceholderFillTemplate();

    const missingTarget = buildWorkflow({}, { openTemplateFill: undefined });
    missingTarget.workflow.openPlaceholderFillTemplate();

    const ready = buildWorkflow();
    ready.workflow.openPlaceholderFillTemplate();

    expect(missingTemplate.effects.openTemplateFill).not.toHaveBeenCalled();
    expect(pending.effects.openTemplateFill).not.toHaveBeenCalled();
    expect(missingTarget.effects.showStatusSuccess).not.toHaveBeenCalled();
    expect(ready.effects.openTemplateFill).toHaveBeenCalledWith('{"placeholders":{}}');
    expect(ready.effects.showStatusSuccess).toHaveBeenCalledWith('已填入模板填充', { duration: 1600 });
  });

  it('行级复制保留 1600ms 提示时长', async () => {
    const { effects, workflow } = buildWorkflow();

    await workflow.copyPath('$.data[0]', '已复制自定义路径');

    expect(effects.copyText).toHaveBeenCalledWith('$.data[0]');
    expect(effects.showSuccess).toHaveBeenCalledWith('已复制自定义路径', { duration: 1600 });
  });

  it('CMD 差异复制透传 expected、忽略额外路径和候选结构', async () => {
    const record = { path: '$.cmd' } as unknown as TransformReportRecord;
    const { effects, workflow } = buildWorkflow();

    await workflow.copyCmdComparisonDiff(record);

    expect(cmdComparison.buildCmdComparisonReportText).toHaveBeenCalledWith(
      record,
      'expected-cmd',
      true,
      actualCandidate
    );
    expect(effects.copyText).toHaveBeenCalledWith('cmd-diff-text');
    expect(effects.showSuccess).toHaveBeenCalledWith('已复制 CMD 差异报告', { duration: 1600 });
  });

  it('CMD 对比包为空文本时沿用复制 runner 的静默跳过', async () => {
    vi.mocked(transformSummary.formatTransformCmdStructureComparisonPackageText).mockReturnValueOnce('');
    const { effects, workflow } = buildWorkflow();

    await workflow.copyCmdComparisonPackage({ path: '$.cmd' } as unknown as TransformReportRecord);

    expect(effects.copyText).not.toHaveBeenCalled();
    expect(effects.showSuccess).not.toHaveBeenCalled();
  });
});
