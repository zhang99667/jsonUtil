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
): void => {
  const pending: Array<{ key: string; value: unknown }> = [{ key, value }];

  while (pending.length > 0) {
    const task = pending.pop();
    if (!task) continue;

    if (Array.isArray(task.value)) {
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(task.value, index)) continue;
        const item = task.value[index];
        const childKey = style.useEmptyArray && !isPlainObject(item) && !Array.isArray(item)
          ? `${task.key}[]`
          : `${task.key}[${index}]`;
        pending.push({ key: childKey, value: item });
      }
      continue;
    }

    if (isPlainObject(task.value)) {
      const entries = Object.entries(task.value);
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [childKey, childValue] = entries[index];
        const nextKey = style.objectStyle === 'dot'
          ? `${task.key}.${childKey}`
          : `${task.key}[${childKey}]`;
        pending.push({ key: nextKey, value: childValue });
      }
      continue;
    }

    params.append(task.key, stringifyParamValue(task.value));
  }
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
