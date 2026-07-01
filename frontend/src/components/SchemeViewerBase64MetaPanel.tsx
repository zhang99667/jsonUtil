import React from 'react';
import {
  formatBase64MetaDisplayValue,
  type Base64MetaInfo,
} from '../utils/schemeMetadata';
import { formatSchemeTooltipValue } from '../utils/schemeViewerFormatters';

interface SchemeViewerBase64MetaPanelProps {
  base64MetaInfo: Base64MetaInfo | null;
}

export const SchemeViewerBase64MetaPanel: React.FC<SchemeViewerBase64MetaPanelProps> = ({
  base64MetaInfo,
}) => {
  if (!base64MetaInfo) return null;

  return (
    <div data-tour="scheme-base64-meta" className="flex items-start gap-2 text-xs">
      <span className="shrink-0 text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 px-2 py-0.5 rounded">
        内部 Base64
      </span>
      <div className="flex flex-wrap gap-1 min-w-0">
        {base64MetaInfo.prefix && (
          <span
            className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
            title={formatSchemeTooltipValue(base64MetaInfo.prefix)}
          >
            头部={formatBase64MetaDisplayValue(base64MetaInfo.prefix, 24)}
          </span>
        )}
        {base64MetaInfo.suffix && (
          <span
            className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
            title={formatSchemeTooltipValue(base64MetaInfo.suffix)}
          >
            后缀={formatBase64MetaDisplayValue(base64MetaInfo.suffix, 32)}
          </span>
        )}
        {base64MetaInfo.suffixDecodePrefix && (
          <span
            className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
            title={formatSchemeTooltipValue(base64MetaInfo.suffixDecodePrefix)}
          >
            跳过={formatBase64MetaDisplayValue(base64MetaInfo.suffixDecodePrefix, 16)}
          </span>
        )}
        {base64MetaInfo.suffixDecodedEntries.slice(0, 6).map(entry => (
          <span
            key={entry.key}
            className="bg-editor-bg text-emerald-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
            title={`${entry.key}=${formatSchemeTooltipValue(entry.displayValue)}`}
          >
            {entry.key}={entry.displayValue}
          </span>
        ))}
        {base64MetaInfo.suffixDecodedCount > 6 && (
          <span className="text-gray-500 px-1 py-0.5">
            +{base64MetaInfo.suffixDecodedCount - 6}
          </span>
        )}
        {base64MetaInfo.suffix && (
          <span className="text-gray-500 px-1 py-0.5">
            {base64MetaInfo.suffixLength} 字符
          </span>
        )}
      </div>
    </div>
  );
};
