import toast from 'react-hot-toast';
import { TransformMode, type FileTab } from '../types';
import { getDetailedErrorMessage, isAbortError } from '../utils/errors';
import { getTextFileOpenError, TEXT_FILE_ACCEPT_EXTENSIONS } from '../utils/fileGuards';
import { importTextFileContent } from '../utils/harImport';
import { createSecureUuid } from '../utils/secureUuid';
import type { FileOpenRequest } from './useFileOpenRequestGuard';
import type { AppendOpenedFilesOptions } from './useWorkspaceFileTabState';

interface OpenTextFileEntry {
  file: File;
  handle?: FileSystemFileHandle;
}

interface FileOpenRequestInspection {
  currentInput: string;
  currentMode: TransformMode;
  shouldActivate: boolean;
}

interface CreateFileOpenCommandsOptions {
  activeFileIdRef: { current: string | null };
  appendOpenedFiles: (options: AppendOpenedFilesOptions) => FileTab | undefined;
  applySourceState: (content: string, mode?: TransformMode) => void;
  beginRequest: () => FileOpenRequest;
  inspectRequest: (request: FileOpenRequest) => FileOpenRequestInspection;
}

const showOpenError = (error: unknown) => {
  console.error('打开文件失败:', error);
  toast.error(getDetailedErrorMessage(error, '打开文件失败'), { duration: 3000 });
};

const readTextFileSafely = async (file: File): Promise<string | null> => {
  const sizeError = getTextFileOpenError(file);
  if (sizeError) {
    toast.error(sizeError, { duration: 4000 });
    return null;
  }

  return file.text();
};

export const createFileOpenCommands = ({
  activeFileIdRef,
  appendOpenedFiles,
  applySourceState,
  beginRequest,
  inspectRequest,
}: CreateFileOpenCommandsOptions) => {
  const openTextFileEntries = async (entries: OpenTextFileEntry[], request: FileOpenRequest) => {
    if (entries.length === 0) return;

    const openedFiles: FileTab[] = [];

    for (const entry of entries) {
      try {
        const contents = await readTextFileSafely(entry.file);
        if (contents === null) continue;
        const importedFile = importTextFileContent(entry.file.name, contents);
        const newFileId = createSecureUuid();
        const isDerivedFile = importedFile.preserveHandle === false;

        openedFiles.push({
          id: newFileId,
          name: importedFile.name || entry.file.name,
          content: importedFile.content,
          // 派生内容没有对应磁盘快照，必须进入关闭确认和草稿恢复流程。
          savedContent: isDerivedFile ? '' : importedFile.content,
          handle: isDerivedFile ? undefined : entry.handle,
          isDirty: isDerivedFile,
          mode: importedFile.mode || TransformMode.NONE,
          path: isDerivedFile ? undefined : (entry.file as File & { path?: string }).path
            || (entry.handle as FileSystemFileHandle & { path?: string } | undefined)?.path,
        });
        if (importedFile.toastMessage) {
          if (importedFile.toastType === 'info') {
            toast(importedFile.toastMessage, { duration: 2500 });
          } else {
            toast.success(importedFile.toastMessage, { duration: 2500 });
          }
        }
      } catch (error) {
        console.error('读取文件失败:', error);
        toast.error(getDetailedErrorMessage(
          error,
          `读取文件「${entry.file.name || '未命名文件'}」失败`,
        ), { duration: 3000 });
      }
    }

    if (openedFiles.length === 0) return;

    const currentActiveFileId = activeFileIdRef.current;
    const { currentInput, currentMode, shouldActivate } = inspectRequest(request);
    const standaloneDraftId = !currentActiveFileId && currentInput.length > 0
      ? createSecureUuid()
      : null;

    const sourceFile = appendOpenedFiles({
      openedFiles,
      currentInput,
      currentMode,
      standaloneDraftId,
      shouldActivate,
    });
    if (sourceFile) applySourceState(sourceFile.content, sourceFile.mode || TransformMode.NONE);

    if (openedFiles.length > 1) {
      toast.success(`已打开 ${openedFiles.length} 个文件`, { duration: 2000 });
    }
  };

  const openFile = async () => {
    const request = beginRequest();
    const showOpenFilePicker = window.showOpenFilePicker;

    // 不支持文件系统访问 API 时退回传统文件输入框。
    if (typeof showOpenFilePicker !== 'function') {
      try {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = TEXT_FILE_ACCEPT_EXTENSIONS.join(',');
        fileInput.multiple = true;

        fileInput.onchange = async event => {
          try {
            const selectedFiles = Array.from((event.target as HTMLInputElement).files || []);
            await openTextFileEntries(selectedFiles.map(file => ({ file })), request);
          } catch (error) {
            showOpenError(error);
          }
        };

        fileInput.click();
      } catch (error) {
        showOpenError(error);
      }
      return;
    }

    let handles: FileSystemFileHandle[];
    try {
      handles = await showOpenFilePicker.call(window, {
        types: [
          {
            description: '文本文件',
            accept: {
              'text/plain': TEXT_FILE_ACCEPT_EXTENSIONS,
            },
          },
        ],
        excludeAcceptAllOption: false,
        multiple: true,
      });
    } catch (error) {
      if (!isAbortError(error)) showOpenError(error);
      return;
    }

    const entryResults = await Promise.allSettled(handles.map(async handle => ({
      file: await handle.getFile(),
      handle,
    })));
    const entries: OpenTextFileEntry[] = [];
    entryResults.forEach(result => {
      if (result.status === 'fulfilled') {
        entries.push(result.value);
      } else {
        showOpenError(result.reason);
      }
    });

    try {
      await openTextFileEntries(entries, request);
    } catch (error) {
      showOpenError(error);
    }
  };

  // 拖拽文件没有可持久句柄，只读取内容。
  const openDroppedFiles = async (droppedFiles: FileList | File[]) => {
    const fileList = Array.from(droppedFiles);
    if (fileList.length === 0) return;

    const request = beginRequest();
    await openTextFileEntries(fileList.map(file => ({ file })), request);
  };

  return { openDroppedFiles, openFile };
};
