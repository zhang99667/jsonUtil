import { describe, expect, it } from 'vitest';
import { APP_VERSION_LABEL } from './appVersion';
import type {
  TransformContextReport,
  TransformReportRecord,
} from './transformSummary';
import {
  formatTransformDiagnosticSummaryText,
  formatTransformReportViewText,
} from './transformReportDiagnosticText';
import { createTransformReportView } from './transformReportViewTestFixture';
import {
  appendDiagnosticSummaryRecommendationSection,
  appendDiagnosticSummarySampleSections,
} from './transformReportDiagnosticSummarySections';

const createReport = (
  overrides: Partial<TransformContextReport> = {}
): TransformContextReport => ({
  summary: {} as TransformContextReport['summary'],
  summaryText: '深度解析: 展开 1 处',
  coverage: {
    score: 80,
    label: '解析覆盖 80%',
    level: 'warning',
    description: '存在待检查线索。',
    items: [],
  },
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
  labels: ['CMD 参数 · 可回写'],
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

describe('transformReportDiagnosticText', () => {
  it('格式化筛选报告空态', () => {
    expect(formatTransformReportViewText(createReport(), createTransformReportView(), '  ')).toBe([
      '深度解析: 展开 1 处',
      `工具版本: ${APP_VERSION_LABEL}`,
      '筛选: 全部',
      '筛选结果: 展开 0/0，内部CMD字段 0/0，资源字段 0/0，占位符 0/0，参数层 0/0，参数修复 0/0，待检查 0/0，跳过 0/0',
      '',
      '筛选结果:',
      '- 无匹配记录',
    ].join('\n'));
  });

  it('格式化筛选报告的展开记录和截断提示', () => {
    const record = createRecord({
      path: '$.cmd',
      decodedPreview: '对象: cmd',
      decodedPaths: [{ path: '$.cmd.id', preview: '1' }],
      decodedPathCount: 2,
      isDecodedPathCountTruncated: true,
    });

    const text = formatTransformReportViewText(createReport(), createTransformReportView({
      records: [record],
      filteredRecordCount: 2,
      totalRecordCount: 3,
      isRecordTruncated: true,
    }), 'cmd');

    expect(text).toContain('筛选: cmd');
    expect(text).toContain('筛选结果: 展开 2/3');
    expect(text).toContain('- $.cmd: CMD 参数 · 可回写');
    expect(text).toContain('解析结果: 对象: cmd');
    expect(text).toContain('内部路径: $.cmd.id=1');
    expect(text).toContain('- 还有 1 条展开记录未复制');
  });

  it('格式化诊断摘要中的 Top、样例和建议', () => {
    const report = createReport({
      topCommandSchemas: [{
        schema: 'sampleapp://v7/vendor/ad/deeplink',
        count: 3,
        recordCount: 2,
        paths: [],
        hasMorePaths: false,
      }],
      topResourceSchemas: [{
        schema: 'https://example.com/a',
        count: 2,
        recordCount: 1,
        paths: [],
        hasMorePaths: false,
        resourceTypeLabel: 'HTTPS',
      }],
      topResourceTypes: [{
        resourceType: 'image',
        resourceTypeLabel: '图片',
        query: 'resource:image',
        count: 4,
        percentage: 50,
        recordCount: 2,
        schemaCount: 3,
        schemas: [],
        hasMoreSchemas: false,
      }],
      topNestedCommandFields: [{
        key: 'panel_cmd',
        count: 3,
        recordCount: 2,
        paths: [],
        hasMorePaths: false,
      }],
      topNestedResourceFields: [{
        key: 'imgUrl',
        count: 2,
        recordCount: 1,
        paths: [],
        hasMorePaths: false,
      }],
    });
    const record = createRecord({
      schemeParamStageSummary: {
        total: 1,
        repairHints: 1,
        nonReversible: 0,
        sources: [],
        keys: [{ key: 'params', count: 1 }],
        repairHintLabels: [{ key: 'URL 参数递归解析', count: 1 }],
        samples: [],
      },
    });

    const text = formatTransformDiagnosticSummaryText(report, createTransformReportView({
      records: [record],
      runtimePlaceholderGroups: [{
        value: '__CONVERT_CMD__',
        description: '运行时命令占位符',
        count: 2,
        sourceCount: 1,
        sources: [],
      }],
      unresolvedCandidates: [{
        path: '$.raw',
        sourceLabel: 'extraParam',
        originalValue: 'secret-token',
        message: '包含敏感原文',
        length: 3,
        preview: 'secret-token',
        detectedType: 'url',
        reasonLabel: '疑似 URL',
        reasonLevel: 'info',
        nextAction: '确认规则',
      }],
      warnings: [{
        type: 'string_decode_skipped',
        path: '$.big',
        sourceLabel: 'ad_common',
        originalValue: 'cookie=abc',
        message: '包含 cookie',
        length: 2048,
        limit: 1024,
        reasonLabel: '超长字段',
        nextAction: '单独排查',
      }],
      filteredRecordCount: 1,
      totalRecordCount: 1,
      filteredCmdStructureCount: 1,
      totalCmdStructureCount: 1,
      filteredPlaceholderCount: 2,
      totalPlaceholderCount: 2,
      filteredSchemeParamStageCount: 1,
      totalSchemeParamStageCount: 1,
      filteredSchemeParamStageRepairHintCount: 1,
      totalSchemeParamStageRepairHintCount: 1,
      filteredUnresolvedCount: 2,
      totalUnresolvedCount: 2,
      filteredWarningCount: 2,
      totalWarningCount: 2,
      isUnresolvedTruncated: true,
      isWarningTruncated: true,
    }), 'schema');

    expect(text).toContain('深度解析诊断摘要');
    expect(text).toContain('筛选: schema');
    expect(text).toContain('全量 CMD Schema Top:');
    expect(text).toContain('- sampleapp://v7/vendor/ad/deeplink ×3（来源记录 2）');
    expect(text).toContain('- [HTTPS] https://example.com/a ×2（来源记录 1）');
    expect(text).toContain('全量静态资源类型 Top:');
    expect(text).toContain('- 图片 50% ×4（URL 3 / 来源记录 2）');
    expect(text).toContain('全量内部 CMD 字段 Top:');
    expect(text).toContain('- panel_cmd ×3（来源记录 2）');
    expect(text).toContain('全量静态资源字段 Top:');
    expect(text).toContain('- imgUrl ×2（来源记录 1）');
    expect(text).toContain('当前占位符 Top:');
    expect(text).toContain('- __CONVERT_CMD__ ×2（来源 1）');
    expect(text).toContain('当前参数分层修复 Top:');
    expect(text).toContain('- URL 参数递归解析 ×1（来源 1）');
    expect(text).toContain('- $.raw · extraParam · url: 疑似 URL');
    expect(text).toContain('- 还有 1 条待检查未列出');
    expect(text).toContain('- $.big · ad_common: 超长字段 (2048/1024)');
    expect(text).toContain('- 还有 1 条跳过记录未列出');
    expect(text).toContain('- 先处理跳过记录，超长字段可单独粘贴到 Scheme 面板或缩小 response 后再解析');
    expect(text).toContain('- 参数分层存在修复提示，建议核对原始值、URL Decode、JSON 解析链路后沉淀回归样本');
    expect(text).not.toContain('secret-token');
    expect(text).not.toContain('包含敏感原文');
    expect(text).not.toContain('cookie=abc');
    expect(text).not.toContain('包含 cookie');
  });

  it('限制诊断摘要 Top 和样例输出数量', () => {
    const report = createReport({
      topCommandSchemas: Array.from({ length: 9 }, (_, index) => ({
        schema: `sampleapp://schema/${index}`,
        count: index + 1,
        recordCount: 1,
        paths: [],
        hasMorePaths: false,
      })),
    });
    const unresolvedCandidates = Array.from({ length: 6 }, (_, index) => ({
      path: `$.raw${index}`,
      originalValue: `raw-secret-${index}`,
      message: `待检查${index}`,
      length: index + 1,
      preview: `raw-secret-${index}`,
      reasonLabel: `疑似值${index}`,
      reasonLevel: 'info' as const,
      nextAction: '确认规则',
    }));
    const warnings = Array.from({ length: 6 }, (_, index) => ({
      type: 'string_decode_skipped' as const,
      path: `$.big${index}`,
      originalValue: `big-secret-${index}`,
      message: `过长${index}`,
      length: 2048 + index,
      limit: 1024,
      reasonLabel: `超长字段${index}`,
      nextAction: '单独排查',
    }));

    const text = formatTransformDiagnosticSummaryText(report, createTransformReportView({
      unresolvedCandidates,
      warnings,
      filteredUnresolvedCount: 6,
      totalUnresolvedCount: 6,
      filteredWarningCount: 6,
      totalWarningCount: 6,
    }), '');

    expect(text).toContain('- sampleapp://schema/7 ×8（来源记录 1）');
    expect(text).not.toContain('sampleapp://schema/8');
    expect(text).toContain('- $.raw4: 疑似值4');
    expect(text).not.toContain('$.raw5');
    expect(text).toContain('- $.big4: 超长字段4 (2052/1024)');
    expect(text).not.toContain('$.big5');
    expect(text).not.toContain('raw-secret-0');
    expect(text).not.toContain('big-secret-0');
  });

  it('格式化诊断摘要中的参数 Key Top 和默认建议', () => {
    const record = createRecord({
      schemeParamStageSummary: {
        total: 2,
        repairHints: 0,
        nonReversible: 0,
        sources: [],
        keys: [{ key: 'url', count: 2 }],
        repairHintLabels: [],
        samples: [],
      },
    });

    const text = formatTransformDiagnosticSummaryText(createReport(), createTransformReportView({
      records: [record],
      filteredRecordCount: 1,
      totalRecordCount: 1,
      filteredSchemeParamStageCount: 2,
      totalSchemeParamStageCount: 2,
    }), '');

    expect(text).toContain('当前参数分层 Key Top:');
    expect(text).toContain('- url ×2（来源 1）');
    expect(text).toContain('- 当前筛选未发现跳过、待检查或运行时占位符，可重点核对 CMD Schema 与业务预期是否一致');
    expect(text).not.toContain('当前参数分层修复 Top:');
  });

  it('诊断摘要样例 section 不输出原始值、预览和内部消息', () => {
    const lines: string[] = [];
    appendDiagnosticSummarySampleSections(lines, createTransformReportView({
      unresolvedCandidates: [{
        path: '$.raw',
        sourceLabel: 'extraParam',
        originalValue: 'token=private',
        message: '内部消息包含 private',
        length: 12,
        preview: 'private-preview',
        detectedType: 'url',
        reasonLabel: '疑似 URL',
        reasonLevel: 'info',
        nextAction: '确认规则',
      }],
      warnings: [{
        type: 'string_decode_skipped',
        path: '$.big',
        sourceLabel: 'ad_common',
        originalValue: 'cookie=private',
        message: '跳过消息包含 private',
        length: 2048,
        limit: 1024,
        reasonLabel: '超长字段',
        nextAction: '单独排查',
      }],
      filteredUnresolvedCount: 1,
      filteredWarningCount: 1,
    }));

    const text = lines.join('\n');
    expect(text).toContain('- $.raw · extraParam · url: 疑似 URL');
    expect(text).toContain('- $.big · ad_common: 超长字段 (2048/1024)');
    expect(text).not.toContain('token=private');
    expect(text).not.toContain('private-preview');
    expect(text).not.toContain('内部消息包含 private');
    expect(text).not.toContain('cookie=private');
    expect(text).not.toContain('跳过消息包含 private');
  });

  it('诊断摘要建议 section 覆盖全部风险动作和空态建议', () => {
    const riskLines: string[] = [];
    appendDiagnosticSummaryRecommendationSection(riskLines, createTransformReportView({
      filteredWarningCount: 1,
      filteredUnresolvedCount: 1,
      filteredPlaceholderCount: 1,
      filteredSchemeParamStageRepairHintCount: 1,
      filteredNonReversibleParamStageCount: 1,
    }));

    const riskText = riskLines.join('\n');
    expect(riskText).toContain('- 先处理跳过记录，超长字段可单独粘贴到 Scheme 面板或缩小 response 后再解析');
    expect(riskText).toContain('- 对待检查项判断是否为规则缺口；确认后可复制样本 JSON 并生成回归模板');
    expect(riskText).toContain('- 运行时占位符通常不是解析失败，可按来源路径确认实际替换链路');
    expect(riskText).toContain('- 参数分层存在修复提示，建议核对原始值、URL Decode、JSON 解析链路后沉淀回归样本');
    expect(riskText).toContain('- 存在不可回写参数层，复制回写前需确认该字段是否只用于只读排查');

    const emptyLines: string[] = [];
    appendDiagnosticSummaryRecommendationSection(emptyLines, createTransformReportView());
    expect(emptyLines.join('\n')).toContain('- 当前筛选未发现跳过、待检查或运行时占位符，可重点核对 CMD Schema 与业务预期是否一致');
  });
});
