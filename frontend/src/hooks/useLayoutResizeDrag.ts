import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { updateLayoutResizeDrag } from './layoutResizeDragUpdate';
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
    updateLayoutResizeDrag({
      clientX: event.clientX,
      appElement: appRef.current,
      sidebarWidth,
      isResizingSidebar,
      isResizingPane,
      setSidebarWidth,
      setLeftPaneWidthPercent,
    });
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
