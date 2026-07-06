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
    handleMouseDown: handleScrollbarMouseDown,
    thumbSize,
    thumbOffset,
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
    handleScrollbarMouseDown,
    scrollbarViewState: {
      showScrollbar,
      thumbHeight: thumbSize,
      thumbTop: thumbOffset,
    },
  };
};
