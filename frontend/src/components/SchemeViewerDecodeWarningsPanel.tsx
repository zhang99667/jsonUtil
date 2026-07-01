import React from 'react';
import { formatSchemeTooltipValue } from '../utils/schemeViewerFormatters';
import type { SchemeDecodeWarning } from '../utils/schemeTypes';

interface SchemeViewerDecodeWarningsPanelProps {
  decodeWarnings: SchemeDecodeWarning[];
}

export const SchemeViewerDecodeWarningsPanel: React.FC<SchemeViewerDecodeWarningsPanelProps> = ({
  decodeWarnings,
}) => {
  if (decodeWarnings.length === 0) return null;

  return (
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
  );
};
