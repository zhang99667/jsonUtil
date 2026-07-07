import React from 'react';

interface JsonPathPanelResultPreviewFrameProps {
    onWheel: React.WheelEventHandler<HTMLElement>;
    children: React.ReactNode;
}

export const JsonPathPanelResultPreviewFrame: React.FC<JsonPathPanelResultPreviewFrameProps> = ({
    onWheel,
    children,
}) => (
    <div
        data-tour="jsonpath-results"
        onWheel={onWheel}
        className="mb-3 max-h-24 flex-shrink-0 overflow-y-auto overscroll-contain rounded border border-editor-border bg-editor-bg/60 p-1 space-y-1 [&::-webkit-scrollbar]:hidden"
    >
        {children}
    </div>
);
