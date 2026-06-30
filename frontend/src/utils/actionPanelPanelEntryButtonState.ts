import { getActionPanelPanelButtonA11y } from './actionPanelButtonState';
import { createActionPanelEntryButtonState } from './actionPanelEntryButtonStateFactory';
import type {
  ActionPanelEntryButtonState,
  ActionPanelPanelEntryButtonStateOptions,
} from './actionPanelEntryButtonTypes';

export const getActionPanelPanelEntryButtonState = ({
  label,
  iconClass,
  hoverIconClass,
  isOpen,
  isCollapsed,
}: ActionPanelPanelEntryButtonStateOptions): ActionPanelEntryButtonState => {
  const collapsedA11y = getActionPanelPanelButtonA11y(label, isOpen, isCollapsed);

  return createActionPanelEntryButtonState({
    isActive: isOpen,
    ...collapsedA11y,
    badge: isOpen ? { label: '打开', dataTour: 'panel-open-badge', ariaHidden: true } : undefined,
    iconState: {
      iconWrapperClassName: `transition-colors ${isOpen ? iconClass : `text-gray-500 ${hoverIconClass}`}`,
    },
  });
};
