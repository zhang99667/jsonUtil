import {
  getStructuredQueryRootStyles,
  type StructuredQueryRootStyle,
} from './schemeStructuredQueryStyles';
import {
  isPlainObject,
  stringifyParamValue,
} from './schemeStructuredQueryValues';

const appendStructuredQueryValue = (
  params: URLSearchParams,
  key: string,
  value: unknown,
  style: StructuredQueryRootStyle
) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const childKey = style.useEmptyArray && !isPlainObject(item) && !Array.isArray(item)
        ? `${key}[]`
        : `${key}[${index}]`;
      appendStructuredQueryValue(params, childKey, item, style);
    });
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([childKey, childValue]) => {
      const nextKey = style.objectStyle === 'dot'
        ? `${key}.${childKey}`
        : `${key}[${childKey}]`;
      appendStructuredQueryValue(params, nextKey, childValue, style);
    });
    return;
  }

  params.append(key, stringifyParamValue(value));
};

export const buildQueryStringFromObject = (
  value: Record<string, unknown>,
  originalQueryString: string = ''
): string => {
  const params = new URLSearchParams();
  const structuredRootStyles = getStructuredQueryRootStyles(originalQueryString);

  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;

    const structuredStyle = structuredRootStyles.get(key);
    if (structuredStyle && (Array.isArray(item) || isPlainObject(item))) {
      appendStructuredQueryValue(params, key, item, structuredStyle);
    } else if (Array.isArray(item)) {
      item.forEach(child => params.append(key, stringifyParamValue(child)));
    } else {
      params.append(key, stringifyParamValue(item));
    }
  }

  return params.toString();
};
