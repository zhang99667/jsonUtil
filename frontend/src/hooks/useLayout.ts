import { useState, useCallback, useEffect, type RefObject } from 'react';
import { getPaneMouseResizePercent, getSidebarMouseResizeWidth } from './layoutResize';

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
            setSidebarWidth(getSidebarMouseResizeWidth(e.clientX));
        }
        if (isResizingPane && appRef.current) {
            const appRect = appRef.current.getBoundingClientRect();
            setLeftPaneWidthPercent(getPaneMouseResizePercent({
                clientX: e.clientX,
                appLeft: appRect.left,
                appWidth: appRect.width,
                sidebarWidth,
            }));
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
