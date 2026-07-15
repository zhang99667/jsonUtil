import React, { useState, useCallback } from 'react';
import { FileTab, TransformMode } from '../types';
import { createSecureUuid } from '../utils/secureUuid';
import { loadWorkspaceDraftSnapshot } from '../utils/workspaceDraft';
import { getNextUntitledName } from '../utils/workspaceFileTabs';
import { getFilesWithStandaloneDraft } from '../utils/workspaceStandaloneDraftFile';
import { applyWorkspaceSourceState } from '../utils/workspaceSourceState';
import { createFileOpenCommands } from './fileOpenCommands';
import { useFileAutoSave } from './useFileAutoSave';
import { useFileOpenRequestGuard } from './useFileOpenRequestGuard';
import { useFileSaveCommands } from './useFileSaveCommands';
import { useWorkspaceDraftPersistence } from './useWorkspaceDraftPersistence';
import { useWorkspaceFileTabState } from './useWorkspaceFileTabState';

interface UseFileSystemProps {
    input: string;
    setInput: (value: string) => void;
    inputRef: React.MutableRefObject<string>;
    mode: TransformMode;
    setMode: (mode: TransformMode) => void;
    onBeforeSourceWorkspaceChange?: () => void;
}

export const useFileSystem = ({
    input,
    setInput,
    inputRef,
    mode,
    setMode,
    onBeforeSourceWorkspaceChange,
}: UseFileSystemProps) => {
    const [restoredDraft] = useState(() => loadWorkspaceDraftSnapshot());
    const {
        beginRequest,
        captureWorkspaceMode,
        captureWorkspaceRevision,
        inspectRequest,
        isWorkspaceRevisionCurrent,
        markWorkspaceIntent,
    } = useFileOpenRequestGuard({ inputRef, mode });

    const applySourceState = useCallback((content: string, nextMode?: TransformMode) => {
        markWorkspaceIntent(nextMode);
        applyWorkspaceSourceState({
            content,
            mode: nextMode,
            inputRef,
            onBeforeSourceWorkspaceChange,
            setInput,
            setMode,
        });
    }, [inputRef, markWorkspaceIntent, onBeforeSourceWorkspaceChange, setInput, setMode]);

    const applyActiveFileSource = useCallback((file: FileTab | null) => {
        applySourceState(file?.content ?? '', file?.mode ?? TransformMode.NONE);
    }, [applySourceState]);

    const {
        files,
        activeFileId,
        activeFileIdRef,
        appendOpenedFiles,
        closeWorkspaceFile,
        getWorkspaceState,
        selectWorkspaceFile,
        setCurrentActiveFileId,
        setFiles,
    } = useWorkspaceFileTabState({
        initialFiles: restoredDraft?.files || [],
        initialActiveFileId: restoredDraft?.activeFileId || null,
    });
    const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(false);

    const flushWorkspaceDraft = useWorkspaceDraftPersistence({
        restoredDraft,
        files,
        activeFileId,
        input,
        mode,
        applySourceState,
    });

    const cancelPendingAutoSave = useFileAutoSave({
        activeFile: files.find(file => file.id === activeFileId),
        input,
        isEnabled: isAutoSaveEnabled,
        setFiles,
    });

    const { openDroppedFiles, openFile } = createFileOpenCommands({
        activeFileIdRef,
        appendOpenedFiles,
        applySourceState,
        beginRequest,
        inspectRequest,
    });

    const { invalidateSaveAsIntent, saveFile, saveSourceAs } = useFileSaveCommands({
        applySourceState,
        cancelPendingAutoSave,
        captureWorkspaceMode,
        captureWorkspaceRevision,
        getWorkspaceState,
        inputRef,
        isWorkspaceRevisionCurrent,
        setCurrentActiveFileId,
        setFiles,
    });

    // 同步输入变更到活动文件
    const updateActiveFileContent = useCallback((newContent: string) => {
        markWorkspaceIntent();
        const currentActiveFileId = activeFileIdRef.current;
        if (currentActiveFileId) {
            setFiles(prev => prev.map(f =>
                f.id === currentActiveFileId
                    ? { ...f, content: newContent, isDirty: newContent !== (f.savedContent || '') }
                    : f
            ));
        }
    }, [activeFileIdRef, markWorkspaceIntent, setFiles]);

    const createNewTab = () => {
        const currentActiveFileId = activeFileIdRef.current;
        const currentInput = inputRef.current;
        const standaloneDraftId = !currentActiveFileId && currentInput.length > 0
            ? createSecureUuid()
            : '';
        const newFileId = createSecureUuid();

        setFiles(currentFiles => {
            const nextFiles = getFilesWithStandaloneDraft({
                files: currentFiles,
                activeFileId: currentActiveFileId,
                input: currentInput,
                mode,
                createId: () => standaloneDraftId,
            });
            return [...nextFiles, {
                id: newFileId,
                name: getNextUntitledName(nextFiles),
                content: '',
                savedContent: '',
                handle: undefined,
                isDirty: false,
                mode: TransformMode.NONE,
            }];
        });
        setCurrentActiveFileId(newFileId);
        applySourceState('', TransformMode.NONE);
    };

    const closeFile = (id: string) => {
        const { closed, nextActiveFile } = closeWorkspaceFile(id);
        if (!closed) return;
        invalidateSaveAsIntent(id);
        if (nextActiveFile !== undefined) applyActiveFileSource(nextActiveFile);
    };

    const switchTab = (id: string) => {
        const file = selectWorkspaceFile(id);
        if (file) applyActiveFileSource(file);
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
