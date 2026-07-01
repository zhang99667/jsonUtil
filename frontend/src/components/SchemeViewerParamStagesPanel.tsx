import React from 'react';
import type { SchemeParamDecodeStage } from '../utils/schemeTypes';
import {
  formatSchemeLayerSizeLabel,
  formatSchemeParamStageValue,
  formatSchemeTooltipValue,
  schemeParamStageSourceLabels,
} from '../utils/schemeViewerFormatters';

interface SchemeViewerParamStagesPanelProps {
  paramStages: SchemeParamDecodeStage[];
}

const buildParamStageTitle = (stage: SchemeParamDecodeStage): string => ([
  `${stage.path} (${schemeParamStageSourceLabels[stage.source]})`,
  '',
  'Raw:',
  formatSchemeTooltipValue(stage.raw, 320),
  '',
  'URL Decode:',
  formatSchemeTooltipValue(stage.urlDecoded, 320),
  '',
  'JSON/CMD 解析:',
  formatSchemeTooltipValue(stage.parsed, 320),
  '',
  '重新编码:',
  formatSchemeTooltipValue(stage.reencoded, 320),
  stage.repairHint ? `\n修复提示: ${stage.repairHint}` : '',
].filter(Boolean).join('\n'));

export const SchemeViewerParamStagesPanel: React.FC<SchemeViewerParamStagesPanelProps> = ({
  paramStages,
}) => {
  if (paramStages.length === 0) return null;

  return (
    <div data-tour="scheme-param-stages" className="flex flex-col gap-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 px-2 py-0.5 rounded">
          参数分层 · {paramStages.length}
        </span>
        <span className="text-gray-500">
          Raw → URL Decode → JSON/CMD 解析 → 重新编码
        </span>
      </div>
      <div className="grid gap-1">
        {paramStages.slice(0, 6).map(stage => (
          <div
            key={`${stage.source}:${stage.path}`}
            data-tour="scheme-param-stage"
            className="flex flex-wrap items-center gap-1 rounded border border-editor-border bg-editor-bg/70 px-2 py-1"
            title={buildParamStageTitle(stage)}
          >
            <span className="rounded bg-editor-sidebar px-2 py-0.5 text-cyan-200">
              {schemeParamStageSourceLabels[stage.source]}
            </span>
            <span className="rounded bg-gray-800 px-2 py-0.5 font-mono text-gray-200">
              {stage.path}
            </span>
            <span className="rounded bg-editor-sidebar px-2 py-0.5 font-mono text-gray-300">
              {stage.key}
            </span>
            <span className="text-gray-500">
              {formatSchemeLayerSizeLabel(stage.raw)} → {formatSchemeLayerSizeLabel(stage.parsed)}
            </span>
            {stage.repairHint && (
              <span className="rounded bg-amber-900/30 px-2 py-0.5 text-amber-200">
                {stage.repairHint}
              </span>
            )}
            <span className={stage.reversible
              ? 'rounded bg-emerald-900/20 px-2 py-0.5 text-emerald-200'
              : 'rounded bg-amber-900/30 px-2 py-0.5 text-amber-200'}
            >
              {stage.reversible ? '可重新编码' : '需确认'}
            </span>
            <span className="min-w-0 truncate text-gray-500">
              {formatSchemeParamStageValue(stage.urlDecoded)}
            </span>
          </div>
        ))}
        {paramStages.length > 6 && (
          <div className="text-xs text-gray-500">
            还有 {paramStages.length - 6} 个参数分层未展示
          </div>
        )}
      </div>
    </div>
  );
};
