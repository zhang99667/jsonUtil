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
    const widePayload = {
      ...Object.fromEntries(
        Array.from({ length: 20 }, (_, index) => [`k${index}`, index])
      ),
      target_after_display_limit: 'needle_after_display_limit',
    };
    const result = deepParseWithContext(JSON.stringify({
      payload: JSON.stringify(widePayload),
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records[0].decodedPaths).toHaveLength(12);
    expect(report.records[0].decodedPaths[0]).toEqual({ path: '$.payload.k0', preview: '0' });
    expect(report.records[0].decodedPaths.some(row => row.path.includes('target_after_display_limit'))).toBe(false);
    expect(report.records[0].hasMoreDecodedPaths).toBe(true);
    expect(formatTransformContextReportText(result.context)).toContain('内部路径: 还有更多未展示');

    const hiddenPathView = buildTransformReportView(report, 'target_after_display_limit');
    expect(hiddenPathView.records.map(record => record.path)).toEqual(['$.payload']);
    expect(hiddenPathView.filteredRecordCount).toBe(1);
  });

  it('报告展示 k/v 形态字段的业务标签并支持筛选', () => {
    const result = deepParseWithContext(JSON.stringify({
      extra: [
        {
          k: 'extraParam',
          v: `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&from=feed`,
        },
      ],
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records[0]).toMatchObject({
      path: '$.extra[0].v',
      sourceLabel: 'extraParam',
      labels: ['CMD 参数 · 可回写'],
    });
    expect(formatTransformContextReportText(result.context)).toContain('业务字段: extraParam');

    const labelView = buildTransformReportView(report, 'extraParam');
    expect(labelView.records.map(record => record.path)).toEqual(['$.extra[0].v']);
    expect(labelView.filteredRecordCount).toBe(1);
  });

  it('诊断项展示 k/v 形态字段的业务标签并支持筛选', () => {
    const rawValue = `raw=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`;
    const unresolvedResult = deepParseWithContext(JSON.stringify({
      extra: [{ k: 'trackingParam', v: rawValue }],
    }), { autoExpandScheme: true });
    const unresolvedReport = buildTransformContextReport(unresolvedResult.context);

    expect(unresolvedReport.unresolvedCandidates[0]).toMatchObject({
      path: '$.extra[0].v',
      sourceLabel: 'trackingParam',
    });
    expect(formatTransformContextReportText(unresolvedResult.context)).toContain('业务字段: trackingParam');
    expect(buildTransformReportView(unresolvedReport, 'trackingParam').filteredUnresolvedCount).toBe(1);

    const placeholderResult = deepParseWithContext(JSON.stringify({
      extra: [{
        k: 'buttonParam',
        v: `cmd=${encodeURIComponent(JSON.stringify({ button_cmd: '__CONVERT_CMD__' }))}`,
      }],
    }), { autoExpandScheme: true });
    const placeholderReport = buildTransformContextReport(placeholderResult.context);

    expect(placeholderReport.runtimePlaceholders[0]).toMatchObject({
      path: '$.extra[0].v.cmd.button_cmd',
      sourceLabel: 'buttonParam',
    });
    expect(formatTransformContextReportText(placeholderResult.context)).toContain('业务字段: buttonParam');
    expect(buildTransformReportView(placeholderReport, 'buttonParam').filteredPlaceholderCount).toBe(1);

    const skippedValue = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&padding=${'x'.repeat(80)}`;
    const warningResult = deepParseWithContext(JSON.stringify({
      extra: [{ k: 'longParam', v: skippedValue }],
    }), {
      autoExpandScheme: true,
      maxStringDecodeLength: 20,
    });
    const warningReport = buildTransformContextReport(warningResult.context);

    expect(warningReport.warnings[0]).toMatchObject({
      path: '$.extra[0].v',
      sourceLabel: 'longParam',
    });
    expect(formatTransformContextReportText(warningResult.context)).toContain('业务字段: longParam');
    expect(buildTransformReportView(warningReport, 'longParam').filteredWarningCount).toBe(1);
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

  it('展示运行时占位符路径和来源', () => {
    const result = deepParseWithContext(JSON.stringify({
      action_cmd: `cmd=${encodeURIComponent(JSON.stringify({
        button_cmd: '__CONVERT_CMD__',
      }))}&from=feed`,
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.summary.placeholderCount).toBe(1);
    expect(formatTransformContextSummary(result.context)).toBe(
      '深度解析: 展开 1 处，Scheme 1 (CMD 1)，占位符 1'
    );
    expect(report.runtimePlaceholders).toEqual([
      {
        path: '$.action_cmd.cmd.button_cmd',
        sourcePath: '$.action_cmd',
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('运行时占位符:');

    const placeholderView = buildTransformReportView(report, '__CONVERT_CMD__');
    expect(placeholderView.runtimePlaceholders.map(placeholder => placeholder.path)).toEqual([
      '$.action_cmd.cmd.button_cmd',
    ]);
    expect(placeholderView.filteredPlaceholderCount).toBe(1);
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

    const report = buildTransformContextReport(result.context);
    const warningView = buildTransformReportView(report, 'action_cmd');
    expect(warningView.warnings).toEqual([
      {
        path: '$.action_cmd',
        message: '字符串过长，已跳过递归展开以保护性能',
        length: actionCmd.length,
        limit: 20,
      },
    ]);
    expect(warningView.filteredWarningCount).toBe(1);
  });
});
