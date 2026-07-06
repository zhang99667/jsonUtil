import { describe, expect, it } from 'vitest';
import { normalizeSmartSuggestionText } from './smartSuggestionText';

describe('normalizeSmartSuggestionText', () => {
  it('对齐智能建议识别的不可见字符和首尾空白处理', () => {
    expect(normalizeSmartSuggestionText(' \uFEFFbaiduboxapp://v1/open\u200B\n')).toBe('baiduboxapp://v1/open');
  });
});
