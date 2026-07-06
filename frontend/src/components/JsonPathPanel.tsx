import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from 'react';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { useJsonPathPanelTour } from '../hooks/useJsonPathPanelTour';
import { useJsonPathSavedQueryLists } from '../hooks/useJsonPathSavedQueryLists';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { JsonPathPanelQueryInput } from './JsonPathPanelQueryInput';
import { JsonPathPanelResultPreview } from './JsonPathPanelResultPreview';
import { JsonPathPanelResultToolbar } from './JsonPathPanelResultToolbar';
import { JsonPathPanelSavedQueries } from './JsonPathPanelSavedQueries';
import { JsonPathPanelStatusMessages } from './JsonPathPanelStatusMessages';
import { JsonPathPanelSuggestions } from './JsonPathPanelSuggestions';
import type { HighlightRange } from '../types';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { showError, showSuccess } from '../utils/toast';
import { getJsonPathScenarioExamples } from '../utils/jsonPathExamples';
import type { JsonPathQueryItem } from '../utils/jsonPathQuery';
import { normalizeJsonPathQueryInput } from '../utils/jsonPathInput';
import {
    formatJsonPathItemsForCopy,
    formatJsonPathValuesForCopy,
    getJsonPathCopyCountLabel,
} from '../utils/jsonPathPanelCopy';
import { buildJsonPathResultPreviewItems } from '../utils/jsonPathPanelPreviewItems';
import { shouldStopNestedScrollPropagation } from '../utils/nestedScrollPropagation';
import {
    getDurationBucket,
    getTextSizeBucket,
    trackToolEvent,
    type ToolEventStatus,
} from '../utils/productTelemetry';
import {
    initialJsonPathPanelQueryState,
    jsonPathPanelQueryStateReducer,
} from '../utils/jsonPathPanelQueryState';
import { buildJsonPathPanelUiState } from '../utils/jsonPathPanelUiState';
import {
    getJsonPathResultFocusIndex,
    getJsonPathResultNavigationIndex,
} from '../utils/jsonPathPanelNavigation';

const MAX_VISIBLE_QUERY_RESULTS = 100;
const JSONPATH_ERROR_MESSAGE_ID = 'jsonpath-error-message';
const JSONPATH_RESULT_STATUS_ID = 'jsonpath-result-status';
const JSONPATH_QUERY_BUTTON_DESCRIPTION_ID = 'jsonpath-query-button-description';

interface JsonPathPanelProps {
    jsonData: string;
    deepFormat?: boolean;
    autoExpandScheme?: boolean;
    isDataPreparing?: boolean;
    externalQueryRequest?: {
        id: number;
        query: string;
    } | null;
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

