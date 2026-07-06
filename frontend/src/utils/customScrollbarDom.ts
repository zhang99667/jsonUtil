import type { CustomScrollbarMetricsInput } from './customScrollbar';

export type CustomScrollbarOrientation = 'vertical' | 'horizontal';

const CUSTOM_SCROLLBAR_AXIS_FIELDS = {
  vertical: ['scrollTop', 'scrollHeight', 'clientHeight', 'pageY'],
  horizontal: ['scrollLeft', 'scrollWidth', 'clientWidth', 'pageX'],
} as const;

type CustomScrollbarAxisFields = typeof CUSTOM_SCROLLBAR_AXIS_FIELDS[CustomScrollbarOrientation];
type CustomScrollbarContainer = Pick<HTMLDivElement, CustomScrollbarAxisFields[0 | 1 | 2]>;

export const readCustomScrollbarMetrics = (
  container: CustomScrollbarContainer,
  orientation: CustomScrollbarOrientation
): CustomScrollbarMetricsInput => {
  const [scrollPosField, scrollSizeField, clientSizeField] = CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation];
  return {
    scrollPos: container[scrollPosField],
    scrollSize: container[scrollSizeField],
    clientSize: container[clientSizeField],
  };
};

export const getCustomScrollbarPointerPos = (
  event: Pick<MouseEvent, CustomScrollbarAxisFields[3]>,
  orientation: CustomScrollbarOrientation
) => event[CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation][3]];

export const setCustomScrollbarScrollPos = (
  container: Pick<HTMLDivElement, 'scrollTop' | 'scrollLeft'>,
  orientation: CustomScrollbarOrientation,
  scrollPos: number
) => {
  container[CUSTOM_SCROLLBAR_AXIS_FIELDS[orientation][0]] = scrollPos;
};
