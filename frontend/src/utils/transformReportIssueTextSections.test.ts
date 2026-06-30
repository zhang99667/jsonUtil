import { describe, expect, it } from 'vitest';
import type {
  TransformReportUnresolvedCandidate,
  TransformReportWarning,
} from './transformSummary';
import {
  appendReportUnresolvedSection,
  appendReportWarningSection,
} from './transformReportIssueTextSections';

describe('transformReportIssueTextSections', () => {
  it('空跳过和未展开线索不追加段落', () => {
    const lines: string[] = ['head'];

    appendReportWarningSection(lines, []);
    appendReportUnresolvedSection(lines, []);

    expect(lines).toEqual(['head']);
  });

  it('输出跳过记录的原因、下一步和来源标签', () => {
    const lines: string[] = [];
    appendReportWarningSection(lines, [
      {
        path: '$.huge',
        message: '字段过长',
        length: 1200,
        limit: 1000,
        reasonLabel: '性能保护',
        nextAction: '单独粘贴字段解析',
        sourceLabel: 'SOURCE[2]',
      },
    ] as TransformReportWarning[]);

    expect(lines).toContain('跳过记录:');
    expect(lines).toContain('- $.huge: 字段过长 (1200/1000)');
    expect(lines).toContain('  业务字段: SOURCE[2]');
    expect(lines).toContain('  原因: 性能保护');
    expect(lines).toContain('  下一步: 单独粘贴字段解析');
  });

  it('输出未展开线索的类型、预览和处理建议', () => {
    const lines: string[] = [];
    appendReportUnresolvedSection(lines, [
      {
        path: '$.raw',
        message: '疑似编码片段',
        detectedType: 'url-encoded',
        length: 64,
        reasonLabel: '缺少上下文',
        nextAction: '复制到 Scheme 面板',
        preview: '%7B%22a%22%3A1%7D',
        sourceLabel: '$.payload',
      },
    ] as TransformReportUnresolvedCandidate[]);

    expect(lines).toContain('未展开线索:');
    expect(lines).toContain('- $.raw · url-encoded: 疑似编码片段 (64 字符)');
    expect(lines).toContain('  业务字段: $.payload');
    expect(lines).toContain('  原因: 缺少上下文');
    expect(lines).toContain('  下一步: 复制到 Scheme 面板');
    expect(lines).toContain('  预览: %7B%22a%22%3A1%7D');
  });
});
