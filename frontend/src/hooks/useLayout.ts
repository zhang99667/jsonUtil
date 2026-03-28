import { useState, useCallback, useEffect, RefObject } from 'react';

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
            const newWidth = Math.max(180, Math.min(400, e.clientX));
            setSidebarWidth(newWidth);
        }
        if (isResizingPane && appRef.current) {
            const appRect = appRef.current.getBoundingClientRect();
            const editorAreaLeft = appRect.left + sidebarWidth;
            const editorAreaWidth = appRect.width - sidebarWidth;
            const relativeX = e.clientX - editorAreaLeft;
            const newPercent = (relativeX / editorAreaWidth) * 100;
            setLeftPaneWidthPercent(Math.max(20, Math.min(80, newPercent)));
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
