import type { JsonValue } from '../types';
import type { JsonPathQueryItem } from './jsonPathQuery';
import { formatDecodedPathCopyValue } from './transformValuePreview';

export const formatJsonPathValuesForCopy = (values: JsonValue[]): string => {
  if (values.length === 1) {
    const [value] = values;
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  return JSON.stringify(values, null, 2);
};

export const formatJsonPathItemsForCopy = (items: JsonPathQueryItem[]): string => (
  items.map(item => `${item.path} = ${formatDecodedPathCopyValue(item.value)}`).join('\n')
);

export const getJsonPathCopyCountLabel = (count: number, isLimited: boolean): string => (
  isLimited ? `已返回 ${count} 项` : `${count} 项`
);
