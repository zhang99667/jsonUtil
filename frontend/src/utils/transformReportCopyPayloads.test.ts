import { describe, expect, it } from 'vitest';
import {
  formatTransformCmdStructureComparisonPackageText,
  getTransformDecodedPathCopyText,
  getTransformPathValueCopyRows,
  getTransformRecordCmdStructureCopyText,
} from './transformReportCopyPayloads';
import type { TransformReportDecodedPath, TransformReportRecord } from './transformSummary';

const createRecord = (
  overrides: Partial<TransformReportRecord> = {}
): TransformReportRecord => ({
  path: '$.cmd',
  labels: [],
  insights: [],
  originalValue: '',
  originalPreview: '',
  decodedPaths: [],
  decodedPathCount: 0,
  isDecodedPathCountTruncated: false,
  indexedDecodedPathCount: 0,
  hasMoreDecodedPaths: false,
  nestedCommandFields: [],
  indexedNestedCommandFieldCount: 0,
  hasMoreNestedCommandFields: false,
  hasCmdStructure: false,
  nestedCommandFieldCount: 0,
  nestedExtFieldCount: 0,
  nestedBase64SuffixFieldCount: 0,
  stepCount: 0,
  hasNonReversibleScheme: false,
  ...overrides,
});

describe('transformReportCopyPayloads', () => {
  it('优先使用预生成的内部路径复制文本', () => {
    expect(getTransformDecodedPathCopyText({
      path: '$.payload.id',
      preview: '1',
      copyText: '$.payload.id = 自定义',
    })).toBe('$.payload.id = 自定义');

    expect(getTransformDecodedPathCopyText({
      path: '$.payload.empty',
      preview: 'null',
      value: null,
    })).toBe('$.payload.empty = null');
  });

  it('内部 CMD 字段聚焦时复制命中的内部字段行', () => {
    const nestedRows: TransformReportDecodedPath[] = [{ path: '$.cmdParams.url', preview: '"https://a.test"' }];
    const decodedRows: TransformReportDecodedPath[] = [{ path: '$.cmd', preview: '"cmd"' }];

    expect(getTransformPathValueCopyRows(createRecord({
      cmdStructureFocusLabel: '内部 CMD 字段',
      nestedCommandSearchFields: nestedRows,
      decodedPaths: decodedRows,
    }))).toBe(nestedRows);
  });

  it('聚焦 CMD 结构复制时优先调用裁剪函数', () => {
    expect(getTransformRecordCmdStructureCopyText(createRecord({
      cmdStructureCopyText: '{"fallback":true}',
      cmdStructureFocusPaths: ['$.cmdParams.url'],
      getCmdStructureCopyText: paths => JSON.stringify({ paths }),
    }))).toBe('{"paths":["$.cmdParams.url"]}');
  });

  it('生成可粘贴到 cmdHandler 对比流程的结构包', () => {
    const packageText = formatTransformCmdStructureComparisonPackageText(createRecord({
      sourceLabel: 'SOURCE[1]',
      cmdStructureCopyText: '{"cmdParams":{"nid":"1"}}',
    }));

    expect(JSON.parse(packageText)).toMatchObject({
      schemaVersion: 1,
      kind: 'json-helper-cmd-structure-comparison-package',
      path: '$.cmd',
      sourceLabel: 'SOURCE[1]',
      actual: { cmdParams: { nid: '1' } },
      expected: {},
    });
  });
});
