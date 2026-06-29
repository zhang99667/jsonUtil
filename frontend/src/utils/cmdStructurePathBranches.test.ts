import { describe, expect, it } from 'vitest';
import {
  collapseCmdStructureDescendantPaths,
  countCmdStructurePathBranches,
} from './cmdStructurePathBranches';

describe('cmdStructurePathBranches', () => {
  it('折叠同一父路径下的子孙路径', () => {
    expect(collapseCmdStructureDescendantPaths([
      '$.extra',
      '$.extra.trace',
      '$.extra.nested',
      '$.extra.nested.token',
      '$.list[0]',
      '$.list[0].title',
      '$.other',
    ])).toEqual([
      '$.extra',
      '$.list[0]',
      '$.other',
    ]);
  });

  it('统计折叠后的路径分支数量', () => {
    expect(countCmdStructurePathBranches([
      '$.extra',
      '$.extra.trace',
      '$.other',
    ])).toBe(2);
  });
});
