export type JsonPathResultNavigationDirection = 'previous' | 'next';

export interface JsonPathResultNavigationInput {
  currentIndex: number;
  resultCount: number;
  direction: JsonPathResultNavigationDirection;
  isDisabled?: boolean;
}

export const getJsonPathResultNavigationIndex = ({
  currentIndex,
  resultCount,
  direction,
  isDisabled = false,
}: JsonPathResultNavigationInput): number | null => {
  if (isDisabled || resultCount <= 0) return null;

  const safeCurrentIndex = currentIndex >= 0 && currentIndex < resultCount ? currentIndex : 0;
  if (direction === 'previous') {
    return safeCurrentIndex === 0 ? resultCount - 1 : safeCurrentIndex - 1;
  }
  return safeCurrentIndex === resultCount - 1 ? 0 : safeCurrentIndex + 1;
};

export const getJsonPathResultFocusIndex = (
  index: number,
  resultCount: number,
  isDisabled = false
): number | null => {
  if (isDisabled || resultCount <= 0 || index < 0 || index >= resultCount) return null;
  return index;
};
