import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import toast from 'react-hot-toast';
import type { FileTab, TransformMode } from '../types';
import { areFileHandlesSameEntry, writeTextToFileHandleQueued } from '../utils/browserFileHandleWrite';
import { triggerTextDownload } from '../utils/browserFileSave';
import { getDetailedErrorMessage, isAbortError } from '../utils/errors';
import { TEXT_FILE_ACCEPT_EXTENSIONS } from '../utils/fileGuards';
import { createSecureUuid } from '../utils/secureUuid';
import { markWorkspaceFileSnapshotSaved } from '../utils/workspaceFileSaveState';

interface UseFileSaveCommandsOptions {
  applySourceState: (content: string) => void;
  cancelPendingAutoSave: () => void;
  captureWorkspaceMode: () => TransformMode;
  captureWorkspaceRevision: () => number;
  getWorkspaceState: () => { files: FileTab[]; activeFileId: string | null };
  inputRef: { current: string };
  isWorkspaceRevisionCurrent: (revision: number) => boolean;
  setCurrentActiveFileId: (fileId: string | null) => void;
  setFiles: Dispatch<SetStateAction<FileTab[]>>;
}

export const useFileSaveCommands = ({
  applySourceState,
  cancelPendingAutoSave,
  captureWorkspaceMode,
  captureWorkspaceRevision,
  getWorkspaceState,
  inputRef,
  isWorkspaceRevisionCurrent,
  setCurrentActiveFileId,
  setFiles,
}: UseFileSaveCommandsOptions) => {
  const saveAsIntentByFileIdRef = useRef(new Map<string, symbol>());

  const invalidateSaveAsIntent = useCallback((fileId: string) => {
    saveAsIntentByFileIdRef.current.delete(fileId);
  }, []);

  const createSavedTab = (
    name: string,
    content: string,
    mode: TransformMode,
    handle?: FileSystemFileHandle,
    path?: string,
    activate = true,
  ) => {
    const newFileId = createSecureUuid();
    const newFile: FileTab = {
      id: newFileId,
      name,
      content,
      savedContent: content,
      handle,
      isDirty: false,
      mode,
      path,
    };

    setFiles(previousFiles => [...previousFiles, newFile]);
    if (activate) {
      setCurrentActiveFileId(newFileId);
      applySourceState(content);
    }
  };

  const saveSourceAs = async () => {
    const workspace = getWorkspaceState();
    const activeFile = workspace.files.find(file => file.id === workspace.activeFileId);
    const sourceSnapshot = inputRef.current;
    const sourceModeSnapshot = captureWorkspaceMode();
    const sourceWorkspaceRevision = captureWorkspaceRevision();
    const downloadName = activeFile?.name || 'untitled.json';
    const showSaveError = (error: unknown) => {
      console.error('源内容另存为失败:', error);
      toast.error(getDetailedErrorMessage(error, '另存为失败'), { duration: 3000 });
    };
    const showSaveFilePicker = window.showSaveFilePicker;

    if (typeof showSaveFilePicker !== 'function') {
      try {
        triggerTextDownload({
          text: sourceSnapshot,
          fileName: downloadName,
          mimeType: 'text/plain',
        });
        toast('已开始下载；浏览器无法确认文件是否已落盘，当前内容仍标记为未保存', {
          duration: 4000,
        });
      } catch (error) {
        showSaveError(error);
      }
      return false;
    }

    let handle: FileSystemFileHandle;
    try {
      handle = await showSaveFilePicker.call(window, {
        suggestedName: downloadName,
        types: [{
          description: '文本文件',
          accept: { 'text/plain': TEXT_FILE_ACCEPT_EXTENSIONS },
        }],
      });
    } catch (error) {
      if (!isAbortError(error)) showSaveError(error);
      return false;
    }
    const saveAsIntent = activeFile ? Symbol() : undefined;
    if (activeFile && saveAsIntent) saveAsIntentByFileIdRef.current.set(activeFile.id, saveAsIntent);

    try {
      cancelPendingAutoSave();
      await writeTextToFileHandleQueued(handle, sourceSnapshot);
      if (activeFile && saveAsIntentByFileIdRef.current.get(activeFile.id) !== saveAsIntent) return true;
      const path = (handle as FileSystemFileHandle & { path?: string }).path;

      if (activeFile) {
        setFiles(previousFiles => previousFiles.map(file => (
          file.id === activeFile.id
            ? {
                ...markWorkspaceFileSnapshotSaved(file, sourceSnapshot),
                name: handle.name,
                handle,
                // 某些桌面容器会提供非标准路径，仅在存在时保留。
                path,
              }
            : file
        )));
      } else {
        const sourceWorkspaceUnchanged = getWorkspaceState().activeFileId === null
          && inputRef.current === sourceSnapshot
          && isWorkspaceRevisionCurrent(sourceWorkspaceRevision);
        createSavedTab(
          handle.name || 'untitled.json',
          sourceSnapshot,
          sourceModeSnapshot,
          handle,
          path,
          sourceWorkspaceUnchanged,
        );
        if (!sourceWorkspaceUnchanged) {
          toast('保存期间工作区已发生变化，已保留当前编辑状态和已写入快照', {
            duration: 4000,
          });
        }
      }
      return true;
    } catch (error) {
      showSaveError(error);
      return false;
    }
  };

  const saveFile = async (content?: string) => {
    const workspace = getWorkspaceState();
    const activeFile = workspace.files.find(file => file.id === workspace.activeFileId);

    // 未命名文件没有句柄，保存源内容时需要先另存为。
    if (!activeFile?.handle && content === undefined) {
      return saveSourceAs();
    }

    if (!activeFile?.handle) return false;

    cancelPendingAutoSave();
    const handle = activeFile.handle;
    const contentToSave = content ?? inputRef.current;
    const sourceBeforeSave = inputRef.current;
    const sourceWorkspaceRevision = captureWorkspaceRevision();
    try {
      await writeTextToFileHandleQueued(handle, contentToSave);

      let currentWorkspace = getWorkspaceState();
      const currentHandle = currentWorkspace.files.find(file => file.id === activeFile.id)?.handle;
      let handleIsCurrent = currentHandle === handle;
      if (!handleIsCurrent && currentHandle) {
        try {
          handleIsCurrent = await areFileHandlesSameEntry(handle, currentHandle);
        } catch { handleIsCurrent = false; }
        if (handleIsCurrent) {
          currentWorkspace = getWorkspaceState();
          handleIsCurrent = currentWorkspace.files.some(file => file.id === activeFile.id && file.handle === currentHandle);
        }
      }
      const shouldReplaceSource = content !== undefined
        && handleIsCurrent
        && currentWorkspace.activeFileId === activeFile.id
        && inputRef.current === sourceBeforeSave
        && isWorkspaceRevisionCurrent(sourceWorkspaceRevision);
      if (shouldReplaceSource) {
        applySourceState(content);
      }
      setFiles(previousFiles => previousFiles.map(file => (
        file.id === activeFile.id && handleIsCurrent && file.handle === currentHandle
          ? markWorkspaceFileSnapshotSaved(
              file,
              contentToSave,
              shouldReplaceSource ? contentToSave : file.content,
            )
          : file
      )));

      return true;
    } catch (error) {
      console.error('保存文件失败:', error);
      toast.error(getDetailedErrorMessage(error, '保存文件失败，请重试'), {
        duration: 3000,
      });
      return false;
    }
  };

  return { invalidateSaveAsIntent, saveFile, saveSourceAs };
};
