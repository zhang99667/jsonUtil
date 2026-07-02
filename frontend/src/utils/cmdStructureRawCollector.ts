import type { JsonValue } from '../types';
import { appendCmdStructureCandidatePathKey } from './cmdStructureCandidatePath';
import {
  appendRawCmdStringCandidate,
  isRawCmdCandidateRecord,
  type RawCmdCandidate,
} from './cmdStructureRawCandidates';

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
