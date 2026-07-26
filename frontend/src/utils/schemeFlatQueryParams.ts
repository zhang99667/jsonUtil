import {
  iterateDecodedQueryPairs,
} from './schemeQuerySyntax';
import {
  getSingleRawStructuredParam,
  type SchemeRawParamOptions,
} from './schemeRawParams';

const assignFlatQueryParam = (
  result: Record<string, string | string[]>,
  key: string,
  value: string
) => {
  const existing = result[key];
  if (existing === undefined) {
    result[key] = value;
  } else if (Array.isArray(existing)) {
    existing.push(value);
  } else {
    result[key] = [existing, value];
  }
};

export const parseFlatQueryParams = (
  queryString: string,
  options: SchemeRawParamOptions
): Record<string, string | string[]> | undefined => {
  const singleRawStructuredParam = getSingleRawStructuredParam(queryString, options);
  if (singleRawStructuredParam) {
    return { [singleRawStructuredParam.key]: singleRawStructuredParam.value };
  }

  const params: Record<string, string | string[]> = {};

  for (const { key, value } of iterateDecodedQueryPairs(
    queryString,
    options.decodeKey,
    options.decodeValue,
  )) {
    assignFlatQueryParam(params, key, value);
  }

  return Object.keys(params).length > 0 ? params : undefined;
};
