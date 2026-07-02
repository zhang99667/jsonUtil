import type { TransformWarning } from '../types';

export type TransformIssueSampleType = 'unresolved' | 'runtime_placeholder' | 'warning';

export interface TransformIssueSampleExportItem {
  type: TransformIssueSampleType;
  path: string;
  sourceLabel?: string;
  originalValue: string;
  redactionHint?: string;
  reasonLabel: string;
  nextAction?: string;
  message?: string;
  detectedType?: string;
  reasonLevel?: 'info' | 'warning';
  length?: number;
  limit?: number;
  value?: string;
  sourcePath?: string;
  warningType?: TransformWarning['type'];
}
