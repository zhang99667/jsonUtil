export const SIDEBAR_MIN_WIDTH = 180;
export const SIDEBAR_MAX_WIDTH = 400;
export const LEFT_PANE_MIN_PERCENT = 20;
export const LEFT_PANE_MAX_PERCENT = 80;

export const clampLayoutValue = (value: number, min: number, max: number) => (
  Math.max(min, Math.min(max, value))
);

export interface PaneMouseResizeInput {
  clientX: number;
  appLeft: number;
  appWidth: number;
  sidebarWidth: number;
}

export const getSidebarMouseResizeWidth = (clientX: number) => (
  clampLayoutValue(clientX, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH)
);

export const getPaneMouseResizePercent = ({
  clientX,
  appLeft,
  appWidth,
  sidebarWidth,
}: PaneMouseResizeInput) => {
  const editorAreaLeft = appLeft + sidebarWidth;
  const editorAreaWidth = appWidth - sidebarWidth;
  const relativeX = clientX - editorAreaLeft;
  const nextPercent = (relativeX / editorAreaWidth) * 100;

  return clampLayoutValue(nextPercent, LEFT_PANE_MIN_PERCENT, LEFT_PANE_MAX_PERCENT);
};
