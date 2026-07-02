import type {
  JsonValue,
  TransformSchemeParamStageSummary,
  TransformWarning,
} from '../types';
import type { TransformReportResourceType } from './transformSummaryGroupTypes';

export interface TransformReportRecord {
  path: string;
  sourceLabel?: string;
  commandSchema?: string;
  commandSchemaRows?: TransformReportCommandSchemaRow[];
  commandParamCount?: number;
  commandParamKeys?: string[];
  labels: string[];
  insights: string[];
  originalValue: string;
  originalPreview: string;
  decodedPreview?: string;
  decodedSearchText?: string;
  decodedSearchPaths?: TransformReportDecodedPath[];
  decodedPaths: TransformReportDecodedPath[];
  decodedPathCount: number;
  isDecodedPathCountTruncated: boolean;
  indexedDecodedPathCount: number;
  hasMoreDecodedPaths: boolean;
  nestedCommandFields: TransformReportDecodedPath[];
  nestedCommandSearchFields?: TransformReportDecodedPath[];
  indexedNestedCommandFieldCount: number;
  hasMoreNestedCommandFields: boolean;
  nestedResourceFields?: TransformReportDecodedPath[];
  nestedResourceSearchFields?: TransformReportDecodedPath[];
  indexedNestedResourceFieldCount?: number;
  hasMoreNestedResourceFields?: boolean;
  hasCmdStructure: boolean;
  nestedCommandFieldCount: number;
  nestedResourceFieldCount?: number;
  nestedExtFieldCount: number;
  nestedBase64SuffixFieldCount: number;
  cmdStructureCopyText?: string;
  getCmdStructureCopyText?: (focusedFieldPaths?: string[]) => string;
  cmdStructureFocusPaths?: string[];
  cmdStructureFocusCount?: number;
  cmdStructureFocusLabel?: string;
  stepCount: number;
  hasNonReversibleScheme: boolean;
  schemeParamStageSummary?: TransformSchemeParamStageSummary;
}

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

export interface TransformReportWarning {
  type: TransformWarning['type'];
  path: string;
  sourceLabel?: string;
  originalValue: string;
  message: string;
  length: number;
  limit: number;
  reasonLabel: string;
  nextAction: string;
}

export interface TransformReportUnresolvedCandidate {
  path: string;
  sourceLabel?: string;
  originalValue: string;
  message: string;
  length: number;
  preview: string;
  detectedType?: string;
  reasonLabel: string;
  reasonLevel: 'info' | 'warning';
  nextAction: string;
}
