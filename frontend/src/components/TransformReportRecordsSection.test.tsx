import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportCmdComparisonPanel } from './TransformReportCmdComparisonPanel';
import { TransformReportCmdHandlerSummary } from './TransformReportCmdHandlerSummary';
import { TransformReportCommandSchemaRows } from './TransformReportCommandSchemaRows';
import { TransformReportRecordBadges } from './TransformReportRecordBadges';
import { TransformReportRecordHeader } from './TransformReportRecordHeader';
import { TransformReportRecordPathSections } from './TransformReportRecordPathSections';
import { TransformReportRecordsSection } from './TransformReportRecordsSection';
import { collectText, findByType } from './componentElementTestHelpers';

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
  const actions = {
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
  };
  const props = {
    records: [record],
    filteredRecordCount: 3,
    isRecordTruncated: true,
    actions,
    cmdComparison: {
      recordPath: null,
      actualCandidate: null,
      expectedText: '',
      ignoreExtraPaths: false,
      getCandidateRecords: vi.fn(() => [record]),
    },
    onFilter: vi.fn(),
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
    expect(headers[0].props.actions).toBe(props.actions);
    const badges = findByType(tree, TransformReportRecordBadges);
    expect(badges).toHaveLength(1);
    expect(badges[0].props.record).toBe(record);
    const pathSections = findByType(tree, TransformReportRecordPathSections);
    expect(pathSections).toHaveLength(1);
    expect(pathSections[0].props.record).toBe(record);
    expect(pathSections[0].props.actions).toBe(props.actions);
    const cmdHandlerSummary = findByType(tree, TransformReportCmdHandlerSummary);
    expect(cmdHandlerSummary).toHaveLength(1);
    expect(cmdHandlerSummary[0].props.record).toBe(record);
    expect(cmdHandlerSummary[0].props.onFilter).toBe(props.onFilter);
    const commandSchemaRows = findByType(tree, TransformReportCommandSchemaRows);
    expect(commandSchemaRows).toHaveLength(1);
    expect(commandSchemaRows[0].props.rows).toBe(record.commandSchemaRows);
    expect(commandSchemaRows[0].props.actions).toBe(props.actions);
  });

  it('只在当前记录展开 CMD 对比并按记录路径过滤候选', () => {
    const getCandidateRecords = vi.fn(() => [record]);
    const { tree } = buildSection({
      cmdComparison: {
        recordPath: record.path,
        actualCandidate: {
          id: '$.candidate',
          recordPath: record.path,
          label: '$.candidate',
          sourceLabel: 'SOURCE[1]',
          actual: { result: { cmdSchema: 'baiduboxapp://v1/open', cmdParams: {} } },
        },
        expectedText: '{"result":{}}',
        ignoreExtraPaths: true,
        getCandidateRecords,
      },
    });
    const panels = findByType(tree, TransformReportCmdComparisonPanel);

    expect(panels).toHaveLength(1);
    expect(panels[0].props.candidateRecords).toEqual([record]);
    expect(panels[0].props.activeCandidate).toMatchObject({ recordPath: record.path });
    expect(panels[0].props.expectedText).toBe('{"result":{}}');
    expect(panels[0].props.ignoreExtraPaths).toBe(true);
    expect(getCandidateRecords).toHaveBeenCalledTimes(1);

    const mismatch = buildSection({
      cmdComparison: {
        recordPath: record.path,
        actualCandidate: {
          id: '$.other',
          recordPath: '$.other',
          label: '$.other',
          sourceLabel: 'SOURCE[2]',
          actual: { result: { cmdSchema: 'baiduboxapp://v1/other', cmdParams: {} } },
        },
        expectedText: '',
        ignoreExtraPaths: false,
        getCandidateRecords: vi.fn(() => []),
      },
    });

    expect(findByType(mismatch.tree, TransformReportCmdComparisonPanel)[0].props.activeCandidate).toBeNull();
  });
});
