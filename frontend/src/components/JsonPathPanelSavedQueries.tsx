import React from 'react';

type SavedQueryTone = 'favorite' | 'history';

interface SavedQueryRowProps {
    item: string;
    tone: SavedQueryTone;
    dataTour: string;
    selectLabel: string;
    removeLabel: string;
    onSelect: () => void;
    onRemove: () => void;
}

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

const getSavedQueryButtonClassName = (tone: SavedQueryTone) => (
    tone === 'favorite'
        ? 'w-full text-left text-xs px-2 py-1.5 bg-editor-bg text-amber-100 rounded hover:bg-editor-hover transition-colors font-mono truncate pr-7 border border-amber-500/20'
        : 'w-full text-left text-xs px-2 py-1.5 bg-editor-bg text-gray-300 rounded hover:bg-editor-hover transition-colors font-mono truncate pr-7'
);

const SavedQueryRow: React.FC<SavedQueryRowProps> = ({
    item,
    tone,
    dataTour,
    selectLabel,
    removeLabel,
    onSelect,
    onRemove,
}) => (
    <div className="relative group">
        <button
            type="button"
            data-tour={dataTour}
            onClick={onSelect}
            className={getSavedQueryButtonClassName(tone)}
            title={`${item}\n点击填入并查询`}
            aria-label={selectLabel}
        >
            {item}
        </button>
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                onRemove();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-editor-active opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 transition-all"
            title={removeLabel}
            aria-label={removeLabel}
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
);

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
                <div
                    onWheel={onNestedWheel}
                    className="space-y-1 max-h-24 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden"
                >
                    {favorites.map(item => (
                        <SavedQueryRow
                            key={item}
                            item={item}
                            tone="favorite"
                            dataTour="jsonpath-favorite-item"
                            selectLabel={`填入并查询收藏：${item}`}
                            removeLabel={`移除收藏：${item}`}
                            onSelect={() => onSelectQuery(item)}
                            onRemove={() => onRemoveFavorite(item)}
                        />
                    ))}
                </div>
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
                <div
                    ref={historyListRef}
                    onScroll={onHistoryScroll}
                    onWheel={onNestedWheel}
                    className="max-h-28 overflow-y-auto overscroll-contain space-y-1 [&::-webkit-scrollbar]:hidden"
                >
                    {history.map((item, index) => (
                        <SavedQueryRow
                            key={index}
                            item={item}
                            tone="history"
                            dataTour="jsonpath-history-item"
                            selectLabel={`填入并查询历史记录：${item}`}
                            removeLabel={`删除历史记录：${item}`}
                            onSelect={() => onSelectQuery(item)}
                            onRemove={() => onRemoveHistory(index)}
                        />
                    ))}
                </div>

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
