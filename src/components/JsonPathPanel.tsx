import React, { useState, useRef, useEffect } from 'react';
import { JSONPath } from 'jsonpath-plus';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';

interface JsonPathPanelProps {
    jsonData: string;
    isOpen: boolean;
    onClose: () => void;
    onQueryResult: (query: string, resultIndex: number) => void; // 修改：添加 resultIndex 参数
}

export const JsonPathPanel: React.FC<JsonPathPanelProps> = ({ jsonData, isOpen, onClose, onQueryResult }) => {
    const [query, setQuery] = useState<string>('$');
    const [error, setError] = useState<string>('');
    const [history, setHistory] = useState<string[]>(() => {
        const saved = localStorage.getItem('jsonpath-query-history');
        return saved ? JSON.parse(saved) : [];
    });

    // 新增：查询结果状态
    const [queryResults, setQueryResults] = useState<any[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState<number>(0);
    const [totalResults, setTotalResults] = useState<number>(0);

    // 拖动相关状态
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // 调整大小相关状态
    const [size, setSize] = useState({ width: 600, height: 400 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });


    const [startSize, setStartSize] = useState({ width: 0, height: 0 });

    const panelRef = useRef<HTMLDivElement>(null);

    // 自定义滚动条 Hook
    const {
        scrollContainerRef: historyListRef,
        handleScroll,
        handleMouseDown: handleScrollbarMouseDown,
        thumbSize: thumbHeight,
        thumbOffset: thumbTop,
        showScrollbar,
        isDragging: isScrollbarDragging
    } = useCustomScrollbar('vertical', history.length);

    // 保存历史记录到 localStorage
    useEffect(() => {
        localStorage.setItem('jsonpath-query-history', JSON.stringify(history));
    }, [history]);

    // 处理拖动和调整大小
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            } else if (isResizing) {
                const deltaX = e.clientX - resizeStart.x;

                setSize(prev => ({
                    ...prev,
                    width: Math.max(400, startSize.width + deltaX) // 最小宽度 400
                }));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, isResizing, resizeStart, startSize]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // 防止在调整大小时触发拖动
        if (isResizing) return;

        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            setDragStart({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
            setIsDragging(true);
        }
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation(); // 防止冒泡触发拖动
        setResizeStart({ x: e.clientX, y: e.clientY });
        setStartSize({ width: size.width, height: size.height });
        setIsResizing(true);
    };

    const handleQuery = () => {
        setError('');

        // 校验 JSON 数据有效性
        if (!jsonData || !jsonData.trim()) {
            setError('请先在左侧输入 JSON 数据');
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);

            try {
                const queryResult = JSONPath({ path: query, json: parsedData });

                if (queryResult === undefined || (Array.isArray(queryResult) && queryResult.length === 0)) {
                    setError('未找到匹配项');
                    setQueryResults([]);
                    setTotalResults(0);
                    setCurrentResultIndex(0);
                } else {
                    // 存储所有查询结果
                    const results = Array.isArray(queryResult) ? queryResult : [queryResult];
                    setQueryResults(results);
                    setTotalResults(results.length);
                    setCurrentResultIndex(0);

                    // 触发第一个结果的高亮
                    onQueryResult(query, 0);

                    // 添加到历史记录（去重）
                    if (!history.includes(query)) {
                        setHistory(prev => [query, ...prev].slice(0, 10)); // 保留最近10条
                    }
                }
            } catch (e: any) {
                setError(`JSONPath 查询错误: ${e.message}`);
                setQueryResults([]);
                setTotalResults(0);
                setCurrentResultIndex(0);
            }
        } catch (e: any) {
            setError(`JSON 解析错误: ${e.message}`);
            setQueryResults([]);
            setTotalResults(0);
            setCurrentResultIndex(0);
        }
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
        if (totalResults === 0) return;
        const newIndex = currentResultIndex === 0 ? totalResults - 1 : currentResultIndex - 1;
        setCurrentResultIndex(newIndex);
        onQueryResult(query, newIndex);
    };

    // 导航到下一个结果
    const goToNext = () => {
        if (totalResults === 0) return;
        const newIndex = currentResultIndex === totalResults - 1 ? 0 : currentResultIndex + 1;
        setCurrentResultIndex(newIndex);
        onQueryResult(query, newIndex);
    };

    // 处理键盘快捷键
    const handleKeyDown = (e: React.KeyboardEvent) => {
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
        localStorage.removeItem('jsonpath-query-history');
    };

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="fixed bg-[#252526] border border-[#454545] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Header - 可拖动 */}
            <div
                className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#454545] rounded-t-lg cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-200">JSONPath 查询</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#333]"
                    title="关闭"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* 面板内容 */}
            <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* 查询输入框 */}
                <div className="mb-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入 JSONPath 表达式"
                            className="flex-1 bg-[#1e1e1e] text-gray-200 text-sm px-3 py-2 rounded border border-[#454545] focus:border-emerald-500 focus:outline-none font-mono"
                        />
                        <button
                            onClick={handleQuery}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors font-medium"
                        >
                            查询
                        </button>
                    </div>
                </div>

                {/* 常用示例 */}
                <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2">常用示例:</div>
                    <div className="flex flex-wrap gap-2">
                        {examples.map((example, idx) => (
                            <button
                                key={idx}
                                onClick={() => setQuery(example.query)}
                                className="text-xs px-2 py-1 bg-[#333] text-gray-300 rounded hover:bg-[#444] transition-colors"
                                title={example.query}
                            >
                                {example.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="mb-3 p-3 bg-[#3c1515] border border-red-900/50 rounded text-sm text-red-300 flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* 结果计数器和导航控件 (VS Code 风格) */}
                {totalResults > 0 && (
                    <div className="mb-1 p-1 bg-[#2d2d2d] border border-[#454545] rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">结果:</span>
                            <span className="text-sm font-mono text-emerald-400 font-semibold">
                                {currentResultIndex + 1} / {totalResults}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={goToPrevious}
                                className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                                title="上一个 (Shift+Enter)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={goToNext}
                                className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                                title="下一个 (Enter)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* 查询历史 */}
                {history.length > 0 && (
                    <div className="border-t border-[#454545] pt-2 mt-1 flex-1 flex flex-col min-h-0 relative group/history">
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
                                        className="w-full text-left text-xs px-2 py-1.5 bg-[#1e1e1e] text-gray-300 rounded hover:bg-[#333] transition-colors font-mono truncate pr-7"
                                        title={item}
                                    >
                                        {item}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newHistory = history.filter((_, i) => i !== idx);
                                            setHistory(newHistory);
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-[#444] opacity-0 group-hover:opacity-100 transition-all"
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
                                    className="w-full bg-[#424242] hover:bg-[#4f4f4f] rounded-full cursor-pointer relative"
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


            {/* 调整大小手柄 */}
            <div
                className="absolute bottom-0 right-0 w-4 h-full cursor-ew-resize z-10 flex items-center justify-end p-0.5 group/resize"
                onMouseDown={handleResizeMouseDown}
            >
                <div className="w-1 h-8 bg-gray-600 rounded-full opacity-0 group-hover/resize:opacity-50 transition-opacity"></div>
            </div>
        </div >
    );
};
