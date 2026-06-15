import { useState, useCallback, useEffect, RefObject } from 'react';

export const SIDEBAR_MIN_WIDTH = 180;
export const SIDEBAR_MAX_WIDTH = 400;
export const LEFT_PANE_MIN_PERCENT = 20;
export const LEFT_PANE_MAX_PERCENT = 80;

export const clampLayoutValue = (value: number, min: number, max: number) => (
    Math.max(min, Math.min(max, value))
);

export const useLayout = (appRef: RefObject<HTMLDivElement>) => {
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [leftPaneWidthPercent, setLeftPaneWidthPercent] = useState(50);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingPane, setIsResizingPane] = useState(false);

    const startResizingSidebar = () => setIsResizingSidebar(true);
    const startResizingPane = () => setIsResizingPane(true);
    const stopResizing = () => {
        setIsResizingSidebar(false);
        setIsResizingPane(false);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizingSidebar) {
            const newWidth = clampLayoutValue(e.clientX, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH);
            setSidebarWidth(newWidth);
        }
        if (isResizingPane && appRef.current) {
            const appRect = appRef.current.getBoundingClientRect();
            const editorAreaLeft = appRect.left + sidebarWidth;
            const editorAreaWidth = appRect.width - sidebarWidth;
            const relativeX = e.clientX - editorAreaLeft;
            const newPercent = (relativeX / editorAreaWidth) * 100;
            setLeftPaneWidthPercent(clampLayoutValue(newPercent, LEFT_PANE_MIN_PERCENT, LEFT_PANE_MAX_PERCENT));
        }
    }, [isResizingSidebar, isResizingPane, sidebarWidth, appRef]);

    // 仅在拖拽状态下挂载全局鼠标事件监听器，避免非拖拽时的无效监听开销
    useEffect(() => {
        if (!isResizingSidebar && !isResizingPane) return;

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizingSidebar, isResizingPane, handleMouseMove]);

    return {
        sidebarWidth,
        setSidebarWidth,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        leftPaneWidthPercent,
        setLeftPaneWidthPercent,
        isResizingSidebar,
        isResizingPane,
        startResizingSidebar,
        startResizingPane
    };
};
