const BUTTON_BASE_CLASS = 'w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-xl transition-all mb-2 group border active:scale-95 shadow-sm';
const BUTTON_ACTIVE_CLASS = 'bg-editor-active border-brand-primary/60 text-white ring-1 ring-brand-primary/40';
const BUTTON_INACTIVE_CLASS = 'bg-editor-sidebar border-transparent text-gray-400 hover:bg-editor-hover hover:text-gray-200 hover:border-gray-600';
const BUTTON_COLLAPSED_CLASS = 'justify-center px-2';

interface ButtonClassOptions {
  isActive: boolean;
  isCollapsed: boolean;
}

interface CollapsedA11y {
  ariaLabel?: string;
  title?: string;
}

export const getActionPanelButtonClassName = ({
  isActive,
  isCollapsed,
}: ButtonClassOptions): string => [
  BUTTON_BASE_CLASS,
  isActive ? BUTTON_ACTIVE_CLASS : BUTTON_INACTIVE_CLASS,
  isCollapsed ? BUTTON_COLLAPSED_CLASS : '',
].filter(Boolean).join(' ');

export const getActionPanelToolButtonA11y = (
  label: string,
  isActive: boolean,
  isCollapsed: boolean,
): CollapsedA11y => {
  if (!isCollapsed) return {};

  return {
    ariaLabel: `${label}${isActive ? '，当前模式' : ''}`,
    title: `${label}${isActive ? '（当前）' : ''}`,
  };
};

export const getActionPanelPanelButtonA11y = (
  label: string,
  isOpen: boolean,
  isCollapsed: boolean,
): CollapsedA11y => {
  if (!isCollapsed) return {};

  return {
    ariaLabel: `${label}${isOpen ? '，已打开' : '，未打开'}`,
    title: `${label}${isOpen ? '（已打开）' : ''}`,
  };
};
