import React from 'react';
import {
  formatSchemeInsightItems,
  type SchemeCommandSummaryInfo,
} from '../utils/schemeMetadata';
import {
  formatSchemeSummaryValue,
  formatSchemeTooltipValue,
} from '../utils/schemeViewerFormatters';

interface SchemeViewerCommandSummaryPanelProps {
  commandSummaryInfo: SchemeCommandSummaryInfo | null;
}

export const SchemeViewerCommandSummaryPanel: React.FC<SchemeViewerCommandSummaryPanelProps> = ({
  commandSummaryInfo,
}) => {
  if (!commandSummaryInfo) return null;

  const nestedCommandInsight = formatSchemeInsightItems('cmd解析', commandSummaryInfo.commandFields);
  const extInsight = formatSchemeInsightItems('ext解析', commandSummaryInfo.extFields);
  const base64SuffixInsight = formatSchemeInsightItems(
    'Base64 后缀',
    commandSummaryInfo.base64SuffixFields,
    6
  );

  return (
    <div data-tour="scheme-command-summary" className="flex items-start gap-2 text-xs">
      <span className="shrink-0 text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 px-2 py-0.5 rounded">
        CMD 结构
      </span>
      <div className="flex flex-wrap gap-1 min-w-0">
        {commandSummaryInfo.commandSchema && (
          <span
            className="bg-editor-bg text-cyan-200 px-2 py-0.5 rounded font-mono max-w-full truncate"
            title={formatSchemeTooltipValue(commandSummaryInfo.commandSchema)}
          >
            cmdSchema={formatSchemeSummaryValue(commandSummaryInfo.commandSchema)}
          </span>
        )}
        {commandSummaryInfo.commandSchemaCount > 0 && (
          <span
            data-tour="scheme-command-schema-count"
            className="bg-editor-bg text-cyan-200 px-2 py-0.5 rounded font-mono"
            title="已从原始 source 对齐出来的 CMD Schema 数量"
          >
            Schema · {commandSummaryInfo.commandSchemaCount}
          </span>
        )}
        {commandSummaryInfo.topCommandSchemas.length > 0 && (
          <span data-tour="scheme-top-command-schemas" className="contents">
            {commandSummaryInfo.topCommandSchemas.map(item => (
              <span
                key={item.schema}
                className="bg-editor-bg text-cyan-100 px-2 py-0.5 rounded font-mono max-w-full truncate"
                title={[
                  item.schema,
                  ...item.paths,
                  ...(item.hasMorePaths ? ['...'] : []),
                ].join('\n')}
              >
                {formatSchemeSummaryValue(item.schema, 42)} ×{item.count}
              </span>
            ))}
          </span>
        )}
        {commandSummaryInfo.paramCount > 0 && (
          <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono">
            cmdParams · {commandSummaryInfo.paramCount}
          </span>
        )}
        {commandSummaryInfo.paramKeys.slice(0, 6).map(key => (
          <span
            key={key}
            className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
            title={formatSchemeTooltipValue(key, 80)}
          >
            {formatSchemeSummaryValue(key, 24)}
          </span>
        ))}
        {commandSummaryInfo.paramKeys.length > 6 && (
          <span className="text-gray-500 px-1 py-0.5">
            +{commandSummaryInfo.paramKeys.length - 6}
          </span>
        )}
        {nestedCommandInsight && (
          <span className="bg-editor-bg text-emerald-300 px-2 py-0.5 rounded font-mono max-w-full truncate" title={nestedCommandInsight}>
            {nestedCommandInsight}
          </span>
        )}
        {extInsight && (
          <span className="bg-editor-bg text-amber-200 px-2 py-0.5 rounded font-mono max-w-full truncate" title={extInsight}>
            {extInsight}
          </span>
        )}
        {base64SuffixInsight && (
          <span className="bg-editor-bg text-emerald-300 px-2 py-0.5 rounded font-mono max-w-full truncate" title={base64SuffixInsight}>
            {base64SuffixInsight}
          </span>
        )}
      </div>
    </div>
  );
};
