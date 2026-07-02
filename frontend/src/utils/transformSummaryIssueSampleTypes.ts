import type { AppVersionMetadata } from './appVersion';
import type { TransformIssueSampleExportItem } from './transformSummaryIssueSampleItemTypes';
import type { TransformIssueSampleExportSummary } from './transformSummaryIssueSampleSummaryTypes';
import type { TransformSuggestedCommand } from './transformSuggestedCommands';

export type {
  TransformIssueSampleExportItem,
  TransformIssueSampleType,
} from './transformSummaryIssueSampleItemTypes';

export type {
  TransformIssueSampleExportSummary,
  TransformIssueSampleExportSummaryBucket,
} from './transformSummaryIssueSampleSummaryTypes';

export interface TransformIssueSampleExport {
  schemaVersion: 1;
  kind: 'json-helper-transform-issue-samples';
  tool: AppVersionMetadata;
  filter: string;
  suggestedCommands: TransformSuggestedCommand[];
  summary: TransformIssueSampleExportSummary;
  samples: TransformIssueSampleExportItem[];
}

export interface TransformIssueSampleJsonOptions {
  redactSensitiveValues?: boolean;
  filter?: string;
}
