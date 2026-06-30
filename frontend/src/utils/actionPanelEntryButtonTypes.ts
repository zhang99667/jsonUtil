export interface ActionPanelEntryButtonBadge {
  label: string;
  dataTour: string;
  ariaHidden?: boolean;
}

export interface ActionPanelEntryButtonPropsState {
  isActive: boolean;
  ariaLabel?: string;
  title?: string;
  badge?: ActionPanelEntryButtonBadge;
}

export interface ActionPanelEntryIconState {
  iconWrapperClassName: string;
  iconInnerClassName?: string;
}

export interface ActionPanelEntryButtonState {
  entryProps: ActionPanelEntryButtonPropsState;
  iconState: ActionPanelEntryIconState;
}

export interface ActionPanelToolEntryButtonStateOptions {
  label: string;
  colorClass: string;
  isActive: boolean;
  isCollapsed: boolean;
}

export interface ActionPanelPanelEntryButtonStateOptions {
  label: string;
  iconClass: string;
  hoverIconClass: string;
  isOpen: boolean;
  isCollapsed: boolean;
}
