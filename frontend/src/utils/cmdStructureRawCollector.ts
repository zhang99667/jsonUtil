import type { JsonValue } from '../types';
import { appendCmdStructureCandidatePathKey } from './cmdStructureCandidatePath';
import {
  appendRawCmdStringCandidate,
  isRawCmdCandidateRecord,
  type RawCmdCandidate,
} from './cmdStructureRawCandidates';

interface RawCmdCollectionTask {
  value: JsonValue;
  key: string;
  depth: number;
  path: string;
}

export const collectRawCmdCandidates = (
  value: JsonValue,
  candidates: RawCmdCandidate[],
  key = '$',
  depth = 0,
  orderRef = { value: 0 },
  path = '$'
): void => {
  const tasks: RawCmdCollectionTask[] = [{ value, key, depth, path }];

  while (tasks.length > 0) {
    const task = tasks.pop();
    if (!task) break;

    if (typeof task.value === 'string') {
      appendRawCmdStringCandidate(
        task.value,
        candidates,
        task.key,
        task.depth,
        orderRef,
        task.path
      );
      continue;
    }

    if (Array.isArray(task.value)) {
      // 子项逆序入栈，保持原有从左到右的深度优先收集顺序。
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!(index in task.value)) continue;
        tasks.push({
          value: task.value[index],
          key: task.key,
          depth: task.depth + 1,
          path: `${task.path}[${index}]`,
        });
      }
      continue;
    }

    if (!isRawCmdCandidateRecord(task.value)) continue;

    const entries = Object.entries(task.value);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      if (!entry) continue;
      const [childKey, item] = entry;
      tasks.push({
        value: item,
        key: childKey,
        depth: task.depth + 1,
        path: appendCmdStructureCandidatePathKey(task.path, childKey),
      });
    }
  }
};
