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
import { formatSchemeTooltipValue } from '../utils/schemeViewerFormatters';
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

          {schemeInfo && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Scheme:
              </span>
              <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded font-mono text-xs">
                {schemeInfo.protocol}
              </span>
              {schemeInfo.host && (
                <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded text-xs">{schemeInfo.host}</span>
              )}
              {schemeInfo.path && (
                <span className="bg-editor-bg text-gray-400 px-2 py-0.5 rounded text-xs truncate max-w-[200px]" title={formatSchemeTooltipValue(schemeInfo.path)}>
                  {schemeInfo.path}
                </span>
              )}
            </div>
          )}

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
