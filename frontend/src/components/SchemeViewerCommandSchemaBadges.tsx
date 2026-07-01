import React from 'react';
import type { SchemeCommandSummaryInfo } from '../utils/schemeMetadata';
import {
  formatSchemeSummaryValue,
  formatSchemeTooltipValue,
} from '../utils/schemeViewerFormatters';

type SchemeViewerCommandSchemaBadgesProps = Pick<
  SchemeCommandSummaryInfo,
  'commandSchema' | 'commandSchemaCount' | 'topCommandSchemas'
>;

export const SchemeViewerCommandSchemaBadges: React.FC<SchemeViewerCommandSchemaBadgesProps> = ({
  commandSchema,
  commandSchemaCount,
  topCommandSchemas,
}) => (
  <>
    {commandSchema && (
      <span
        className="bg-editor-bg text-cyan-200 px-2 py-0.5 rounded font-mono max-w-full truncate"
        title={formatSchemeTooltipValue(commandSchema)}
      >
        cmdSchema={formatSchemeSummaryValue(commandSchema)}
      </span>
    )}
    {commandSchemaCount > 0 && (
      <span
        data-tour="scheme-command-schema-count"
        className="bg-editor-bg text-cyan-200 px-2 py-0.5 rounded font-mono"
        title="已从原始 source 对齐出来的 CMD Schema 数量"
      >
        Schema · {commandSchemaCount}
      </span>
    )}
    {topCommandSchemas.length > 0 && (
      <span data-tour="scheme-top-command-schemas" className="contents">
        {topCommandSchemas.map(item => (
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
  </>
);
