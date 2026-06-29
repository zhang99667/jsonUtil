import type { JsonValue } from '../types';
import { decodeRawCmdCandidate } from './cmdStructureRawSourceDecoder';
import type { NormalizedCmdStructure } from './cmdStructureRawSourceDecoder';
import {
  getRawCmdFieldPriority,
  looksLikeRawCmdSource,
} from './cmdStructureRawSourceGuards';

export { decodeRawCmdCandidate } from './cmdStructureRawSourceDecoder';
export type { NormalizedCmdStructure } from './cmdStructureRawSourceDecoder';
export { normalizeRawSourceString } from './cmdStructureRawSourceGuards';

interface JsonObject {
  [key: string]: JsonValue;
}

export interface RawCmdCandidate {
  source: string;
  priority: number;
  depth: number;
  order: number;
  path: string;
  sourceLabel?: string;
}

const isRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const appendPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

export const collectRawCmdCandidates = (
  value: JsonValue,
  candidates: RawCmdCandidate[],
  key = '$',
  depth = 0,
  orderRef = { value: 0 },
  path = '$'
) => {
  if (typeof value === 'string') {
    const priority = getRawCmdFieldPriority(key);
    if (priority > 0 && looksLikeRawCmdSource(value)) {
      candidates.push({
        source: value,
        priority,
        depth,
        order: orderRef.value,
        path,
        sourceLabel: key === '$' ? undefined : key,
      });
      orderRef.value += 1;
    }
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

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([childKey, item]) => {
    collectRawCmdCandidates(
      item,
      candidates,
      childKey,
      depth + 1,
      orderRef,
      appendPathKey(path, childKey)
    );
  });
};

export const findRawResponseCmdStructure = (value: JsonValue): NormalizedCmdStructure | null => {
  const candidates: RawCmdCandidate[] = [];
  collectRawCmdCandidates(value, candidates);
  if (candidates.length === 0) return null;

  const orderedCandidates = candidates.sort((left, right) => (
    right.priority - left.priority ||
    left.depth - right.depth ||
    left.order - right.order
  ));

  for (const candidate of orderedCandidates) {
    const structure = decodeRawCmdCandidate(candidate.source);
    if (structure) return structure;
  }

  return null;
};
