import { describe, expect, it } from 'vitest';
import {
  normalizeSmartSuggestionText,
  shouldKeepSmartSuggestionOrigin,
} from './smartSuggestionText';

describe('normalizeSmartSuggestionText', () => {
  it('对齐智能建议识别的不可见字符和首尾空白处理', () => {
    expect(normalizeSmartSuggestionText(' \uFEFFbaiduboxapp://v1/open\u200B\n')).toBe('baiduboxapp://v1/open');
  });

  it.each([
    { name: '归一化后仍匹配', sourceText: ' \uFEFFbaiduboxapp://v1/open\u200B\n', hasSmartSuggestion: true, expected: true },
    { name: '来源文本被编辑', sourceText: 'edited text', hasSmartSuggestion: true, expected: false },
    { name: '建议已消失', sourceText: 'baiduboxapp://v1/open', hasSmartSuggestion: false, expected: false },
  ])('判断智能建议来源是否可以保留: $name', ({
    sourceText,
    hasSmartSuggestion,
    expected,
  }) => {
    expect(shouldKeepSmartSuggestionOrigin(
      sourceText,
      hasSmartSuggestion,
      'baiduboxapp://v1/open'
    )).toBe(expected);
  });
});
