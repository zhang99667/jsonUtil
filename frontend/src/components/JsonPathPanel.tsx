import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from 'react';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { useFeatureTour, FeatureId } from '../hooks/useFeatureTour';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import type { HighlightRange } from '../types';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { showError, showSuccess } from '../utils/toast';
import { safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from '../utils/storage';
import { getJsonPathScenarioExamples } from '../utils/jsonPathExamples';
import type { JsonPathQueryItem } from '../utils/jsonPathQuery';
import { normalizeJsonPathQueryInput } from '../utils/jsonPathInput';
import { formatJsonPathValueForCompactPreview } from '../utils/jsonPathPreview';
import { shouldStopNestedScrollPropagation } from '../utils/nestedScrollPropagation';
import {
    getDurationBucket,
    getTextSizeBucket,
    trackToolEvent,
    type ToolEventStatus,
} from '../utils/productTelemetry';
import {
    addJsonPathListItem,
    JSONPATH_FAVORITES_STORAGE_KEY,
    JSONPATH_HISTORY_STORAGE_KEY,
    parseStoredJsonPathList,
    removeJsonPathListItem
} from '../utils/jsonPathLists';
import {
    initialJsonPathPanelQueryState,
    jsonPathPanelQueryStateReducer,
} from '../utils/jsonPathPanelQueryState';

const MAX_VISIBLE_QUERY_RESULTS = 100;
const JSONPATH_ERROR_MESSAGE_ID = 'jsonpath-error-message';
const JSONPATH_RESULT_STATUS_ID = 'jsonpath-result-status';
const JSONPATH_QUERY_BUTTON_DESCRIPTION_ID = 'jsonpath-query-button-description';

const JSONPATH_EXAMPLES = [
    { label: '根节点', query: '$' },
    { label: '所有属性', query: '$.*' },
    { label: '数组第一项', query: '$[0]' },
    { label: '递归搜索', query: '$..name' },
    { label: '过滤条件', query: '$[?(@.age > 18)]' },
];

const RESPONSE_JSONPATH_PRESETS = [
    { label: 'action_cmd', query: '$..action_cmd' },
    { label: 'button_cmd', query: '$..button_cmd' },
    { label: 'scheme', query: '$..scheme' },
    { label: 'url', query: '$..url' },
    { label: 'params', query: '$..params' },
    { label: 'traceId', query: '$..traceId' },
];

const formatJsonPathValuesForCopy = (values: unknown[]): string => {
    if (values.length === 1) {
        const [value] = values;
        return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    }

    return JSON.stringify(values, null, 2);
};

const formatJsonPathValueForLineCopy = (value: unknown): string => (
    typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value) ?? String(value)
);

const formatJsonPathItemsForCopy = (items: JsonPathQueryItem[]): string => (
    items.map(item => `${item.path} = ${formatJsonPathValueForLineCopy(item.value)}`).join('\n')
);

