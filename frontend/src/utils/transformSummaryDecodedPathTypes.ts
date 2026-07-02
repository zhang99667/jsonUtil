import type { JsonValue } from '../types';
import type { TransformReportResourceType } from './transformSummaryGroupTypes';

export interface TransformReportDecodedPath {
  path: string;
  preview: string;
  copyText?: string;
  value?: JsonValue;
  sourceValue?: JsonValue;
  resourceType?: TransformReportResourceType;
  resourceTypeLabel?: string;
}

export interface TransformReportCommandSchemaRow {
  schema: string;
  path: string;
  source?: string;
}
