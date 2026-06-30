export interface ActionPanelScrollState {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface ActionPanelScrollbarThumbState {
  thumbHeight: number;
  thumbTop: number;
}

export const getActionPanelScrollbarThumbState = ({
  scrollTop,
  scrollHeight,
  clientHeight,
}: ActionPanelScrollState): ActionPanelScrollbarThumbState => {
  if (scrollHeight <= 0 || clientHeight <= 0) {
    return { thumbHeight: 0, thumbTop: 0 };
  }

  return {
    thumbHeight: (clientHeight / scrollHeight) * 100,
    thumbTop: (scrollTop / scrollHeight) * 100,
  };
};

export interface ActionPanelDragScrollInput {
  startScrollTop: number;
  deltaY: number;
  scrollHeight: number;
  clientHeight: number;
}

export const getActionPanelDragScrollTop = ({
  startScrollTop,
  deltaY,
  scrollHeight,
  clientHeight,
}: ActionPanelDragScrollInput): number => {
  if (clientHeight <= 0) return startScrollTop;
  return startScrollTop + deltaY * (scrollHeight / clientHeight);
};
