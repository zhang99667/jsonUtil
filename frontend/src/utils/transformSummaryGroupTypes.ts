import type { StaticResourceType } from './staticResourceSchema';

export interface TransformReportNestedCommandFieldGroup {
  key: string;
  count: number;
  recordCount: number;
  paths: string[];
  hasMorePaths: boolean;
}

export interface TransformReportCommandSchemaGroup {
  schema: string;
  count: number;
  recordCount: number;
  paths: string[];
  hasMorePaths: boolean;
  resourceType?: TransformReportResourceType;
  resourceTypeLabel?: string;
}

export type TransformReportResourceType = StaticResourceType;

export interface TransformReportResourceTypeGroup {
  resourceType: TransformReportResourceType;
  resourceTypeLabel: string;
  query: string;
  count: number;
  percentage: number;
  recordCount: number;
  schemaCount: number;
  schemas: string[];
  hasMoreSchemas: boolean;
}

export interface TransformReportCommandSchemaOriginGroup {
  origin: string;
  count: number;
  schemaCount: number;
  recordCount: number;
  schemas: string[];
  hasMoreSchemas: boolean;
}
