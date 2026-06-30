import React from 'react';
import { TransformMode } from '../types';
import type { SmartSuggestionActionId } from '../utils/smartInputSuggestion';

interface ActionPanelAuxiliaryWorkbenchProps {
  activeMode: TransformMode;
  isCollapsed: boolean;
  onSmartSuggestionAction: (actionId: SmartSuggestionActionId) => void;
}

export const ActionPanelAuxiliaryWorkbench: React.FC<ActionPanelAuxiliaryWorkbenchProps> = ({
  activeMode,
  isCollapsed,
  onSmartSuggestionAction,
}) => {
  if (isCollapsed) return null;

  const isDebugActive = activeMode === TransformMode.DEEP_FORMAT;

  return (
    <details data-tour="auxiliary-workbench" className="mt-3 border-t border-editor-border pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-gray-500 transition-colors hover:bg-editor-sidebar hover:text-gray-300">
        <span className="flex min-w-0 items-center gap-1.5">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
          </svg>
          <span className="truncate">更多 / 实验</span>
        </span>
        <span className="truncate text-[10px] font-normal text-gray-600">低频</span>
      </summary>
      <div className="pt-2">
        <button
          type="button"
          data-tour="workbench-debug-recipe"
          onClick={() => onSmartSuggestionAction('response-inspection')}
          aria-pressed={isDebugActive}
          title="低频排查入口：切到嵌套解析并打开 Response 报告"
          className={`min-h-[42px] rounded-lg border px-2 py-1.5 text-left transition-all active:scale-95 ${isDebugActive ? 'border-brand-primary/50 bg-editor-active text-white ring-1 ring-brand-primary/30' : 'border-editor-border bg-editor-sidebar/70 text-gray-300 hover:border-gray-600 hover:bg-editor-hover hover:text-gray-100'}`}
        >
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/10 bg-editor-bg/70 text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold">高级排查</span>
              <span className="mt-0.5 block truncate text-[10px] text-gray-500">低频复盘</span>
            </span>
          </span>
        </button>
      </div>
    </details>
  );
};
