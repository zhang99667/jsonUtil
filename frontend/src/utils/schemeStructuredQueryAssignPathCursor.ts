import type {
  QueryKeySegment,
  StructuredQueryParamContainer,
  StructuredQueryValue,
} from './schemeStructuredQueryTypes';
import { createNestedContainer } from './schemeStructuredQueryAssignNodes';

export type StructuredQueryPathCursor = StructuredQueryParamContainer | StructuredQueryValue[];

const asPathCursor = (value: StructuredQueryValue): StructuredQueryPathCursor => (
  value as StructuredQueryPathCursor
);

export const resolveStructuredQueryPathCursor = (
  current: StructuredQueryPathCursor,
  segment: QueryKeySegment,
  nextSegment: QueryKeySegment
): StructuredQueryPathCursor | null => {
  const nextContainer = createNestedContainer(nextSegment);

  if (segment === null) {
    if (!Array.isArray(current)) return null;
    current.push(nextContainer);
    return asPathCursor(nextContainer);
  }

  if (typeof segment === 'number') {
    if (!Array.isArray(current)) return null;
    const existing = current[segment];
    if (!existing || typeof existing !== 'object') {
      current[segment] = nextContainer;
    }
    return asPathCursor(current[segment]);
  }

  if (Array.isArray(current)) return null;
  const existing = current[segment];
  if (!existing || typeof existing !== 'object') {
    current[segment] = nextContainer;
  }
  return asPathCursor(current[segment]);
};
