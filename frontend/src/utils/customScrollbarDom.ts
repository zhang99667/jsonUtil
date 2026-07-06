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
  const isVertical = orientation === 'vertical';

  return {
    scrollPos: isVertical ? container.scrollTop : container.scrollLeft,
    scrollSize: isVertical ? container.scrollHeight : container.scrollWidth,
    clientSize: isVertical ? container.clientHeight : container.clientWidth,
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
  container[orientation === 'vertical' ? 'scrollTop' : 'scrollLeft'] = scrollPos;
};
