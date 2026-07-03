import type {
  Base64MetaInfo,
  SchemeCommandSummaryInfo,
} from './schemeMetadata';
import type { SchemeQualitySummary } from './schemeQualitySummary';
import type {
  SchemeDecodeResult,
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
} from './schemeTypes';
import type { SchemeViewerParamSection } from './schemeViewerParamSections';

interface HasSchemeDiagnosticDetailsOptions {
  schemeQualitySummary?: SchemeQualitySummary | null;
  decodeResult: Pick<SchemeDecodeResult, 'schemeInfo' | 'layers'>;
  commandSummaryInfo?: SchemeCommandSummaryInfo | null;
  paramSections: SchemeViewerParamSection[];
  paramStages: SchemeParamDecodeStage[];
  placeholders: SchemePlaceholder[];
  decodeWarnings: SchemeDecodeWarning[];
  base64MetaInfo?: Base64MetaInfo | null;
}

export const hasSchemeDiagnosticDetails = ({
  schemeQualitySummary,
  decodeResult,
  commandSummaryInfo,
  paramSections,
  paramStages,
  placeholders,
  decodeWarnings,
  base64MetaInfo,
}: HasSchemeDiagnosticDetailsOptions): boolean => Boolean(
  schemeQualitySummary ||
  decodeResult.schemeInfo ||
  commandSummaryInfo ||
  decodeResult.layers.length > 0 ||
  paramSections.length > 0 ||
  paramStages.length > 0 ||
  placeholders.length > 0 ||
  decodeWarnings.length > 0 ||
  base64MetaInfo
);
