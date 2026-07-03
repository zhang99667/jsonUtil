import {
  LEFT_PANE_MAX_PERCENT,
  LEFT_PANE_MIN_PERCENT,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  clampLayoutValue,
} from './layoutResize';

const SIDEBAR_KEYBOARD_RESIZE_STEP = 16;
const PANE_KEYBOARD_RESIZE_STEP = 5;

interface LayoutKeyboardResizeEvent {
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
}

interface ApplyLayoutKeyboardResizeInput {
  event: LayoutKeyboardResizeEvent;
  currentValue: number;
  getNextValue: (currentValue: number, key: string, shiftKey: boolean) => number | null;
  onResize: (nextValue: number) => void;
}

const getKeyboardResizeValue = (
  currentValue: number,
  key: string,
  shiftKey: boolean,
  step: number,
  min: number,
  max: number
): number | null => {
  const keyboardStep = shiftKey ? step * 2 : step;

  if (key === 'ArrowLeft') return clampLayoutValue(currentValue - keyboardStep, min, max);
  if (key === 'ArrowRight') return clampLayoutValue(currentValue + keyboardStep, min, max);
  if (key === 'Home') return min;
  if (key === 'End') return max;

  return null;
};

export const getSidebarKeyboardResizeWidth = (
  currentWidth: number,
  key: string,
  shiftKey: boolean
): number | null => (
  getKeyboardResizeValue(currentWidth, key, shiftKey, SIDEBAR_KEYBOARD_RESIZE_STEP, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH)
);

export const getPaneKeyboardResizePercent = (
  currentPercent: number,
  key: string,
  shiftKey: boolean
): number | null => (
  getKeyboardResizeValue(
    currentPercent,
    key,
    shiftKey,
    PANE_KEYBOARD_RESIZE_STEP,
    LEFT_PANE_MIN_PERCENT,
    LEFT_PANE_MAX_PERCENT
  )
);

export const applyLayoutKeyboardResize = ({
  event,
  currentValue,
  getNextValue,
  onResize,
}: ApplyLayoutKeyboardResizeInput): boolean => {
  const nextValue = getNextValue(currentValue, event.key, event.shiftKey);
  if (nextValue === null) return false;

  event.preventDefault();
  onResize(nextValue);
  return true;
};
