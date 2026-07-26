import type { JsonValue } from '../types.ts';

export type SchemeMetadataSourceShape = string | number | boolean | null
  | SchemeMetadataSourceShape[]
  | { [key: string]: SchemeMetadataSourceShape };

export interface SchemeCommandSourceInfo {
  cmdSchema?: string;
  source: string;
}

export interface SchemeMetadataSourceContext {
  sourceShape: SchemeMetadataSourceShape | null;
  rawJsonSource: JsonValue | null;
}
