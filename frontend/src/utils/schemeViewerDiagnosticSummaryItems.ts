import type { SchemeDecodeWarning } from './schemeTypes';
import {
  buildSchemeDiagnosticSummaryItemList,
} from './schemeViewerDiagnosticSummaryItemBuilders';
import type {
  BuildSchemeDiagnosticSummaryItemsOptions,
  SchemeDiagnosticSummaryItem,
} from './schemeViewerDiagnosticSummaryTypes';

export type { SchemeDiagnosticSummaryItem };

export const sumSchemeSkippedDecodeCount = (
  decodeWarnings: SchemeDecodeWarning[]
): number => (
  decodeWarnings.reduce((total, warning) => total + warning.skippedCount, 0)
);

export const buildSchemeDiagnosticSummaryItems = (
  options: BuildSchemeDiagnosticSummaryItemsOptions
): SchemeDiagnosticSummaryItem[] => (
  buildSchemeDiagnosticSummaryItemList(options)
);
