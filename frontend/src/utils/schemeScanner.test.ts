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
});
