import React from 'react';
import { JsonPathPanelSavedQueryRow, type JsonPathSavedQueryTone } from './JsonPathPanelSavedQueryRow';

interface JsonPathPanelSavedQueryListProps {
    items: string[];
    tone: JsonPathSavedQueryTone;
    className: string;
    dataTour: string;
    selectLabelPrefix: string;
    removeLabelPrefix: string;
    listRef?: React.Ref<HTMLDivElement>;
    onScroll?: React.UIEventHandler<HTMLDivElement>;
    onWheel: React.WheelEventHandler<HTMLDivElement>;
    onSelectQuery: (query: string) => void;
    onRemoveQuery: (query: string, index: number) => void;
}

export const JsonPathPanelSavedQueryList: React.FC<JsonPathPanelSavedQueryListProps> = ({
    items,
    tone,
    className,
    dataTour,
    selectLabelPrefix,
    removeLabelPrefix,
    listRef,
    onScroll,
    onWheel,
    onSelectQuery,
    onRemoveQuery,
}) => (
    <div ref={listRef} onScroll={onScroll} onWheel={onWheel} className={className}>
        {items.map((item, index) => (
            <JsonPathPanelSavedQueryRow
                key={`${item}-${index}`}
                item={item}
                tone={tone}
                dataTour={dataTour}
                selectLabel={`${selectLabelPrefix}${item}`}
                removeLabel={`${removeLabelPrefix}${item}`}
                onSelect={() => onSelectQuery(item)}
                onRemove={() => onRemoveQuery(item, index)}
            />
        ))}
    </div>
);
