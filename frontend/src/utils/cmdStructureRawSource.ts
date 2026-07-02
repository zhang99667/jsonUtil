import type { JsonValue } from '../types';
import { appendCmdStructureCandidatePathKey } from './cmdStructureCandidatePath';
import {
  appendRawCmdStringCandidate,
  isRawCmdCandidateRecord,
  sortRawCmdCandidatesByPriority,
  type RawCmdCandidate,
} from './cmdStructureRawCandidates';
import { decodeRawCmdCandidate } from './cmdStructureRawSourceDecoder';
import type { NormalizedCmdStructure } from './cmdStructureRawSourceDecoder';

export { decodeRawCmdCandidate } from './cmdStructureRawSourceDecoder';
export type { NormalizedCmdStructure } from './cmdStructureRawSourceDecoder';
export type { RawCmdCandidate } from './cmdStructureRawCandidates';
export { normalizeRawSourceString } from './cmdStructureRawSourceGuards';

export const collectRawCmdCandidates = (
  value: JsonValue,
  candidates: RawCmdCandidate[],
  key = '$',
  depth = 0,
  orderRef = { value: 0 },
  path = '$'
) => {
  if (typeof value === 'string') {
    appendRawCmdStringCandidate(value, candidates, key, depth, orderRef, path);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectRawCmdCandidates(
      item,
      candidates,
      key,
      depth + 1,
      orderRef,
      `${path}[${index}]`
    ));
    return;
  }

  if (!isRawCmdCandidateRecord(value)) return;

  Object.entries(value).forEach(([childKey, item]) => {
    collectRawCmdCandidates(
      item,
      candidates,
      childKey,
      depth + 1,
      orderRef,
      appendCmdStructureCandidatePathKey(path, childKey)
    );
  });
};

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
