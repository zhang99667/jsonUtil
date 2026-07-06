import { useCallback } from 'react';
import { useCustomScrollbar } from './useCustomScrollbar';
import { useRafCallback } from './useRafCallback';

interface UseActionPanelScrollbarOptions {
  isCollapsed: boolean;
  onScrollFrame: () => void;
}

export const useActionPanelScrollbar = ({
  isCollapsed,
  onScrollFrame,
}: UseActionPanelScrollbarOptions) => {
  const {
    scrollContainerRef: containerRef,
    handleScroll: handleCustomScrollbarScroll,
    handleMouseDown: onMouseDown,
    thumbSize: thumbHeight,
    thumbOffset: thumbTop,
    showScrollbar,
  } = useCustomScrollbar('vertical', isCollapsed);
  const scheduleScrollFrame = useRafCallback(onScrollFrame);

  const handleScroll = useCallback(() => {
    scheduleScrollFrame();
    handleCustomScrollbarScroll();
  }, [handleCustomScrollbarScroll, scheduleScrollFrame]);

  return {
    containerRef,
    handleScroll,
    scrollbarProps: {
      showScrollbar,
      thumbHeight,
      thumbTop,
      onMouseDown,
    },
  };
};
