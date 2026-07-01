import React from 'react';
import type { SchemeCommandSummaryInfo } from '../utils/schemeMetadata';
import {
  formatSchemeSummaryValue,
  formatSchemeTooltipValue,
} from '../utils/schemeViewerFormatters';

type SchemeViewerCommandParamBadgesProps = Pick<
  SchemeCommandSummaryInfo,
  'paramCount' | 'paramKeys'
>;

export const SchemeViewerCommandParamBadges: React.FC<SchemeViewerCommandParamBadgesProps> = ({
  paramCount,
  paramKeys,
}) => (
  <>
    {paramCount > 0 && (
      <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono">
        cmdParams · {paramCount}
      </span>
    )}
    {paramKeys.slice(0, 6).map(key => (
      <span
        key={key}
        className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
        title={formatSchemeTooltipValue(key, 80)}
      >
        {formatSchemeSummaryValue(key, 24)}
      </span>
    ))}
    {paramKeys.length > 6 && (
      <span className="text-gray-500 px-1 py-0.5">
        +{paramKeys.length - 6}
      </span>
    )}
  </>
);
