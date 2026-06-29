import {
  splitQueryPairs,
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

  splitQueryPairs(queryString).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = options.decodeKey(pair.slice(0, equalIndex));
    const value = options.decodeValue(pair.slice(equalIndex + 1));
    if (key) {
      assignFlatQueryParam(params, key, value);
    }
  });

  return Object.keys(params).length > 0 ? params : undefined;
};
