import { useState, type RefObject } from 'react';
import { useLayoutResizeDrag } from './useLayoutResizeDrag';

export const useLayout = (appRef: RefObject<HTMLDivElement>) => {
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [leftPaneWidthPercent, setLeftPaneWidthPercent] = useState(50);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingPane, setIsResizingPane] = useState(false);

    const {
        startResizingSidebar,
        startResizingPane,
    } = useLayoutResizeDrag({
        appRef,
        sidebarWidth,
        isResizingSidebar,
        isResizingPane,
        setSidebarWidth,
        setLeftPaneWidthPercent,
        setIsResizingSidebar,
        setIsResizingPane,
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
        startResizingPane,
    };
};