    const [queryState, dispatchQueryState] = useReducer(
        jsonPathPanelQueryStateReducer,
        initialJsonPathPanelQueryState
    );
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
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const activeQueryRef = useRef('');
    const activeQueryStartedAtRef = useRef<number | null>(null);
    const externalQueryIdRef = useRef<number | null>(null);
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

    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
            activeQueryStartedAtRef.current = null;
        };
    }, []);

    const trackJsonPathQueryEvent = useCallback((status: ToolEventStatus, startedAt: number) => {
        const durationMs = typeof performance === 'undefined' ? -1 : performance.now() - startedAt;
        trackToolEvent({
            eventName: 'JSONPATH_QUERY',
            category: 'jsonpath',
            status,
            inputSizeBucket: getTextSizeBucket(jsonData),
            durationBucket: getDurationBucket(durationMs),
        });
    }, [jsonData]);

    const resetQueryState = useCallback(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
        requestIdRef.current++;
        activeQueryRef.current = '';
        activeQueryStartedAtRef.current = null;
        dispatchQueryState({ type: 'reset' });
        onHighlightRange(null);
    }, [onHighlightRange]);

    useEffect(() => {
        resetQueryState();
    }, [jsonData, deepFormat, autoExpandScheme, isOpen, resetQueryState]);

    const handleQuery = useCallback((overrideQuery?: string) => {
        const startedAt = performance.now();
        dispatchQueryState({ type: 'prepare' });
        const normalizedQueryInput = normalizeJsonPathQueryInput(overrideQuery ?? query);
        const queryPath = normalizedQueryInput.query;

        if (isDataPreparing) {
            dispatchQueryState({ type: 'skipped', error: '深度格式化仍在处理，请稍后查询' });
            trackJsonPathQueryEvent('skipped', startedAt);
            return;
        }

        if (!queryPath) {
            dispatchQueryState({
                type: 'skipped',
                error: '请输入 JSONPath 表达式或字段名',
                clearResults: true,
            });
            onHighlightRange(null);
            trackJsonPathQueryEvent('skipped', startedAt);
            return;
        }

        if (normalizedQueryInput.isFieldNameShortcut) {
            setQuery(queryPath);
        }

        // 校验 JSON 数据有效性
        if (!jsonData || !jsonData.trim()) {
            dispatchQueryState({ type: 'skipped', error: '请先在左侧输入 JSON 数据' });
            trackJsonPathQueryEvent('skipped', startedAt);
            return;
        }

        workerRef.current?.terminate();
        const requestId = ++requestIdRef.current;
        const worker = new Worker(new URL('../workers/jsonPath.worker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;
        activeQueryRef.current = queryPath;
        activeQueryStartedAtRef.current = startedAt;
        dispatchQueryState({ type: 'start' });
        onHighlightRange(null);

        worker.onmessage = (event: MessageEvent<{
            id: number;
            ranges: HighlightRange[];
            values: unknown[];
            items: JsonPathQueryItem[];
            totalResults: number;
            isLimited: boolean;
            resultLimit: number;
            error?: string;
        }>) => {
            if (event.data.id !== requestId) return;
            worker.terminate();
            if (workerRef.current === worker) {
                workerRef.current = null;
            }
            activeQueryRef.current = '';
            const queryStartedAt = activeQueryStartedAtRef.current ?? startedAt;
            activeQueryStartedAtRef.current = null;

            if (event.data.error) {
                dispatchQueryState({ type: 'failed', error: event.data.error });
                onHighlightRange(null);
                trackJsonPathQueryEvent('error', queryStartedAt);
                return;
            }

            if (event.data.totalResults === 0) {
                dispatchQueryState({ type: 'empty', query: queryPath });
                onHighlightRange(null);
                trackJsonPathQueryEvent('success', queryStartedAt);
                return;
            }

            dispatchQueryState({
                type: 'success',
                payload: {
                    ranges: event.data.ranges,
                    values: event.data.values,
                    items: event.data.items || [],
                    totalResults: event.data.totalResults,
                    isLimited: event.data.isLimited,
                    resultLimit: event.data.resultLimit,
                },
            });
            onHighlightRange(event.data.ranges[0] || null);

            addHistoryItem(queryPath);
            trackJsonPathQueryEvent('success', queryStartedAt);
        };

        worker.onerror = (event) => {
            if (requestIdRef.current !== requestId) return;
            worker.terminate();
            if (workerRef.current === worker) {
                workerRef.current = null;
            }
            activeQueryRef.current = '';
            const queryStartedAt = activeQueryStartedAtRef.current ?? startedAt;
            activeQueryStartedAtRef.current = null;
            dispatchQueryState({ type: 'failed', error: `JSONPath 查询错误: ${event.message}` });
            onHighlightRange(null);
            trackJsonPathQueryEvent('error', queryStartedAt);
        };

        worker.postMessage({
            id: requestId,
            jsonData,
            query: queryPath,
            options: {
                deepFormat,
                autoExpandScheme,
            },
        });
    }, [addHistoryItem, autoExpandScheme, deepFormat, isDataPreparing, jsonData, onHighlightRange, query, trackJsonPathQueryEvent]);

    const handleCancelQuery = useCallback(() => {
        if (!isQuerying || !workerRef.current) return;

        const cancelledQueryPath = activeQueryRef.current || query.trim();
        const queryStartedAt = activeQueryStartedAtRef.current ?? performance.now();
        workerRef.current.terminate();
        workerRef.current = null;
        requestIdRef.current++;
        activeQueryRef.current = '';
        activeQueryStartedAtRef.current = null;
        dispatchQueryState({ type: 'cancelled', query: cancelledQueryPath });
        onHighlightRange(null);
        trackJsonPathQueryEvent('cancelled', queryStartedAt);
        showSuccess('已取消查询', 1600);
    }, [isQuerying, onHighlightRange, query, trackJsonPathQueryEvent]);

    // 从解析报告等外部入口进入时，自动填入路径并触发一次查询。
    useEffect(() => {
        if (!externalQueryRequest || !isOpen || isDataPreparing) return;
        if (externalQueryIdRef.current === externalQueryRequest.id) return;

        externalQueryIdRef.current = externalQueryRequest.id;
        setQuery(externalQueryRequest.query);
        handleQuery(externalQueryRequest.query);
    }, [externalQueryRequest, handleQuery, isDataPreparing, isOpen]);

    const applyFocusedResult = (index: number) => {
        dispatchQueryState({ type: 'focus', index });
        onHighlightRange(queryRanges[index] || null);
    };

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
        dispatchQueryState({ type: 'clearCancelled' });
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
        dispatchQueryState({ type: 'prepare' });
        handleQuery(queryPath);
    };

    const handleNestedScrollWheel = (event: React.WheelEvent<HTMLElement>) => {
        const target = event.currentTarget;
        if (shouldStopNestedScrollPropagation(target.scrollHeight, target.clientHeight)) {
            event.stopPropagation();
        }
    };

    const copyQueryResults = async () => {
        if (queryValues.length === 0) return;

        try {
            await copyText(formatJsonPathValuesForCopy(queryValues));
            showSuccess(`查询结果已复制（${getJsonPathCopyCountLabel(queryValues.length, isResultLimited)}）`);
        } catch (error) {
            console.warn('复制 JSONPath 查询结果失败:', error);
            showError(getClipboardErrorMessage(error, '复制查询结果失败'));
        }
    };

    const copyQueryResultPaths = async () => {
        if (queryItems.length === 0) return;

        try {
            await copyText(formatJsonPathItemsForCopy(queryItems));
            showSuccess(`查询路径和值已复制（${getJsonPathCopyCountLabel(queryItems.length, isResultLimited)}）`);
        } catch (error) {
            console.warn('复制 JSONPath 查询路径和值失败:', error);
            showError(getClipboardErrorMessage(error, '复制查询路径和值失败'));
        }
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
            title={
                <div className="flex items-center gap-2">
                    <span>JSONPath 查询</span>
                    <button
                        type="button"
                        onClick={() => window.open('https://docs.apifox.com/doc-5725287', '_blank', 'noopener,noreferrer')}
                        className="rounded text-gray-400 transition-colors hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                        title="学习 JSONPath 语法"
                        aria-label="学习 JSONPath 语法"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            }
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
