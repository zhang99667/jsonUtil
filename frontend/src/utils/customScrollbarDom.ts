import type { CustomScrollbarMetricsInput } from './customScrollbar';

export type CustomScrollbarOrientation = 'vertical' | 'horizontal';

const CUSTOM_SCROLLBAR_AXIS_FIELDS = {
  vertical: { scrollPos: 'scrollTop', scrollSize: 'scrollHeight', clientSize: 'clientHeight', pointerPos: 'pageY' },
  horizontal: { scrollPos: 'scrollLeft', scrollSize: 'scrollWidth', clientSize: 'clientWidth', pointerPos: 'pageX' },
} as const;

export const readCustomScrollbarMetrics = (
  container: HTMLDivElement,
  orientation: CustomScrollbarOrientation
): CustomScrollbarMetricsInput => {
  const { scrollPos, scrollSize, clientSize } = CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation];
  return {
    scrollPos: container[scrollPos],
    scrollSize: container[scrollSize],
    clientSize: container[clientSize],
  };
};

export const getCustomScrollbarPointerPos = (
  event: MouseEvent,
  orientation: CustomScrollbarOrientation
) => event[CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation].pointerPos];

export const setCustomScrollbarScrollPos = (
  container: HTMLDivElement,
  orientation: CustomScrollbarOrientation,
  scrollPos: number
) => {
  container[CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation].scrollPos] = scrollPos;
};
