import type { JsonValue } from '../types';
import { toCmdStructureCandidateActual } from './cmdStructureCandidateActual';
import type { CmdStructureCandidateInput } from './cmdStructureCandidateTypes';
import {
  collectDecodedCmdStructureCandidates,
} from './cmdStructureDecodedCandidates';
import {
  collectRawCmdCandidates,
  decodeRawCmdCandidate,
} from './cmdStructureRawSource';
import type { RawCmdCandidate } from './cmdStructureRawSource';

export type { CmdStructureCandidateInput } from './cmdStructureCandidateTypes';

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
