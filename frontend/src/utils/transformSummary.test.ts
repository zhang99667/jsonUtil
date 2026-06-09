import { describe, expect, it } from 'vitest';
import { base64Encode } from './schemeUtils';
import { deepParseWithContext } from './transformations';
import {
  buildTransformContextReport,
  buildTransformReportView,
  formatTransformContextReportText,
  formatTransformContextSummary,
  summarizeTransformContext,
} from './transformSummary';

describe('transformSummary', () => {
  it('统计深度格式化中的 Scheme、嵌套 JSON 和不可逆 Base64', () => {
    const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123 }));
    const base64Payload = `AFD8f${base64Encode('meg_name":"AI","flag":true}')}`;
    const input = JSON.stringify({
      cmd: `cmd=${cmdPayload}&from=feed`,
      payload: JSON.stringify({ nested: true }),
      extra: base64Payload,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const summary = summarizeTransformContext(result.context);

    expect(summary).toMatchObject({
      recordCount: 3,
      stepCounts: {
        scheme_decode: 2,
        json_parse: 1,
      },
      schemeCounts: {
        queryString: 1,
        url: 0,
        base64: 1,
        nonReversible: 1,
      },
      warningCount: 0,
    });
    expect(formatTransformContextSummary(result.context)).toBe(
      '深度解析: 展开 3 处，Scheme 2 (CMD 1 / Base64 1)，嵌套 JSON 1，不可逆 1'
    );

    const report = buildTransformContextReport(result.context);
    expect(report.records.map(record => ({
      path: record.path,
      labels: record.labels,
      decodedPreview: record.decodedPreview,
      hasNonReversibleScheme: record.hasNonReversibleScheme,
    }))).toEqual([
      {
        path: '$.cmd',
        labels: ['CMD 参数 · 可回写'],
        decodedPreview: '对象: cmd, from',
        hasNonReversibleScheme: false,
      },
      {
        path: '$.payload',
        labels: ['嵌套 JSON'],
        decodedPreview: '对象: nested',
        hasNonReversibleScheme: false,
      },
      {
        path: '$.extra',
        labels: ['Base64 · 不可逆'],
        decodedPreview: '对象: meg_name, flag',
        hasNonReversibleScheme: true,
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('$.extra: Base64 · 不可逆');
    expect(formatTransformContextReportText(result.context)).toContain('解析结果: 对象: meg_name, flag');
    expect(formatTransformContextReportText(result.context)).toContain('内部路径: $.cmd.cmd.nid=123');
    expect(report.records[0].decodedPaths).toEqual([
      { path: '$.cmd.cmd.nid', preview: '123' },
      { path: '$.cmd.from', preview: 'feed' },
    ]);

    const base64View = buildTransformReportView(report, 'base64');
    expect(base64View.records.map(record => record.path)).toEqual(['$.extra']);
    expect(base64View.filteredRecordCount).toBe(1);

    const decodedValueView = buildTransformReportView(report, 'nested');
    expect(decodedValueView.records.map(record => record.path)).toEqual(['$.payload']);
    expect(decodedValueView.filteredRecordCount).toBe(1);

    const decodedPathView = buildTransformReportView(report, 'cmd.nid');
    expect(decodedPathView.records.map(record => record.path)).toEqual(['$.cmd']);
    expect(decodedPathView.filteredRecordCount).toBe(1);

    const limitedView = buildTransformReportView(report, '', { recordLimit: 2 });
    expect(limitedView.records.map(record => record.path)).toEqual(['$.cmd', '$.payload']);
    expect(limitedView.filteredRecordCount).toBe(3);
    expect(limitedView.isRecordTruncated).toBe(true);
  });

  it('无转换记录时不展示摘要', () => {
    const result = deepParseWithContext(JSON.stringify({ ok: true }), { autoExpandScheme: true });

    expect(formatTransformContextSummary(result.context)).toBeUndefined();
  });

  it('内部路径展示会限制条数避免大对象刷屏', () => {
    const widePayload = Object.fromEntries(
      Array.from({ length: 14 }, (_, index) => [`k${index}`, index])
    );
    const result = deepParseWithContext(JSON.stringify({
      payload: JSON.stringify(widePayload),
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records[0].decodedPaths).toHaveLength(12);
    expect(report.records[0].decodedPaths[0]).toEqual({ path: '$.payload.k0', preview: '0' });
    expect(report.records[0].hasMoreDecodedPaths).toBe(true);
    expect(formatTransformContextReportText(result.context)).toContain('内部路径: 还有更多未展示');
  });

  it('展示疑似未展开的结构化字符串线索', () => {
    const rawValue = `raw=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`;
    const result = deepParseWithContext(JSON.stringify({
      tracking: rawValue,
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.summary.unresolvedCount).toBe(1);
    expect(formatTransformContextSummary(result.context)).toBe(
      '深度解析: 展开 1 处，URL 解码 1，待检查 1'
    );
    expect(report.unresolvedCandidates).toEqual([
      {
        path: '$.tracking',
        message: 'URL 编码内容已解码，但未展开为结构化对象',
        length: rawValue.length,
        preview: rawValue,
        detectedType: 'url-encoded',
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('未展开线索:');

    const unresolvedView = buildTransformReportView(report, 'tracking');
    expect(unresolvedView.unresolvedCandidates.map(candidate => candidate.path)).toEqual(['$.tracking']);
    expect(unresolvedView.filteredUnresolvedCount).toBe(1);
  });

  it('统计性能保护跳过信息', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&padding=${'x'.repeat(80)}`;
    const result = deepParseWithContext(JSON.stringify({ action_cmd: actionCmd }), {
      autoExpandScheme: true,
      maxStringDecodeLength: 20,
    });

    expect(formatTransformContextSummary(result.context)).toBe('深度解析: 展开 0 处，跳过 1');
    expect(formatTransformContextReportText(result.context)).toContain(
      '$.action_cmd: 字符串过长，已跳过递归展开以保护性能'
    );
  });
});
