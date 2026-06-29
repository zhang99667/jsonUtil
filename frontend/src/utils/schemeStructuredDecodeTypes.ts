export interface SchemeDecodeWarning {
  type: 'json_string_decode_skipped';
  message: string;
  skippedCount: number;
  decodedStringCount: number;
  totalStringLength: number;
  limit: number;
  paths: string[];
}

export interface SchemeStructuredDecodeState {
  maxStringDecodeLength: number;
  maxTotalStringDecodeLength: number;
  totalStringDecodeLength: number;
  decodedStringCount: number;
  skippedStringCount: number;
  skippedPaths: string[];
}
