import { describe, expect, it } from 'vitest';
import { scanSchemesInJson } from './schemeScanner';

describe('scanSchemesInJson 数组定位', () => {
  it('记录至少两项的数组位置并忽略单项数组', () => {
    const source = JSON.stringify({
      cross_session_context: [{ id: 1 }, { id: 2 }],
      singleton: [{ id: 3 }],
    }, null, 2);
    const result = scanSchemesInJson(source);

    expect(result.arrayLocations).toEqual([{
      path: '$.cross_session_context',
      pointer: '/cross_session_context',
      line: 2,
      column: 28,
      itemCount: 2,
    }]);
    expect(result.isArrayLimited).toBe(false);
    expect(result.arrayLimit).toBeGreaterThan(0);
  });

  it('Scheme 结果截断后继续扫描数组，两类结果分别受限', () => {
    const source = JSON.stringify({
      schemes: ['sampleapp://first', 'sampleapp://second'],
      groups: [[1, 2], [3, 4], [5, 6]],
    });
    const result = scanSchemesInJson(source, { resultLimit: 1, arrayResultLimit: 2 });

    expect(result.locations.map(location => location.path)).toEqual(['$.schemes[0]']);
    expect(result.isLimited).toBe(true);
    expect(result.arrayLocations.map(location => location.path)).toEqual(['$.schemes', '$.groups']);
    expect(result.isArrayLimited).toBe(true);
    expect(result.arrayLimit).toBe(2);
  });

  it('非法 JSON 对 Scheme 和数组都返回静默空结果', () => {
    const result = scanSchemesInJson('{invalid}');
    expect(result.locations).toEqual([]);
    expect(result.arrayLocations).toEqual([]);
    expect(result.isLimited).toBe(false);
    expect(result.isArrayLimited).toBe(false);
  });
});
