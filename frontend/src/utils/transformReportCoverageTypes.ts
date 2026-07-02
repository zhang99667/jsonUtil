import type { TransformContextSummary } from './transformContextSummary';

export type TransformReportCoverageSummary = Pick<
  TransformContextSummary,
  'recordCount' | 'unresolvedCount' | 'warningCount' | 'placeholderCount'
>;

export interface TransformReportCoverage {
  score: number;
  label: string;
  level: 'success' | 'info' | 'warning';
  description: string;
  items: string[];
}
