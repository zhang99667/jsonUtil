import React from 'react';
import type { SchemeDecodeResult } from '../utils/schemeTypes';
import { formatSchemeTooltipValue } from '../utils/schemeViewerFormatters';

interface SchemeViewerSchemeInfoRowProps {
  schemeInfo: SchemeDecodeResult['schemeInfo'];
}

export const SchemeViewerSchemeInfoRow: React.FC<SchemeViewerSchemeInfoRowProps> = ({ schemeInfo }) => {
  if (!schemeInfo) return null;

  return (
    <div
      data-tour="scheme-info-row"
      className="flex items-center gap-2 flex-wrap"
    >
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
        <span
          className="bg-editor-bg text-gray-400 px-2 py-0.5 rounded text-xs truncate max-w-[200px]"
          title={formatSchemeTooltipValue(schemeInfo.path)}
        >
          {schemeInfo.path}
        </span>
      )}
    </div>
  );
};
