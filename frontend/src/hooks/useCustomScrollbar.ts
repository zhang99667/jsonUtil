import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  EMPTY_CUSTOM_SCROLLBAR_METRICS,
  getCustomScrollbarDragScrollPos,
  getCustomScrollbarThumbMetrics,
} from '../utils/customScrollbar';
import {
  getCustomScrollbarPointerPos,
  readCustomScrollbarMetrics,
  setCustomScrollbarScrollPos,
  type CustomScrollbarOrientation,
} from '../utils/customScrollbarDom';
import { useWindowMouseDragListeners } from './useWindowMouseDragListeners';

export const useCustomScrollbar = (orientation: CustomScrollbarOrientation = 'vertical', dependency?: unknown) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState(EMPTY_CUSTOM_SCROLLBAR_METRICS);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerPos: 0, scrollPos: 0 });

  const updateScrollDimensions = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setMetrics(readCustomScrollbarMetrics(container, orientation));
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
      pointerPos: getCustomScrollbarPointerPos(event.nativeEvent, orientation),
      scrollPos: metrics.scrollPos,
    };
    event.preventDefault();
  };

  const handleDragMouseMove = useCallback((event: globalThis.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentPos = getCustomScrollbarPointerPos(event, orientation);
    const nextScrollPos = getCustomScrollbarDragScrollPos({
      startScrollPos: dragStartRef.current.scrollPos,
      delta: currentPos - dragStartRef.current.pointerPos,
      scrollSize: metrics.scrollSize,
      clientSize: metrics.clientSize,
    });

    setCustomScrollbarScrollPos(container, orientation, nextScrollPos);
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
