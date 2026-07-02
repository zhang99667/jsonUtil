import type { JsonValue } from '../types';
import {
  getCmdStructureCandidateActual,
  isCmdStructureCandidateObject,
} from './cmdStructureCandidateActual';
import { appendCmdStructureCandidatePathKey } from './cmdStructureCandidatePath';
import type { CmdStructureCandidateInput } from './cmdStructureCandidateTypes';

export type { CmdStructureCandidateInput } from './cmdStructureCandidateTypes';

const appendCmdStructureCandidate = (
  candidates: CmdStructureCandidateInput[],
  seenIds: Set<string>,
  candidate: CmdStructureCandidateInput
) => {
  if (seenIds.has(candidate.id)) return;

  seenIds.add(candidate.id);
  candidates.push(candidate);
};

export const collectDecodedCmdStructureCandidates = (
  value: JsonValue,
  path: string,
  candidates: CmdStructureCandidateInput[],
  seenIds: Set<string>,
  sourceLabel?: string
) => {
  const cmdStructureActual = getCmdStructureCandidateActual(value);
  if (cmdStructureActual) {
    appendCmdStructureCandidate(candidates, seenIds, {
      id: path,
      label: path,
      sourceLabel,
      commandSchema: typeof cmdStructureActual.cmdSchema === 'string' ? cmdStructureActual.cmdSchema : undefined,
      actual: cmdStructureActual,
    });
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDecodedCmdStructureCandidates(
      item,
      `${path}[${index}]`,
      candidates,
      seenIds
    ));
    return;
  }

  if (!isCmdStructureCandidateObject(value)) return;

  Object.entries(value).forEach(([childKey, item]) => {
    collectDecodedCmdStructureCandidates(
      item,
      appendCmdStructureCandidatePathKey(path, childKey),
      candidates,
      seenIds,
      childKey
    );
  });
};
