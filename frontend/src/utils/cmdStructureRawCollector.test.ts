import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import { collectRawCmdCandidates } from './cmdStructureRawCollector';
import type { RawCmdCandidate } from './cmdStructureRawCandidates';

describe('cmdStructureRawCollector', () => {
  it('迭代收集七千层对象和数组中的末端 CMD', () => {
    const source = 'sampleapp://v1/panel?tab=reward';
    let value: JsonValue = { action_cmd: source };
    for (let depth = 0; depth < 7000; depth += 1) {
      value = depth % 2 === 0 ? [value] : { child: value };
    }
    const candidates: RawCmdCandidate[] = [];

    collectRawCmdCandidates(value, candidates);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      source,
      sourceLabel: 'action_cmd',
      depth: 7001,
    });
    expect(candidates[0]?.path.endsWith('.action_cmd')).toBe(true);
  });
});
