import { useCallback, type KeyboardEvent, type RefObject } from 'react';
import {
  applyLayoutKeyboardResize,
  getPaneKeyboardResizePercent,
  getSidebarKeyboardResizeWidth,
} from './layoutKeyboardResize';
import { useLayout } from './useLayout';

export const useAppLayoutController = (appRef: RefObject<HTMLDivElement>) => {
  const layout = useLayout(appRef);
  const {
    sidebarWidth,
    setSidebarWidth,
    leftPaneWidthPercent,
    setLeftPaneWidthPercent,
  } = layout;

  const handleSidebarResizeKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    applyLayoutKeyboardResize({
      event,
      currentValue: sidebarWidth,
      getNextValue: getSidebarKeyboardResizeWidth,
      onResize: setSidebarWidth,
    });
  }, [setSidebarWidth, sidebarWidth]);

  const handlePaneResizeKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    applyLayoutKeyboardResize({
      event,
      currentValue: leftPaneWidthPercent,
      getNextValue: getPaneKeyboardResizePercent,
      onResize: setLeftPaneWidthPercent,
    });
  }, [leftPaneWidthPercent, setLeftPaneWidthPercent]);

  return {
    ...layout,
    handleSidebarResizeKeyDown,
    handlePaneResizeKeyDown,
  };
};
