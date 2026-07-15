import type { JsonObject, JsonValue } from '../types';

export type CmdStructureCandidateObject = JsonObject;

export interface CmdStructureCandidateInput {
  id: string;
  label: string;
  sourceLabel?: string;
  commandSchema?: string;
  actual: JsonValue;
}
