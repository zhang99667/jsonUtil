import type { CustomScrollbarMetricsInput } from './customScrollbar';

export type CustomScrollbarOrientation = 'vertical' | 'horizontal';

type CustomScrollbarContainer = Pick<
  HTMLDivElement,
  'scrollTop' | 'scrollLeft' | 'scrollHeight' | 'scrollWidth' | 'clientHeight' | 'clientWidth'
>;

type CustomScrollbarPointerEvent = Pick<MouseEvent, 'pageX' | 'pageY'>;

export const readCustomScrollbarMetrics = (
  container: CustomScrollbarContainer,
  orientation: CustomScrollbarOrientation
): CustomScrollbarMetricsInput => {
  if (orientation === 'vertical') {
    return {
      scrollPos: container.scrollTop,
      scrollSize: container.scrollHeight,
      clientSize: container.clientHeight,
    };
  }

  return {
    scrollPos: container.scrollLeft,
    scrollSize: container.scrollWidth,
    clientSize: container.clientWidth,
  };
};

export const getCustomScrollbarPointerPos = (
  event: CustomScrollbarPointerEvent,
  orientation: CustomScrollbarOrientation
) => orientation === 'vertical' ? event.pageY : event.pageX;

export const setCustomScrollbarScrollPos = (
  container: Pick<HTMLDivElement, 'scrollTop' | 'scrollLeft'>,
  orientation: CustomScrollbarOrientation,
  scrollPos: number
) => {
  if (orientation === 'vertical') {
    container.scrollTop = scrollPos;
    return;
  }

  container.scrollLeft = scrollPos;
};
