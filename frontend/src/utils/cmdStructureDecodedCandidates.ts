import type { JsonValue } from '../types';

interface JsonObject {
  [key: string]: JsonValue;
}

export interface CmdStructureCandidateInput {
  id: string;
  label: string;
  sourceLabel?: string;
  commandSchema?: string;
  actual: JsonValue;
}

const isRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const appendPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

export const toCmdStructureCandidateActual = (value: {
  cmdSchema?: JsonValue;
  cmdParams: JsonValue;
  source?: JsonValue;
}): JsonObject => ({
  ...(typeof value.cmdSchema === 'string' ? { cmdSchema: value.cmdSchema } : {}),
  cmdParams: value.cmdParams,
  ...(typeof value.source === 'string' ? { source: value.source } : {}),
});

const getCmdStructureCandidateActual = (value: JsonValue): JsonObject | null => (
  isRecord(value) && Object.prototype.hasOwnProperty.call(value, 'cmdParams')
    ? toCmdStructureCandidateActual(value as {
        cmdSchema?: JsonValue;
        cmdParams: JsonValue;
        source?: JsonValue;
      })
    : null
);

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

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([childKey, item]) => {
    collectDecodedCmdStructureCandidates(
      item,
      appendPathKey(path, childKey),
      candidates,
      seenIds,
      childKey
    );
  });
};
