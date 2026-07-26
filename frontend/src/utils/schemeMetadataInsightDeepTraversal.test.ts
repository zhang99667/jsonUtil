import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import { collectSchemeInsightFields } from './schemeMetadata';

describe('collectSchemeInsightFields 深层遍历', () => {
  it('稳定收集七千层对象数组混合链的 CMD 字段', () => {
    let value: JsonValue = { convert_cmd: { id: 'target' } };
    for (let depth = 0; depth < 7_000; depth += 1) {
      value = depth % 2 === 0 ? { child: value } : [value];
    }

    const fields = collectSchemeInsightFields(value);

    expect(fields.commandFields).toEqual(['convert_cmd']);
    expect(fields.commandFieldCount).toBe(1);
    expect(fields.commandFieldRows[0]?.path.length).toBeGreaterThan(7_000);
  });
});
