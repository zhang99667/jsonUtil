import React, { useState, useRef, useMemo } from 'react';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { useJsonPathPanelTour } from '../hooks/useJsonPathPanelTour';
import {
    useJsonPathPanelQueryRunner,
    type JsonPathPanelExternalQueryRequest,
} from '../hooks/useJsonPathPanelQueryRunner';
import { useJsonPathSavedQueryLists } from '../hooks/useJsonPathSavedQueryLists';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { JsonPathPanelQueryInput } from './JsonPathPanelQueryInput';
import { JsonPathPanelResultPreview } from './JsonPathPanelResultPreview';
import { JsonPathPanelResultToolbar } from './JsonPathPanelResultToolbar';
import { JsonPathPanelSavedQueries } from './JsonPathPanelSavedQueries';
import { JsonPathPanelStatusMessages } from './JsonPathPanelStatusMessages';
import { JsonPathPanelSuggestions } from './JsonPathPanelSuggestions';
import { JsonPathPanelTitle } from './JsonPathPanelTitle';
import type { HighlightRange } from '../types';
import { copyText } from '../utils/clipboard';
import { showError, showSuccess } from '../utils/toast';
import { getJsonPathScenarioExamples } from '../utils/jsonPathExamples';
import type { JsonPathQueryItem } from '../utils/jsonPathQuery';
import {
    runJsonPathPathValueCopyCommand,
    runJsonPathValueCopyCommand,
} from '../utils/jsonPathPanelCopyCommand';
import { buildJsonPathResultPreviewItems } from '../utils/jsonPathPanelPreviewItems';
import { shouldStopNestedScrollPropagation } from '../utils/nestedScrollPropagation';
import { buildJsonPathPanelUiState } from '../utils/jsonPathPanelUiState';
import {
    getJsonPathResultFocusIndex,
    getJsonPathResultNavigationIndex,
} from '../utils/jsonPathPanelNavigation';

const MAX_VISIBLE_QUERY_RESULTS = 100;
const JSONPATH_ERROR_MESSAGE_ID = 'jsonpath-error-message';
const JSONPATH_RESULT_STATUS_ID = 'jsonpath-result-status';
const JSONPATH_QUERY_BUTTON_DESCRIPTION_ID = 'jsonpath-query-button-description';
const JSONPATH_COPY_COMMAND_EFFECTS = {
    copyText,
    onShowSuccess: showSuccess,
    onShowError: showError,
    onLogWarning: (message: string, error: unknown) => console.warn(message, error),
};

interface JsonPathPanelProps {
    jsonData: string;
    deepFormat?: boolean;
    autoExpandScheme?: boolean;
    isDataPreparing?: boolean;
    externalQueryRequest?: JsonPathPanelExternalQueryRequest | null;
    isOpen: boolean;
    onClose: () => void;
    onHighlightRange: (range: HighlightRange | null) => void;
    onLocateStructure?: (item: JsonPathQueryItem) => void;
}

