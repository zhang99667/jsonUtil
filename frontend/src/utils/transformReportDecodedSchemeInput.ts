import type { TransformReportRecord } from './transformSummary';

export const getDecodedPathSchemeInput = (row: TransformReportRecord['nestedCommandFields'][number]): string => {
  if (!Object.hasOwn(row, 'value')) return '';

  if (typeof row.value === 'string') return row.value;

  try {
    return JSON.stringify(row.value, null, 2);
  } catch {
    return '';
  }
};
