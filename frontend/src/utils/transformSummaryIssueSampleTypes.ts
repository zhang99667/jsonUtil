import type { TransformWarning } from '../types';
import type { AppVersionMetadata } from './appVersion';
import type { TransformSuggestedCommand } from './transformSuggestedCommands';

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

export interface TransformIssueSampleExport {
  schemaVersion: 1;
  kind: 'json-helper-transform-issue-samples';
  tool: AppVersionMetadata;
  filter: string;
  suggestedCommands: TransformSuggestedCommand[];
  summary: {
    unresolved: {
      copied: number;
      filtered: number;
      total: number;
      truncated: boolean;
    };
    runtimePlaceholders: {
      copied: number;
      filtered: number;
      total: number;
      truncated: boolean;
    };
    warnings: {
      copied: number;
      filtered: number;
      total: number;
      truncated: boolean;
    };
  };
  samples: TransformIssueSampleExportItem[];
}

export interface TransformIssueSampleJsonOptions {
  redactSensitiveValues?: boolean;
  filter?: string;
}
