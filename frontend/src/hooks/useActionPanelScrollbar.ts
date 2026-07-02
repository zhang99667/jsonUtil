import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  EMPTY_ACTION_PANEL_SCROLL_STATE,
  getActionPanelDragScrollTop,
  getActionPanelScrollbarThumbState,
} from '../utils/actionPanelScrollbar';

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

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setScrollState({
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
    });
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

    requestAnimationFrame(() => {
      onScrollFrame();
    });
    updateScrollState();
  }, [onScrollFrame, updateScrollState]);

  const handleScrollbarMouseDown = useCallback((event: ReactMouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      y: event.pageY,
      scrollTop: containerRef.current?.scrollTop ?? scrollState.scrollTop,
    };
    event.preventDefault();
  }, [scrollState.scrollTop]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;

      containerRef.current.scrollTop = getActionPanelDragScrollTop({
        startScrollTop: dragStartRef.current.scrollTop,
        deltaY: event.pageY - dragStartRef.current.y,
        scrollHeight: scrollState.scrollHeight,
        clientHeight: scrollState.clientHeight,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scrollState.clientHeight, scrollState.scrollHeight]);

  return {
    containerRef,
    handleScroll,
    handleScrollbarMouseDown,
    showScrollbar: scrollState.scrollHeight > scrollState.clientHeight,
    ...getActionPanelScrollbarThumbState(scrollState),
  };
};
