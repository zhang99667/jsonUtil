import React from 'react';
import {
  getSchemeViewerParamCount,
  getSchemeViewerParamEntries,
  type SchemeViewerParamSection,
} from '../utils/schemeViewerDiagnostics';
import {
  formatSchemeParamTooltipValue,
  formatSchemeParamValue,
} from '../utils/schemeViewerFormatters';

interface SchemeViewerParamSectionsPanelProps {
  paramSections: SchemeViewerParamSection[];
}

export const SchemeViewerParamSectionsPanel: React.FC<SchemeViewerParamSectionsPanelProps> = ({
  paramSections,
}) => {
  if (paramSections.length === 0) return null;

  return (
    <div data-tour="scheme-param-sections" className="flex flex-col gap-1.5">
      {paramSections.map(section => {
        const entries = getSchemeViewerParamEntries(section.params);

        return (
          <div key={section.title} className="flex items-start gap-2 text-xs">
            <span className="shrink-0 text-gray-500 bg-editor-bg px-2 py-0.5 rounded">
              {section.title} · {getSchemeViewerParamCount(section.params)}
            </span>
            <div className="flex flex-wrap gap-1 min-w-0">
              {entries.slice(0, 6).map(([key, paramValue]) => (
                <span
                  key={key}
                  className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                  title={`${key}=${formatSchemeParamTooltipValue(paramValue)}`}
                >
                  {key}={formatSchemeParamValue(paramValue)}
                </span>
              ))}
              {entries.length > 6 && (
                <span className="text-gray-500 px-1 py-0.5">
                  +{entries.length - 6}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
