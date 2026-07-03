import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  EMPTY_ACTION_PANEL_SCROLL_STATE,
  getActionPanelDragScrollTop,
  getActionPanelScrollbarThumbState,
} from '../utils/actionPanelScrollbar';
import { readActionPanelScrollState } from '../utils/actionPanelScrollbarDom';
import { useRafCallback } from './useRafCallback';
import { useWindowMouseDragListeners } from './useWindowMouseDragListeners';

interface UseActionPanelScrollbarOptions {
  isCollapsed: boolean;
  onScrollFrame: () => void;
}

export const useActionPanelScrollbar = ({
  isCollapsed,
  onScrollFrame,
}: UseActionPanelScrollbarOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState(EMPTY_ACTION_PANEL_SCROLL_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, scrollTop: 0 });
  const scheduleScrollFrame = useRafCallback(onScrollFrame);

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setScrollState(readActionPanelScrollState(container));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [isCollapsed, updateScrollState]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    scheduleScrollFrame();
    updateScrollState();
  }, [scheduleScrollFrame, updateScrollState]);

  const handleScrollbarMouseDown = useCallback((event: ReactMouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      y: event.pageY,
      scrollTop: containerRef.current?.scrollTop ?? scrollState.scrollTop,
    };
    event.preventDefault();
  }, [scrollState.scrollTop]);

  const handleDragMouseMove = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;

    containerRef.current.scrollTop = getActionPanelDragScrollTop({
      startScrollTop: dragStartRef.current.scrollTop,
      deltaY: event.pageY - dragStartRef.current.y,
      scrollHeight: scrollState.scrollHeight,
      clientHeight: scrollState.clientHeight,
    });
  }, [scrollState.clientHeight, scrollState.scrollHeight]);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  useWindowMouseDragListeners({
    isActive: isDragging,
    onMouseMove: handleDragMouseMove,
    onMouseUp: stopDragging,
  });

  return {
    containerRef,
    handleScroll,
    handleScrollbarMouseDown,
    showScrollbar: scrollState.scrollHeight > scrollState.clientHeight,
    ...getActionPanelScrollbarThumbState(scrollState),
  };
};
