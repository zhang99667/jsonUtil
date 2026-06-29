import type {
  SchemeDecodeWarning,
  SchemeStructuredDecodeState,
} from './schemeStructuredDecodeTypes';

export const buildSchemeStructuredDecodeWarnings = (
  state: SchemeStructuredDecodeState
): SchemeDecodeWarning[] | undefined => (
  state.skippedStringCount > 0
    ? [{
        type: 'json_string_decode_skipped',
        message: '部分 JSON 字符串因性能保护未递归展开，可复制对应字段单独解析',
        skippedCount: state.skippedStringCount,
        decodedStringCount: state.decodedStringCount,
        totalStringLength: state.totalStringDecodeLength,
        limit: state.maxTotalStringDecodeLength,
        paths: state.skippedPaths,
      }]
    : undefined
);
