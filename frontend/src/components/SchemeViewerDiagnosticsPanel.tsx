import React from 'react';
import type {
  Base64MetaInfo,
  SchemeCommandSummaryInfo,
} from '../utils/schemeMetadata';
import type { SchemeQualitySummary } from '../utils/schemeQualitySummary';
import type {
  SchemeDiagnosticSummaryItem,
  SchemeViewerParamSection,
} from '../utils/schemeViewerDiagnostics';
import type {
  DecodeLayer,
  SchemeDecodeResult,
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
  SchemePlaceholderGroup,
} from '../utils/schemeTypes';
import { SchemeViewerBase64MetaPanel } from './SchemeViewerBase64MetaPanel';
import { SchemeViewerCommandSummaryPanel } from './SchemeViewerCommandSummaryPanel';
import { SchemeViewerDecodeWarningsPanel } from './SchemeViewerDecodeWarningsPanel';
import { SchemeViewerDecodeLayersPanel } from './SchemeViewerDecodeLayersPanel';
import { SchemeViewerDiagnosticsQualityCard } from './SchemeViewerDiagnosticsQualityCard';
import { SchemeViewerDiagnosticsSummaryBar } from './SchemeViewerDiagnosticsSummaryBar';
import { SchemeViewerParamSectionsPanel } from './SchemeViewerParamSectionsPanel';
import { SchemeViewerParamStagesPanel } from './SchemeViewerParamStagesPanel';
import { SchemeViewerRuntimePlaceholdersPanel } from './SchemeViewerRuntimePlaceholdersPanel';
import { SchemeViewerSchemeInfoRow } from './SchemeViewerSchemeInfoRow';

interface SchemeViewerDiagnosticsPanelProps {
  hasDiagnosticDetails: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  schemeQualitySummary: SchemeQualitySummary | null;
  diagnosticSummaryItems: SchemeDiagnosticSummaryItem[];
  canInspectOriginal: boolean;
  onInspectOriginal: () => void;
  onCopyQualitySummary: () => void;
  onCopyQualitySnapshot: () => void;
  copyQualitySnapshotTitle: string;
  schemeInfo: SchemeDecodeResult['schemeInfo'];
  commandSummaryInfo: SchemeCommandSummaryInfo | null;
  placeholders: SchemePlaceholder[];
  placeholderGroups: SchemePlaceholderGroup[];
  decodeWarnings: SchemeDecodeWarning[];
  paramSections: SchemeViewerParamSection[];
  paramStages: SchemeParamDecodeStage[];
  base64MetaInfo: Base64MetaInfo | null;
  layers: DecodeLayer[];
  decodedContent: string;
  isJson: boolean;
}

export const SchemeViewerDiagnosticsPanel: React.FC<SchemeViewerDiagnosticsPanelProps> = ({
  hasDiagnosticDetails,
  isExpanded,
  onToggleExpanded,
  schemeQualitySummary,
  diagnosticSummaryItems,
  canInspectOriginal,
  onInspectOriginal,
  onCopyQualitySummary,
  onCopyQualitySnapshot,
  copyQualitySnapshotTitle,
  schemeInfo,
  commandSummaryInfo,
  placeholders,
  placeholderGroups,
  decodeWarnings,
  paramSections,
  paramStages,
  base64MetaInfo,
  layers,
  decodedContent,
  isJson,
}) => {
  if (!hasDiagnosticDetails) return null;

  return (
    <div
      data-tour="scheme-diagnostics-panel"
      className="bg-editor-sidebar rounded border border-editor-border"
    >
      <SchemeViewerDiagnosticsSummaryBar
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
        schemeQualitySummary={schemeQualitySummary}
        diagnosticSummaryItems={diagnosticSummaryItems}
      />
      {isExpanded && (
        <div
          id="scheme-diagnostics-detail"
          className="flex flex-col gap-2 border-t border-editor-border px-3 py-2"
        >
          <SchemeViewerDiagnosticsQualityCard
            schemeQualitySummary={schemeQualitySummary}
            canInspectOriginal={canInspectOriginal}
            onInspectOriginal={onInspectOriginal}
            onCopyQualitySummary={onCopyQualitySummary}
            onCopyQualitySnapshot={onCopyQualitySnapshot}
            copyQualitySnapshotTitle={copyQualitySnapshotTitle}
          />

          <SchemeViewerSchemeInfoRow schemeInfo={schemeInfo} />

          <SchemeViewerCommandSummaryPanel commandSummaryInfo={commandSummaryInfo} />
          <SchemeViewerRuntimePlaceholdersPanel
            placeholders={placeholders}
            placeholderGroups={placeholderGroups}
          />

          <SchemeViewerDecodeWarningsPanel decodeWarnings={decodeWarnings} />

          <SchemeViewerParamSectionsPanel paramSections={paramSections} />
          <SchemeViewerParamStagesPanel paramStages={paramStages} />
          <SchemeViewerBase64MetaPanel base64MetaInfo={base64MetaInfo} />
          <SchemeViewerDecodeLayersPanel
            layers={layers}
            decodedContent={decodedContent}
            isJson={isJson}
          />
        </div>
      )}
    </div>
  );
};
