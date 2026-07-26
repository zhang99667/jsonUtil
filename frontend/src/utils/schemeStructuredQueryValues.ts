import { stringifyUnknownValue } from './transformValuePreview';

export { isRecord as isPlainObject } from './storage';

export const stringifyParamValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  return stringifyUnknownValue(value);
};
