import { describe, expect, it } from 'vitest';
import type { DecodeLayer } from './schemeTypes';
import {
  formatSchemeCopySizeLabel,
  formatSchemeJoinedValuePreview,
  formatSchemeLayerSizeLabel,
  formatSchemeParamStageValue,
  formatSchemeParamTooltipValue,
  formatSchemeParamValue,
  formatSchemePlaceholderValue,
  formatSchemeSummaryValue,
  formatSchemeTextPreview,
  formatSchemeTooltipValue,
  getSchemeLayerAfterContent,
  getSchemeLayerReversibleLabel,
  schemeLayerTypeLabels,
  schemeParamStageSourceLabels,
} from './schemeViewerFormatters';

describe('schemeViewerFormatters', () => {
  it('裁剪普通文本、摘要和 tooltip 展示', () => {
    expect(formatSchemeTextPreview('abcdef', 4)).toBe('abcd...');
    expect(formatSchemeSummaryValue('x'.repeat(60))).toBe(`${'x'.repeat(56)}...`);
    expect(formatSchemeTooltipValue('y'.repeat(170))).toBe(`${'y'.repeat(160)}...`);
    expect(formatSchemePlaceholderValue('z'.repeat(40))).toBe(`${'z'.repeat(32)}...`);
  });

  it('格式化参数值和数组参数 tooltip', () => {
    expect(formatSchemeJoinedValuePreview(['a', 'b', 'c'], 20)).toBe('a, b, c');
    expect(formatSchemeParamValue('u'.repeat(60))).toBe(`${'u'.repeat(48)}...`);
    expect(formatSchemeParamValue(['first', 'second'])).toBe('first, second');
    expect(formatSchemeParamTooltipValue(['a'.repeat(80), 'b'.repeat(90)]))
      .toBe(`${'a'.repeat(80)}, ${'b'.repeat(78)}...`);
  });

  it('格式化层级尺寸和复制大小', () => {
    expect(formatSchemeLayerSizeLabel()).toBe('未知');
    expect(formatSchemeLayerSizeLabel('中文')).toBe('2 字符');
    expect(formatSchemeCopySizeLabel('中文')).toBe('2 字符 / 6 B');
  });

  it('获取层级输出内容并标记可回写状态', () => {
    const layers: DecodeLayer[] = [
      {
        type: 'url',
        before: 'raw',
        after: 'decoded-url',
        description: 'URL Decode',
      },
      {
        type: 'json',
        before: 'decoded-url',
        description: 'JSON 字符串',
        reversible: false,
      },
    ];

    expect(getSchemeLayerAfterContent(layers, 0, 'final')).toBe('decoded-url');
    expect(getSchemeLayerAfterContent(layers, 1, 'final')).toBe('final');
    expect(getSchemeLayerReversibleLabel(layers[0])).toBe('可回写');
    expect(getSchemeLayerReversibleLabel(layers[1])).toBe('只读');
  });

  it('格式化参数分层值并提供来源/类型标签', () => {
    expect(formatSchemeParamStageValue('  a\n    b  ')).toBe('a b');
    expect(schemeParamStageSourceLabels['prefixed-query']).toBe('日志参数');
    expect(schemeLayerTypeLabels['json-unicode-ascii']).toBe('Unicode ASCII');
  });
});