const getJsonPathCopyCountLabel = (count: number, isLimited: boolean): string => (
    isLimited ? `已返回 ${count} 项` : `${count} 项`
);

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
    const [history, setHistory] = useState<string[]>(() => {
        return parseStoredJsonPathList(safeGetStorageItem(JSONPATH_HISTORY_STORAGE_KEY));
    });
    const [favorites, setFavorites] = useState<string[]>(() => {
        return parseStoredJsonPathList(safeGetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY));
    });

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

    // 自定义滚动条 Hook
    const {
        scrollContainerRef: historyListRef,
        handleScroll,
        handleMouseDown: handleScrollbarMouseDown,
        thumbSize: thumbHeight,
        thumbOffset: thumbTop,
        showScrollbar,
    } = useCustomScrollbar('vertical', history.length);

    // 功能级引导
    const { triggerFeatureFirstUse, refreshTour } = useFeatureTour();
    const hasTriggeredTour = useRef(false);

    // 首次打开时触发引导(仅触发一次)
    useEffect(() => {
        if (isOpen && !hasTriggeredTour.current) {
            hasTriggeredTour.current = true;
            triggerFeatureFirstUse(FeatureId.JSONPATH);
        }
    }, [isOpen, triggerFeatureFirstUse]);

    // 监听面板打开时刷新引导位置
    useEffect(() => {
        if (isOpen) {
            refreshTour();
        }
    }, [isOpen, refreshTour]);

    // ESC 关闭面板（仅当焦点在面板内时）
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                // 查找面板 DOM 元素
                const panelElement = document.querySelector('[data-tour="jsonpath-panel"]');
                // 检查焦点是否在面板内部
                if (panelElement && panelElement.contains(document.activeElement)) {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen, onClose]);

    // 保存历史记录到 localStorage
    useEffect(() => {
        safeSetStorageItem(JSONPATH_HISTORY_STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    // 保存收藏查询到 localStorage
    useEffect(() => {
        safeSetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    // 配置备份导入后同步刷新已挂载面板中的收藏和历史
    useEffect(() => {
        const handleBackupImported = () => {
            setHistory(parseStoredJsonPathList(safeGetStorageItem(JSONPATH_HISTORY_STORAGE_KEY)));
            setFavorites(parseStoredJsonPathList(safeGetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY)));
        };

        window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
        return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    }, []);

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

            // 添加到历史记录（去重）
            setHistory(prev => addJsonPathListItem(prev, queryPath));
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
    }, [autoExpandScheme, deepFormat, isDataPreparing, jsonData, onHighlightRange, query, trackJsonPathQueryEvent]);

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

    // 导航到上一个结果
    const goToPrevious = () => {
        const navigableResultCount = queryRanges.length;
        if (navigableResultCount === 0 || isQuerying) return;
        const newIndex = currentResultIndex === 0 ? navigableResultCount - 1 : currentResultIndex - 1;
        dispatchQueryState({ type: 'focus', index: newIndex });
        onHighlightRange(queryRanges[newIndex] || null);
    };

    // 导航到下一个结果
    const goToNext = () => {
        const navigableResultCount = queryRanges.length;
        if (navigableResultCount === 0 || isQuerying) return;
        const newIndex = currentResultIndex === navigableResultCount - 1 ? 0 : currentResultIndex + 1;
        dispatchQueryState({ type: 'focus', index: newIndex });
        onHighlightRange(queryRanges[newIndex] || null);
    };

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

    const clearHistory = () => {
        setHistory([]);
        safeRemoveStorageItem(JSONPATH_HISTORY_STORAGE_KEY);
    };

    const clearQueryInput = () => {
        setQuery('');
        resetQueryState();
    };

    const normalizedQuery = query.trim();
    const isCurrentQueryFavorite = normalizedQuery ? favorites.includes(normalizedQuery) : false;
    const queryResultPreviewItems = useMemo(() => {
        return queryItems.slice(0, MAX_VISIBLE_QUERY_RESULTS).map((item, index) => ({
            index,
            path: item.path,
            sourceLabel: item.sourceLabel,
            text: formatJsonPathValueForCompactPreview(item.value),
        }));
    }, [queryItems]);
    const scenarioExamples = useMemo(() => getJsonPathScenarioExamples(jsonData), [jsonData]);
    const hiddenResultCount = Math.max(queryItems.length - queryResultPreviewItems.length, 0);
    const copyButtonLabel = isResultLimited ? '复制已返回结果' : '复制全部结果';
    const copyPathValueButtonLabel = isResultLimited ? '复制已返回路径和值' : '复制路径和值';
    const showEmptyResult = Boolean(emptyResultQuery) && !error && !isQuerying && totalResults === 0;
    const showCancelledQuery = Boolean(cancelledQuery) && !error && !isQuerying && totalResults === 0;
    const queryInputDescriptionId = error
        ? JSONPATH_ERROR_MESSAGE_ID
        : totalResults > 0 && queryRanges.length > 0
            ? JSONPATH_RESULT_STATUS_ID
            : undefined;
    const favoriteToggleTitle = !normalizedQuery
        ? '请输入 JSONPath 表达式或字段名后可收藏'
        : isCurrentQueryFavorite
            ? '取消收藏当前查询'
            : '收藏当前查询';
    const queryButtonTitle = (() => {
        if (isDataPreparing) return '深度格式化仍在处理，请稍后查询';
        if (isQuerying) return 'JSONPath 查询正在运行，可取消后重新查询';
        if (!normalizedQuery) return '请输入 JSONPath 表达式或字段名后查询';
        if (!jsonData.trim()) return '请先在 SOURCE 输入 JSON 数据';
        return '执行 JSONPath 查询';
    })();

    const fillAndRunQuery = (queryPath: string) => {
        setQuery(queryPath);
        dispatchQueryState({ type: 'prepare' });
        handleQuery(queryPath);
    };

    const toggleFavorite = () => {
        if (!normalizedQuery) return;

        setFavorites(prev => (
            isCurrentQueryFavorite
                ? removeJsonPathListItem(prev, normalizedQuery)
                : addJsonPathListItem(prev, normalizedQuery)
        ));
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
        if (isQuerying || queryRanges.length === 0 || index < 0 || index >= queryRanges.length) return;

        dispatchQueryState({ type: 'focus', index });
        onHighlightRange(queryRanges[index] || null);
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
                        className="rounded text-gray-400 transition-colors hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
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
                {/* 查询输入框 */}
                <div className="mb-3">
                    <div className="flex gap-2">
                        <input
                            ref={queryInputRef}
                            data-tour="jsonpath-input"
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                dispatchQueryState({ type: 'clearCancelled' });
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="输入 JSONPath 表达式或字段名"
                            aria-label="JSONPath 表达式"
                            aria-invalid={Boolean(error)}
                            aria-describedby={queryInputDescriptionId}
                            className="flex-1 bg-editor-bg text-gray-200 text-sm px-3 py-2 rounded border border-editor-border focus:border-emerald-500 focus:outline-none font-mono"
                        />
                        <button
                            data-tour="jsonpath-favorite-toggle"
                            onClick={toggleFavorite}
                            disabled={!normalizedQuery}
                            className={`px-2.5 py-2 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                isCurrentQueryFavorite
                                    ? 'bg-amber-500/15 border-amber-400 text-amber-300 hover:bg-amber-500/25'
                                    : 'bg-editor-bg border-editor-border text-gray-400 hover:text-amber-300 hover:border-amber-400'
                            }`}
                            title={favoriteToggleTitle}
                            aria-label={favoriteToggleTitle}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isCurrentQueryFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.5 2.47 5.02 5.54.8-4.01 3.91.95 5.52-4.95-2.6-4.95 2.6.95-5.52-4.01-3.91 5.54-.8 2.47-5.02Z" />
                            </svg>
                        </button>
                        <button
                            data-tour="jsonpath-query-button"
                            onClick={() => handleQuery()}
                            disabled={isQuerying || isDataPreparing}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            title={queryButtonTitle}
                            aria-describedby={JSONPATH_QUERY_BUTTON_DESCRIPTION_ID}
                        >
                            {isQuerying ? '查询中...' : '查询'}
                        </button>
                        <span id={JSONPATH_QUERY_BUTTON_DESCRIPTION_ID} className="sr-only">
                            {queryButtonTitle}
                        </span>
                        {isQuerying && (
                            <button
                                data-tour="jsonpath-cancel-query"
                                onClick={handleCancelQuery}
                                className="px-3 py-2 bg-amber-700/80 text-white text-sm rounded hover:bg-amber-700 transition-colors font-medium"
                                title="停止当前 JSONPath 查询"
                                aria-label="取消 JSONPath 查询，停止当前正在执行的查询"
                            >
                                取消
                            </button>
                        )}
                    </div>
                    {(isQuerying || showCancelledQuery) && (
                        <div
                            data-tour="jsonpath-query-status"
                            role="status"
                            aria-live="polite"
                            className="mt-2 text-xs text-gray-500"
                        >
                            {isQuerying ? '查询中...' : '已取消查询'}
                        </div>
                    )}
                </div>

                {/* 收藏查询 */}
                {favorites.length > 0 && (
                    <div data-tour="jsonpath-favorites" className="mb-3 flex-shrink-0">
                        <div className="text-xs text-gray-500 mb-2">常用收藏:</div>
                        <div
                            onWheel={handleNestedScrollWheel}
                            className="space-y-1 max-h-24 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden"
                        >
                            {favorites.map(item => (
                                <div key={item} className="relative group">
                                    <button
                                        data-tour="jsonpath-favorite-item"
                                        onClick={() => fillAndRunQuery(item)}
                                        className="w-full text-left text-xs px-2 py-1.5 bg-editor-bg text-amber-100 rounded hover:bg-editor-hover transition-colors font-mono truncate pr-7 border border-amber-500/20"
                                        title={`${item}\n点击填入并查询`}
                                        aria-label={`填入并查询收藏：${item}`}
                                    >
                                        {item}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFavorites(prev => removeJsonPathListItem(prev, item));
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-editor-active opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400/70 transition-all"
                                        title={`移除收藏：${item}`}
                                        aria-label={`移除收藏：${item}`}
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 常用示例 */}
                <div className="mb-3" data-tour="jsonpath-examples">
                    <div className="text-xs text-gray-500 mb-2">常用示例:</div>
                    <div className="flex flex-wrap gap-2">
                        {JSONPATH_EXAMPLES.map((example) => (
                            <button
                                key={example.query}
                                onClick={() => fillAndRunQuery(example.query)}
                                className="text-xs px-2 py-1 bg-editor-border text-gray-300 rounded hover:bg-editor-active transition-colors"
                                title={`${example.query}\n点击填入并查询`}
                                aria-label={`填入并查询示例：${example.label}（${example.query}）`}
                            >
                                {example.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 场景示例 */}
                {scenarioExamples.length > 0 && (
                    <div className="mb-3" data-tour="jsonpath-scenario-examples">
                        <div className="text-xs text-gray-500 mb-2">场景示例:</div>
                        <div className="flex flex-wrap gap-2">
                            {scenarioExamples.map((example) => (
                                <button
                                    key={example.id}
                                    onClick={() => fillAndRunQuery(example.query)}
                                    className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/20"
                                    title={`${example.description}\n${example.query}\n点击填入并查询`}
                                    aria-label={`填入并查询场景示例：${example.label}（${example.query}）`}
                                >
                                    {example.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Response 常用 */}
                <div className="mb-3" data-tour="jsonpath-response-presets">
                    <div className="text-xs text-gray-500 mb-2">Response 常用:</div>
                    <div className="flex flex-wrap gap-2">
                        {RESPONSE_JSONPATH_PRESETS.map((preset) => (
                            <button
                                key={preset.query}
                                data-tour="jsonpath-response-preset"
                                onClick={() => fillAndRunQuery(preset.query)}
                                className="rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 font-mono text-[11px] text-cyan-100 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/20"
                                title={`${preset.query}\n点击填入并查询`}
                                aria-label={`填入并查询 Response 常用：${preset.label}（${preset.query}）`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div
                        id={JSONPATH_ERROR_MESSAGE_ID}
                        role="alert"
                        className="mb-3 p-3 bg-status-error-bg border border-status-error-border rounded text-sm text-status-error-text flex items-start gap-2"
                    >
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* 查询空状态 */}
                {showEmptyResult && (
                    <div
                        data-tour="jsonpath-empty"
                        role="status"
                        aria-live="polite"
                        className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">未命中任何结果</div>
                            <button
                                type="button"
                                data-tour="jsonpath-empty-clear"
                                onClick={clearQueryInput}
                                className="shrink-0 rounded border border-amber-400/40 px-2 py-0.5 text-xs text-amber-100 transition-colors hover:border-amber-300 hover:bg-amber-400/10 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
                                title="清空当前 JSONPath 查询"
                                aria-label="清空当前 JSONPath 查询"
                            >
                                清空查询
                            </button>
                        </div>
                        <div className="mt-1 break-all font-mono text-xs text-amber-200/80">
                            {emptyResultQuery}
                        </div>
                    </div>
                )}

                {/* 结果计数器和导航控件 (VS Code 风格) */}
                {totalResults > 0 && queryRanges.length > 0 && (
                    <div className="mb-1 p-1 bg-editor-sidebar border border-editor-border rounded flex items-center justify-between">
                        <div
                            id={JSONPATH_RESULT_STATUS_ID}
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                            className="flex items-center gap-2"
                        >
                            <span className="text-xs text-gray-400">结果:</span>
                            <span className="text-sm font-mono text-emerald-400 font-semibold">
                                {currentResultIndex + 1} / {queryRanges.length}
                            </span>
                            {isResultLimited && (
                                <span className="text-[11px] text-amber-300">
                                    命中超过 {resultLimit}，已提前停止
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={copyQueryResults}
                                disabled={isQuerying || queryValues.length === 0}
                                className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={copyButtonLabel}
                                aria-label={copyButtonLabel}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <button
                                data-tour="jsonpath-copy-path-values"
                                onClick={copyQueryResultPaths}
                                disabled={isQuerying || queryItems.length === 0}
                                className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={copyPathValueButtonLabel}
                                aria-label={copyPathValueButtonLabel}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v4h4" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={goToPrevious}
                                disabled={isQuerying}
                                className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="上一个结果 (Shift+Enter)"
                                aria-label="上一个结果 (Shift+Enter)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={goToNext}
                                disabled={isQuerying}
                                className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="下一个结果 (Enter)"
                                aria-label="下一个结果 (Enter)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* 查询结果预览 */}
                {queryResultPreviewItems.length > 0 && (
                    <div
                        data-tour="jsonpath-results"
                        onWheel={handleNestedScrollWheel}
                        className="mb-3 max-h-24 flex-shrink-0 overflow-y-auto overscroll-contain rounded border border-editor-border bg-editor-bg/60 p-1 space-y-1 [&::-webkit-scrollbar]:hidden"
                    >
                        {queryResultPreviewItems.map(item => (
                            <div
                                key={item.index}
                                className={`flex min-w-0 items-center gap-1 rounded border text-xs transition-colors ${
                                    item.index === currentResultIndex
                                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
                                        : 'border-transparent bg-editor-sidebar text-gray-300 hover:bg-editor-hover hover:text-gray-100'
                                }`}
                            >
                                <button
                                    type="button"
                                    data-tour="jsonpath-result-preview"
                                    onClick={() => focusQueryResult(item.index)}
                                    className="min-w-0 flex-1 rounded px-2 py-1 text-left focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                    title={`${item.sourceLabel ? `${item.sourceLabel} ` : ''}${item.path}\n${item.text}`}
                                    aria-label={`定位第 ${item.index + 1} 个 JSONPath 结果：${item.path}`}
                                >
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        <span className="shrink-0 text-[10px] text-gray-500">{item.index + 1}</span>
                                        {item.sourceLabel && (
                                            <span
                                                className="max-w-[120px] shrink-0 truncate rounded bg-cyan-900/40 px-1.5 py-0.5 text-[10px] text-cyan-200"
                                                title={item.sourceLabel}
                                            >
                                                {item.sourceLabel}
                                            </span>
                                        )}
                                        <span className="min-w-0 truncate font-mono text-[10px] text-emerald-300" title={item.path}>
                                            {item.path}
                                        </span>
                                        <span className="shrink-0 text-gray-600">=</span>
                                        <span className="min-w-[4rem] max-w-[45%] truncate font-mono text-[10px] text-gray-200" title={item.text}>
                                            {item.text}
                                        </span>
                                    </div>
                                </button>
                                {onLocateStructure && (
                                    <button
                                        type="button"
                                        data-tour="jsonpath-locate-structure"
                                        onClick={() => locateStructureResult(item.index)}
                                        className="m-1 shrink-0 rounded p-1 text-cyan-200/70 transition-colors hover:bg-cyan-500/15 hover:text-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-300"
                                        title={`在结构导航中定位 ${item.path}`}
                                        aria-label={`在结构导航中定位第 ${item.index + 1} 个 JSONPath 结果：${item.path}`}
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6zM10 9h4M10 17h4M17 10v4" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        {hiddenResultCount > 0 && (
                            <div className="px-2 py-1 text-[11px] text-gray-500">
                                仅显示前 {MAX_VISIBLE_QUERY_RESULTS} 项，复制按钮可导出已返回的 {queryValues.length} 项
                            </div>
                        )}
                        {isResultLimited && (
                            <div className="px-2 py-1 text-[11px] text-amber-300">
                                为保护性能，命中超过 {resultLimit} 项后已提前停止
                            </div>
                        )}
                    </div>
                )}

                {/* 查询历史 */}
                {history.length > 0 && (
                    <div data-tour="jsonpath-history" className="border-t border-editor-border pt-2 mt-1 flex-shrink-0 relative group/history">
                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                            <div className="text-xs text-gray-500">查询历史:</div>
                            <button
                                onClick={clearHistory}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                title="清空 JSONPath 查询历史"
                                aria-label="清空 JSONPath 查询历史"
                            >
                                清空
                            </button>
                        </div>
                        <div
                            ref={historyListRef}
                            onScroll={handleScroll}
                            onWheel={handleNestedScrollWheel}
                            className="max-h-28 overflow-y-auto overscroll-contain space-y-1 [&::-webkit-scrollbar]:hidden"
                        >
                            {history.map((item, idx) => (
                                <div key={idx} className="relative group">
                                    <button
                                        data-tour="jsonpath-history-item"
                                        onClick={() => fillAndRunQuery(item)}
                                        className="w-full text-left text-xs px-2 py-1.5 bg-editor-bg text-gray-300 rounded hover:bg-editor-hover transition-colors font-mono truncate pr-7"
                                        title={`${item}\n点击填入并查询`}
                                        aria-label={`填入并查询历史记录：${item}`}
                                    >
                                        {item}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setHistory(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-editor-active opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400/70 transition-all"
                                        title={`删除历史记录：${item}`}
                                        aria-label={`删除历史记录：${item}`}
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* 自定义滚动条 */}
                        {showScrollbar && (
                            <div className="absolute right-0 top-[36px] bottom-0 w-[3px] z-10 opacity-0 group-hover/history:opacity-100 transition-opacity duration-200">
                                <div
                                    className="w-full bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer relative"
                                    style={{
                                        height: `${thumbHeight}%`,
                                        top: `${thumbTop}%`
                                    }}
                                    onMouseDown={handleScrollbarMouseDown}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 操作提示 */}
                <div className="mt-3 text-xs text-gray-500 italic">
                    查询结果将显示在右侧 PREVIEW 编辑器中
                </div>
            </div>
        </DraggablePanel>
    );
};
