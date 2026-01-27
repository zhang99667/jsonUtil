import React, { useState, useEffect, useCallback } from 'react';
import { FileTab, TransformMode } from '../types';

interface UseFileSystemProps {
    input: string;
    setInput: (value: string) => void;
    inputRef: React.MutableRefObject<string>;
    setMode: (mode: TransformMode) => void;
    output: string;
}

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
    setMode,
    output
}: UseFileSystemProps) => {
    const [files, setFiles] = useState<FileTab[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(false);

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
        if (!isAutoSaveEnabled || !activeFile?.handle) return;

        const timer = setTimeout(async () => {
            try {
                const writable = await activeFile.handle.createWritable();
                await writable.write(input);
                await writable.close();
                console.log('Auto-saved');
            } catch (err) {
                console.error('Auto-save failed:', err);
            }
        }, 1000); // 防抖延迟 1s

        return () => clearTimeout(timer);
    }, [input, activeFileId, files, isAutoSaveEnabled]);

    const createNewTab = () => {
        const newFileId = generateUUID();

        // VSCode 风格命名:找到最小的未使用编号
        const existingNumbers = files
            .map(f => {
                const match = f.name.match(/^Untitled-(\d+)$/);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter((n): n is number => n !== null);

        // 找到最小的可用编号
        let newNumber = 1;
        while (existingNumbers.includes(newNumber)) {
            newNumber++;
        }

        const newFileName = `Untitled-${newNumber}`;

        const newFile: FileTab = {
            id: newFileId,
            name: newFileName,
            content: '',
            savedContent: '', // 新建文件，保存内容为空
            handle: undefined, // 无文件句柄,表示未保存的新标签
            isDirty: false,
            mode: TransformMode.NONE // 新标签默认无转换模式
        };

        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFileId);
        setInput('');
        inputRef.current = '';

        // 重置视图模式
        setMode(TransformMode.NONE);
    };

    const openFile = async () => {
        // Fallback for environments without File System Access API
        // @ts-ignore
        if (typeof window.showOpenFilePicker !== 'function') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.json,.js,.ts,.md';
            
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;

                const contents = await file.text();
                const newFileId = generateUUID();

                const newFile: FileTab = {
                    id: newFileId,
                    name: file.name,
                    content: contents,
                    savedContent: contents,
                    handle: undefined, // No handle in fallback mode
                    isDirty: false,
                    mode: TransformMode.NONE,
                    path: (file as any).path
                };

                setFiles(prev => [...prev, newFile]);
                setActiveFileId(newFileId);
                setInput(contents);
                inputRef.current = contents;
                setMode(TransformMode.NONE);
            };

            input.click();
            return;
        }

        try {
            // @ts-ignore - 忽略 File System Access API 类型检查
            const [handle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'Text Files',
                        accept: {
                            'text/plain': ['.txt', '.json', '.js', '.ts', '.md'],
                        },
                    },
                ],
                excludeAcceptAllOption: false,
                multiple: false,
            });

            const file = await handle.getFile();
            const contents = await file.text();
            const newFileId = generateUUID();

            const newFile: FileTab = {
                id: newFileId,
                name: file.name,
                content: contents,
                savedContent: contents, // 打开时保存内容等于当前内容
                handle: handle,
                isDirty: false,
                mode: TransformMode.NONE, // 新打开的文件默认无转换模式
                path: (file as any).path // Electron 环境下 File 对象包含 path 属性
            };

            setFiles(prev => [...prev, newFile]);
            setActiveFileId(newFileId);
            setInput(contents);
            inputRef.current = contents; // 同步 Ref 状态

            // 重置视图模式
            setMode(TransformMode.NONE);
        } catch (err) {
            // 处理取消或不支持的情况
            console.log('File open cancelled or failed', err);
        }
    };

    const saveSourceAs = async () => {
        try {
            // @ts-ignore
            if (window.showSaveFilePicker) {
                // @ts-ignore
                const handle = await window.showSaveFilePicker({
                    suggestedName: activeFileId ? files.find(f => f.id === activeFileId)?.name : 'untitled.json',
                    types: [{
                        description: 'Text Files',
                        accept: { 'text/plain': ['.txt', '.json', '.js', '.ts', '.md'] },
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
                            path: (handle as any).path // Electron 环境下可能可用
                        } : f
                    ));
                }
                
                return true;
            } else {
                // Fallback (传统下载模式，无法更新 Handle)
                const blob = new Blob([input], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = activeFileId ? (files.find(f => f.id === activeFileId)?.name || 'untitled.json') : 'untitled.json';
                a.click();
                URL.revokeObjectURL(url);
                
                // 传统下载模式下，我们至少可以重置 Dirty 状态，假定用户已保存
                if (activeFileId) {
                    setFiles(prev => prev.map(f =>
                        f.id === activeFileId ? { ...f, savedContent: input, isDirty: false } : f
                    ));
                }
                return true;
            }
        } catch (err) {
            // 用户取消保存不应视为错误
            if ((err as Error).name === 'AbortError') {
                return false;
            }
            console.error('Failed to save source as:', err);
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
                    setInput(content);
                    inputRef.current = content;
                    setFiles(prev => prev.map(f =>
                        f.id === activeFileId ? { ...f, content: content, savedContent: content, isDirty: false } : f
                    ));
                }

                console.log('File saved successfully');
                return true;
            } catch (err) {
                console.error('Failed to save file:', err);
                alert('保存文件失败，请重试');
                return false;
            }
        }
        return false;
    };

    const closeFile = (id: string) => {
        const fileToClose = files.find(f => f.id === id);
        if (fileToClose?.isDirty) {
            // 简单确认，后续可升级为自定义 Modal
            const confirmClose = window.confirm(`文件 "${fileToClose.name}" 有未保存的修改，确定要关闭吗？\n\n关闭后修改将丢失。`);
            if (!confirmClose) return;
        }

        // 找到被关闭标签的索引
        const closedIndex = files.findIndex(f => f.id === id);
        const newFiles = files.filter(f => f.id !== id);
        setFiles(newFiles);

        if (id === activeFileId) {
            if (newFiles.length > 0) {
                // VS Code 行为：优先切换到右侧的下一个标签，如果没有则切换到左侧的前一个标签
                let nextFile;
                if (closedIndex < newFiles.length) {
                    // 右侧还有标签，切换到右侧的下一个（索引保持不变，因为当前标签被移除）
                    nextFile = newFiles[closedIndex];
                } else {
                    // 右侧没有标签了，切换到左侧的最后一个
                    nextFile = newFiles[newFiles.length - 1];
                }
                setActiveFileId(nextFile.id);
                setInput(nextFile.content);
                inputRef.current = nextFile.content; // 同步 Ref 状态
                setMode(nextFile.mode ?? TransformMode.NONE); // 恢复该标签的模式
            } else {
                // 无打开文件
                setActiveFileId(null);
                setInput('');
                inputRef.current = ''; // 同步 Ref 状态
                setMode(TransformMode.NONE);
            }
        }
    };

    const switchTab = (id: string) => {
        const file = files.find(f => f.id === id);
        if (file) {
            setActiveFileId(id);
            setInput(file.content);
            inputRef.current = file.content; // 同步 Ref 状态
            setMode(file.mode ?? TransformMode.NONE); // 恢复该标签保存的模式
        }
    };

    return {
        files,
        setFiles,
        activeFileId,
        isAutoSaveEnabled,
        setIsAutoSaveEnabled,
        createNewTab,
        openFile,
        saveFile,
        saveSourceAs,
        closeFile,
        switchTab,
        updateActiveFileContent
    };
};
