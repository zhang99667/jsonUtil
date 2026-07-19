export interface CustomScrollbarMetricsInput {
  scrollPos: number;
  scrollSize: number;
  clientSize: number;
}

export const EMPTY_CUSTOM_SCROLLBAR_METRICS: CustomScrollbarMetricsInput = {
  scrollPos: 0,
  scrollSize: 0,
  clientSize: 0,
};

export interface CustomScrollbarThumbMetrics {
  thumbSize: number;
  thumbOffset: number;
  showScrollbar: boolean;
}

export interface CustomScrollbarDragInput {
  startScrollPos: number;
  delta: number;
  scrollSize: number;
  clientSize: number;
}

const MIN_THUMB_SIZE_PERCENT = 5;

export const getCustomScrollbarThumbMetrics = ({
  scrollPos,
  scrollSize,
  clientSize,
}: CustomScrollbarMetricsInput): CustomScrollbarThumbMetrics => {
  const showScrollbar = scrollSize > clientSize + 1;
  if (!showScrollbar || scrollSize <= 0 || clientSize <= 0) {
    return { thumbSize: 0, thumbOffset: 0, showScrollbar: false };
  }

  const thumbSize = Math.min(100, Math.max((clientSize / scrollSize) * 100, MIN_THUMB_SIZE_PERCENT));
  const scrollRange = scrollSize - clientSize;
  const thumbTravel = 100 - thumbSize;
  const thumbOffset = Math.min(
    thumbTravel,
    Math.max(0, (scrollPos / scrollRange) * thumbTravel)
  );

  return { thumbSize, thumbOffset, showScrollbar };
};

export const getCustomScrollbarDragScrollPos = ({
  startScrollPos,
  delta,
  scrollSize,
  clientSize,
}: CustomScrollbarDragInput): number => {
  const { thumbSize, showScrollbar } = getCustomScrollbarThumbMetrics({
    scrollPos: startScrollPos,
    scrollSize,
    clientSize,
  });
  if (!showScrollbar) return startScrollPos;

  const scrollRange = scrollSize - clientSize;
  const thumbTravelPixels = clientSize * (1 - thumbSize / 100);
  if (thumbTravelPixels <= 0) return startScrollPos;
  return startScrollPos + delta * (scrollRange / thumbTravelPixels);
};
