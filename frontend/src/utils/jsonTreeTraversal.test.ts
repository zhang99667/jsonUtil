import { describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '../types';
import { buildJsonTreeModel } from './jsonTreeModel';

interface AccessCounter {
  count: number;
}

const buildWithParsedValue = (value: JsonValue, maxNodes: number) => {
  const parseSpy = vi.spyOn(JSON, 'parse').mockReturnValue(value);
  try {
    return buildJsonTreeModel('[]', { maxNodes });
  } finally {
    parseSpy.mockRestore();
  }
};

const createWideArray = (length: number, counter: AccessCounter): JsonValue[] => {
  const result = new Array<JsonValue>(length);
  for (let index = 0; index < length; index += 1) {
    Object.defineProperty(result, index, {
      configurable: true,
      enumerable: true,
      get: () => {
        counter.count += 1;
        return index;
      },
    });
  }
  return result;
};

const createWideObject = (size: number, counter: AccessCounter): Record<string, JsonValue> => {
  const result: Record<string, JsonValue> = {};
  for (let index = 0; index < size; index += 1) {
    Object.defineProperty(result, `key${index}`, {
      configurable: true,
      enumerable: true,
      get: () => {
        counter.count += 1;
        return index;
      },
    });
  }
  return result;
};

describe('jsonTreeTraversal', () => {
  it('节点预算不会提前读取超宽数组的全部子项', () => {
    const counter = { count: 0 };

    const model = buildWithParsedValue(createWideArray(500, counter), 2);

    expect(model.nodes.map(node => node.path)).toEqual(['$', '$[0]']);
    expect(model.isLimited).toBe(true);
    expect(counter.count).toBe(1);
  });

  it('节点预算不会提前读取超宽对象的全部属性值', () => {
    const counter = { count: 0 };

    const model = buildWithParsedValue(createWideObject(500, counter), 2);

    expect(model.nodes.map(node => node.path)).toEqual(['$', '$.key0']);
    expect(model.isLimited).toBe(true);
    expect(counter.count).toBe(1);
  });

  it('节点数量恰好达到预算时不误报截断', () => {
    const model = buildJsonTreeModel('{"item":1}', { maxNodes: 2 });

    expect(model.nodes.map(node => node.path)).toEqual(['$', '$.item']);
    expect(model.isLimited).toBe(false);
  });
});
