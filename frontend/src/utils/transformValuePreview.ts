import type { JsonValue } from '../types';

export const formatOriginalPreview = (value: string, maxLength = 96): string => (
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
);

export const formatJsonValuePreview = (value: JsonValue, maxLength = 120): string => {
  if (Array.isArray(value)) {
    return `数组 ${value.length} 项`;
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '对象: 空';

    const visibleKeys = keys.slice(0, 8).join(', ');
    return keys.length > 8
      ? `对象: ${visibleKeys} ... +${keys.length - 8}`
      : `对象: ${visibleKeys}`;
  }

  if (typeof value === 'string') return formatOriginalPreview(value, maxLength);
  return String(value);
};

export const formatDecodedPathCopyValue = (value: JsonValue, maxLength = 8_000): string => {
  const text = typeof value === 'string'
    ? JSON.stringify(value)
    : JSON.stringify(value) ?? String(value);

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
