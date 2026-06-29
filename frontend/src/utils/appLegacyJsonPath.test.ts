import { describe, expect, it } from 'vitest';
import { setLegacyJsonPathValue } from './appLegacyJsonPath';

describe('appLegacyJsonPath', () => {
  it('按旧 JSONPath 写入对象字段', () => {
    const root = { data: { cmd: 'old' } };

    expect(setLegacyJsonPathValue(root, '$.data.cmd', 'new')).toBe(root);
    expect(root.data.cmd).toBe('new');
  });

  it('按旧 JSONPath 写入数组字段', () => {
    const root = { list: [{ url: 'old' }] };

    setLegacyJsonPathValue(root, '$.list[0].url', 'new');
    expect(root.list[0].url).toBe('new');
  });
});
