import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportCmdHandlerSummary } from './TransformReportCmdHandlerSummary';
import { TransformReportCommandSchemaRows } from './TransformReportCommandSchemaRows';
import { TransformReportRecordBadges } from './TransformReportRecordBadges';
import { TransformReportRecordHeader } from './TransformReportRecordHeader';
import { TransformReportRecordPathSections } from './TransformReportRecordPathSections';
import { TransformReportRecordsSection } from './TransformReportRecordsSection';

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

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const record: TransformReportRecord = {
  path: '$.cmd',
  sourceLabel: 'scheme',
  commandSchema: 'baiduboxapp://v1/open',
  commandSchemaRows: [{
    path: '$.cmd.cmdSchema',
    schema: 'baiduboxapp://v1/open',
  }],
  commandParamCount: 2,
  commandParamKeys: ['uid'],
  labels: ['JSON 字符串'],
  insights: ['cmdSchema=baiduboxapp://v1/open'],
  originalValue: 'baiduboxapp://v1/open?uid=1',
  originalPreview: 'baiduboxapp://v1/open?...',
  decodedPreview: '{"uid":1}',
  decodedPaths: [{
    path: '$.cmd.uid',
    preview: '1',
    value: 1,
  }],
  decodedPathCount: 2,
  isDecodedPathCountTruncated: true,
  indexedDecodedPathCount: 3,
  hasMoreDecodedPaths: true,
  nestedCommandFields: [{
    path: '$.cmd.jump_url',
    preview: 'baiduboxapp://v1/jump',
    value: 'baiduboxapp://v1/jump',
  }],
  nestedCommandSearchFields: [],
  indexedNestedCommandFieldCount: 2,
  hasMoreNestedCommandFields: true,
  nestedResourceFields: [{
    path: '$.cmd.image',
    preview: 'https://example.com/a.png',
    value: 'https://example.com/a.png',
  }],
  nestedResourceSearchFields: [],
  indexedNestedResourceFieldCount: 2,
  hasMoreNestedResourceFields: true,
  hasCmdStructure: true,
  nestedCommandFieldCount: 2,
  nestedResourceFieldCount: 2,
  nestedExtFieldCount: 0,
  nestedBase64SuffixFieldCount: 0,
  cmdStructureCopyText: '{"result":{"cmdSchema":"baiduboxapp://v1/open","cmdParams":{"uid":1}}}',
  cmdStructureFocusPaths: ['$.cmd.uid'],
  cmdStructureFocusCount: 1,
  cmdStructureFocusLabel: '内部路径',
  stepCount: 2,
  hasNonReversibleScheme: true,
};

const buildSection = (overrides: Partial<Parameters<typeof TransformReportRecordsSection>[0]> = {}) => {
  const props = {
    records: [record],
    filteredRecordCount: 3,
    isRecordTruncated: true,
    cmdComparisonRecordPath: null,
    cmdComparisonActualCandidate: null,
    cmdComparisonExpectedText: '',
    cmdComparisonIgnoreExtraPaths: false,
    getCmdComparisonCandidateRecords: vi.fn(() => [record]),
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
    onFilter: vi.fn(),
    onLocatePath: vi.fn(),
    onOpenSchemeValue: vi.fn(),
    ...overrides,
  };

  return {
    props,
    tree: TransformReportRecordsSection(props),
  };
};

describe('TransformReportRecordsSection', () => {
  it('渲染展开记录摘要并转发复制、筛选、定位和 Scheme 动作', () => {
    const { props, tree } = buildSection();
    const text = collectText(tree);

    expect(text).toContain('展开记录 · 3');
    expect(text).toContain('仅显示前 1 条');

    const headers = findByType(tree, TransformReportRecordHeader);
    expect(headers).toHaveLength(1);
    expect(headers[0].props.record).toBe(record);
    expect(headers[0].props.onCopyPath).toBe(props.onCopyPath);
    expect(headers[0].props.onCopyOriginalValue).toBe(props.onCopyOriginalValue);
    expect(headers[0].props.onCopyCmdStructure).toBe(props.onCopyCmdStructure);
    expect(headers[0].props.onCopyCmdComparisonPackage).toBe(props.onCopyCmdComparisonPackage);
    expect(headers[0].props.onToggleCmdComparison).toBe(props.onToggleCmdComparison);
    expect(headers[0].props.onLocatePath).toBe(props.onLocatePath);
    expect(headers[0].props.onOpenSchemeValue).toBe(props.onOpenSchemeValue);
    const badges = findByType(tree, TransformReportRecordBadges);
    expect(badges).toHaveLength(1);
    expect(badges[0].props.record).toBe(record);
    const pathSections = findByType(tree, TransformReportRecordPathSections);
    expect(pathSections).toHaveLength(1);
    expect(pathSections[0].props.record).toBe(record);
    expect(pathSections[0].props.onCopyPath).toBe(props.onCopyPath);
    expect(pathSections[0].props.onCopyDecodedPathValue).toBe(props.onCopyDecodedPathValue);
    expect(pathSections[0].props.onLocatePath).toBe(props.onLocatePath);
    expect(pathSections[0].props.onOpenSchemeValue).toBe(props.onOpenSchemeValue);
    const cmdHandlerSummary = findByType(tree, TransformReportCmdHandlerSummary);
    expect(cmdHandlerSummary).toHaveLength(1);
    expect(cmdHandlerSummary[0].props.record).toBe(record);
    expect(cmdHandlerSummary[0].props.onFilter).toBe(props.onFilter);
    const commandSchemaRows = findByType(tree, TransformReportCommandSchemaRows);
    expect(commandSchemaRows).toHaveLength(1);
    expect(commandSchemaRows[0].props.rows).toBe(record.commandSchemaRows);
    expect(commandSchemaRows[0].props.onCopyPath).toBe(props.onCopyPath);
    expect(commandSchemaRows[0].props.onCopyDecodedPathValue).toBe(props.onCopyDecodedPathValue);
    expect(commandSchemaRows[0].props.onLocatePath).toBe(props.onLocatePath);
  });
});
