import { describe, expect, it, vi } from 'vitest';
import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';
import type { TransformReportPlaceholderToolbarState } from '../utils/transformReportPlaceholderToolbarState';
import { TransformReportPanelContent } from './TransformReportPanelContent';
import { TransformReportPanelSections } from './TransformReportPanelSections';

vi.mock('./TransformReportPanelSections', () => ({
  TransformReportPanelSections: (props: Record<string, unknown>) => (
    <section data-mock="sections" {...props} />
  ),
}));

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

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const collectText = (node: unknown): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (!isElementLike(node)) return '';
  return collectText(node.props.children);
};

const report = { summaryText: '解析完成' } as TransformContextReport;
const reportView = {
  records: [],
  unresolvedCandidates: [],
  runtimePlaceholderGroups: [],
  runtimePlaceholders: [],
  warnings: [],
  filteredRecordCount: 0,
  filteredUnresolvedCount: 0,
  filteredPlaceholderCount: 0,
  filteredWarningCount: 0,
  isRecordTruncated: false,
  isUnresolvedTruncated: false,
  isPlaceholderTruncated: false,
  isWarningTruncated: false,
} as unknown as TransformReportView;
const placeholderToolbarState = {
  filteredPlaceholderCount: 0,
  isPlaceholderTruncated: false,
  canShowOpenTemplateFill: true,
  isPlaceholderFillTemplateDisabled: false,
  isCopyPlaceholderReportDisabled: false,
  openTemplateFillTitle: '打开模板',
  copyTemplateTitle: '复制模板',
  copyPlaceholderReportTitle: '复制占位符',
} satisfies TransformReportPlaceholderToolbarState;

const buildProps = (
  overrides: Partial<Parameters<typeof TransformReportPanelContent>[0]> = {}
): Parameters<typeof TransformReportPanelContent>[0] => ({
  report,
  reportView,
  query: 'CMD',
  issuePriorityCount: 1,
  isFilterPending: false,
  hasTemplateFillTarget: true,
  placeholderFillTemplateJsonText: '{}',
  placeholderFillTemplateSummary: null,
  placeholderFillPanelTitle: '打开模板填充',
  nextActions: [],
  issueTriageItems: [],
  sectionVisibility: {
    showRecords: true,
    showUnresolved: false,
    showPlaceholders: false,
    showWarnings: true,
    showEmptyState: false,
  },
  placeholderToolbarState,
  cmdComparisonRecordPath: null,
  cmdComparisonActualCandidate: null,
  cmdComparisonExpectedText: '',
  cmdComparisonIgnoreExtraPaths: false,
  getCmdComparisonCandidateRecords: vi.fn(() => []),
  onFilter: vi.fn(),
  onOpenFirstCmdComparison: vi.fn(),
  onOpenPlaceholderFillTemplate: vi.fn(),
  onCopyPlaceholderFillTemplate: vi.fn(),
  onCopyPlaceholderReport: vi.fn(),
  onRunNextAction: vi.fn(),
  onRunIssueTriageAction: vi.fn(),
  onCopyPath: vi.fn(),
  onCopyOriginalValue: vi.fn(),
  onCopyDecodedPathValue: vi.fn(),
  onCopyCmdStructure: vi.fn(),
  onCopyCmdComparisonPackage: vi.fn(),
  onToggleCmdComparison: vi.fn(),
  onCopyCmdComparisonDiff: vi.fn(),
  onSwitchCmdComparisonCandidate: vi.fn(),
  onCmdComparisonExpectedTextChange: vi.fn(),
  onCmdComparisonIgnoreExtraPathsChange: vi.fn(),
  onLocatePath: vi.fn(),
  onOpenSchemeValue: vi.fn(),
  ...overrides,
});

describe('TransformReportPanelContent', () => {
  it('没有报告时展示空上下文提示', () => {
    const tree = TransformReportPanelContent(buildProps({
      report: null,
      reportView: null,
    }));

    expect(collectText(tree)).toContain('暂无深度解析上下文');
    expect(findByType(tree, TransformReportPanelSections)).toHaveLength(0);
  });

  it('有报告时委派 sections 组件渲染内容区', () => {
    const onFilter = vi.fn();
    const tree = TransformReportPanelContent(buildProps({ onFilter }));
    const sections = findByType(tree, TransformReportPanelSections)[0];

    expect(sections.props.report).toBe(report);
    expect(sections.props.reportView).toBe(reportView);
    expect(sections.props.query).toBe('CMD');
    expect(sections.props.onFilter).toBe(onFilter);
  });
});
