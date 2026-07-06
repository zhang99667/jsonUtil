import type { JsonPathQueryItem } from './jsonPathQuery';

export const formatJsonPathValuesForCopy = (values: unknown[]): string => {
  if (values.length === 1) {
    const [value] = values;
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  return JSON.stringify(values, null, 2);
};

const formatJsonPathValueForLineCopy = (value: unknown): string => (
  typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value) ?? String(value)
);

export const formatJsonPathItemsForCopy = (items: JsonPathQueryItem[]): string => (
  items.map(item => `${item.path} = ${formatJsonPathValueForLineCopy(item.value)}`).join('\n')
);

export const getJsonPathCopyCountLabel = (count: number, isLimited: boolean): string => (
  isLimited ? `已返回 ${count} 项` : `${count} 项`
);
