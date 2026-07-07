const BASE_ROW_CLASS_NAME = 'flex min-w-0 items-center gap-1 rounded border text-xs transition-colors';
const ACTIVE_ROW_CLASS_NAME = 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100';
const IDLE_ROW_CLASS_NAME = 'border-transparent bg-editor-sidebar text-gray-300 hover:bg-editor-hover hover:text-gray-100';

export const getJsonPathResultPreviewRowClassName = (isActive: boolean): string => (
  `${BASE_ROW_CLASS_NAME} ${isActive ? ACTIVE_ROW_CLASS_NAME : IDLE_ROW_CLASS_NAME}`
);
