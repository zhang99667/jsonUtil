import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  getActionPanelDragScrollTop,
  getActionPanelScrollbarThumbState,
  type ActionPanelScrollState,
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
  const [scrollState, setScrollState] = useState<ActionPanelScrollState>({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setShowScrollbar(container.scrollHeight > container.clientHeight);
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
    setStartY(event.pageY);
    setStartScrollTop(scrollState.scrollTop);
    event.preventDefault();
  }, [scrollState.scrollTop]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      containerRef.current.scrollTop = getActionPanelDragScrollTop({
        startScrollTop,
        deltaY: event.pageY - startY,
        scrollHeight: scrollState.scrollHeight,
        clientHeight: scrollState.clientHeight,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scrollState.clientHeight, scrollState.scrollHeight, startScrollTop, startY]);

  return {
    containerRef,
    handleScroll,
    handleScrollbarMouseDown,
    showScrollbar,
    ...getActionPanelScrollbarThumbState(scrollState),
  };
};
