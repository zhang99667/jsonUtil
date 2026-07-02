import React from 'react';
import type { SmartInputSuggestion } from '../utils/smartInputSuggestion';
import { ActionPanelSmartSuggestionIcon } from './ActionPanelSmartSuggestionIcon';

interface ActionPanelSmartSuggestionHeaderProps {
  smartSuggestion: SmartInputSuggestion;
  originLabel: string;
}

export const ActionPanelSmartSuggestionHeader: React.FC<ActionPanelSmartSuggestionHeaderProps> = ({
  smartSuggestion,
  originLabel,
}) => (
  <div className="mb-2 flex items-start gap-2">
    <ActionPanelSmartSuggestionIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <div className="truncate text-xs font-semibold" title={smartSuggestion.title}>
          {smartSuggestion.title}
        </div>
        {originLabel && (
          <span
            data-tour="smart-action-origin"
            className="flex-shrink-0 rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white/90"
            title="来自本次手动粘贴后的剪贴板内容识别"
          >
            {originLabel}
          </span>
        )}
      </div>
      <div className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-gray-300" title={smartSuggestion.description}>
        {smartSuggestion.description}
      </div>
    </div>
  </div>
);
