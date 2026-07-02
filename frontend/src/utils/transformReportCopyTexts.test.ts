import { describe, expect, it } from 'vitest';
import { APP_VERSION_LABEL } from './appVersion';
import type {
  TransformContextReport,
  TransformReportRecord,
} from './transformSummary';
import {
  formatTransformCmdStructureReportText,
  formatTransformPathValueReportText,
  formatTransformPlaceholderReportText,
} from './transformReportCopyTexts';
import { createTransformReportView } from './transformReportViewTestFixture';

const createReport = (
  overrides: Partial<TransformContextReport> = {}
): TransformContextReport => ({
  summary: {} as TransformContextReport['summary'],
  summaryText: '深度解析: 展开 1 处',
  coverage: {} as TransformContextReport['coverage'],
  cmdStructureCount: 0,
  nestedCommandFieldCount: 0,
  records: [],
  warnings: [],
  unresolvedCandidates: [],
  runtimePlaceholderGroups: [],
  runtimePlaceholders: [],
  ...overrides,
});

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
  stepCount: 1,
  hasNonReversibleScheme: false,
  ...overrides,
});

describe('transformReportCopyTexts', () => {
  it('格式化路径值复制文本并保留截断提示', () => {
    const record = createRecord({
      decodedPaths: [
        { path: '$.cmd.a', preview: '1', copyText: '$.cmd.a = 1' },
        { path: '$.cmd.b', preview: 'two', value: 'two' },
      ],
      decodedPathCount: 3,
      indexedDecodedPathCount: 3,
    });

    expect(formatTransformPathValueReportText(createTransformReportView({
      records: [record],
      filteredRecordCount: 2,
      isRecordTruncated: true,
    }))).toBe([
      '$.cmd.a = 1',
      '$.cmd.b = "two"',
      '... $.cmd 还有更多内部路径未复制',
      '... 还有 1 条展开记录未复制',
    ].join('\n'));
  });

  it('内部 CMD 字段聚焦复制时不追加普通内部路径截断提示', () => {
    const record = createRecord({
      cmdStructureFocusLabel: '内部 CMD 字段',
      nestedCommandSearchFields: [
        { path: '$.cmd.params.panel_cmd', preview: 'baiduboxapp://x' },
      ],
      decodedPaths: [
        { path: '$.cmd.params.id', preview: '1' },
      ],
      decodedPathCount: 3,
      indexedDecodedPathCount: 3,
    });

    expect(formatTransformPathValueReportText(createTransformReportView({
      records: [record],
      filteredRecordCount: 1,
    }))).toBe('$.cmd.params.panel_cmd = "baiduboxapp://x"');
  });

  it('格式化 CMD 结构复制文本中的筛选、聚焦和内部字段摘要', () => {
    const record = createRecord({
      sourceLabel: 'SOURCE[0]',
      insights: ['cmd解析: params'],
      commandParamCount: 3,
      commandParamKeys: ['params', 'from'],
      cmdStructureFocusPaths: ['$.cmd.params.id'],
      cmdStructureFocusCount: 1,
      cmdStructureFocusLabel: '内部路径',
      nestedCommandFieldCount: 2,
      nestedCommandFields: [
        { path: '$.cmd.params.panel_cmd', preview: '对象: cmdParams' },
      ],
      hasMoreNestedCommandFields: true,
      indexedNestedCommandFieldCount: 5,
      getCmdStructureCopyText: () => '{"result":{"cmdParams":{"params":{"id":1}}}}',
    });

    const text = formatTransformCmdStructureReportText(createReport(), createTransformReportView({
      cmdStructureRecords: [record],
      filteredCmdStructureCount: 3,
      isCmdStructureTruncated: true,
    }), ' params.id ');

    expect(text).toContain(`工具版本: ${APP_VERSION_LABEL}`);
    expect(text).toContain('筛选: params.id');
    expect(text).toContain('CMD 结构: 1/3 条');
    expect(text).toContain('业务字段: SOURCE[0]');
    expect(text).toContain('解析线索: cmd解析: params');
    expect(text).toContain('cmdParams: 3 个顶层参数（params, from ... +1）');
    expect(text).toContain('聚焦复制: 已按筛选命中的 1 个内部路径裁剪 cmdParams');
    expect(text).toContain('内部CMD字段路径: $.cmd.params.panel_cmd = 对象: cmdParams');
    expect(text).toContain('内部CMD字段路径: 还有更多未展示（已索引 5 个）');
    expect(text).toContain('{"result":{"cmdParams":{"params":{"id":1}}}}');
    expect(text).toContain('... 还有 2 条 CMD 结构未复制');
  });

  it('格式化 CMD 结构复制文本的空态和无可见参数键摘要', () => {
    expect(formatTransformCmdStructureReportText(createReport(), createTransformReportView(), '')).toBe('');

    const text = formatTransformCmdStructureReportText(createReport(), createTransformReportView({
      cmdStructureRecords: [createRecord({
        commandParamCount: 2,
        getCmdStructureCopyText: () => '{"cmdParams":{"a":1,"b":2}}',
      })],
      filteredCmdStructureCount: 1,
    }), '');

    expect(text).toContain('cmdParams: 2 个顶层参数');
    expect(text).not.toContain('cmdParams: 2 个顶层参数（');
  });

  it('格式化占位符复制文本的空态', () => {
    expect(formatTransformPlaceholderReportText(createReport(), createTransformReportView({
      filteredPlaceholderCount: 0,
      totalPlaceholderCount: 2,
    }), 'missing')).toBe([
      '深度解析: 展开 1 处',
      `工具版本: ${APP_VERSION_LABEL}`,
      '筛选: missing',
      '占位符: 0/2',
      '',
      '运行时占位符:',
      '- 无匹配占位符',
    ].join('\n'));
  });

  it('格式化占位符复制文本的明细和截断提示', () => {
    const text = formatTransformPlaceholderReportText(createReport(), createTransformReportView({
      runtimePlaceholderGroups: [{
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD',
        count: 3,
        sourceCount: 1,
        sources: [{ sourcePath: '$.cmd', sourceLabel: 'SOURCE[1]', count: 3 }],
      }],
      runtimePlaceholders: [{
        path: '$.params.cmd',
        sourcePath: '$.cmd',
        sourceLabel: 'SOURCE[1]',
        sourceOriginalPreview: 'baiduboxapp://x',
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD',
      }],
      filteredPlaceholderCount: 3,
      totalPlaceholderCount: 3,
      isPlaceholderTruncated: true,
    }), '');

    expect(text).toContain('占位符: 3/3');
    expect(text).toContain('- __CONVERT_CMD__ ×3: 运行时转换 CMD');
    expect(text).toContain('主要来源: SOURCE[1] $.cmd ×3');
    expect(text).toContain('- $.params.cmd: __CONVERT_CMD__');
    expect(text).toContain('来源预览: baiduboxapp://x');
    expect(text).toContain('- 还有 2 个运行时占位符未复制');
  });
});
