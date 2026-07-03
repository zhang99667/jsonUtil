import { useState, useCallback, type RefObject } from 'react';
import { getPaneMouseResizePercent, getSidebarMouseResizeWidth } from './layoutResize';
import { useWindowMouseDragListeners } from './useWindowMouseDragListeners';

export const useLayout = (appRef: RefObject<HTMLDivElement>) => {
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [leftPaneWidthPercent, setLeftPaneWidthPercent] = useState(50);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingPane, setIsResizingPane] = useState(false);

    const startResizingSidebar = () => setIsResizingSidebar(true);
    const startResizingPane = () => setIsResizingPane(true);
    const stopResizing = useCallback(() => {
        setIsResizingSidebar(false);
        setIsResizingPane(false);
    }, []);

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

    useWindowMouseDragListeners({
        isActive: isResizingSidebar || isResizingPane,
        onMouseMove: handleMouseMove,
        onMouseUp: stopResizing,
    });

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
