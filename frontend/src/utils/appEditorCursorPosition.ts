export type AppEditorFocusTarget = 'SOURCE' | 'PREVIEW';

export const shouldAcceptEditorCursorPosition = (
  activeEditor: AppEditorFocusTarget | null,
  eventEditor: AppEditorFocusTarget
): boolean => {
  if (eventEditor === 'SOURCE') {
    return activeEditor !== 'PREVIEW';
  }

  return activeEditor === 'PREVIEW';
};
