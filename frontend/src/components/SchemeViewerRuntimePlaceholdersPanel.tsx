import React from 'react';
import type {
  SchemePlaceholder,
  SchemePlaceholderGroup,
} from '../utils/schemeTypes';
import {
  formatSchemePlaceholderValue,
  formatSchemeTooltipValue,
} from '../utils/schemeViewerFormatters';

interface SchemeViewerRuntimePlaceholdersPanelProps {
  placeholders: SchemePlaceholder[];
  placeholderGroups: SchemePlaceholderGroup[];
}

export const SchemeViewerRuntimePlaceholdersPanel: React.FC<SchemeViewerRuntimePlaceholdersPanelProps> = ({
  placeholders,
  placeholderGroups,
}) => {
  if (placeholders.length === 0) return null;

  return (
    <div data-tour="scheme-runtime-placeholders" className="flex flex-col gap-1.5 text-xs">
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-amber-300 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
          运行时占位符 · {placeholders.length}
        </span>
        <div data-tour="scheme-runtime-placeholder-groups" className="flex flex-wrap gap-1 min-w-0">
          {placeholderGroups.map(group => (
            <span
              key={group.value}
              className="bg-editor-bg text-amber-100 px-2 py-0.5 rounded font-mono max-w-full truncate"
              title={`${group.description}\n${group.paths.slice(0, 8).join('\n')}`}
            >
              {group.value} ×{group.count}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-amber-300 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
          路径明细
        </span>
        <div className="flex flex-wrap gap-1 min-w-0">
          {placeholders.slice(0, 6).map(placeholder => (
            <span
              key={`${placeholder.path}:${placeholder.value}`}
              className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
              title={`${placeholder.path} = ${formatSchemeTooltipValue(placeholder.value)}\n${placeholder.description}`}
            >
              {placeholder.path}={formatSchemePlaceholderValue(placeholder.value)}
            </span>
          ))}
          {placeholders.length > 6 && (
            <span className="text-gray-500 px-1 py-0.5">
              +{placeholders.length - 6}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
