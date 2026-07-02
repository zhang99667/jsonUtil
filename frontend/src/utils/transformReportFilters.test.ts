import { describe, expect, it } from 'vitest';
import {
  buildFilteredRecordView,
  matchesReportRecord,
  shouldSearchLongSourceValue,
  type TransformReportFilterOptions,
} from './transformReportFilters';
import type { TransformReportRecord } from './transformSummary';

const filterOptions: TransformReportFilterOptions = {
  decodedPathLimit: 1,
  nestedCommandFieldLimit: 1,
  getCommandSchemaOrigin: schema => {
    const match = schema.match(/^([A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#]+)/);
    return match ? match[1] : schema;
  },
  getSchemeParamStageSearchText: summary => (
    summary ? summary.keys.map(bucket => bucket.key).join(' ') : ''
  ),
};

const createRecord = (overrides: Partial<TransformReportRecord> = {}): TransformReportRecord => ({
  path: '$.cmd',
  labels: [],
  insights: [],
  originalValue: '',
  originalPreview: 'origin preview',
  decodedPaths: [],
  decodedPathCount: 0,
  isDecodedPathCountTruncated: false,
  indexedDecodedPathCount: 0,
  hasMoreDecodedPaths: false,
  nestedCommandFields: [],
  indexedNestedCommandFieldCount: 0,
  hasMoreNestedCommandFields: false,
  hasCmdStructure: true,
  nestedCommandFieldCount: 0,
  nestedExtFieldCount: 0,
  nestedBase64SuffixFieldCount: 0,
  stepCount: 1,
  hasNonReversibleScheme: false,
  ...overrides,
});

describe('transformReportFilters', () => {
  it('通过 schema origin 和参数层 key 匹配展开记录', () => {
    const record = createRecord({
      commandSchema: 'baiduboxapp://v1/browser/open?url=https%3A%2F%2Fm.baidu.com',
      schemeParamStageSummary: {
        total: 1,
        repairHints: 0,
        nonReversible: 0,
        sources: [],
        keys: [{ key: 'extraParam', count: 1 }],
        repairHintLabels: [],
        samples: [],
      },
    });

    expect(matchesReportRecord(record, 'baiduboxapp://v1', filterOptions)).toBe(true);
    expect(matchesReportRecord(record, 'extraparam', filterOptions)).toBe(true);
  });

  it('通过资源类型 token 匹配并裁剪资源字段视图', () => {
    const record = createRecord({
      nestedResourceFieldCount: 2,
      nestedResourceSearchFields: [
        { path: '$.video_url', preview: 'https://cdn.baidu.com/a.mp4', resourceType: 'video' },
        { path: '$.image_url', preview: 'https://cdn.baidu.com/a.png', resourceType: 'image' },
      ],
    });

    expect(matchesReportRecord(record, '资源类型:视频', filterOptions)).toBe(true);

    const filtered = buildFilteredRecordView(record, '资源类型:视频', filterOptions);
    expect(filtered.nestedResourceFields).toEqual([
      { path: '$.video_url', preview: 'https://cdn.baidu.com/a.mp4', resourceType: 'video' },
    ]);
    expect(filtered.nestedResourceFieldCount).toBe(1);
  });

  it('筛选内部路径时收敛 decodedPaths 并清空未命中的内部 CMD 字段', () => {
    const record = createRecord({
      decodedSearchPaths: [
        { path: '$.cmd.first', preview: 'first value' },
        { path: '$.cmd.second', preview: 'second value' },
      ],
      nestedCommandSearchFields: [
        { path: '$.cmd.third', preview: 'third value' },
      ],
      nestedCommandFieldCount: 1,
    });

    const filtered = buildFilteredRecordView(record, 'second', filterOptions);
    expect(filtered.decodedPaths).toEqual([
      { path: '$.cmd.second', preview: 'second value' },
    ]);
    expect(filtered.nestedCommandFields).toEqual([]);
    expect(filtered.hasMoreDecodedPaths).toBe(false);
  });

  it('通过 CMD Schema 行筛选时提供结构聚焦路径', () => {
    const record = createRecord({
      commandSchemaRows: [
        { path: '$.cmd.primary', schema: 'baiduboxapp://v1/open' },
        { path: '$.cmd.secondary', schema: 'baiduboxapp://v2/open' },
      ],
    });

    const filtered = buildFilteredRecordView(record, 'v2/open', filterOptions);
    expect(filtered.commandSchemaRows).toEqual([
      { path: '$.cmd.secondary', schema: 'baiduboxapp://v2/open' },
    ]);
    expect(filtered.cmdStructureFocusPaths).toEqual(['$.cmd.secondary']);
    expect(filtered.cmdStructureFocusLabel).toBe('CMD Schema');
  });

  it('多类明细同时命中时优先聚焦内部 CMD 字段', () => {
    const record = createRecord({
      decodedSearchPaths: [
        { path: '$.cmd.decoded', preview: 'shared target' },
      ],
      nestedCommandSearchFields: [
        { path: '$.cmd.nested', preview: 'shared target' },
      ],
      commandSchemaRows: [
        { path: '$.cmd.schema', schema: 'baiduboxapp://shared/target' },
      ],
    });

    const filtered = buildFilteredRecordView(record, 'shared', filterOptions);
    expect(filtered.cmdStructureFocusPaths).toEqual(['$.cmd.nested']);
    expect(filtered.cmdStructureFocusLabel).toBe('内部 CMD 字段');
  });

  it('短字段名不扫描整段原始 CMD，明显 URL/编码片段允许兜底', () => {
    expect(shouldSearchLongSourceValue('url')).toBe(false);
    expect(shouldSearchLongSourceValue('https://m.baidu.com')).toBe(true);
    expect(shouldSearchLongSourceValue('%7B%22cmd')).toBe(true);
  });
});
