import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  EMPTY_CUSTOM_SCROLLBAR_METRICS,
  getCustomScrollbarDragScrollPos,
  getCustomScrollbarThumbMetrics,
} from '../utils/customScrollbar';
import { useWindowMouseDragListeners } from './useWindowMouseDragListeners';

type Orientation = 'vertical' | 'horizontal';

export const useCustomScrollbar = (orientation: Orientation = 'vertical', dependency?: unknown) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState(EMPTY_CUSTOM_SCROLLBAR_METRICS);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerPos: 0, scrollPos: 0 });

  const updateScrollDimensions = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (orientation === 'vertical') {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setMetrics({ scrollPos: scrollTop, scrollSize: scrollHeight, clientSize: clientHeight });
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setMetrics({ scrollPos: scrollLeft, scrollSize: scrollWidth, clientSize: clientWidth });
  }, [orientation]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(updateScrollDimensions);
    resizeObserver.observe(container);
    Array.from(container.children).forEach(child => resizeObserver.observe(child as Element));

    return () => resizeObserver.disconnect();
  }, [updateScrollDimensions, dependency]);

  const handleScroll = () => {
    updateScrollDimensions();
  };

  const handleMouseDown = (event: MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      pointerPos: orientation === 'vertical' ? event.pageY : event.pageX,
      scrollPos: metrics.scrollPos,
    };
    event.preventDefault();
  };

  const handleDragMouseMove = useCallback((event: globalThis.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentPos = orientation === 'vertical' ? event.pageY : event.pageX;
    const nextScrollPos = getCustomScrollbarDragScrollPos({
      startScrollPos: dragStartRef.current.scrollPos,
      delta: currentPos - dragStartRef.current.pointerPos,
      scrollSize: metrics.scrollSize,
      clientSize: metrics.clientSize,
    });

    if (orientation === 'vertical') {
      container.scrollTop = nextScrollPos;
      return;
    }

    container.scrollLeft = nextScrollPos;
  }, [metrics.clientSize, metrics.scrollSize, orientation]);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  useWindowMouseDragListeners({
    isActive: isDragging,
    onMouseMove: handleDragMouseMove,
    onMouseUp: stopDragging,
  });

  const { thumbSize, thumbOffset, showScrollbar } = getCustomScrollbarThumbMetrics(metrics);

  return {
    scrollContainerRef,
    handleScroll,
    handleMouseDown,
    thumbSize,
    thumbOffset,
    showScrollbar,
    isDragging,
  };
};
