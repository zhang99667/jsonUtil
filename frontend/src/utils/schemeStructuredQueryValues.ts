export { isRecord as isPlainObject } from './storage';

export const stringifyParamValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};
