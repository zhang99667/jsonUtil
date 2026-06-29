import type { StructuredQueryParamContainer, StructuredQueryValue } from './schemeStructuredQueryTypes';
import { parseStructuredQueryKey } from './schemeStructuredQueryKeys';
import { mergeQueryValue } from './schemeStructuredQueryAssignNodes';
import { assignStructuredQueryPath } from './schemeStructuredQueryAssignPath';

export const assignQueryParam = (
  result: StructuredQueryParamContainer,
  key: string,
  value: StructuredQueryValue
) => {
  const shouldNestKey = key.includes('.') || key.includes('[');
  const segments = shouldNestKey ? parseStructuredQueryKey(key) : [];
  if (segments.length > 1) {
    assignStructuredQueryPath(result, segments, value);
    return;
  }

  result[key] = mergeQueryValue(result[key], value);
};
