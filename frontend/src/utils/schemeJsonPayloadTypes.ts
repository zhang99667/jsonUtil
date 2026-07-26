import type { JsonValue } from '../types';

export type SchemeJsonPayloadValue = JsonValue;

export type JsonParseStrategy = 'strict' | 'html-quote' | 'escaped-quote' | 'loose-json';

export interface JsonParseMeta {
  value: SchemeJsonPayloadValue;
  strategy: JsonParseStrategy;
  normalized: string;
}
