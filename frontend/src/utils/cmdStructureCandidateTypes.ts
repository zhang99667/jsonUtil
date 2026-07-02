import type { JsonValue } from '../types';

export interface CmdStructureCandidateObject {
  [key: string]: JsonValue;
}

export interface CmdStructureCandidateInput {
  id: string;
  label: string;
  sourceLabel?: string;
  commandSchema?: string;
  actual: JsonValue;
}
