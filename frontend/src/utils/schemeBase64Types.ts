export type SchemeBase64StructuredValue =
  | string
  | number
  | boolean
  | null
  | SchemeBase64StructuredValue[]
  | { [key: string]: SchemeBase64StructuredValue };

export interface SchemeBase64DecodeOptions {
  isJsonString?: (value: string) => boolean;
  looksLikeStructuredPayload?: (value: string) => boolean;
  decodeNestedParamValue?: (value: string) => SchemeBase64StructuredValue;
}

export interface Base64DecodeResult {
  decoded: string;
  reversible: boolean;
}
