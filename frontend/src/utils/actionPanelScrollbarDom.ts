import type { ActionPanelScrollState } from './actionPanelScrollbar';
import { readCustomScrollbarMetrics } from './customScrollbarDom';

export const readActionPanelScrollState = (
  container: HTMLDivElement
): ActionPanelScrollState => {
  const { scrollPos, scrollSize, clientSize } = readCustomScrollbarMetrics(container, 'vertical');
  return { scrollTop: scrollPos, scrollHeight: scrollSize, clientHeight: clientSize };
};
