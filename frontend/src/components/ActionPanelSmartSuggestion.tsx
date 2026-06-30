import React from 'react';
import {
  getActionPanelSmartSuggestionOriginLabel,
  getActionPanelSmartSuggestionToneClassName,
  getVisibleActionPanelSmartSuggestionActions,
} from '../utils/actionPanelSmartSuggestionState';
import type { SmartInputSuggestion, SmartSuggestionActionId } from '../utils/smartInputSuggestion';

interface ActionPanelSmartSuggestionProps {
  smartSuggestion: SmartInputSuggestion | null;
  smartSuggestionOrigin?: 'clipboard' | null;
  isCollapsed: boolean;
  onSmartSuggestionAction: (actionId: SmartSuggestionActionId) => void;
}

export const ActionPanelSmartSuggestion: React.FC<ActionPanelSmartSuggestionProps> = ({
  smartSuggestion,
  smartSuggestionOrigin = null,
  isCollapsed,
  onSmartSuggestionAction,
}) => {
  if (!smartSuggestion) return null;

  const primaryAction = smartSuggestion.actions[0];
  if (!primaryAction) return null;

  const originLabel = getActionPanelSmartSuggestionOriginLabel(smartSuggestionOrigin);
  const toneClassName = getActionPanelSmartSuggestionToneClassName(smartSuggestion.tone);

  if (isCollapsed) {
    return (
      <button
        data-tour="smart-action-suggestion"
        onClick={() => onSmartSuggestionAction(primaryAction.id)}
        aria-label={`智能建议：${originLabel ? `${originLabel}，` : ''}${smartSuggestion.title}，${primaryAction.label}`}
        title={`${originLabel ? `${originLabel}：` : ''}${smartSuggestion.title}：${primaryAction.label}`}
        className={`mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border transition-all hover:bg-editor-hover active:scale-95 ${toneClassName}`}
      >
        <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21l3-1.5L15 21l-.75-4M4 5h16M5 9h14M7 13h10" />
        </svg>
      </button>
    );
  }

  const visibleActions = getVisibleActionPanelSmartSuggestionActions(smartSuggestion);

  return (
    <div
      data-tour="smart-action-suggestion"
      className={`mb-4 rounded-lg border p-3 shadow-sm ${toneClassName}`}
    >
      <div className="mb-2 flex items-start gap-2">
        <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21l3-1.5L15 21l-.75-4M4 5h16M5 9h14M7 13h10" />
        </svg>
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
      <div className="grid grid-cols-2 gap-1.5">
        {visibleActions.map((action, index) => (
          <button
            key={action.id}
            data-tour={`smart-action-${action.id}`}
            onClick={() => onSmartSuggestionAction(action.id)}
            aria-label={`智能建议动作 ${index + 1}: ${action.label}`}
            className={`min-w-0 rounded border border-white/10 bg-editor-bg/70 px-2 py-1.5 text-[11px] font-medium text-gray-100 transition-colors hover:border-white/20 hover:bg-editor-active active:scale-95 ${visibleActions.length === 3 && index === 2 ? 'col-span-2' : ''}`}
            title={action.label}
          >
            <span className="block truncate">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
