import { getActionPanelToolButtonA11y } from './actionPanelButtonState';
import type {
  ActionPanelEntryButtonState,
  ActionPanelToolEntryButtonStateOptions,
} from './actionPanelEntryButtonTypes';

export const getActionPanelToolEntryButtonState = ({
  label,
  colorClass,
  isActive,
  isCollapsed,
}: ActionPanelToolEntryButtonStateOptions): ActionPanelEntryButtonState => {
  const collapsedA11y = getActionPanelToolButtonA11y(label, isActive, isCollapsed);

  return {
    entryProps: {
      isActive,
      ariaLabel: collapsedA11y.ariaLabel,
      title: collapsedA11y.title,
      badge: isActive ? { label: '当前', dataTour: 'active-mode-badge' } : undefined,
    },
    iconState: {
      iconWrapperClassName: `transition-colors ${isActive ? colorClass : 'text-gray-500'}`,
      iconInnerClassName: colorClass,
    },
  };
};
