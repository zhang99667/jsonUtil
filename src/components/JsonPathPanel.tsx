import React, { useState, useRef, useEffect } from 'react';
import { JSONPath } from 'jsonpath-plus';

interface JsonPathPanelProps {
    jsonData: string;
    isOpen: boolean;
    onClose: () => void;
    onQueryResult: (result: string) => void; // 新增：回调函数将结果传递给父组件
}

export const JsonPathPanel: React.FC<JsonPathPanelProps> = ({ jsonData, isOpen, onClose, onQueryResult }) => {
    const [query, setQuery] = useState<string>('$');
    const [error, setError] = useState<string>('');
    const [history, setHistory] = useState<string[]>(() => {
        const saved = localStorage.getItem('jsonpath-query-history');
        return saved ? JSON.parse(saved) : [];
    });

    // 拖动相关状态
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    // 保存历史记录到 localStorage
    useEffect(() => {
        localStorage.setItem('jsonpath-query-history', JSON.stringify(history));
    }, [history]);

    // 处理拖动
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            setDragStart({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
            setIsDragging(true);
        }
    };

    const handleQuery = () => {
        setError('');

        // Validate JSON data
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
                } else {
                    // 传递原始查询表达式给父组件，以便在右侧编辑器中高亮显示
                    onQueryResult(query);

                    // 添加到历史记录（去重）
                    if (!history.includes(query)) {
                        setHistory(prev => [query, ...prev].slice(0, 10)); // 保留最近10条
                    }
                }
            } catch (e: any) {
                setError(`JSONPath 查询错误: ${e.message}`);
            }
        } catch (e: any) {
            setError(`JSON 解析错误: ${e.message}`);
        }
    };

    const examples = [
        { label: '根节点', query: '$' },
        { label: '所有属性', query: '$.*' },
        { label: '数组第一项', query: '$[0]' },
        { label: '递归搜索', query: '$..name' },
        { label: '过滤条件', query: '$[?(@.age > 18)]' },
    ];

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('jsonpath-query-history');
    };

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="fixed bg-[#252526] border border-[#454545] rounded-lg shadow-2xl z-50 w-[600px]"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
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

            {/* Content */}
            <div className="p-4">
                {/* Query Input */}
                <div className="mb-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
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

                {/* Examples */}
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

                {/* Error Display */}
                {error && (
                    <div className="mb-3 p-3 bg-[#3c1515] border border-red-900/50 rounded text-sm text-red-300 flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* History */}
                {history.length > 0 && (
                    <div className="border-t border-[#454545] pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-500">查询历史:</div>
                            <button
                                onClick={clearHistory}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                清空
                            </button>
                        </div>
                        <div className="max-h-[150px] overflow-y-auto space-y-1">
                            {history.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setQuery(item)}
                                    className="w-full text-left text-xs px-2 py-1.5 bg-[#1e1e1e] text-gray-300 rounded hover:bg-[#333] transition-colors font-mono truncate"
                                    title={item}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hint */}
                <div className="mt-3 text-xs text-gray-500 italic">
                    查询结果将显示在右侧 PREVIEW 编辑器中
                </div>
            </div>
        </div>
    );
};
