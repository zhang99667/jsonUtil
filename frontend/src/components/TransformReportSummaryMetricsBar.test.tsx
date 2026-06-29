import { describe, expect, it, vi } from 'vitest';
import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';
import { SummaryMetricChip } from './TransformReportPanelAtoms';
import { TransformReportSummaryMetricsBar } from './TransformReportSummaryMetricsBar';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const findByDataTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByDataTour(item, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByDataTour(node.props.children, dataTour));
};

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const buildReport = (): TransformContextReport => ({
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
  cmdStructureCount: 1,
  nestedCommandFieldCount: 1,
  nestedResourceFieldCount: 1,
} as TransformContextReport);

describe('TransformReportSummaryMetricsBar', () => {
  it('展示总览指标并转发筛选和快捷入口', () => {
    const onFilter = vi.fn();
    const onOpenFirstCmdComparison = vi.fn();
    const onOpenPlaceholderFillTemplate = vi.fn();
    const tree = TransformReportSummaryMetricsBar({
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
      onFilter,
      onOpenFirstCmdComparison,
      onOpenPlaceholderFillTemplate,
    });
    const text = collectText(tree);

    expect(text).toContain('展开 3');
    expect(text).toContain('回填占位符 1/2');
    expect(findByType(tree, SummaryMetricChip).map(chip => chip.props.label)).toEqual([
      'CMD',
      'URL',
      'Base64',
    ]);
    expect(findByType(tree, SummaryMetricChip).map(chip => chip.props.count)).toEqual([1, 1, 1]);

    (findByDataTour(tree, 'transform-report-cmd-structure-count')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-open-first-cmd-comparison')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-nested-cmd-count')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-nested-resource-count')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-issue-priority')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-non-reversible-count')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-unresolved-count')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-warning-count')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-placeholder-count')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-open-placeholder-fill-shortcut')[0].props.onClick as () => void)();

    expect(onFilter).toHaveBeenCalledWith('CMD结构');
    expect(onFilter).toHaveBeenCalledWith('内部CMD字段');
    expect(onFilter).toHaveBeenCalledWith('资源URL');
    expect(onFilter).toHaveBeenCalledWith('待处理');
    expect(onFilter).toHaveBeenCalledWith('不可逆');
    expect(onFilter).toHaveBeenCalledWith('待检查');
    expect(onFilter).toHaveBeenCalledWith('跳过');
    expect(onFilter).toHaveBeenCalledWith('占位符');
    expect(onOpenFirstCmdComparison).toHaveBeenCalledTimes(1);
    expect(onOpenPlaceholderFillTemplate).toHaveBeenCalledTimes(1);
  });

  it('过滤未满足条件的快捷入口并保留禁用态', () => {
    const tree = TransformReportSummaryMetricsBar({
      report: {
        ...buildReport(),
        summary: {
          ...buildReport().summary,
          placeholderCount: 1,
          unresolvedCount: 0,
          warningCount: 0,
          schemeCounts: {
            queryString: 0,
            url: 0,
            base64: 0,
            nonReversible: 0,
          },
        },
        cmdStructureCount: 1,
        nestedCommandFieldCount: 0,
        nestedResourceFieldCount: 0,
      } as TransformContextReport,
      reportView: { filteredCmdStructureCount: 0 } as TransformReportView,
      issuePriorityCount: 0,
      isFilterPending: true,
      hasTemplateFillTarget: true,
      placeholderFillTemplateJsonText: '',
      placeholderFillTemplateSummary: null,
      placeholderFillPanelTitle: '打开回填模板',
      onFilter: vi.fn(),
      onOpenFirstCmdComparison: vi.fn(),
      onOpenPlaceholderFillTemplate: vi.fn(),
    });

    expect(findByDataTour(tree, 'transform-report-open-first-cmd-comparison')[0].props.disabled).toBe(true);
    expect(findByDataTour(tree, 'transform-report-open-placeholder-fill-shortcut')[0].props.disabled).toBe(true);
    expect(findByDataTour(tree, 'transform-report-nested-cmd-count')).toHaveLength(0);
    expect(findByDataTour(tree, 'transform-report-warning-count')).toHaveLength(0);
  });
});
