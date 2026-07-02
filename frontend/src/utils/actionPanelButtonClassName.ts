const BUTTON_BASE_CLASS = 'w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-xl transition-all mb-2 group border active:scale-95 shadow-sm';
const BUTTON_ACTIVE_CLASS = 'bg-editor-active border-transparent text-white shadow-[inset_3px_0_0_rgba(96,165,250,0.72)]';
const BUTTON_INACTIVE_CLASS = 'bg-editor-sidebar border-transparent text-gray-400 hover:bg-editor-hover hover:text-gray-200 hover:border-gray-600';
const BUTTON_COLLAPSED_CLASS = 'justify-center px-2';

interface ButtonClassOptions {
  isActive: boolean;
  isCollapsed: boolean;
}

export const getActionPanelButtonClassName = ({
  isActive,
  isCollapsed,
}: ButtonClassOptions): string => [
  BUTTON_BASE_CLASS,
  isActive ? BUTTON_ACTIVE_CLASS : BUTTON_INACTIVE_CLASS,
  isCollapsed ? BUTTON_COLLAPSED_CLASS : '',
].filter(Boolean).join(' ');
