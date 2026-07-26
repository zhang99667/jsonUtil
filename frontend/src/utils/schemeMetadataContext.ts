import type { JsonValue } from '../types';
import {
  parseSchemeMetadataSourceContext,
  type SchemeMetadataSourceShape,
} from './schemeMetadataSourceShape';
import { parseJsonValue } from './jsonValueGuards';

export interface SchemeMetadataContext {
  decoded: string;
  decodedValue: JsonValue;
  source?: string;
  sourceShape: SchemeMetadataSourceShape | null;
  rawJsonSource: unknown | null;
}

export const parseSchemeMetadataContext = (
  decoded: string,
  source?: string,
): SchemeMetadataContext | null => {
  let decodedValue: JsonValue;
  try {
    decodedValue = parseJsonValue(decoded);
  } catch {
    return null;
  }

  const sourceValue = source?.trim() || undefined;
  let sourceContext = {
    sourceShape: null,
    rawJsonSource: null,
  };
  try {
    sourceContext = parseSchemeMetadataSourceContext(sourceValue);
  } catch {
    // 来源异常不应影响已成功解析的解码值和 Base64 摘要。
  }

  return {
    decoded,
    decodedValue,
    ...(sourceValue ? { source: sourceValue } : {}),
    ...sourceContext,
  };
};
