import React from 'react';
import { TransformMode, ActionType } from '../types';
import { useFeatureTour, FeatureId } from '../hooks/useFeatureTour';
import { useActionPanelScrollbar } from '../hooks/useActionPanelScrollbar';
import { ActionPanelAuxiliaryWorkbench } from './ActionPanelAuxiliaryWorkbench';
import { ActionPanelFileOperations } from './ActionPanelFileOperations';
import { ActionPanelPanelIcon } from './ActionPanelPanelIcon';
import { ActionPanelPanelButton } from './ActionPanelPanelButton';
import { ActionPanelSmartSuggestion } from './ActionPanelSmartSuggestion';
import { ActionPanelToolIcon } from './ActionPanelToolIcon';
import { ActionPanelToolButton } from './ActionPanelToolButton';
import { ACTION_PANEL_PANEL_GROUP, type ActionPanelPanelItemId } from '../utils/actionPanelPanelItems';
import { ACTION_PANEL_TOOL_GROUPS } from '../utils/actionPanelToolGroups';
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
  const panelStateById: Record<ActionPanelPanelItemId, { isOpen: boolean; onClick: () => void }> = {
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
        {/* 侧边栏顶部栏 */}
        <div className={`px-2 mb-6 mt-1 pb-4 border-b border-editor-border flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="text-sm font-bold text-gray-200 tracking-wide flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              JSON 工具箱
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? '展开工具栏' : '折叠工具栏'}
            aria-controls="action-panel-content"
            aria-expanded={!isCollapsed}
            className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-editor-border transition-colors"
            title={isCollapsed ? "展开" : "折叠"}
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            )}
          </button>
        </div>

        <ActionPanelSmartSuggestion
          smartSuggestion={smartSuggestion}
          smartSuggestionOrigin={smartSuggestionOrigin}
          isCollapsed={isCollapsed}
          onSmartSuggestionAction={onSmartSuggestionAction}
        />

        {ACTION_PANEL_TOOL_GROUPS.map((group, index) => (
          <React.Fragment key={group.id}>
            {!isCollapsed && (
              <div className={`px-2 text-[10px] font-bold text-editor-fg-dim uppercase tracking-wider mb-2 ${index === 0 ? 'mt-2' : ''}`}>
                {group.title}
              </div>
            )}
            <div className="mb-4">
              {group.items.map(item => (
                <React.Fragment key={item.mode}>
                  <ActionPanelToolButton
                    mode={item.mode}
                    label={item.label}
                    icon={<ActionPanelToolIcon iconId={item.iconId} />}
                    colorClass={item.colorClass}
                    dataTour={item.dataTour}
                    isActive={activeMode === item.mode}
                    isCollapsed={isCollapsed}
                    onClick={handleModeChange}
                  />
                </React.Fragment>
              ))}
            </div>
          </React.Fragment>
        ))}

        <div className="flex-1"></div>

        {/* 工具组：查询与解析工具 */}
        {!isCollapsed && (
          <div className="px-2 text-[10px] font-bold text-editor-fg-dim uppercase tracking-wider mb-2">
            {ACTION_PANEL_PANEL_GROUP.title}
          </div>
        )}
        <div className="mb-4">
          {ACTION_PANEL_PANEL_GROUP.items.map(item => {
            const panelState = panelStateById[item.id];

            return (
              <React.Fragment key={item.id}>
                <ActionPanelPanelButton
                  label={item.label}
                  icon={<ActionPanelPanelIcon iconId={item.iconId} />}
                  iconClass={item.iconClass}
                  hoverIconClass={item.hoverIconClass}
                  isOpen={panelState.isOpen}
                  isCollapsed={isCollapsed}
                  onClick={panelState.onClick}
                  dataTour={item.dataTour}
                />
              </React.Fragment>
            );
          })}
        </div>

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

      {/* 自定义垂直滚动条 */}
      {showScrollbar && (
        <div className="absolute right-0 top-0 bottom-0 w-[10px] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
          <div
            className="absolute right-[2px] w-[6px] bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer"
            style={{
              height: `${thumbHeight}%`,
              top: `${thumbTop}%`
            }}
            onMouseDown={handleScrollbarMouseDown}
          />
        </div>
      )}
    </div>
  );
};
