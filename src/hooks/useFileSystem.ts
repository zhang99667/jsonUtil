import { useState, useEffect, useCallback } from 'react';
import { FileTab, TransformMode } from '../types';

interface UseFileSystemProps {
    input: string;
    setInput: (value: string) => void;
    inputRef: React.MutableRefObject<string>;
    setMode: (mode: TransformMode) => void;
    output: string;
}

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
                f.id === activeFileId ? { ...f, content: newContent, isDirty: true } : f
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

    const openFile = async () => {
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
            const newFileId = crypto.randomUUID();

            const newFile: FileTab = {
                id: newFileId,
                name: file.name,
                content: contents,
                handle: handle,
                isDirty: false
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

    const saveFile = async () => {
        const activeFile = files.find(f => f.id === activeFileId);
        if (activeFile?.handle) {
            try {
                // 调用原生保存 API
                const writable = await activeFile.handle.createWritable();
                await writable.write(output);
                await writable.close();

                console.log('File saved successfully');
            } catch (err) {
                console.error('Failed to save file:', err);
                alert('保存文件失败，请重试');
            }
        } else {
            // 不支持原生 API 时的下载回退
            const blob = new Blob([output], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'result.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const closeFile = (id: string) => {
        const newFiles = files.filter(f => f.id !== id);
        setFiles(newFiles);

        if (id === activeFileId) {
            if (newFiles.length > 0) {
                // 自动切换至最后一个文件
                const nextFile = newFiles[newFiles.length - 1];
                setActiveFileId(nextFile.id);
                setInput(nextFile.content);
                inputRef.current = nextFile.content; // 同步 Ref 状态
                setMode(TransformMode.NONE);
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
            setMode(TransformMode.NONE);
        }
    };

    return {
        files,
        activeFileId,
        isAutoSaveEnabled,
        setIsAutoSaveEnabled,
        openFile,
        saveFile,
        closeFile,
        switchTab,
        updateActiveFileContent
    };
};
