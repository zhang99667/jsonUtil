import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { TransformMode, type FileTab } from '../types';
import { getWorkspaceTabCloseResult } from '../utils/workspaceFileTabs';
import { getFilesWithStandaloneDraft } from '../utils/workspaceStandaloneDraftFile';

export interface WorkspaceFileTabState {
  files: FileTab[];
  activeFileId: string | null;
}

export interface AppendOpenedFilesOptions {
  openedFiles: FileTab[];
  currentInput: string;
  currentMode: TransformMode;
  standaloneDraftId: string | null;
  shouldActivate: boolean;
}

interface UseWorkspaceFileTabStateOptions {
  initialFiles: FileTab[];
  initialActiveFileId: string | null;
}

export const useWorkspaceFileTabState = ({
  initialFiles,
  initialActiveFileId,
}: UseWorkspaceFileTabStateOptions) => {
  const [state, setState] = useState<WorkspaceFileTabState>(() => ({
    files: initialFiles,
    activeFileId: initialActiveFileId,
  }));
  const stateRef = useRef(state);
  const activeFileIdRef = useRef(state.activeFileId);

  const updateState = useCallback((update: (current: WorkspaceFileTabState) => WorkspaceFileTabState) => {
    const current = stateRef.current;
    const next = update(current);
    if (next === current) return current;
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const setFiles = useCallback<Dispatch<SetStateAction<FileTab[]>>>((update) => {
    updateState(current => {
      const files = typeof update === 'function' ? update(current.files) : update;
      return files === current.files ? current : { ...current, files };
    });
  }, [updateState]);

  const setCurrentActiveFileId = useCallback((activeFileId: string | null) => {
    activeFileIdRef.current = activeFileId;
    updateState(current => current.activeFileId === activeFileId
      ? current
      : { ...current, activeFileId });
  }, [updateState]);

  const appendOpenedFiles = useCallback(({
    openedFiles,
    currentInput,
    currentMode,
    standaloneDraftId,
    shouldActivate,
  }: AppendOpenedFilesOptions) => {
    const openedActiveFile = openedFiles.at(-1);
    if (!openedActiveFile) return undefined;
    const current = stateRef.current;
    const filesBeforeOpened = standaloneDraftId
      ? getFilesWithStandaloneDraft({
          files: current.files,
          activeFileId: current.activeFileId,
          input: currentInput,
          mode: currentMode,
          createId: () => standaloneDraftId,
        })
      : current.files;
    const files = [...filesBeforeOpened, ...openedFiles];
    const standaloneDraftAdded = Boolean(standaloneDraftId)
      && filesBeforeOpened.some(file => file.id === standaloneDraftId);
    const currentActiveExists = Boolean(current.activeFileId)
      && files.some(file => file.id === current.activeFileId);
    const sourceFile = shouldActivate || (!standaloneDraftAdded && !currentActiveExists)
      ? openedActiveFile
      : undefined;
    const activeFileId = sourceFile?.id
      ?? (standaloneDraftAdded ? standaloneDraftId : current.activeFileId);
    const next = updateState(() => ({ files, activeFileId }));
    activeFileIdRef.current = next.activeFileId;
    return sourceFile;
  }, [updateState]);

  const closeWorkspaceFile = useCallback((fileId: string) => {
    const current = stateRef.current;
    const closeResult = getWorkspaceTabCloseResult(current.files, fileId);
    if (!closeResult) return { closed: false, nextActiveFile: undefined };
    const nextActiveFile = current.activeFileId === fileId
      ? closeResult.nextActiveFile ?? null
      : undefined;
    const next = updateState(() => ({
      files: closeResult.remainingFiles,
      activeFileId: nextActiveFile === undefined ? current.activeFileId : nextActiveFile?.id ?? null,
    }));
    if (nextActiveFile !== undefined) activeFileIdRef.current = next.activeFileId;
    return { closed: true, nextActiveFile };
  }, [updateState]);

  const selectWorkspaceFile = useCallback((fileId: string) => {
    const current = stateRef.current;
    const selectedFile = current.files.find(file => file.id === fileId);
    if (!selectedFile) return undefined;
    const next = updateState(() => current.activeFileId === fileId
      ? current
      : { ...current, activeFileId: fileId });
    activeFileIdRef.current = next.activeFileId;
    return selectedFile;
  }, [updateState]);

  const getWorkspaceState = useCallback(() => stateRef.current, []);

  return {
    files: state.files,
    activeFileId: state.activeFileId,
    activeFileIdRef,
    appendOpenedFiles,
    closeWorkspaceFile,
    getWorkspaceState,
    selectWorkspaceFile,
    setCurrentActiveFileId,
    setFiles,
  };
};
