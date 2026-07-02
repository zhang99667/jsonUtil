import { describe, expect, it, vi } from 'vitest';
import type {
  TransformContextReport,
  TransformReportRecord,
  TransformReportView,
} from '../utils/transformSummary';
import type { TransformReportPlaceholderToolbarState } from '../utils/transformReportPlaceholderToolbarState';
import { TransformReportEmptyState } from './TransformReportEmptyState';
import { TransformReportFilterBar } from './TransformReportFilterBar';
import { TransformReportPanelSections } from './TransformReportPanelSections';
import { TransformReportPlaceholdersSection } from './TransformReportPlaceholdersSection';
import { TransformReportRecordsSection } from './TransformReportRecordsSection';
import { TransformReportSummarySection } from './TransformReportSummarySection';
import { TransformReportUnresolvedSection } from './TransformReportUnresolvedSection';
import { TransformReportWarningsSection } from './TransformReportWarningsSection';

vi.mock('./TransformReportSummarySection', () => ({
  TransformReportSummarySection: (props: Record<string, unknown>) => (
    <section data-mock="summary" {...props} />
  ),
}));

vi.mock('./TransformReportFilterBar', () => ({
  TransformReportFilterBar: (props: Record<string, unknown>) => (
    <section data-mock="filter" {...props} />
  ),
}));

vi.mock('./TransformReportRecordsSection', () => ({
  TransformReportRecordsSection: (props: Record<string, unknown>) => (
    <section data-mock="records" {...props} />
  ),
}));

vi.mock('./TransformReportUnresolvedSection', () => ({
  TransformReportUnresolvedSection: (props: Record<string, unknown>) => (
    <section data-mock="unresolved" {...props} />
  ),
}));

vi.mock('./TransformReportPlaceholdersSection', () => ({
  TransformReportPlaceholdersSection: (props: Record<string, unknown>) => (
    <section data-mock="placeholders" {...props} />
  ),
}));

vi.mock('./TransformReportWarningsSection', () => ({
  TransformReportWarningsSection: (props: Record<string, unknown>) => (
    <section data-mock="warnings" {...props} />
  ),
}));

vi.mock('./TransformReportEmptyState', () => ({
  TransformReportEmptyState: (props: Record<string, unknown>) => (
    <section data-mock="empty" {...props} />
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

const report = { summaryText: '解析完成' } as TransformContextReport;
const record = { path: '$.a' } as TransformReportRecord;
const reportView = {
  records: [record],
  unresolvedCandidates: [{ path: '$.todo' }],
  runtimePlaceholderGroups: [],
  runtimePlaceholders: [],
  warnings: [{ path: '$.warn' }],
  filteredRecordCount: 1,
  filteredUnresolvedCount: 1,
  filteredPlaceholderCount: 0,
  filteredWarningCount: 1,
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
  overrides: Partial<Parameters<typeof TransformReportPanelSections>[0]> = {}
): Parameters<typeof TransformReportPanelSections>[0] => ({
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
  recordActions: {
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
  },
  recordCmdComparison: {
    recordPath: null,
    actualCandidate: null,
    expectedText: '',
    ignoreExtraPaths: false,
    getCandidateRecords: vi.fn(() => []),
  },
  onFilter: vi.fn(),
  onOpenFirstCmdComparison: vi.fn(),
  onOpenPlaceholderFillTemplate: vi.fn(),
  onCopyPlaceholderFillTemplate: vi.fn(),
  onCopyPlaceholderReport: vi.fn(),
  onRunNextAction: vi.fn(),
  onRunIssueTriageAction: vi.fn(),
  ...overrides,
});

describe('TransformReportPanelSections', () => {
  it('按 section 可见性渲染记录、未展开、告警和空态', () => {
    const tree = TransformReportPanelSections(buildProps({
      sectionVisibility: {
        showRecords: true,
        showUnresolved: true,
        showPlaceholders: false,
        showWarnings: true,
        showEmptyState: true,
      },
    }));

    expect(findByType(tree, TransformReportSummarySection)).toHaveLength(1);
    expect(findByType(tree, TransformReportFilterBar)).toHaveLength(1);
    expect(findByType(tree, TransformReportRecordsSection)).toHaveLength(1);
    expect(findByType(tree, TransformReportUnresolvedSection)).toHaveLength(1);
    expect(findByType(tree, TransformReportWarningsSection)).toHaveLength(1);
    expect(findByType(tree, TransformReportEmptyState)).toHaveLength(1);
  });

  it('向记录和占位符分区透传复制、定位和模板回调', () => {
    const onFilter = vi.fn();
    const onCopyPlaceholderReport = vi.fn();
    const onOpenPlaceholderFillTemplate = vi.fn();
    const tree = TransformReportPanelSections(buildProps({
      onFilter,
      onCopyPlaceholderReport,
      onOpenPlaceholderFillTemplate,
      sectionVisibility: {
        showRecords: true,
        showUnresolved: false,
        showPlaceholders: true,
        showWarnings: false,
        showEmptyState: false,
      },
    }));
    const records = findByType(tree, TransformReportRecordsSection)[0];
    const placeholders = findByType(tree, TransformReportPlaceholdersSection)[0];

    expect(records.props.records).toBe(reportView.records);
    expect(records.props.onFilter).toBe(onFilter);
    expect(records.props.actions).toBeDefined();
    expect(records.props.cmdComparison).toBeDefined();
    const toolbar = placeholders.props.toolbar as {
      onOpenPlaceholderFillTemplate: () => void;
      onCopyPlaceholderReport: () => void;
    };
    expect(toolbar.onOpenPlaceholderFillTemplate).toBe(onOpenPlaceholderFillTemplate);
    expect(toolbar.onCopyPlaceholderReport).toBe(onCopyPlaceholderReport);
    expect(placeholders.props.onFilter).toBe(onFilter);
  });
});
