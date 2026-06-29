import { describe, expect, it } from 'vitest';
import {
  getRawCmdFieldPriority,
  isStructuredCmdField,
  looksLikeRawCmdSource,
  normalizeRawSourceString,
  safeDecodeURIComponent,
} from './cmdStructureRawSourceGuards';

describe('cmdStructureRawSourceGuards', () => {
  it('按业务字段优先级识别 raw CMD 来源字段', () => {
    expect(getRawCmdFieldPriority('scheme')).toBe(100);
    expect(getRawCmdFieldPriority('panel_cmd')).toBe(90);
    expect(getRawCmdFieldPriority('url')).toBe(30);
    expect(getRawCmdFieldPriority('custom_cmd')).toBe(70);
    expect(getRawCmdFieldPriority('title')).toBe(0);
  });

  it('识别 URL 或 query 形态的 raw source 并排除占位符', () => {
    expect(looksLikeRawCmdSource('baiduboxapp://v1/panel?tab=reward')).toBe(true);
    expect(looksLikeRawCmdSource('params=%7B%22id%22%3A%221%22%7D')).toBe(true);
    expect(looksLikeRawCmdSource(encodeURIComponent('baiduboxapp://v1/panel?tab=reward'))).toBe(true);
    expect(looksLikeRawCmdSource('__CONVERT_CMD__')).toBe(false);
    expect(looksLikeRawCmdSource('普通标题')).toBe(false);
  });

  it('识别结构化 CMD 字段名和普通字段边界', () => {
    expect(isStructuredCmdField('panel_cmd')).toBe(true);
    expect(isStructuredCmdField('landingUrl')).toBe(true);
    expect(isStructuredCmdField('trackingInfo')).toBe(true);
    expect(isStructuredCmdField('urlish')).toBe(false);
  });

  it('安全解码和来源归一化遇到异常输入时保持可用', () => {
    expect(safeDecodeURIComponent('%E0%A4%A')).toBe('%E0%A4%A');
    expect(safeDecodeURIComponent('a+b')).toBe('a b');
    expect(normalizeRawSourceString(' https:\\/\\/example.com/path ')).toBe('https://example.com/path');
  });
});
