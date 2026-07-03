import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { FileTab, TransformMode } from '../types';
import { getDetailedErrorMessage, isAbortError } from '../utils/errors';
import { getTextFileOpenError, TEXT_FILE_ACCEPT_EXTENSIONS } from '../utils/fileGuards';
import { importTextFileContent } from '../utils/harImport';
import {
    buildWorkspaceDraftSnapshot,
    loadWorkspaceDraftSnapshot,
    saveWorkspaceDraftSnapshot,
} from '../utils/workspaceDraft';
import {
    getNextUntitledName,
    getWorkspaceTabCloseResult,
} from '../utils/workspaceFileTabs';
import { getFilesWithStandaloneDraft } from '../utils/workspaceStandaloneDraftFile';
import { applyWorkspaceSourceState } from '../utils/workspaceSourceState';

interface UseFileSystemProps {
    input: string;
    setInput: (value: string) => void;
    inputRef: React.MutableRefObject<string>;
    mode: TransformMode;
    setMode: (mode: TransformMode) => void;
    onBeforeSourceWorkspaceChange?: () => void;
}

interface OpenTextFileEntry {
    file: File;
    handle?: FileSystemFileHandle;
}

const WORKSPACE_DRAFT_PERSIST_DEBOUNCE_MS = 300;

