import React from 'react';

interface JsonPathPanelResultPreviewMessagesProps {
    hiddenResultCount: number;
    maxVisibleResultCount: number;
    copiedResultCount: number;
    isResultLimited: boolean;
    resultLimit: number;
}

export const JsonPathPanelResultPreviewMessages: React.FC<JsonPathPanelResultPreviewMessagesProps> = ({
    hiddenResultCount,
    maxVisibleResultCount,
    copiedResultCount,
    isResultLimited,
    resultLimit,
}) => (
    <>
        {hiddenResultCount > 0 && (
            <div className="px-2 py-1 text-[11px] text-gray-500">
                仅显示前 {maxVisibleResultCount} 项，复制按钮可导出已返回的 {copiedResultCount} 项
            </div>
        )}
        {isResultLimited && (
            <div className="px-2 py-1 text-[11px] text-amber-300">
                为保护性能，命中超过 {resultLimit} 项后已提前停止
            </div>
        )}
    </>
);
