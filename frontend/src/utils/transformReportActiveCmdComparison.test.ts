import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import {
  buildActiveCmdComparisonCandidateText,
  buildActiveCmdComparisonReportText,
  findActiveCmdComparisonRecord,
  getCmdComparisonCandidateRecords,
} from './transformReportActiveCmdComparison';
import type {
  TransformContextReport,
  TransformReportRecord,
} from './transformSummary';
import { createTransformReportViewWithRecords } from './transformReportViewTestFixture';

const createCmdRecord = (
  path: string,
  cmdParams: JsonValue,
  overrides: Partial<TransformReportRecord> = {}
): TransformReportRecord => ({
  path,
  sourceLabel: 'scheme',
  commandSchema: 'sampleapp://v1/open',
  hasCmdStructure: true,
  cmdStructureCopyText: JSON.stringify({
    result: {
      cmdSchema: 'sampleapp://v1/open',
      source: 'sampleapp://v1/open',
      cmdParams,
    },
  }),
  ...overrides,
} as TransformReportRecord);

const expectedText = JSON.stringify({
  result: {
    cmdSchema: 'sampleapp://v1/open',
    source: 'sampleapp://v1/open',
    cmdParams: { id: 2 },
  },
});

describe('transformReportActiveCmdComparison', () => {
  it('按当前筛选视图、全量视图和报告顺序定位 active record', () => {
    const reportRecord = createCmdRecord('$.report', { id: 1 });
    const fullRecord = createCmdRecord('$.full', { id: 1 });
    const viewRecord = createCmdRecord('$.view', { id: 1 });

    expect(findActiveCmdComparisonRecord({
      recordPath: '$.view',
      report: { records: [reportRecord] } as TransformContextReport,
      reportView: createTransformReportViewWithRecords([viewRecord]),
      fullReportView: createTransformReportViewWithRecords([fullRecord]),
    })).toBe(viewRecord);

    expect(findActiveCmdComparisonRecord({
      recordPath: '$.full',
      report: { records: [reportRecord] } as TransformContextReport,
      reportView: createTransformReportViewWithRecords([viewRecord]),
      fullReportView: createTransformReportViewWithRecords([fullRecord]),
    })).toBe(fullRecord);
  });

  it('候选记录优先使用报告全量记录并过滤非 CMD 结构记录', () => {
    const cmdRecord = createCmdRecord('$.cmd', { id: 1 });
    const plainRecord = createCmdRecord('$.plain', { id: 1 }, { hasCmdStructure: false });

    expect(getCmdComparisonCandidateRecords({
      report: { records: [cmdRecord, plainRecord] } as TransformContextReport,
      reportView: createTransformReportViewWithRecords([]),
      fullReportView: createTransformReportViewWithRecords([]),
    })).toEqual([cmdRecord]);
  });

  it('生成 active 差异报告和候选推荐文本', () => {
    const currentRecord = createCmdRecord('$.current', { id: 1 });
    const betterRecord = createCmdRecord('$.better', { id: 2 });
    const report = { records: [currentRecord, betterRecord] } as TransformContextReport;
    const reportView = createTransformReportViewWithRecords([currentRecord]);

    const state = {
      recordPath: '$.current',
      expectedText,
      ignoreExtraPaths: false,
      actualCandidate: null,
      report,
      reportView,
      fullReportView: createTransformReportViewWithRecords([currentRecord, betterRecord]),
    };

    expect(buildActiveCmdComparisonReportText(state)).toContain('CMD 结构差异报告');
    expect(buildActiveCmdComparisonCandidateText(state)).toContain('建议优先切到 $.better');
  });
});
