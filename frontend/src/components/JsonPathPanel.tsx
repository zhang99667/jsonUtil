import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { useFeatureTour, FeatureId } from '../hooks/useFeatureTour';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import type { HighlightRange } from '../types';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { showError, showSuccess } from '../utils/toast';
import { safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from '../utils/storage';
import {
    addJsonPathListItem,
    JSONPATH_FAVORITES_STORAGE_KEY,
    JSONPATH_HISTORY_STORAGE_KEY,
    parseStoredJsonPathList,
    removeJsonPathListItem
} from '../utils/jsonPathLists';

const MAX_VISIBLE_QUERY_RESULTS = 100;
const MAX_RESULT_PREVIEW_LENGTH = 240;

const formatJsonPathValuesForCopy = (values: unknown[]): string => {
    if (values.length === 1) {
        const [value] = values;
        return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    }

    return JSON.stringify(values, null, 2);
};

const formatJsonPathValueForPreview = (value: unknown): string => {
    const text = typeof value === 'string'
        ? value
        : JSON.stringify(value, null, 2) ?? String(value);

    return text.length > MAX_RESULT_PREVIEW_LENGTH
        ? `${text.slice(0, MAX_RESULT_PREVIEW_LENGTH)}...`
        : text;
};

interface JsonPathPanelProps {
    jsonData: string;
    deepFormat?: boolean;
    autoExpandScheme?: boolean;
    isDataPreparing?: boolean;
    isOpen: boolean;
    onClose: () => void;
    onHighlightRange: (range: HighlightRange | null) => void;
}

export const JsonPathPanel: React.FC<JsonPathPanelProps> = ({
    jsonData,
    deepFormat = false,
    autoExpandScheme = false,
    isDataPreparing = false,
    isOpen,
    onClose,
    onHighlightRange
}) => {
    const [query, setQuery] = useState<string>('$');
    const [error, setError] = useState<string>('');
    const [history, setHistory] = useState<string[]>(() => {
        return parseStoredJsonPathList(safeGetStorageItem(JSONPATH_HISTORY_STORAGE_KEY));
    });
    const [favorites, setFavorites] = useState<string[]>(() => {
        return parseStoredJsonPathList(safeGetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY));
    });

    // 查询结果状态
    const [queryRanges, setQueryRanges] = useState<HighlightRange[]>([]);
    const [queryValues, setQueryValues] = useState<unknown[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState<number>(0);
    const [totalResults, setTotalResults] = useState<number>(0);
    const [isQuerying, setIsQuerying] = useState<boolean>(false);
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);

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
        };
    }, []);

    const resetQueryState = useCallback(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
        requestIdRef.current++;
        setError('');
        setIsQuerying(false);
        setQueryRanges([]);
        setQueryValues([]);
        setTotalResults(0);
        setCurrentResultIndex(0);
        onHighlightRange(null);
    }, [onHighlightRange]);

    useEffect(() => {
        resetQueryState();
    }, [jsonData, deepFormat, autoExpandScheme, isOpen, resetQueryState]);

    const handleQuery = () => {
        setError('');
        const queryPath = query.trim();

        if (isDataPreparing) {
            setError('深度格式化仍在处理，请稍后查询');
            return;
        }

        if (!queryPath) {
            setError('请输入 JSONPath 表达式');
            setQueryRanges([]);
            setQueryValues([]);
            setTotalResults(0);
            setCurrentResultIndex(0);
            onHighlightRange(null);
            return;
        }

        // 校验 JSON 数据有效性
        if (!jsonData || !jsonData.trim()) {
            setError('请先在左侧输入 JSON 数据');
            return;
        }

        workerRef.current?.terminate();
        const requestId = ++requestIdRef.current;
        const worker = new Worker(new URL('../workers/jsonPath.worker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;
        setIsQuerying(true);

        worker.onmessage = (event: MessageEvent<{
            id: number;
            ranges: HighlightRange[];
            values: unknown[];
            totalResults: number;
            error?: string;
        }>) => {
            if (event.data.id !== requestId) return;
            worker.terminate();
            if (workerRef.current === worker) {
                workerRef.current = null;
            }
            setIsQuerying(false);

            if (event.data.error) {
                setError(event.data.error);
                setQueryRanges([]);
                setQueryValues([]);
                setTotalResults(0);
                setCurrentResultIndex(0);
                onHighlightRange(null);
                return;
            }

            if (event.data.totalResults === 0) {
                setError('未找到匹配项');
                setQueryRanges([]);
                setQueryValues([]);
                setTotalResults(0);
                setCurrentResultIndex(0);
                onHighlightRange(null);
                return;
            }

            setQueryRanges(event.data.ranges);
            setQueryValues(event.data.values);
            setTotalResults(event.data.totalResults);
            setCurrentResultIndex(0);
            onHighlightRange(event.data.ranges[0] || null);

            // 添加到历史记录（去重）
            setHistory(prev => addJsonPathListItem(prev, queryPath));
        };

        worker.onerror = (event) => {
            if (requestIdRef.current !== requestId) return;
            worker.terminate();
            if (workerRef.current === worker) {
                workerRef.current = null;
            }
            setIsQuerying(false);
            setError(`JSONPath 查询错误: ${event.message}`);
            setQueryRanges([]);
            setQueryValues([]);
            setTotalResults(0);
            setCurrentResultIndex(0);
            onHighlightRange(null);
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
    };

    const examples = [
        { label: '根节点', query: '$' },
        { label: '所有属性', query: '$.*' },
        { label: '数组第一项', query: '$[0]' },
        { label: '递归搜索', query: '$..name' },
        { label: '过滤条件', query: '$[?(@.age > 18)]' },
    ];

    // 导航到上一个结果
    const goToPrevious = () => {
        if (totalResults === 0 || isQuerying) return;
        const newIndex = currentResultIndex === 0 ? totalResults - 1 : currentResultIndex - 1;
        setCurrentResultIndex(newIndex);
        onHighlightRange(queryRanges[newIndex] || null);
    };

    // 导航到下一个结果
    const goToNext = () => {
        if (totalResults === 0 || isQuerying) return;
        const newIndex = currentResultIndex === totalResults - 1 ? 0 : currentResultIndex + 1;
        setCurrentResultIndex(newIndex);
        onHighlightRange(queryRanges[newIndex] || null);
    };

    // 处理键盘快捷键
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isQuerying) return;

        if (e.key === 'Enter') {
            if (e.shiftKey) {
                e.preventDefault();
                goToPrevious();
            } else if (totalResults > 0) {
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

    const normalizedQuery = query.trim();
    const isCurrentQueryFavorite = normalizedQuery ? favorites.includes(normalizedQuery) : false;
    const queryResultPreviewItems = useMemo(() => {
        return queryValues.slice(0, MAX_VISIBLE_QUERY_RESULTS).map((value, index) => ({
            index,
            text: formatJsonPathValueForPreview(value),
        }));
    }, [queryValues]);
    const hiddenResultCount = Math.max(queryValues.length - queryResultPreviewItems.length, 0);

    const toggleFavorite = () => {
        if (!normalizedQuery) return;

        setFavorites(prev => (
            isCurrentQueryFavorite
                ? removeJsonPathListItem(prev, normalizedQuery)
                : addJsonPathListItem(prev, normalizedQuery)
        ));
    };

    const copyQueryResults = async () => {
        if (queryValues.length === 0) return;

        try {
            await navigator.clipboard.writeText(formatJsonPathValuesForCopy(queryValues));
            showSuccess('查询结果已复制');
        } catch (error) {
            console.warn('复制 JSONPath 查询结果失败:', error);
            showError('复制查询结果失败');
        }
    };

    const focusQueryResult = (index: number) => {
        if (isQuerying || totalResults === 0 || index < 0 || index >= totalResults) return;

        setCurrentResultIndex(index);
        onHighlightRange(queryRanges[index] || null);
    };

    return (
        <DraggablePanel
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span>JSONPath 查询</span>
                    <button 
                        onClick={() => window.open('https://docs.apifox.com/doc-5725287', '_blank')}
                        className="text-gray-400 hover:text-emerald-400 transition-colors"
                        title="学习JSONPath语法"
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
            resizeDirections={['width']}
            dataTour="jsonpath-panel"
        >
            {/* 面板内容 */}
            <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* 查询输入框 */}
                <div className="mb-3">
                    <div className="flex gap-2">
                        <input
                            data-tour="jsonpath-input"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入 JSONPath 表达式"
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
                            title={isCurrentQueryFavorite ? '取消收藏当前查询' : '收藏当前查询'}
                            aria-label={isCurrentQueryFavorite ? '取消收藏当前查询' : '收藏当前查询'}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isCurrentQueryFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.5 2.47 5.02 5.54.8-4.01 3.91.95 5.52-4.95-2.6-4.95 2.6.95-5.52-4.01-3.91 5.54-.8 2.47-5.02Z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleQuery}
                            disabled={isQuerying || isDataPreparing}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isQuerying ? '查询中...' : '查询'}
                        </button>
                    </div>
                </div>

                {/* 收藏查询 */}
                {favorites.length > 0 && (
                    <div data-tour="jsonpath-favorites" className="mb-3 flex-shrink-0">
                        <div className="text-xs text-gray-500 mb-2">常用收藏:</div>
                        <div className="space-y-1 max-h-24 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                            {favorites.map(item => (
                                <div key={item} className="relative group">
                                    <button
                                        data-tour="jsonpath-favorite-item"
                                        onClick={() => setQuery(item)}
                                        className="w-full text-left text-xs px-2 py-1.5 bg-editor-bg text-amber-100 rounded hover:bg-editor-hover transition-colors font-mono truncate pr-7 border border-amber-500/20"
                                        title={item}
                                    >
                                        {item}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFavorites(prev => removeJsonPathListItem(prev, item));
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-editor-active opacity-0 group-hover:opacity-100 transition-all"
                                        title="移除收藏"
                                        aria-label="移除收藏"
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
                        {examples.map((example, idx) => (
                            <button
                                key={idx}
                                onClick={() => setQuery(example.query)}
                                className="text-xs px-2 py-1 bg-editor-border text-gray-300 rounded hover:bg-editor-active transition-colors"
                                title={example.query}
                            >
                                {example.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="mb-3 p-3 bg-status-error-bg border border-status-error-border rounded text-sm text-status-error-text flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* 结果计数器和导航控件 (VS Code 风格) */}
                {totalResults > 0 && (
                    <div className="mb-1 p-1 bg-editor-sidebar border border-editor-border rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">结果:</span>
                            <span className="text-sm font-mono text-emerald-400 font-semibold">
                                {currentResultIndex + 1} / {totalResults}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={copyQueryResults}
                                disabled={isQuerying || queryValues.length === 0}
                                className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="复制全部结果"
                                aria-label="复制全部结果"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <button
                                onClick={goToPrevious}
                                disabled={isQuerying}
                                className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="上一个 (Shift+Enter)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={goToNext}
                                disabled={isQuerying}
                                className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="下一个 (Enter)"
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
                        className="mb-3 max-h-28 flex-shrink-0 overflow-y-auto rounded border border-editor-border bg-editor-bg/60 p-1 space-y-1 [&::-webkit-scrollbar]:hidden"
                    >
                        {queryResultPreviewItems.map(item => (
                            <button
                                key={item.index}
                                onClick={() => focusQueryResult(item.index)}
                                className={`w-full text-left text-xs rounded border px-2 py-1.5 transition-colors ${
                                    item.index === currentResultIndex
                                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
                                        : 'border-transparent bg-editor-sidebar text-gray-300 hover:bg-editor-hover hover:text-gray-100'
                                }`}
                                title={item.text}
                            >
                                <span className="mr-2 text-[10px] text-gray-500">{item.index + 1}</span>
                                <span className="font-mono whitespace-pre-wrap break-words align-top">{item.text}</span>
                            </button>
                        ))}
                        {hiddenResultCount > 0 && (
                            <div className="px-2 py-1 text-[11px] text-gray-500">
                                仅显示前 {MAX_VISIBLE_QUERY_RESULTS} 项，复制按钮可导出全部 {totalResults} 项
                            </div>
                        )}
                    </div>
                )}

                {/* 查询历史 */}
                {history.length > 0 && (
                    <div data-tour="jsonpath-history" className="border-t border-editor-border pt-2 mt-1 flex-1 flex flex-col min-h-0 relative group/history">
                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                            <div className="text-xs text-gray-500">查询历史:</div>
                            <button
                                onClick={clearHistory}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                清空
                            </button>
                        </div>
                        <div
                            ref={historyListRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto space-y-1 min-h-0 [&::-webkit-scrollbar]:hidden"
                        >
                            {history.map((item, idx) => (
                                <div key={idx} className="relative group">
                                    <button
                                        onClick={() => setQuery(item)}
                                        className="w-full text-left text-xs px-2 py-1.5 bg-editor-bg text-gray-300 rounded hover:bg-editor-hover transition-colors font-mono truncate pr-7"
                                        title={item}
                                    >
                                        {item}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setHistory(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-editor-active opacity-0 group-hover:opacity-100 transition-all"
                                        title="删除此记录"
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
