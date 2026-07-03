import type {
  Base64MetaInfo,
  SchemeCommandSummaryInfo,
} from './schemeMetadata';
import type {
  SchemeDecodeResult,
  SchemeParamDecodeStage,
  SchemePlaceholder,
} from './schemeTypes';
import type { SchemeViewerParamSection } from './schemeViewerParamSections';

export interface SchemeDiagnosticSummaryItem {
  key: string;
  label: string;
  title?: string;
}

export interface BuildSchemeDiagnosticSummaryItemsOptions {
  decodeResult: Pick<SchemeDecodeResult, 'schemeInfo' | 'layers'>;
  commandSummaryInfo?: SchemeCommandSummaryInfo | null;
  paramSections: SchemeViewerParamSection[];
  paramStages: SchemeParamDecodeStage[];
  placeholders: SchemePlaceholder[];
  skippedDecodeCount: number;
  base64MetaInfo?: Base64MetaInfo | null;
}
