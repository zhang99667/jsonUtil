export type SchemeJsonPayloadValue =
  | string
  | number
  | boolean
  | null
  | SchemeJsonPayloadValue[]
  | { [key: string]: SchemeJsonPayloadValue };

export type JsonParseStrategy = 'strict' | 'html-quote' | 'escaped-quote' | 'loose-json';

export interface JsonParseMeta {
  value: SchemeJsonPayloadValue;
  strategy: JsonParseStrategy;
  normalized: string;
}
