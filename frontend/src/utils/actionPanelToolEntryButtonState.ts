import { getActionPanelToolButtonA11y } from './actionPanelButtonState';
import { createActionPanelEntryButtonState } from './actionPanelEntryButtonStateFactory';
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

  return createActionPanelEntryButtonState({
    isActive,
    ...collapsedA11y,
    badge: isActive ? { label: '当前', dataTour: 'active-mode-badge' } : undefined,
    iconState: {
      iconWrapperClassName: `transition-colors ${isActive ? colorClass : 'text-gray-500'}`,
      iconInnerClassName: colorClass,
    },
  });
};
