import type { JsonValue } from '../types';
import {
  getCmdStructureCandidateActual,
  isCmdStructureCandidateObject,
} from './cmdStructureCandidateActual';
import { appendCmdStructureCandidatePathKey } from './cmdStructureCandidatePath';
import type { CmdStructureCandidateInput } from './cmdStructureCandidateTypes';

export type { CmdStructureCandidateInput } from './cmdStructureCandidateTypes';

interface DecodedCmdCandidateTask {
  value: JsonValue;
  path: string;
  sourceLabel?: string;
}

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
  const tasks: DecodedCmdCandidateTask[] = [{ value, path, sourceLabel }];

  while (tasks.length > 0) {
    const task = tasks.pop();
    if (!task) break;

    const cmdStructureActual = getCmdStructureCandidateActual(task.value);
    if (cmdStructureActual) {
      appendCmdStructureCandidate(candidates, seenIds, {
        id: task.path,
        label: task.path,
        sourceLabel: task.sourceLabel,
        commandSchema: typeof cmdStructureActual.cmdSchema === 'string'
          ? cmdStructureActual.cmdSchema
          : undefined,
        actual: cmdStructureActual,
      });
    }

    if (Array.isArray(task.value)) {
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!(index in task.value)) continue;
        tasks.push({ value: task.value[index], path: `${task.path}[${index}]` });
      }
      continue;
    }

    if (!isCmdStructureCandidateObject(task.value)) continue;

    const entries = Object.entries(task.value);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const [childKey, item] = entries[index];
      tasks.push({
        value: item,
        path: appendCmdStructureCandidatePathKey(task.path, childKey),
        sourceLabel: childKey,
      });
    }
  }
};
