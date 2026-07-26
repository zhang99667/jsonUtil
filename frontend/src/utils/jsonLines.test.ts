import { describe, expect, it } from 'vitest';
import { parseJsonLinesDetailed } from './jsonLines';

describe('parseJsonLinesDetailed', () => {
  it('保留有效记录的值和原始位置', () => {
    expect(parseJsonLinesDetailed('  {"ok":true}\n[1,2]')).toEqual({
      records: [
        { value: { ok: true }, source: '{"ok":true}', lineIndex: 0, columnOffset: 2 },
        { value: [1, 2], source: '[1,2]', lineIndex: 1, columnOffset: 0 },
      ],
    });
  });

  it('拒绝非有限数值并返回统一诊断', () => {
    expect(parseJsonLinesDetailed('{"ok":true}\n{"value":1e400}')).toEqual({
      records: null,
      error: 'JSON Lines 第 2 行解析错误: JSON 包含不支持的值',
    });
  });
});
