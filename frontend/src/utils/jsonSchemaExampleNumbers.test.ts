import { describe, expect, it } from 'vitest';
import {
  generateNumberExample,
  getIntegerValue,
  getNumberValue,
  getUniqueNumberExample,
} from './jsonSchemaExampleNumbers';

describe('JSON Schema 数值示例约束', () => {
  it('只读取有限数字并按整数语义截断', () => {
    const schema = {
      finite: 2.8,
      infinite: Number.POSITIVE_INFINITY,
      text: '2',
    };

    expect(getNumberValue(schema, 'finite')).toBe(2.8);
    expect(getIntegerValue(schema, 'finite')).toBe(2);
    expect(getNumberValue(schema, 'infinite')).toBeUndefined();
    expect(getNumberValue(schema, 'text')).toBeUndefined();
  });

  it('生成满足边界和倍数约束的数值', () => {
    expect(generateNumberExample({ exclusiveMinimum: 2 }, true)).toBe(3);
    expect(generateNumberExample({ minimum: 0.3, multipleOf: 0.2 }, false)).toBe(0.4);
    expect(generateNumberExample({ minimum: 10, maximum: 6 }, true)).toBe(6);
    expect(generateNumberExample({ exclusiveMaximum: 1 }, false)).toBe(0.9);
  });

  it('唯一值候选继续遵守整数、倍数和上限', () => {
    expect(getUniqueNumberExample(2, { multipleOf: 2, maximum: 6 }, 1, true)).toBe(4);
    expect(getUniqueNumberExample(2, { maximum: 2 }, 1, true)).toBe(1);
    expect(getUniqueNumberExample(2, { minimum: 2, maximum: 2 }, 1, true)).toBeUndefined();
  });
});
