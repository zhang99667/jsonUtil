import { describe, expect, it } from 'vitest';
import type { JsonObject } from '../types';
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

  it('稳定序列化保留特殊对象键', () => {
    const value = JSON.parse('{"z":1,"__proto__":{"polluted":true},"a":2}') as JsonObject;

    expect(stringifyCmdStructureValue(value)).toBe('{"__proto__":{"polluted":true},"a":2,"z":1}');
  });

  it('按 160 字符截断 CMD 值预览', () => {
    const text = 'x'.repeat(170);

    expect(formatCmdStructureValuePreview(text)).toBe(`"${'x'.repeat(159)}...`);
  });

  it('七千层 CMD 值稳定序列化不依赖调用栈', () => {
    const depth = 7_000;
    let value: JsonObject = { z: 1, a: 2 };
    for (let index = 0; index < depth; index += 1) {
      value = { child: value };
    }

    expect(stringifyCmdStructureValue(value)).toBe(
      `${'{"child":'.repeat(depth)}{"a":2,"z":1}${'}'.repeat(depth)}`
    );
  });
});
