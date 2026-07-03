import type { ActionPanelScrollState } from './actionPanelScrollbar';

type ActionPanelScrollContainer = Pick<HTMLDivElement, 'scrollTop' | 'scrollHeight' | 'clientHeight'>;

export const readActionPanelScrollState = (
  container: ActionPanelScrollContainer
): ActionPanelScrollState => ({
  scrollTop: container.scrollTop,
  scrollHeight: container.scrollHeight,
  clientHeight: container.clientHeight,
});
