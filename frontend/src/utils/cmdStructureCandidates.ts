import type { JsonValue } from '../types';
import {
  collectDecodedCmdStructureCandidates,
  toCmdStructureCandidateActual,
  type CmdStructureCandidateInput,
} from './cmdStructureDecodedCandidates';
import {
  collectRawCmdCandidates,
  decodeRawCmdCandidate,
} from './cmdStructureRawSource';
import type { RawCmdCandidate } from './cmdStructureRawSource';

export type { CmdStructureCandidateInput } from './cmdStructureDecodedCandidates';

export const collectActualCmdStructureCandidates = (value: JsonValue): CmdStructureCandidateInput[] => {
  const candidates: CmdStructureCandidateInput[] = [];
  const seenIds = new Set<string>();
  const rawCandidates: RawCmdCandidate[] = [];
  collectRawCmdCandidates(value, rawCandidates);

  rawCandidates.forEach(candidate => {
    const structure = decodeRawCmdCandidate(candidate.source);
    if (!structure) return;

    collectDecodedCmdStructureCandidates(
      toCmdStructureCandidateActual(structure),
      candidate.path,
      candidates,
      seenIds,
      candidate.sourceLabel
    );
  });

  collectDecodedCmdStructureCandidates(value, '$', candidates, seenIds);
  return candidates;
};
