import React from 'react';
import { TransformMode, ActionType } from '../types';
import { useFeatureTour } from '../hooks/useFeatureTour';
import { useActionPanelScrollbar } from '../hooks/useActionPanelScrollbar';
import { ActionPanelAuxiliaryWorkbench } from './ActionPanelAuxiliaryWorkbench';
import { ActionPanelFileOperations } from './ActionPanelFileOperations';
import { ActionPanelHeader } from './ActionPanelHeader';
import {
  ActionPanelPanelGroup,
  type ActionPanelPanelStateById,
} from './ActionPanelPanelGroup';
import { ActionPanelScrollbar } from './ActionPanelScrollbar';
import { ActionPanelSettingsButton } from './ActionPanelSettingsButton';
import { ActionPanelSmartSuggestion } from './ActionPanelSmartSuggestion';
import { ActionPanelToolGroups } from './ActionPanelToolGroups';
import { getActionPanelModeFeatureTour } from '../utils/actionPanelModeFeatureTour';
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
    scrollbarViewState,
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
    const featureId = getActionPanelModeFeatureTour(mode);
    if (featureId) {
      triggerFeatureFirstUse(featureId);
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

        <ActionPanelSettingsButton
          isCollapsed={isCollapsed}
          onOpenSettings={onOpenSettings}
        />
      </div>

      <ActionPanelScrollbar
        {...scrollbarViewState}
        onMouseDown={handleScrollbarMouseDown}
      />
    </div>
  );
};
