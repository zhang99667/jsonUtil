import type { CustomScrollbarMetricsInput } from './customScrollbar';

export type CustomScrollbarOrientation = 'vertical' | 'horizontal';

const CUSTOM_SCROLLBAR_AXIS_FIELDS = {
  vertical: { scrollPos: 'scrollTop', scrollSize: 'scrollHeight', clientSize: 'clientHeight', pointerPos: 'pageY' },
  horizontal: { scrollPos: 'scrollLeft', scrollSize: 'scrollWidth', clientSize: 'clientWidth', pointerPos: 'pageX' },
} as const;

type CustomScrollbarAxisFields<Orientation extends CustomScrollbarOrientation> = typeof CUSTOM_SCROLLBAR_AXIS_FIELDS[Orientation];

export const readCustomScrollbarMetrics = <Orientation extends CustomScrollbarOrientation>(
  container: Pick<HTMLDivElement, CustomScrollbarAxisFields<Orientation>['scrollPos' | 'scrollSize' | 'clientSize']>,
  orientation: Orientation
): CustomScrollbarMetricsInput => {
  const { scrollPos, scrollSize, clientSize } = CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation];
  return {
    scrollPos: container[scrollPos],
    scrollSize: container[scrollSize],
    clientSize: container[clientSize],
  };
};

export const getCustomScrollbarPointerPos = <Orientation extends CustomScrollbarOrientation>(
  event: Pick<MouseEvent, CustomScrollbarAxisFields<Orientation>['pointerPos']>,
  orientation: Orientation
) => event[CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation].pointerPos];

export const setCustomScrollbarScrollPos = <Orientation extends CustomScrollbarOrientation>(
  container: Pick<HTMLDivElement, CustomScrollbarAxisFields<Orientation>['scrollPos']>,
  orientation: Orientation,
  scrollPos: number
) => {
  container[CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation].scrollPos] = scrollPos;
};
