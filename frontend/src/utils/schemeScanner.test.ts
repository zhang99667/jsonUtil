import { describe, expect, it } from 'vitest';
import { findSchemesInJson, scanSchemesInJson } from './schemeScanner';

describe('scanSchemesInJson 深层遍历', () => {
  it('过深结构不伪装成成功的空结果', () => {
    const depth = 5_000;
    const source = `${'{"child":'.repeat(depth)}{"link":"sampleapp://v1/open?from=deep"}${'}'.repeat(depth)}`;

    try {
      expect(scanSchemesInJson(source).locations).toHaveLength(1);
    } catch (error) {
      expect(error).toBeInstanceOf(RangeError);
      expect(findSchemesInJson(source)).toEqual([]);
    }
  });

  it('为来源标签定位对象起始位置且不要求对象包含展示字段', () => {
    const source = JSON.stringify({
      landing: {
        __url__: '业务值',
        cmd: { id: 1 },
      },
    }, null, 2);

    const result = scanSchemesInJson(source, { forcedPaths: ['$.landing'] });

    expect(result.locations).toEqual([
      expect.objectContaining({
        path: '$.landing',
        pointer: '/landing',
        value: '',
        schemeType: 'plain',
        line: 2,
      }),
    ]);
    expect(result.locations[0].endColumn).toBe(result.locations[0].column + 1);
  });
});
