import { describe, expect, it } from 'vitest';
import {
  formatCmdStructureValuePreview,
  stringifyCmdStructureValue,
} from './cmdStructureValueFormatter';

describe('cmdStructureValueFormatter', () => {
  it('稳定序列化对象 key，避免 CMD 值 diff 受输入顺序影响', () => {
    expect(stringifyCmdStructureValue({
      b: 2,
      a: {
        d: 4,
        c: 3,
      },
    })).toBe('{"a":{"c":3,"d":4},"b":2}');
  });

  it('按 160 字符截断 CMD 值预览', () => {
    const text = 'x'.repeat(170);

    expect(formatCmdStructureValuePreview(text)).toBe(`"${'x'.repeat(159)}...`);
  });
});
