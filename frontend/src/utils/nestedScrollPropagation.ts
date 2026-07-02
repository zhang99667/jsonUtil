export const shouldStopNestedScrollPropagation = (
  scrollHeight: number,
  clientHeight: number
): boolean => scrollHeight > clientHeight;
