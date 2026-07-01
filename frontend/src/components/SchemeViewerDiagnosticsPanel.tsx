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
import {
  getSchemeQualityClassName,
  getSchemeQualityItemClassName,
} from '../utils/schemeViewerQualityStyles';
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
import { SchemeViewerDecodeLayersPanel } from './SchemeViewerDecodeLayersPanel';
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
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
          aria-expanded={isExpanded}
          aria-controls="scheme-diagnostics-detail"
          title={isExpanded ? '收起 Scheme 解析详情' : '展开 Scheme 解析详情'}
        >
          <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${
            schemeQualitySummary
              ? getSchemeQualityClassName(schemeQualitySummary.level)
              : 'border-editor-border bg-editor-bg text-gray-300'
          }`}>
            {schemeQualitySummary?.label || '解析信息'}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-gray-400 [&::-webkit-scrollbar]:hidden">
            {diagnosticSummaryItems.map(item => (
              <span
                key={item.key}
                className="rounded bg-editor-bg px-2 py-0.5 font-mono text-gray-300"
                title={item.title}
              >
                {item.label}
              </span>
            ))}
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="shrink-0 rounded bg-editor-active px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-border hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
          aria-expanded={isExpanded}
          aria-controls="scheme-diagnostics-detail"
        >
          {isExpanded ? '收起详情' : '展开详情'}
        </button>
      </div>
      {isExpanded && (
        <div
          id="scheme-diagnostics-detail"
          className="flex flex-col gap-2 border-t border-editor-border px-3 py-2"
        >
          {schemeQualitySummary && (
            <div
              data-tour="scheme-quality-summary"
              className={`rounded border px-2.5 py-2 text-xs ${getSchemeQualityClassName(schemeQualitySummary.level)}`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="shrink-0 font-medium">{schemeQualitySummary.label}</span>
                <span className="min-w-0 text-gray-300">{schemeQualitySummary.description}</span>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  {canInspectOriginal && (
                    <button
                      data-tour="scheme-inspect-original"
                      type="button"
                      onClick={onInspectOriginal}
                      className="rounded border border-emerald-500/40 bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-100 transition-colors hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                      title="将原始值送入 SOURCE 并打开深度解析报告"
                      aria-label="用原始值排查，将原始值送入 SOURCE 并打开深度解析报告"
                    >
                      用原始值排查
                    </button>
                  )}
                  <button
                    data-tour="scheme-copy-quality-summary"
                    type="button"
                    onClick={onCopyQualitySummary}
                    className="rounded border border-current/20 px-2 py-0.5 text-xs text-gray-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current/30"
                    title="复制当前 Scheme 解析质量摘要"
                    aria-label="复制质量摘要，复制当前 Scheme 解析质量摘要"
                  >
                    复制摘要
                  </button>
                  <button
                    data-tour="scheme-copy-quality-snapshot"
                    type="button"
                    onClick={onCopyQualitySnapshot}
                    className="rounded border border-current/20 px-2 py-0.5 text-xs text-gray-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current/30"
                    title={copyQualitySnapshotTitle}
                    aria-label={`复制质量快照，${copyQualitySnapshotTitle}`}
                  >
                    复制快照
                  </button>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {schemeQualitySummary.items.map(item => (
                  <span
                    key={item.label}
                    className={`rounded border px-2 py-0.5 font-mono ${getSchemeQualityItemClassName(item.tone)}`}
                  >
                    {item.label} · {item.value}
                  </span>
                ))}
              </div>
            </div>
          )}

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

          {decodeWarnings.length > 0 && (
            <div data-tour="scheme-decode-warnings" className="flex flex-col gap-1.5 text-xs">
              {decodeWarnings.map(warning => (
                <div key={warning.type} className="flex items-start gap-2">
                  <span className="shrink-0 text-amber-300 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
                    性能保护 · 跳过 {warning.skippedCount}
                  </span>
                  <div className="flex flex-wrap gap-1 min-w-0">
                    <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                      {warning.message}
                    </span>
                    {warning.paths.map(itemPath => (
                      <span
                        key={itemPath}
                        className="bg-editor-bg text-amber-100 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={formatSchemeTooltipValue(itemPath)}
                      >
                        {itemPath}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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
