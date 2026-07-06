import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  EMPTY_ACTION_PANEL_SCROLL_STATE,
  getActionPanelDragScrollTop,
  getActionPanelScrollbarViewState,
} from '../utils/actionPanelScrollbar';
import { readActionPanelScrollState } from '../utils/actionPanelScrollbarDom';
import { getCustomScrollbarPointerPos, setCustomScrollbarScrollPos } from '../utils/customScrollbarDom';
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
  const dragStartRef = useRef({ pointerPos: 0, scrollTop: 0 });
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
      pointerPos: getCustomScrollbarPointerPos(event.nativeEvent, 'vertical'),
      scrollTop: containerRef.current?.scrollTop ?? scrollState.scrollTop,
    };
    event.preventDefault();
  }, [scrollState.scrollTop]);

  const handleDragMouseMove = useCallback((event: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    setCustomScrollbarScrollPos(container, 'vertical', getActionPanelDragScrollTop({
      scrollTop: dragStartRef.current.scrollTop,
      startPointerY: dragStartRef.current.pointerPos,
      currentPointerY: getCustomScrollbarPointerPos(event, 'vertical'),
      scrollHeight: scrollState.scrollHeight,
      clientHeight: scrollState.clientHeight,
    }));
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
    scrollbarViewState: getActionPanelScrollbarViewState(scrollState),
  };
};
