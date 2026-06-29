export interface SchemeLogFieldParam {
  prefix?: string;
  rawKey: string;
  key: string;
  delimiter: ':' | '：' | '=' | '=>' | '->';
  value: string;
  quote?: '"' | "'";
  trailingComma?: boolean;
}

export interface SchemeLogFieldParseOptions {
  decodeKey: (rawKey: string) => string;
  isDecodableValue: (value: string) => boolean;
}
