import type { JsonValue } from '../types';
import type { CmdStructureCandidateObject } from './cmdStructureCandidateTypes';

export const isCmdStructureCandidateObject = (value: JsonValue): value is CmdStructureCandidateObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

export const toCmdStructureCandidateActual = (value: {
  cmdSchema?: JsonValue;
  cmdParams: JsonValue;
  source?: JsonValue;
}): CmdStructureCandidateObject => ({
  ...(typeof value.cmdSchema === 'string' ? { cmdSchema: value.cmdSchema } : {}),
  cmdParams: value.cmdParams,
  ...(typeof value.source === 'string' ? { source: value.source } : {}),
});

export const getCmdStructureCandidateActual = (value: JsonValue): CmdStructureCandidateObject | null => (
  isCmdStructureCandidateObject(value) && Object.prototype.hasOwnProperty.call(value, 'cmdParams')
    ? toCmdStructureCandidateActual(value as {
        cmdSchema?: JsonValue;
        cmdParams: JsonValue;
        source?: JsonValue;
      })
    : null
);
