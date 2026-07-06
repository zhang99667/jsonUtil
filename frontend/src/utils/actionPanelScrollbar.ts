import { getCustomScrollbarDragScrollPos } from './customScrollbar';

export interface ActionPanelScrollState {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export const EMPTY_ACTION_PANEL_SCROLL_STATE: ActionPanelScrollState = {
  scrollTop: 0,
  scrollHeight: 0,
  clientHeight: 0,
};

export interface ActionPanelScrollbarViewState {
  showScrollbar: boolean;
  thumbHeight: number;
  thumbTop: number;
}

export const getActionPanelScrollbarViewState = ({
  scrollTop,
  scrollHeight,
  clientHeight,
}: ActionPanelScrollState): ActionPanelScrollbarViewState => {
  const showScrollbar = scrollHeight > clientHeight;

  if (scrollHeight <= 0 || clientHeight <= 0) {
    return { showScrollbar, thumbHeight: 0, thumbTop: 0 };
  }

  return {
    showScrollbar,
    thumbHeight: (clientHeight / scrollHeight) * 100,
    thumbTop: (scrollTop / scrollHeight) * 100,
  };
};

export interface ActionPanelDragScrollInput extends ActionPanelScrollState {
  startPointerY: number;
  currentPointerY: number;
}

export const getActionPanelDragScrollTop = ({
  scrollTop,
  startPointerY,
  currentPointerY,
  scrollHeight,
  clientHeight,
}: ActionPanelDragScrollInput): number => getCustomScrollbarDragScrollPos({
  startScrollPos: scrollTop, delta: currentPointerY - startPointerY,
  scrollSize: scrollHeight, clientSize: clientHeight,
});
