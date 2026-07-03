import { useCallback, type KeyboardEvent, type RefObject } from 'react';
import {
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
    const nextWidth = getSidebarKeyboardResizeWidth(sidebarWidth, event.key, event.shiftKey);
    if (nextWidth === null) return;

    event.preventDefault();
    setSidebarWidth(nextWidth);
  }, [setSidebarWidth, sidebarWidth]);

  const handlePaneResizeKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const nextPercent = getPaneKeyboardResizePercent(leftPaneWidthPercent, event.key, event.shiftKey);
    if (nextPercent === null) return;

    event.preventDefault();
    setLeftPaneWidthPercent(nextPercent);
  }, [leftPaneWidthPercent, setLeftPaneWidthPercent]);

  return {
    ...layout,
    handleSidebarResizeKeyDown,
    handlePaneResizeKeyDown,
  };
};
