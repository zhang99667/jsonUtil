import { describe, expect, it } from 'vitest';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from './transformSummary';
import { appendReportPlaceholderSection } from './transformReportPlaceholderTextSections';

describe('transformReportPlaceholderTextSections', () => {
  it('没有运行时占位符时不追加段落', () => {
    const lines: string[] = ['head'];

    appendReportPlaceholderSection(lines, [], []);

    expect(lines).toEqual(['head']);
  });

  it('输出占位符汇总、来源和明细预览', () => {
    const lines: string[] = [];
    const groups = [
      {
        value: 'AFDXXX',
        count: 2,
        description: 'AFD 渲染扩展信息占位符',
        sourceCount: 1,
        sources: [
          {
            sourcePath: '$.ad.extInfo',
            sourceLabel: '$.ad',
            count: 2,
          },
        ],
      },
    ] as TransformReportRuntimePlaceholderGroup[];
    const placeholders = [
      {
        path: '$.ad.extInfo',
        value: 'AFDXXX',
        sourcePath: '$.ad',
        sourceLabel: '$.ad',
        sourceOriginalPreview: 'baiduboxapp://v1/vendor/ad',
        description: 'AFD 渲染扩展信息占位符',
      },
    ] as TransformReportRuntimePlaceholder[];

    appendReportPlaceholderSection(lines, groups, placeholders);

    expect(lines).toContain('运行时占位符汇总:');
    expect(lines).toContain('- AFDXXX ×2: AFD 渲染扩展信息占位符');
    expect(lines).toContain('  来源数: 1');
    expect(lines).toContain('  主要来源: $.ad $.ad.extInfo ×2');
    expect(lines).toContain('运行时占位符明细:');
    expect(lines).toContain('- $.ad.extInfo: AFDXXX');
    expect(lines).toContain('  来源: $.ad');
    expect(lines).toContain('  业务字段: $.ad');
    expect(lines).toContain('  来源预览: baiduboxapp://v1/vendor/ad');
    expect(lines).toContain('  说明: AFD 渲染扩展信息占位符');
  });
});
