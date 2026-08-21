export const JSON_COMPARE_EDITOR_MIN_PERCENT = 38;
export const JSON_COMPARE_EDITOR_MAX_PERCENT = 78;
export const JSON_COMPARE_EDITOR_DEFAULT_PERCENT = 58;
export const JSON_COMPARE_EDITOR_KEYBOARD_STEP = 4;

export const clampJsonCompareEditorPercent = (value: number): number => (
  Math.min(
    JSON_COMPARE_EDITOR_MAX_PERCENT,
    Math.max(JSON_COMPARE_EDITOR_MIN_PERCENT, Math.round(value)),
  )
);

export const getJsonCompareEditorPercentFromPointer = (
  clientY: number,
  containerTop: number,
  containerHeight: number,
): number => {
  if (containerHeight <= 0) return JSON_COMPARE_EDITOR_DEFAULT_PERCENT;
  return clampJsonCompareEditorPercent(((clientY - containerTop) / containerHeight) * 100);
};

export const adjustJsonCompareEditorPercentByKey = (
  current: number,
  key: string,
): number | null => {
  if (key === 'ArrowUp') {
    return clampJsonCompareEditorPercent(current - JSON_COMPARE_EDITOR_KEYBOARD_STEP);
  }
  if (key === 'ArrowDown') {
    return clampJsonCompareEditorPercent(current + JSON_COMPARE_EDITOR_KEYBOARD_STEP);
  }
  if (key === 'Home') return JSON_COMPARE_EDITOR_MIN_PERCENT;
  if (key === 'End') return JSON_COMPARE_EDITOR_MAX_PERCENT;
  return null;
};
