import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import { collectRuntimePlaceholders } from './schemePlaceholders';

describe('collectRuntimePlaceholders 深层遍历', () => {
  it('稳定收集七千层对象数组混合链的末端占位符', () => {
    let value: JsonValue = '__CONVERT_CMD__';
    for (let depth = 0; depth < 7_000; depth += 1) {
      value = depth % 2 === 0 ? { child: value } : [value];
    }

    const placeholders = collectRuntimePlaceholders(value);

    expect(placeholders).toHaveLength(1);
    expect(placeholders[0]?.value).toBe('__CONVERT_CMD__');
    expect(placeholders[0]?.path.length).toBeGreaterThan(7_000);
  });
});
