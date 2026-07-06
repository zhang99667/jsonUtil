import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';

interface JsonPathPanelResultPreviewRowContentProps {
    item: JsonPathResultPreviewItem;
}

export const JsonPathPanelResultPreviewRowContent: React.FC<JsonPathPanelResultPreviewRowContentProps> = ({ item }) => (
    <div className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 text-[10px] text-gray-500">{item.displayIndex}</span>
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
);
