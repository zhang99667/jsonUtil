import type {
  QueryKeySegment,
  StructuredQueryParamContainer,
  StructuredQueryValue,
} from './schemeStructuredQueryTypes';

export const createNestedContainer = (nextSegment: QueryKeySegment): StructuredQueryValue => (
  typeof nextSegment === 'number' || nextSegment === null ? [] : {}
);

export const mergeQueryValue = (
  existing: StructuredQueryValue | undefined,
  value: StructuredQueryValue
): StructuredQueryValue => {
  if (existing === undefined) {
    return value;
  } else if (Array.isArray(existing)) {
    return [...existing, value];
  }

  return [existing, value];
};

export const assignQueryLeaf = (
  container: StructuredQueryParamContainer | StructuredQueryValue[],
  segment: QueryKeySegment,
  value: StructuredQueryValue
) => {
  if (segment === null) {
    if (Array.isArray(container)) {
      container.push(value);
    }
    return;
  }

  if (typeof segment === 'number') {
    if (Array.isArray(container)) {
      container[segment] = mergeQueryValue(container[segment], value);
    }
    return;
  }

  if (!Array.isArray(container)) {
    container[segment] = mergeQueryValue(container[segment], value);
  }
};
