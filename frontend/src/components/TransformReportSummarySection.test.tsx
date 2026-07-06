import { describe, expect, it, vi } from 'vitest';
import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';
import type {
  TransformReportIssueTriageItem,
  TransformReportNextActionItem,
} from '../utils/transformReportActionItems';
import { TransformReportIssueTriagePanel } from './TransformReportIssueTriagePanel';
import { TransformReportNextActionsPanel } from './TransformReportNextActionsPanel';
import { TransformReportSummaryMetricsBar } from './TransformReportSummaryMetricsBar';
import { TransformReportSummarySection } from './TransformReportSummarySection';
import { collectText, findByType } from './componentElementTestHelpers';

const buildReport = (): TransformContextReport => ({
  summaryText: '深度解析: 展开 3',
  summary: {
    recordCount: 3,
    unresolvedCount: 1,
    warningCount: 1,
    placeholderCount: 1,
    schemeCounts: {
      queryString: 1,
      url: 1,
      base64: 1,
      nonReversible: 1,
    },
  },
  coverage: {
    level: 'info',
    label: '覆盖 80%',
    description: '覆盖描述',
    items: ['CMD 参数'],
  },
  cmdStructureCount: 1,
  nestedCommandFieldCount: 1,
  nestedResourceFieldCount: 1,
  topCommandSchemaOrigins: [],
  topCommandSchemas: [],
  topResourceSchemas: [],
  topResourceTypes: [],
  topNestedCommandFields: [],
  topNestedResourceFields: [],
} as TransformContextReport);

describe('TransformReportSummarySection', () => {
  it('渲染顶部概览并转发筛选和行动入口', () => {
    const onFilter = vi.fn();
    const onOpenFirstCmdComparison = vi.fn();
    const onOpenPlaceholderFillTemplate = vi.fn();
    const onRunNextAction = vi.fn();
    const onRunIssueTriageAction = vi.fn();
    const nextActions: TransformReportNextActionItem[] = [{
      key: 'archive',
      label: '归档',
      description: '复制归档包',
      title: '复制归档包',
      tone: 'cyan',
      action: 'copy-archive',
    }];
    const issueTriageItems: TransformReportIssueTriageItem[] = [{
      key: 'warning',
      label: '跳过',
      count: 1,
      description: '优先处理跳过记录',
      actionLabel: '筛选跳过',
      title: '筛选跳过记录',
      action: 'filter-warning',
    }];

    const tree = TransformReportSummarySection({
      report: buildReport(),
      reportView: { filteredCmdStructureCount: 1 } as TransformReportView,
      issuePriorityCount: 3,
      isFilterPending: false,
      hasTemplateFillTarget: true,
      placeholderFillTemplateJsonText: '{"placeholders":{}}',
      placeholderFillTemplateSummary: {
        total: 2,
        filled: 1,
        suggested: 1,
        pending: 1,
      },
      placeholderFillPanelTitle: '打开回填模板',
      nextActions,
      issueTriageItems,
      onFilter,
      onOpenFirstCmdComparison,
      onOpenPlaceholderFillTemplate,
      onRunNextAction,
      onRunIssueTriageAction,
    });

    const text = collectText(tree);
    expect(text).toContain('深度解析: 展开 3');
    const metricsBar = findByType(tree, TransformReportSummaryMetricsBar);
    expect(metricsBar).toHaveLength(1);
    expect(metricsBar[0].props.report).toBeTruthy();
    expect(metricsBar[0].props.reportView).toEqual({ filteredCmdStructureCount: 1 });
    expect(metricsBar[0].props.issuePriorityCount).toBe(3);
    expect(metricsBar[0].props.isFilterPending).toBe(false);
    expect(metricsBar[0].props.hasTemplateFillTarget).toBe(true);
    expect(metricsBar[0].props.placeholderFillTemplateJsonText).toBe('{"placeholders":{}}');
    expect(metricsBar[0].props.placeholderFillPanelTitle).toBe('打开回填模板');
    expect(metricsBar[0].props.onFilter).toBe(onFilter);
    expect(metricsBar[0].props.onOpenFirstCmdComparison).toBe(onOpenFirstCmdComparison);
    expect(metricsBar[0].props.onOpenPlaceholderFillTemplate).toBe(onOpenPlaceholderFillTemplate);
    const nextActionsPanel = findByType(tree, TransformReportNextActionsPanel);
    expect(nextActionsPanel).toHaveLength(1);
    expect(nextActionsPanel[0].props.nextActions).toBe(nextActions);
    expect(nextActionsPanel[0].props.onRunNextAction).toBe(onRunNextAction);
    const issueTriagePanel = findByType(tree, TransformReportIssueTriagePanel);
    expect(issueTriagePanel).toHaveLength(1);
    expect(issueTriagePanel[0].props.issuePriorityCount).toBe(3);
    expect(issueTriagePanel[0].props.issueTriageItems).toBe(issueTriageItems);
    expect(issueTriagePanel[0].props.onFilter).toBe(onFilter);
    expect(issueTriagePanel[0].props.onRunIssueTriageAction).toBe(onRunIssueTriageAction);
  });
});
