interface CollapsedA11y {
  ariaLabel?: string;
  title?: string;
}

const getCollapsedButtonA11y = (
  label: string,
  ariaSuffix: string,
  titleSuffix: string,
): CollapsedA11y => ({
  ariaLabel: `${label}${ariaSuffix}`,
  title: `${label}${titleSuffix}`,
});

export const getActionPanelToolButtonA11y = (
  label: string,
  isActive: boolean,
  isCollapsed: boolean,
): CollapsedA11y => (
  isCollapsed ? getCollapsedButtonA11y(
    label,
    isActive ? '，当前模式' : '',
    isActive ? '（当前）' : '',
  ) : {}
);

export const getActionPanelPanelButtonA11y = (
  label: string,
  isOpen: boolean,
  isCollapsed: boolean,
): CollapsedA11y => (
  isCollapsed ? getCollapsedButtonA11y(
    label,
    isOpen ? '，已打开' : '，未打开',
    isOpen ? '（已打开）' : '',
  ) : {}
);
