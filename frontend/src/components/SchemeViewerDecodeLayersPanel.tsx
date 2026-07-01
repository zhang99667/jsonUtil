import React from 'react';
import type { DecodeLayer } from '../utils/schemeTypes';
import {
  formatSchemeLayerSizeLabel,
  formatSchemeTooltipValue,
  getSchemeLayerAfterContent,
  getSchemeLayerReversibleLabel,
  schemeLayerTypeLabels,
} from '../utils/schemeViewerFormatters';

interface SchemeViewerDecodeLayersPanelProps {
  layers: DecodeLayer[];
  decodedContent: string;
  isJson: boolean;
}

const buildDecodeLayerTitle = (
  layers: DecodeLayer[],
  index: number,
  decodedContent: string
): string => {
  const layer = layers[index];
  const afterContent = getSchemeLayerAfterContent(layers, index, decodedContent);

  return [
    layer.description,
    `输入: ${formatSchemeLayerSizeLabel(layer.before)}`,
    `输出: ${formatSchemeLayerSizeLabel(afterContent)}`,
    `类型: ${schemeLayerTypeLabels[layer.type]}`,
    `模式: ${getSchemeLayerReversibleLabel(layer)}`,
    '',
    '输入预览:',
    formatSchemeTooltipValue(layer.before, 260),
    '',
    '输出预览:',
    formatSchemeTooltipValue(afterContent || '', 260),
  ].join('\n');
};

export const SchemeViewerDecodeLayersPanel: React.FC<SchemeViewerDecodeLayersPanelProps> = ({
  layers,
  decodedContent,
  isJson,
}) => {
  if (layers.length === 0) return null;

  return (
    <div data-tour="scheme-decode-layers" className="flex flex-col gap-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          解析链路 · {layers.length} 层
        </span>
        <span className="rounded bg-editor-bg px-2 py-0.5 font-mono text-gray-400">
          原始 → {isJson ? 'JSON' : '文本'}
        </span>
      </div>
      <div className="grid gap-1">
        {layers.map((layer, index) => {
          const afterContent = getSchemeLayerAfterContent(layers, index, decodedContent);

          return (
            <div
              key={`${layer.type}:${index}:${layer.description}`}
              data-tour="scheme-decode-layer"
              className="flex flex-wrap items-center gap-1 rounded border border-editor-border bg-editor-bg/70 px-2 py-1"
              title={buildDecodeLayerTitle(layers, index, decodedContent)}
            >
              <span className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-gray-300">
                {index + 1}
              </span>
              <span className="rounded bg-emerald-900/40 px-2 py-0.5 font-medium text-emerald-300">
                {layer.description}
              </span>
              <span className="rounded bg-editor-sidebar px-2 py-0.5 font-mono text-cyan-200">
                {schemeLayerTypeLabels[layer.type]}
              </span>
              <span className={layer.reversible === false
                ? 'rounded bg-amber-900/30 px-2 py-0.5 text-amber-200'
                : 'rounded bg-emerald-900/20 px-2 py-0.5 text-emerald-200'}
              >
                {getSchemeLayerReversibleLabel(layer)}
              </span>
              <span className="text-gray-500">
                {formatSchemeLayerSizeLabel(layer.before)} → {formatSchemeLayerSizeLabel(afterContent)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
