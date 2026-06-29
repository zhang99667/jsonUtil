import type {
  QueryKeySegment,
  StructuredQueryParamContainer,
  StructuredQueryValue,
} from './schemeStructuredQueryTypes';
import {
  assignQueryLeaf,
  createNestedContainer,
} from './schemeStructuredQueryAssignNodes';

export const assignStructuredQueryPath = (
  result: StructuredQueryParamContainer,
  segments: QueryKeySegment[],
  value: StructuredQueryValue
) => {
  let current: StructuredQueryParamContainer | StructuredQueryValue[] = result;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;
    if (isLast) {
      assignQueryLeaf(current, segment, value);
      return;
    }

    const nextContainer = createNestedContainer(segments[i + 1]);

    if (segment === null) {
      if (!Array.isArray(current)) return;
      current.push(nextContainer);
      current = nextContainer as StructuredQueryParamContainer | StructuredQueryValue[];
      continue;
    }

    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return;
      const existing = current[segment];
      if (!existing || typeof existing !== 'object') {
        current[segment] = nextContainer;
      }
      current = current[segment] as StructuredQueryParamContainer | StructuredQueryValue[];
      continue;
    }

    if (Array.isArray(current)) return;
    const existing = current[segment];
    if (!existing || typeof existing !== 'object') {
      current[segment] = nextContainer;
    }
    current = current[segment] as StructuredQueryParamContainer | StructuredQueryValue[];
  }
};
