import type { ActionPanelScrollState } from './actionPanelScrollbar';
import { readCustomScrollbarMetrics } from './customScrollbarDom';

type ActionPanelScrollContainer = Pick<HTMLDivElement, 'scrollTop' | 'scrollHeight' | 'clientHeight'>;

export const readActionPanelScrollState = (
  container: ActionPanelScrollContainer
): ActionPanelScrollState => {
  const { scrollPos, scrollSize, clientSize } = readCustomScrollbarMetrics(container, 'vertical');
  return { scrollTop: scrollPos, scrollHeight: scrollSize, clientHeight: clientSize };
};
