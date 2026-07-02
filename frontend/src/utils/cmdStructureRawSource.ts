import type { JsonValue } from '../types';
import {
  sortRawCmdCandidatesByPriority,
  type RawCmdCandidate,
} from './cmdStructureRawCandidates';
import { collectRawCmdCandidates } from './cmdStructureRawCollector';
import { decodeRawCmdCandidate } from './cmdStructureRawSourceDecoder';
import type { NormalizedCmdStructure } from './cmdStructureRawSourceDecoder';

export { decodeRawCmdCandidate } from './cmdStructureRawSourceDecoder';
export { collectRawCmdCandidates } from './cmdStructureRawCollector';
export type { NormalizedCmdStructure } from './cmdStructureRawSourceDecoder';
export type { RawCmdCandidate } from './cmdStructureRawCandidates';
export { normalizeRawSourceString } from './cmdStructureRawSourceGuards';

export const findRawResponseCmdStructure = (value: JsonValue): NormalizedCmdStructure | null => {
  const candidates: RawCmdCandidate[] = [];
  collectRawCmdCandidates(value, candidates);
  if (candidates.length === 0) return null;

  const orderedCandidates = sortRawCmdCandidatesByPriority(candidates);

  for (const candidate of orderedCandidates) {
    const structure = decodeRawCmdCandidate(candidate.source);
    if (structure) return structure;
  }

  return null;
};