export const JsonPathPanel: React.FC<JsonPathPanelProps> = ({
    jsonData,
    deepFormat = false,
    autoExpandScheme = false,
    isDataPreparing = false,
    externalQueryRequest = null,
    isOpen,
    onClose,
    onHighlightRange,
    onLocateStructure
}) => {
    const [query, setQuery] = useState<string>('$');
    const normalizedQuery = query.trim();
    const {
        history,
        favorites,
        isCurrentQueryFavorite,
        addHistoryItem,
        clearHistory,
        removeFavorite,
        removeHistoryItem,
        toggleFavorite,
    } = useJsonPathSavedQueryLists(normalizedQuery);

    const {
        queryState,
        clearCancelledQuery,
        focusResult: applyFocusedResult,
        handleCancelQuery,
        handleQuery,
        resetQueryState,
    } = useJsonPathPanelQueryRunner({
        query,
        jsonData,
        deepFormat,
        autoExpandScheme,
        isDataPreparing,
        externalQueryRequest,
        isOpen,
        onSetQuery: setQuery,
        onAddHistoryItem: addHistoryItem,
        onHighlightRange,
    });
    const {
        error,
        queryRanges,
        queryValues,
        queryItems,
        currentResultIndex,
        totalResults,
        isResultLimited,
        resultLimit,
        emptyResultQuery,
        isQuerying,
        cancelledQuery,
    } = queryState;
    const queryInputRef = useRef<HTMLInputElement | null>(null);
    useJsonPathPanelTour(isOpen);

    // 自定义滚动条 Hook
    const {
        scrollContainerRef: historyListRef,
        handleScroll,
        handleMouseDown: handleScrollbarMouseDown,
        thumbSize: thumbHeight,
        thumbOffset: thumbTop,
        showScrollbar,
    } = useCustomScrollbar('vertical', history.length);

    const navigateResult = (direction: 'previous' | 'next') => {
        const nextIndex = getJsonPathResultNavigationIndex({
            currentIndex: currentResultIndex,
            resultCount: queryRanges.length,
            direction,
            isDisabled: isQuerying,
        });
        if (nextIndex === null) return;
        applyFocusedResult(nextIndex);
    };

    const goToPrevious = () => navigateResult('previous');

    const goToNext = () => navigateResult('next');

    // 处理键盘快捷键
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isQuerying) return;

        if (e.key === 'Enter') {
            if (e.shiftKey) {
                e.preventDefault();
                goToPrevious();
            } else if (queryRanges.length > 0) {
                e.preventDefault();
                goToNext();
            } else {
                handleQuery();
            }
        }
    };

    const handleQueryInputChange = (nextQuery: string) => {
        setQuery(nextQuery);
        clearCancelledQuery();
    };

    const clearQueryInput = () => {
        setQuery('');
        resetQueryState();
    };

    const queryResultPreviewItems = useMemo(
        () => buildJsonPathResultPreviewItems(queryItems, MAX_VISIBLE_QUERY_RESULTS),
        [queryItems]
    );
    const scenarioExamples = useMemo(() => getJsonPathScenarioExamples(jsonData), [jsonData]);
    const panelUiState = buildJsonPathPanelUiState({
        normalizedQuery,
        isCurrentQueryFavorite,
        isResultLimited,
        emptyResultQuery,
        cancelledQuery,
        error,
        isQuerying,
        totalResults,
        navigableResultCount: queryRanges.length,
        isDataPreparing,
        hasJsonData: Boolean(jsonData.trim()),
        queryItemsCount: queryItems.length,
        previewItemsCount: queryResultPreviewItems.length,
        errorMessageId: JSONPATH_ERROR_MESSAGE_ID,
        resultStatusId: JSONPATH_RESULT_STATUS_ID,
    });

    const fillAndRunQuery = (queryPath: string) => {
        setQuery(queryPath);
        handleQuery(queryPath);
    };

    const handleNestedScrollWheel = (event: React.WheelEvent<HTMLElement>) => {
        const target = event.currentTarget;
        if (shouldStopNestedScrollPropagation(target.scrollHeight, target.clientHeight)) {
            event.stopPropagation();
        }
    };

    const copyQueryResults = async () => {
        await runJsonPathValueCopyCommand({
            values: queryValues,
            isResultLimited,
        }, JSONPATH_COPY_COMMAND_EFFECTS);
    };

    const copyQueryResultPaths = async () => {
        await runJsonPathPathValueCopyCommand({
            items: queryItems,
            isResultLimited,
        }, JSONPATH_COPY_COMMAND_EFFECTS);
    };

    const focusQueryResult = (index: number) => {
        const focusIndex = getJsonPathResultFocusIndex(index, queryRanges.length, isQuerying);
        if (focusIndex === null) return;

        applyFocusedResult(focusIndex);
    };

    const locateStructureResult = (index: number) => {
        if (!onLocateStructure) return;
        const item = queryItems[index];
        if (!item) return;

        focusQueryResult(index);
        onLocateStructure(item);
        showSuccess('已定位结构导航');
    };

    return (
        <DraggablePanel
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="JSONPath 查询"
            initialFocusRef={queryInputRef}
            title={<JsonPathPanelTitle />}
            icon={PanelIcons.Search}
            storageKey="jsonpath-panel"
            defaultPosition={{ x: 100, y: 100 }}
            defaultSize={{ width: 600, height: 400 }}
            minSize={{ width: 400, height: 300 }}
            dataTour="jsonpath-panel"
        >
            {/* 面板内容 */}
            <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden">
                <JsonPathPanelQueryInput
                    query={query}
                    normalizedQuery={normalizedQuery}
                    isCurrentQueryFavorite={isCurrentQueryFavorite}
                    isQuerying={isQuerying}
                    isDataPreparing={isDataPreparing}
                    error={error}
                    uiState={panelUiState}
                    queryButtonDescriptionId={JSONPATH_QUERY_BUTTON_DESCRIPTION_ID}
                    inputRef={queryInputRef}
                    onQueryChange={handleQueryInputChange}
                    onKeyDown={handleKeyDown}
                    onToggleFavorite={toggleFavorite}
                    onRunQuery={handleQuery}
                    onCancelQuery={handleCancelQuery}
                />

                <JsonPathPanelSavedQueries
                    favorites={favorites}
                    history={history}
                    historyListRef={historyListRef}
                    showHistoryScrollbar={showScrollbar}
                    historyThumbHeight={thumbHeight}
                    historyThumbTop={thumbTop}
                    onSelectQuery={fillAndRunQuery}
                    onRemoveFavorite={removeFavorite}
                    onRemoveHistory={removeHistoryItem}
                    onClearHistory={clearHistory}
                    onHistoryScroll={handleScroll}
                    onNestedWheel={handleNestedScrollWheel}
                    onHistoryScrollbarMouseDown={handleScrollbarMouseDown}
                />

                <JsonPathPanelSuggestions
                    scenarioExamples={scenarioExamples}
                    onSelectQuery={fillAndRunQuery}
                />

                <JsonPathPanelStatusMessages
                    error={error}
                    errorMessageId={JSONPATH_ERROR_MESSAGE_ID}
                    showEmptyResult={panelUiState.showEmptyResult}
                    emptyResultQuery={emptyResultQuery}
                    onClearQuery={clearQueryInput}
                />

                <JsonPathPanelResultToolbar
                    currentResultIndex={currentResultIndex}
                    resultCount={queryRanges.length}
                    isResultLimited={isResultLimited}
                    resultLimit={resultLimit}
                    isQuerying={isQuerying}
                    canCopyValues={queryValues.length > 0}
                    canCopyPathValues={queryItems.length > 0}
                    copyButtonLabel={panelUiState.copyButtonLabel}
                    copyPathValueButtonLabel={panelUiState.copyPathValueButtonLabel}
                    resultStatusId={JSONPATH_RESULT_STATUS_ID}
                    onCopyValues={copyQueryResults}
                    onCopyPathValues={copyQueryResultPaths}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                />

                <JsonPathPanelResultPreview
                    previewItems={queryResultPreviewItems}
                    currentResultIndex={currentResultIndex}
                    hiddenResultCount={panelUiState.hiddenResultCount}
                    maxVisibleResultCount={MAX_VISIBLE_QUERY_RESULTS}
                    copiedResultCount={queryValues.length}
                    isResultLimited={isResultLimited}
                    resultLimit={resultLimit}
                    showLocateStructure={Boolean(onLocateStructure)}
                    onWheel={handleNestedScrollWheel}
                    onFocusResult={focusQueryResult}
                    onLocateStructureResult={locateStructureResult}
                />

                {/* 操作提示 */}
                <div className="mt-3 text-xs text-gray-500 italic">
                    查询结果将显示在右侧 PREVIEW 编辑器中
                </div>
            </div>
        </DraggablePanel>
    );
};
