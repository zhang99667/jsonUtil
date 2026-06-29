import type { JsonValue } from '../types';
import type { TransformReportRecord } from './transformSummary';

export const getDecodedPathSchemeInput = (row: TransformReportRecord['nestedCommandFields'][number]): string => {
  if (!Object.prototype.hasOwnProperty.call(row, 'value')) return '';

  if (typeof row.value === 'string') return row.value;

  try {
    return JSON.stringify(row.value as JsonValue, null, 2);
  } catch {
    return '';
  }
};
