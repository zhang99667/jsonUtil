import type {
  QueryKeySegment,
  StructuredQueryParamContainer,
  StructuredQueryValue,
} from './schemeStructuredQueryTypes';
import { assignQueryLeaf } from './schemeStructuredQueryAssignNodes';
import {
  resolveStructuredQueryPathCursor,
  type StructuredQueryPathCursor,
} from './schemeStructuredQueryAssignPathCursor';

export const assignStructuredQueryPath = (
  result: StructuredQueryParamContainer,
  segments: QueryKeySegment[],
  value: StructuredQueryValue
) => {
  let current: StructuredQueryPathCursor = result;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;
    if (isLast) {
      assignQueryLeaf(current, segment, value);
      return;
    }

    const nextCursor = resolveStructuredQueryPathCursor(current, segment, segments[i + 1]);
    if (!nextCursor) return;
    current = nextCursor;
  }
};
