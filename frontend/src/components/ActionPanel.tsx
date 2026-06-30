import React from 'react';
import { TransformMode, ActionType } from '../types';
import { useFeatureTour, FeatureId } from '../hooks/useFeatureTour';
import { useActionPanelScrollbar } from '../hooks/useActionPanelScrollbar';
import { ActionPanelAuxiliaryWorkbench } from './ActionPanelAuxiliaryWorkbench';
import { ActionPanelFileOperations } from './ActionPanelFileOperations';
import { ActionPanelHeader } from './ActionPanelHeader';
import {
  ActionPanelPanelGroup,
  type ActionPanelPanelStateById,
} from './ActionPanelPanelGroup';
import { ActionPanelScrollbar } from './ActionPanelScrollbar';
import { ActionPanelSmartSuggestion } from './ActionPanelSmartSuggestion';
import { ActionPanelToolGroups } from './ActionPanelToolGroups';
import type { SmartInputSuggestion, SmartSuggestionActionId } from '../utils/smartInputSuggestion';

export interface ActionPanelProps {
  activeMode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
  onAction: (action: ActionType) => void;
  isProcessing: boolean;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isJsonPathOpen: boolean;
  isJsonTreeOpen: boolean;
  isJsonCompareOpen: boolean;
  isSchemeDecodeOpen: boolean;
  isTemplateFillOpen: boolean;
  isJsonSchemaOpen: boolean;
  onToggleJsonPath: () => void;
  onToggleJsonTree: () => void;
  onToggleJsonCompare: () => void;
  onToggleSchemeDecode: () => void;
  onToggleTemplateFill: () => void;
  onToggleJsonSchema: () => void;
  smartSuggestion: SmartInputSuggestion | null;
  smartSuggestionOrigin?: 'clipboard' | null;
  onSmartSuggestionAction: (actionId: SmartSuggestionActionId) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  activeMode,
  onModeChange,
  onAction,
  isProcessing,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
  isJsonPathOpen,
  isJsonTreeOpen,
  isJsonCompareOpen,
  isSchemeDecodeOpen,
  isTemplateFillOpen,
  isJsonSchemaOpen,
  onToggleJsonPath,
  onToggleJsonTree,
  onToggleJsonCompare,
  onToggleSchemeDecode,
  onToggleTemplateFill,
  onToggleJsonSchema,
  smartSuggestion,
  smartSuggestionOrigin = null,
  onSmartSuggestionAction
}) => {
  // 功能级引导
  const { triggerFeatureFirstUse, refreshTour } = useFeatureTour();
  const {
    containerRef,
    handleScroll,
    handleScrollbarMouseDown,
    showScrollbar,
    thumbHeight,
    thumbTop,
  } = useActionPanelScrollbar({
    isCollapsed,
    onScrollFrame: refreshTour,
  });
  const panelStateById: ActionPanelPanelStateById = {
    jsonPath: { isOpen: isJsonPathOpen, onClick: onToggleJsonPath },
    jsonCompare: { isOpen: isJsonCompareOpen, onClick: onToggleJsonCompare },
    jsonTree: { isOpen: isJsonTreeOpen, onClick: onToggleJsonTree },
    jsonSchema: { isOpen: isJsonSchemaOpen, onClick: onToggleJsonSchema },
    scheme: { isOpen: isSchemeDecodeOpen, onClick: onToggleSchemeDecode },
    template: { isOpen: isTemplateFillOpen, onClick: onToggleTemplateFill },
  };

  // 处理模式切换并触发功能引导
  const handleModeChange = (mode: TransformMode) => {
    // 触发相应的功能引导
    if (mode === TransformMode.DEEP_FORMAT) {
      triggerFeatureFirstUse(FeatureId.DEEP_FORMAT);
    } else if (mode === TransformMode.ESCAPE || mode === TransformMode.UNESCAPE) {
      triggerFeatureFirstUse(FeatureId.ESCAPE);
    } else if (mode === TransformMode.UNICODE_TO_CN || mode === TransformMode.CN_TO_UNICODE) {
      triggerFeatureFirstUse(FeatureId.UNICODE_CONVERT);
    }

    // 调用原始的 onModeChange
    onModeChange(mode);
  };

  // 自动触发发现式引导 - 已移除 (根据用户反馈，仅在点击时触发或在主引导中介绍)
  // 之前的 IntersectionObserver 逻辑已删除，恢复为被动触发模式
  return (
    <div className="h-full bg-editor-bg border-r border-editor-bg relative group/sidebar">
      {/* ... (container and top bar unchanged) ... */}
      <div
        id="action-panel-content"
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full flex flex-col p-3 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-hide"
      >
        <ActionPanelHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />

        <ActionPanelSmartSuggestion
          smartSuggestion={smartSuggestion}
          smartSuggestionOrigin={smartSuggestionOrigin}
          isCollapsed={isCollapsed}
          onSmartSuggestionAction={onSmartSuggestionAction}
        />

        <ActionPanelToolGroups
          activeMode={activeMode}
          isCollapsed={isCollapsed}
          onModeChange={handleModeChange}
        />

        <div className="flex-1"></div>

        <ActionPanelPanelGroup
          isCollapsed={isCollapsed}
          panelStateById={panelStateById}
        />

        <ActionPanelFileOperations
          isCollapsed={isCollapsed}
          isProcessing={isProcessing}
          onAction={onAction}
        />

        <ActionPanelAuxiliaryWorkbench
          activeMode={activeMode}
          isCollapsed={isCollapsed}
          onSmartSuggestionAction={onSmartSuggestionAction}
        />

        {/* 设置入口 */}
        <div className="pt-4 mt-auto">
          <button
            data-tour="settings"
            onClick={onOpenSettings}
            aria-label="设置"
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-editor-sidebar"
            title="设置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {!isCollapsed && <span className="text-xs">设置</span>}
          </button>

        </div>
      </div>

      <ActionPanelScrollbar
        showScrollbar={showScrollbar}
        thumbHeight={thumbHeight}
        thumbTop={thumbTop}
        onMouseDown={handleScrollbarMouseDown}
      />
    </div>
  );
};
