import React from 'react';
import { JsonPathPanelSavedQueryList } from './JsonPathPanelSavedQueryList';

interface JsonPathPanelSavedQueriesProps {
    favorites: string[];
    history: string[];
    historyListRef: React.Ref<HTMLDivElement>;
    showHistoryScrollbar: boolean;
    historyThumbHeight: number;
    historyThumbTop: number;
    onSelectQuery: (query: string) => void;
    onRemoveFavorite: (query: string) => void;
    onRemoveHistory: (index: number) => void;
    onClearHistory: () => void;
    onHistoryScroll: React.UIEventHandler<HTMLDivElement>;
    onNestedWheel: React.WheelEventHandler<HTMLDivElement>;
    onHistoryScrollbarMouseDown: React.MouseEventHandler<HTMLDivElement>;
}

export const JsonPathPanelSavedQueries: React.FC<JsonPathPanelSavedQueriesProps> = ({
    favorites,
    history,
    historyListRef,
    showHistoryScrollbar,
    historyThumbHeight,
    historyThumbTop,
    onSelectQuery,
    onRemoveFavorite,
    onRemoveHistory,
    onClearHistory,
    onHistoryScroll,
    onNestedWheel,
    onHistoryScrollbarMouseDown,
}) => (
    <>
        {favorites.length > 0 && (
            <div data-tour="jsonpath-favorites" className="mb-3 flex-shrink-0">
                <div className="text-xs text-gray-500 mb-2">常用收藏:</div>
                <JsonPathPanelSavedQueryList
                    items={favorites}
                    tone="favorite"
                    className="space-y-1 max-h-24 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden"
                    dataTour="jsonpath-favorite-item"
                    selectLabelPrefix="填入并查询收藏："
                    removeLabelPrefix="移除收藏："
                    onWheel={onNestedWheel}
                    onSelectQuery={onSelectQuery}
                    onRemoveQuery={onRemoveFavorite}
                />
            </div>
        )}

        {history.length > 0 && (
            <div data-tour="jsonpath-history" className="border-t border-editor-border pt-2 mt-1 flex-shrink-0 relative group/history">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="text-xs text-gray-500">查询历史:</div>
                    <button
                        type="button"
                        onClick={onClearHistory}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        title="清空 JSONPath 查询历史"
                        aria-label="清空 JSONPath 查询历史"
                    >
                        清空
                    </button>
                </div>
                <JsonPathPanelSavedQueryList
                    items={history}
                    tone="history"
                    className="max-h-28 overflow-y-auto overscroll-contain space-y-1 [&::-webkit-scrollbar]:hidden"
                    dataTour="jsonpath-history-item"
                    selectLabelPrefix="填入并查询历史记录："
                    removeLabelPrefix="删除历史记录："
                    listRef={historyListRef}
                    onScroll={onHistoryScroll}
                    onWheel={onNestedWheel}
                    onSelectQuery={onSelectQuery}
                    onRemoveQuery={(_, index) => onRemoveHistory(index)}
                />

                {showHistoryScrollbar && (
                    <div className="absolute right-0 top-[36px] bottom-0 w-[3px] z-10 opacity-0 group-hover/history:opacity-100 transition-opacity duration-200">
                        <div
                            className="w-full bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer relative"
                            style={{
                                height: `${historyThumbHeight}%`,
                                top: `${historyThumbTop}%`,
                            }}
                            onMouseDown={onHistoryScrollbarMouseDown}
                        />
                    </div>
                )}
            </div>
        )}
    </>
);
