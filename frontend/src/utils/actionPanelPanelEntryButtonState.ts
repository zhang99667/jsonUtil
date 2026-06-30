import { getActionPanelPanelButtonA11y } from './actionPanelButtonState';
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

  return {
    entryProps: {
      isActive: isOpen,
      ariaLabel: collapsedA11y.ariaLabel,
      title: collapsedA11y.title,
      badge: isOpen ? { label: '打开', dataTour: 'panel-open-badge', ariaHidden: true } : undefined,
    },
    iconState: {
      iconWrapperClassName: `transition-colors ${isOpen ? iconClass : `text-gray-500 ${hoverIconClass}`}`,
    },
  };
};
