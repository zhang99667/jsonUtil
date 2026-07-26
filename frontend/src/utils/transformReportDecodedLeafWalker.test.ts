import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import { walkTransformDecodedLeaves } from './transformReportDecodedLeafWalker';

describe('walkTransformDecodedLeaves', () => {
  it('深层对象末端遍历不依赖 JavaScript 调用栈', () => {
    const depth = 10_000;
    let value: JsonValue = '末端';
    for (let index = 0; index < depth; index += 1) {
      value = { child: value };
    }

    const visited: Array<{ path: string; value: JsonValue }> = [];
    walkTransformDecodedLeaves(value, '$', leaf => {
      visited.push({ path: leaf.path, value: leaf.value });
    });

    expect(visited).toEqual([{
      path: `$${'.child'.repeat(depth)}`,
      value: '末端',
    }]);
  });

  it('保持深度优先顺序并支持提前停止', () => {
    const paths: string[] = [];

    walkTransformDecodedLeaves({ first: [], second: [{}, '不应访问'] }, '$', leaf => {
      paths.push(leaf.path);
      return leaf.path === '$.second[0]' ? false : undefined;
    });

    expect(paths).toEqual(['$.first', '$.second[0]']);
  });
});
