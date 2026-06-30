import {
  getActionPanelPanelButtonA11y,
  getActionPanelToolButtonA11y,
} from './actionPanelButtonState';
import type {
  ActionPanelEntryButtonState,
  ActionPanelPanelEntryButtonStateOptions,
  ActionPanelToolEntryButtonStateOptions,
} from './actionPanelEntryButtonTypes';

export type {
  ActionPanelEntryButtonBadge,
  ActionPanelEntryButtonState,
  ActionPanelEntryIconState,
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
