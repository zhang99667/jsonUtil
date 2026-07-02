interface EditorTabViewStateHandlersInput {
  activeFileId?: string | null;
  saveEditorViewState: () => unknown;
  onSaveViewState?: (fileId: string, viewState: unknown) => void;
  onTabClick?: (id: string) => void;
  onCloseFile?: (id: string) => void;
  onNewTab?: () => void;
}

interface EditorTabViewStateHandlers {
  handleTabClick: (id: string) => void;
  handleCloseFile: (id: string) => void;
  handleNewTab: () => void;
}

export const saveActiveEditorViewState = ({
  activeFileId,
  saveEditorViewState,
  onSaveViewState,
}: Pick<EditorTabViewStateHandlersInput, 'activeFileId' | 'saveEditorViewState' | 'onSaveViewState'>): boolean => {
  if (!activeFileId || !onSaveViewState) return false;

  const viewState = saveEditorViewState();
  if (!viewState) return false;

  onSaveViewState(activeFileId, viewState);
  return true;
};

export const buildEditorTabViewStateHandlers = ({
  activeFileId,
  saveEditorViewState,
  onSaveViewState,
  onTabClick,
  onCloseFile,
  onNewTab,
}: EditorTabViewStateHandlersInput): EditorTabViewStateHandlers => {
  const saveCurrentViewState = () => saveActiveEditorViewState({
    activeFileId,
    saveEditorViewState,
    onSaveViewState,
  });

  return {
    handleTabClick: (id: string) => {
      if (id !== activeFileId) {
        saveCurrentViewState();
      }
      onTabClick?.(id);
    },
    handleCloseFile: (id: string) => {
      if (id === activeFileId) {
        saveCurrentViewState();
      }
      onCloseFile?.(id);
    },
    handleNewTab: () => {
      saveCurrentViewState();
      onNewTab?.();
    },
  };
};
