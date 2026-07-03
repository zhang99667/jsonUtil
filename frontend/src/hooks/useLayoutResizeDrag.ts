import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { getPaneMouseResizePercent, getSidebarMouseResizeWidth } from './layoutResize';
import { useWindowMouseDragListeners } from './useWindowMouseDragListeners';

interface UseLayoutResizeDragInput {
  appRef: RefObject<HTMLDivElement>;
  sidebarWidth: number;
  isResizingSidebar: boolean;
  isResizingPane: boolean;
  setSidebarWidth: Dispatch<SetStateAction<number>>;
  setLeftPaneWidthPercent: Dispatch<SetStateAction<number>>;
  setIsResizingSidebar: Dispatch<SetStateAction<boolean>>;
  setIsResizingPane: Dispatch<SetStateAction<boolean>>;
}

export const useLayoutResizeDrag = ({
  appRef,
  sidebarWidth,
  isResizingSidebar,
  isResizingPane,
  setSidebarWidth,
  setLeftPaneWidthPercent,
  setIsResizingSidebar,
  setIsResizingPane,
}: UseLayoutResizeDragInput) => {
  const startResizingSidebar = useCallback(() => setIsResizingSidebar(true), [setIsResizingSidebar]);
  const startResizingPane = useCallback(() => setIsResizingPane(true), [setIsResizingPane]);
  const stopResizing = useCallback(() => {
    setIsResizingSidebar(false);
    setIsResizingPane(false);
  }, [setIsResizingPane, setIsResizingSidebar]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isResizingSidebar) {
      setSidebarWidth(getSidebarMouseResizeWidth(event.clientX));
    }
    if (isResizingPane && appRef.current) {
      const appRect = appRef.current.getBoundingClientRect();
      setLeftPaneWidthPercent(getPaneMouseResizePercent({
        clientX: event.clientX,
        appLeft: appRect.left,
        appWidth: appRect.width,
        sidebarWidth,
      }));
    }
  }, [
    appRef,
    isResizingPane,
    isResizingSidebar,
    setLeftPaneWidthPercent,
    setSidebarWidth,
    sidebarWidth,
  ]);

  useWindowMouseDragListeners({
    isActive: isResizingSidebar || isResizingPane,
    onMouseMove: handleMouseMove,
    onMouseUp: stopResizing,
  });

  return {
    startResizingSidebar,
    startResizingPane,
  };
};
