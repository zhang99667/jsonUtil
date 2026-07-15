import type { JsonObject, JsonValue } from '../types';
import {
  getRawCmdFieldPriority,
  looksLikeRawCmdSource,
} from './cmdStructureRawSourceGuards';
import { isJsonObject } from './jsonValueGuards';

export interface RawCmdCandidate {
  source: string;
  priority: number;
  depth: number;
  order: number;
  path: string;
  sourceLabel?: string;
}

interface RawCmdCandidateOrderRef {
  value: number;
}

export const isRawCmdCandidateRecord: (
  value: JsonValue
) => value is JsonObject = isJsonObject;

export const appendRawCmdStringCandidate = (
  value: string,
  candidates: RawCmdCandidate[],
  key: string,
  depth: number,
  orderRef: RawCmdCandidateOrderRef,
  path: string
) => {
  const priority = getRawCmdFieldPriority(key);
  if (priority <= 0 || !looksLikeRawCmdSource(value)) return;

  candidates.push({
    source: value,
    priority,
    depth,
    order: orderRef.value,
    path,
    sourceLabel: key === '$' ? undefined : key,
  });
  orderRef.value += 1;
};

export const sortRawCmdCandidatesByPriority = (
  candidates: RawCmdCandidate[]
): RawCmdCandidate[] => (
  candidates.sort((left, right) => (
    right.priority - left.priority ||
    left.depth - right.depth ||
    left.order - right.order
  ))
);
