import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import { collectDecodedCmdStructureCandidates } from './cmdStructureDecodedCandidates';

describe('collectDecodedCmdStructureCandidates', () => {
  it('稳定扫描极深的对象和数组混合结构', () => {
    let value: JsonValue = {
      cmdSchema: 'sampleapp://v1/panel',
      cmdParams: { tab: 'reward' },
    };

    for (let depth = 0; depth < 7_000; depth += 1) {
      value = depth % 2 === 0 ? { child: value } : [value];
    }

    const candidates: Parameters<typeof collectDecodedCmdStructureCandidates>[2] = [];
    collectDecodedCmdStructureCandidates(value, '$', candidates, new Set());

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.commandSchema).toBe('sampleapp://v1/panel');
    expect(candidates[0]?.id.length).toBeGreaterThan(7_000);
  });
});