// UUID 生成器 polyfill
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback implementation (RFC4122 version 4 compliant)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const useFileSystem = ({
    input,
    setInput,
    inputRef,
    mode,
    setMode,
    onBeforeSourceWorkspaceChange,
}: UseFileSystemProps) => {
    const [restoredDraft] = useState(() => loadWorkspaceDraftSnapshot());
    const shouldSkipInitialDraftPersistRef = useRef(Boolean(restoredDraft));
    const [files, setFiles] = useState<FileTab[]>(() => restoredDraft?.files || []);
    const [activeFileId, setActiveFileId] = useState<string | null>(() => restoredDraft?.activeFileId || null);
    const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(false);
    const latestDraftStateRef = useRef({
        files,
        activeFileId,
        input,
        mode,
    });
    const hasShownDraftPersistWarningRef = useRef(false);

    const applySourceState = useCallback((content: string, nextMode?: TransformMode) => {
        applyWorkspaceSourceState({
            content,
            mode: nextMode,
            inputRef,
            onBeforeSourceWorkspaceChange,
            setInput,
            setMode,
        });
    }, [inputRef, onBeforeSourceWorkspaceChange, setInput, setMode]);

    useEffect(() => {
        const draft = restoredDraft;
        if (!draft) return;

        const activeRestoredFile = draft.activeFileId
            ? draft.files.find(file => file.id === draft.activeFileId)
            : null;

        if (activeRestoredFile) {
            applySourceState(activeRestoredFile.content, activeRestoredFile.mode || TransformMode.NONE);
            toast.success('已恢复上次未保存标签', { duration: 2000 });
            return;
        }

        if (draft.standaloneInput) {
            applySourceState(draft.standaloneInput, draft.standaloneMode || TransformMode.NONE);
            toast.success('已恢复上次未保存草稿', { duration: 2000 });
        }
    }, [applySourceState, restoredDraft]);

    const persistWorkspaceDraft = useCallback((snapshot: ReturnType<typeof buildWorkspaceDraftSnapshot>, silent = false) => {
        const saved = saveWorkspaceDraftSnapshot(snapshot);
        if (saved) {
            hasShownDraftPersistWarningRef.current = false;
            return;
        }

        if (snapshot && !silent && !hasShownDraftPersistWarningRef.current) {
            hasShownDraftPersistWarningRef.current = true;
            toast.error('当前草稿过大或浏览器存储受限，已暂停本地草稿恢复', { duration: 4000 });
        }
    }, []);

    const buildCurrentWorkspaceDraft = useCallback(() => {
        const draftState = latestDraftStateRef.current;
        return buildWorkspaceDraftSnapshot({
            files: draftState.files,
            activeFileId: draftState.activeFileId,
            standaloneInput: draftState.activeFileId ? '' : draftState.input,
            standaloneMode: draftState.activeFileId ? TransformMode.NONE : draftState.mode,
        });
    }, []);

    const flushWorkspaceDraft = useCallback(() => {
        persistWorkspaceDraft(buildCurrentWorkspaceDraft(), true);
    }, [buildCurrentWorkspaceDraft, persistWorkspaceDraft]);

    useEffect(() => {
        latestDraftStateRef.current = {
            files,
            activeFileId,
            input,
            mode,
        };
    }, [activeFileId, files, input, mode]);

    useEffect(() => {
        if (shouldSkipInitialDraftPersistRef.current) {
            shouldSkipInitialDraftPersistRef.current = false;
            return;
        }

        const timer = window.setTimeout(() => {
            persistWorkspaceDraft(buildCurrentWorkspaceDraft());
        }, WORKSPACE_DRAFT_PERSIST_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [activeFileId, buildCurrentWorkspaceDraft, files, input, mode, persistWorkspaceDraft]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                flushWorkspaceDraft();
            }
        };

        window.addEventListener('beforeunload', flushWorkspaceDraft);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', flushWorkspaceDraft);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [flushWorkspaceDraft]);

    const readTextFileSafely = async (file: File): Promise<string | null> => {
        const sizeError = getTextFileOpenError(file);
        if (sizeError) {
            toast.error(sizeError, { duration: 4000 });
            return null;
        }

        return file.text();
    };

    const createSavedTab = (name: string, content: string, handle?: FileSystemFileHandle, path?: string) => {
        const newFileId = generateUUID();
        const newFile: FileTab = {
            id: newFileId,
            name,
            content,
            savedContent: content,
            handle,
            isDirty: false,
            mode: TransformMode.NONE,
            path
        };

        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFileId);
        applySourceState(content);
    };

    const openTextFileEntries = async (entries: OpenTextFileEntry[]) => {
        if (entries.length === 0) return;

        const openedFiles: FileTab[] = [];

        for (const entry of entries) {
            try {
                const contents = await readTextFileSafely(entry.file);
                if (contents === null) continue;
                const importedFile = importTextFileContent(entry.file.name, contents);
                const newFileId = generateUUID();

                openedFiles.push({
                    id: newFileId,
                    name: importedFile.name || entry.file.name,
                    content: importedFile.content,
                    savedContent: importedFile.content,
                    handle: importedFile.preserveHandle === false ? undefined : entry.handle,
                    isDirty: false,
                    mode: importedFile.mode || TransformMode.NONE,
                    path: importedFile.preserveHandle === false ? undefined : (entry.file as File & { path?: string }).path ||
                        (entry.handle as FileSystemFileHandle & { path?: string } | undefined)?.path
                });
                if (importedFile.toastMessage) {
                    if (importedFile.toastType === 'info') {
                        toast(importedFile.toastMessage, { duration: 2500 });
                    } else {
                        toast.success(importedFile.toastMessage, { duration: 2500 });
                    }
                }
            } catch (err) {
                console.error('Failed to read file:', err);
                toast.error(getDetailedErrorMessage(
                    err,
                    `读取文件「${entry.file.name || '未命名文件'}」失败`
                ), { duration: 3000 });
            }
        }

        if (openedFiles.length === 0) return;

        const nextFiles = [
            ...getFilesWithStandaloneDraft({
                files,
                activeFileId,
                input,
                createId: generateUUID,
            }),
            ...openedFiles,
        ];
        const activeFile = openedFiles[openedFiles.length - 1];

        setFiles(nextFiles);
        setActiveFileId(activeFile.id);
        applySourceState(activeFile.content, activeFile.mode || TransformMode.NONE);

        if (openedFiles.length > 1) {
            toast.success(`已打开 ${openedFiles.length} 个文件`, { duration: 2000 });
        }
    };

    // 同步输入变更到活动文件
    const updateActiveFileContent = useCallback((newContent: string) => {
        if (activeFileId) {
            setFiles(prev => prev.map(f =>
                f.id === activeFileId ? { ...f, content: newContent, isDirty: newContent !== (f.savedContent || '') } : f
            ));
        }
    }, [activeFileId]);

    // 自动保存逻辑
    useEffect(() => {
        const activeFile = files.find(f => f.id === activeFileId);
        if (!isAutoSaveEnabled || !activeFile?.handle || input === (activeFile.savedContent || '')) return;

        const timer = setTimeout(async () => {
            try {
                const writable = await activeFile.handle.createWritable();
                await writable.write(input);
                await writable.close();
                setFiles(prev => prev.map(f =>
                    f.id === activeFileId ? { ...f, content: input, savedContent: input, isDirty: false } : f
                ));
            } catch (err) {
                console.error('Auto-save failed:', err);
                toast.error(getDetailedErrorMessage(err, '自动保存失败'), { duration: 3000 });
            }
        }, 1000); // 防抖延迟 1s

        return () => clearTimeout(timer);
    }, [input, activeFileId, files, isAutoSaveEnabled]);

    const createNewTab = () => {
        const nextFiles = getFilesWithStandaloneDraft({
            files,
            activeFileId,
            input,
            createId: generateUUID,
        });
        const newFileId = generateUUID();
        const newFileName = getNextUntitledName(nextFiles);

        const newFile: FileTab = {
            id: newFileId,
            name: newFileName,
            content: '',
            savedContent: '', // 新建文件，保存内容为空
            handle: undefined, // 无文件句柄,表示未保存的新标签
            isDirty: false,
            mode: TransformMode.NONE // 新标签默认无转换模式
        };

        setFiles([...nextFiles, newFile]);
        setActiveFileId(newFileId);
        applySourceState('', TransformMode.NONE);
    };

    const openFile = async () => {
        // Fallback for environments without File System Access API
        if (typeof window.showOpenFilePicker !== 'function') {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = TEXT_FILE_ACCEPT_EXTENSIONS.join(',');
            fileInput.multiple = true;
            
            fileInput.onchange = async (e) => {
                const selectedFiles = Array.from((e.target as HTMLInputElement).files || []);
                await openTextFileEntries(selectedFiles.map(file => ({ file })));
            };

            fileInput.click();
            return;
        }

        try {
            const handles = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'Text Files',
                        accept: {
                            'text/plain': TEXT_FILE_ACCEPT_EXTENSIONS,
                        },
                    },
                ],
                excludeAcceptAllOption: false,
                multiple: true,
            });

            const entries = await Promise.all(handles.map(async handle => ({
                file: await handle.getFile(),
                handle,
            })));

            await openTextFileEntries(entries);
        } catch (err) {
            if (isAbortError(err)) {
                return;
            }
            console.error('Failed to open file:', err);
            toast.error(getDetailedErrorMessage(err, '打开文件失败'), { duration: 3000 });
        }
    };

    const saveSourceAs = async () => {
        try {
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: activeFileId ? files.find(f => f.id === activeFileId)?.name : 'untitled.json',
                    types: [{
                        description: 'Text Files',
                        accept: { 'text/plain': TEXT_FILE_ACCEPT_EXTENSIONS },
                    }],
                });
                
                // 写入文件
                const writable = await handle.createWritable();
                await writable.write(input);
                await writable.close();

                // 关键修复：另存为成功后，更新当前文件的元数据（Handle, Name, SavedContent, Dirty）
                if (activeFileId) {
                    const newName = handle.name;
                    setFiles(prev => prev.map(f =>
                        f.id === activeFileId ? {
                            ...f,
                            name: newName,
                            handle: handle, // 绑定新句柄，下次直接 save
                            savedContent: input,
                            isDirty: false,
                            // Electron 环境下 FileSystemFileHandle 可能包含 path 属性（非标准）
                            path: (handle as FileSystemFileHandle & { path?: string }).path
                        } : f
                    ));
                } else {
                    createSavedTab(
                        handle.name || 'untitled.json',
                        input,
                        handle,
                        (handle as FileSystemFileHandle & { path?: string }).path
                    );
                }
                
                return true;
            } else {
                // Fallback (传统下载模式，无法更新 Handle)
                const blob = new Blob([input], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const downloadName = activeFileId ? (files.find(f => f.id === activeFileId)?.name || 'untitled.json') : 'untitled.json';
                a.download = downloadName;
                a.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 0);
                
                // 传统下载模式下，我们至少可以重置 Dirty 状态，假定用户已保存
                if (activeFileId) {
                    setFiles(prev => prev.map(f =>
                        f.id === activeFileId ? { ...f, savedContent: input, isDirty: false } : f
                    ));
                } else {
                    createSavedTab(downloadName, input);
                }
                return true;
            }
        } catch (err) {
            // 用户取消保存不应视为错误
            if (isAbortError(err)) {
                return false;
            }
            console.error('Failed to save source as:', err);
            toast.error(getDetailedErrorMessage(err, '另存为失败'), { duration: 3000 });
            return false;
        }
    };

    const saveFile = async (content?: string) => {
        const activeFile = files.find(f => f.id === activeFileId);
        
        // 如果是 Untitled 文件（无 handle），且正在保存 Source 内容，则转为“另存为”逻辑
        if (!activeFile?.handle && content === undefined) {
            return await saveSourceAs();
        }

        if (activeFile?.handle) {
            try {
                // 调用原生保存 API
                // 如果传入 content 则保存 content (如 Preview)，否则保存 input (Source)
                const writable = await activeFile.handle.createWritable();
                await writable.write(content ?? input);
                await writable.close();

                // 保存成功后，更新 savedContent 并清除 Dirty 标记
                if (content === undefined) {
                    // 仅当保存的是 Source (Input) 内容时更新 savedContent
                    setFiles(prev => prev.map(f =>
                        f.id === activeFileId ? { ...f, savedContent: input, isDirty: false } : f
                    ));
                } else {
                    // 当保存的是 Preview 内容时，同步更新 Source 内容和状态
                    applySourceState(content);
                    setFiles(prev => prev.map(f =>
                        f.id === activeFileId ? { ...f, content: content, savedContent: content, isDirty: false } : f
                    ));
                }

                return true;
            } catch (err) {
                console.error('Failed to save file:', err);
                toast.error(getDetailedErrorMessage(err, '保存文件失败，请重试'), {
                    duration: 3000,
                });
                return false;
            }
        }
        return false;
    };

    // 打开拖拽进来的文件（无 Handle，仅读取内容）
    const openDroppedFiles = async (droppedFiles: FileList | File[]) => {
        const fileList = Array.from(droppedFiles);
        await openTextFileEntries(fileList.map(file => ({ file })));
    };

    const closeFile = (id: string) => {
        const closeResult = getWorkspaceTabCloseResult(files, id);
        if (!closeResult) return;

        setFiles(closeResult.remainingFiles);
        if (id === activeFileId) {
            if (closeResult.nextActiveFile) {
                setActiveFileId(closeResult.nextActiveFile.id);
                applySourceState(closeResult.nextActiveFile.content, closeResult.nextActiveFile.mode ?? TransformMode.NONE);
            } else {
                setActiveFileId(null);
                applySourceState('', TransformMode.NONE);
            }
        }
    };

    const switchTab = (id: string) => {
        const file = files.find(f => f.id === id);
        if (file) {
            setActiveFileId(id);
            applySourceState(file.content, file.mode ?? TransformMode.NONE);
        }
    };

    // 保存指定标签页的编辑器视图状态（光标位置、滚动位置）
    const saveViewState = useCallback((fileId: string, viewState: unknown) => {
        setFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, viewState } : f
        ));
    }, []);

    return {
        files,
        setFiles,
        activeFileId,
        isAutoSaveEnabled,
        setIsAutoSaveEnabled,
        createNewTab,
        openFile,
        openDroppedFiles,
        saveFile,
        saveSourceAs,
        closeFile,
        switchTab,
        updateActiveFileContent,
        saveViewState,
        flushWorkspaceDraft
    };
};
