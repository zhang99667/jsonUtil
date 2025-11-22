
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ActionPanel } from './components/ActionPanel';
import { CodeEditor } from './components/Editor';
import {
  validateJson,
  performTransform,
  performInverseTransform
} from './utils/transformations';
import { fixJsonWithAI } from './services/aiService';
import { UnifiedSettingsModal } from './components/UnifiedSettingsModal';
import { TransformMode, ActionType, ValidationResult, ShortcutConfig, ShortcutKey, ShortcutAction, FileTab, AIConfig, AIProvider } from './types';

const DEFAULT_SHORTCUTS: ShortcutConfig = {
  SAVE: { key: 's', meta: true, ctrl: false, shift: false, alt: false },
  FORMAT: { key: 'f', meta: true, ctrl: false, shift: true, alt: false },
  DEEP_FORMAT: { key: 'Enter', meta: true, ctrl: false, shift: false, alt: false },
  MINIFY: { key: 'm', meta: true, ctrl: false, shift: true, alt: false },
  CLOSE_TAB: { key: 'w', meta: true, ctrl: false, shift: false, alt: false },
};

const MODE_LABELS: Record<TransformMode, string> = {
  [TransformMode.NONE]: '原始视图',
  [TransformMode.FORMAT]: '格式化',
  [TransformMode.DEEP_FORMAT]: '深度格式化',
  [TransformMode.MINIFY]: '压缩',
  [TransformMode.ESCAPE]: '转义',
  [TransformMode.UNESCAPE]: '反转义',
  [TransformMode.UNICODE_TO_CN]: 'Unicode 转中文',
  [TransformMode.CN_TO_UNICODE]: '中文 转 Unicode',
};

const App: React.FC = () => {
  // The Source of Truth
  const [input, setInput] = useState<string>('');

  // Use ref to always have the latest input value for inverse transforms
  // This prevents race conditions when rapidly typing in the preview pane
  const inputRef = useRef<string>('');

  // Use ref to prevent feedback loops when updating from output pane
  const isUpdatingFromOutput = useRef<boolean>(false);

  // Use ref to store the pending output value being edited
  const pendingOutputValue = useRef<string>('');

  // The View Mode
  const [mode, setMode] = useState<TransformMode>(TransformMode.NONE);

  // Derived Output (The Projection)
  const output = useMemo(() => {
    // If we're currently processing an output change and have a pending value, return it
    // This prevents the output from being recalculated and overwriting what the user is typing
    if (isUpdatingFromOutput.current && pendingOutputValue.current) {
      return pendingOutputValue.current;
    }
    const result = performTransform(input, mode);
    // Clear pending value when we do a fresh transform
    if (!isUpdatingFromOutput.current) {
      pendingOutputValue.current = '';
    }
    return result;
  }, [input, mode]);

  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });

  // File System Access API State
  const [files, setFiles] = useState<FileTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(() => {
    const saved = localStorage.getItem('json-helper-shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('json-helper-ai-config');
    return saved ? JSON.parse(saved) : {
      provider: AIProvider.GEMINI,
      apiKey: '',
      model: 'gemini-2.0-flash'
    };
  });

  useEffect(() => {
    localStorage.setItem('json-helper-ai-config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    localStorage.setItem('json-helper-shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [leftPaneWidthPercent, setLeftPaneWidthPercent] = useState(50);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingPane, setIsResizingPane] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);

  // Validate input on change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (input && input.trim()) {
        // Clean input before validation checks (remove zero-width spaces, BOM, etc)
        // This helps prevent false positives on "copy-paste" errors
        const cleanInput = input.replace(/[\u200B-\u200D\uFEFF]/g, '');

        if (cleanInput.trim().startsWith('{') || cleanInput.trim().startsWith('[')) {
          setValidation(validateJson(cleanInput));
        } else {
          setValidation({ isValid: true });
        }
      } else {
        setValidation({ isValid: true });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [input]);

  // Handle Left Pane Changes (Update Source directly)
  const handleInputChange = (newVal: string) => {
    // Remove invisible characters immediately on input to prevent "ghost" errors
    const cleanVal = newVal.replace(/[\u200B-\u200D\uFEFF]/g, '');
    setInput(cleanVal);

    // CRITICAL: Update ref to always have the latest value for inverse transforms
    inputRef.current = cleanVal;

    // Update the content of the active file in the files list
    if (activeFileId) {
      setFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, content: cleanVal, isDirty: true } : f
      ));
    }

    // CRITICAL CHANGE: 
    // When user types or pastes in the source, RESET the mode to NONE (Raw).
    // This prevents previous modes (like Escape/Format) from automatically applying
    // to new, potentially incompatible content.
    if (mode !== TransformMode.NONE) {
      setMode(TransformMode.NONE);
    }
  };

  // Handle Right Pane Changes (Update Source via Inverse Transform)
  // This is only called when the user edits the right pane (after unlocking read-only)
  const handleOutputChange = (newVal: string) => {
    // Store the value being edited to prevent it from being overwritten
    pendingOutputValue.current = newVal;

    // Set flag to prevent feedback loop
    isUpdatingFromOutput.current = true;

    // Independent Validation for Preview Pane
    if (newVal && newVal.trim()) {
      const cleanVal = newVal.replace(/[\u200B-\u200D\uFEFF]/g, '');
      if (cleanVal.trim().startsWith('{') || cleanVal.trim().startsWith('[')) {
        setPreviewValidation(validateJson(cleanVal));
      } else {
        setPreviewValidation({ isValid: true });
      }
    } else {
      setPreviewValidation({ isValid: true });
    }

    // CRITICAL FIX: Use inputRef.current instead of input state to avoid race conditions
    // When typing rapidly, the 'input' state might be stale, but inputRef.current is always fresh
    // This prevents the inverse transform from using outdated originalInput and losing structure
    const newSource = performInverseTransform(newVal, mode, inputRef.current);
    setInput(newSource);

    // CRITICAL: Update ref immediately to keep it in sync
    inputRef.current = newSource;

    // Update active file content as well
    if (activeFileId) {
      setFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, content: newSource, isDirty: true } : f
      ));
    }

    // Reset flags after state updates have been processed
    // Use setTimeout to ensure this happens after React's render cycle
    setTimeout(() => {
      isUpdatingFromOutput.current = false;
      pendingOutputValue.current = '';
    }, 100); // Small delay to allow React to complete the update
  };

  // Auto Save Effect
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
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [input, activeFileId, files, isAutoSaveEnabled]);

  const handleAction = async (action: ActionType) => {
    if (action === ActionType.AI_FIX) {
      if (!input.trim()) return;
      setIsProcessing(true);
      try {
        // AI Fix logic operates on Input directly
        const fixed = await fixJsonWithAI(input, aiConfig);
        setInput(fixed);
        inputRef.current = fixed; // Keep ref in sync
        // Automatically switch to Format mode to show the result nicely
        setMode(TransformMode.FORMAT);
      } catch (e: any) {
        setValidation({ isValid: false, error: e.message });
      } finally {
        setIsProcessing(false);
      }
    } else if (action === ActionType.SAVE) {
      const activeFile = files.find(f => f.id === activeFileId);
      if (activeFile?.handle) {
        try {
          // Native Save
          const writable = await activeFile.handle.createWritable();
          await writable.write(output);
          await writable.close();
          // Optional: Show a toast or indicator here
          console.log('File saved successfully');
        } catch (err) {
          console.error('Failed to save file:', err);
          alert('保存文件失败，请重试');
        }
      } else {
        // Fallback Download
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
    } else if (action === ActionType.OPEN) {
      try {
        // @ts-ignore - File System Access API
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
        inputRef.current = contents; // Keep ref in sync

        // Reset mode for new file
        setMode(TransformMode.NONE);
      } catch (err) {
        // User cancelled or API not supported
        console.log('File open cancelled or failed', err);
      }
    }
  };

  // Drag Logic
  const startResizingSidebar = () => setIsResizingSidebar(true);
  const startResizingPane = () => setIsResizingPane(true);
  const stopResizing = () => {
    setIsResizingSidebar(false);
    setIsResizingPane(false);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingSidebar) {
      const newWidth = Math.max(180, Math.min(400, e.clientX));
      setSidebarWidth(newWidth);
    }
    if (isResizingPane && appRef.current) {
      const appRect = appRef.current.getBoundingClientRect();
      const editorAreaLeft = appRect.left + sidebarWidth;
      const editorAreaWidth = appRect.width - sidebarWidth;
      const relativeX = e.clientX - editorAreaLeft;
      const newPercent = (relativeX / editorAreaWidth) * 100;
      setLeftPaneWidthPercent(Math.max(20, Math.min(80, newPercent)));
    }
  }, [isResizingSidebar, isResizingPane, sidebarWidth]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Helper to check if event matches shortcut
      const matches = (shortcut: ShortcutKey) => {
        if (!shortcut.key) return false;
        return (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          e.metaKey === shortcut.meta &&
          e.ctrlKey === shortcut.ctrl &&
          e.shiftKey === shortcut.shift &&
          e.altKey === shortcut.alt
        );
      };

      // Save
      if (matches(shortcuts.SAVE)) {
        e.preventDefault();
        handleAction(ActionType.SAVE);
        return;
      }

      // Format
      if (matches(shortcuts.FORMAT)) {
        e.preventDefault();
        setMode(TransformMode.FORMAT);
        return;
      }

      // Deep Format
      if (matches(shortcuts.DEEP_FORMAT)) {
        e.preventDefault();
        setMode(TransformMode.DEEP_FORMAT);
        return;
      }

      // Minify
      if (matches(shortcuts.MINIFY)) {
        e.preventDefault();
        setMode(TransformMode.MINIFY);
        return;
      }

      // Close Tab
      if (matches(shortcuts.CLOSE_TAB)) {
        e.preventDefault();
        if (activeFileId) {
          closeFile(activeFileId);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, shortcuts]);

  const updateShortcut = (action: ShortcutAction, key: ShortcutKey) => {
    setShortcuts(prev => ({ ...prev, [action]: key }));
  };

  const resetShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
  };

  const closeFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);

    if (id === activeFileId) {
      if (newFiles.length > 0) {
        // Switch to the last file
        const nextFile = newFiles[newFiles.length - 1];
        setActiveFileId(nextFile.id);
        setInput(nextFile.content);
        inputRef.current = nextFile.content; // Keep ref in sync
        setMode(TransformMode.NONE);
      } else {
        // No files left
        setActiveFileId(null);
        setInput('');
        inputRef.current = ''; // Keep ref in sync
        setMode(TransformMode.NONE);
      }
    }
  };

  const switchTab = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      setActiveFileId(id);
      setInput(file.content);
      inputRef.current = file.content; // Keep ref in sync
      setMode(TransformMode.NONE);
    }
  };

  return (
    <div ref={appRef} className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none">

      <UnifiedSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        shortcuts={shortcuts}
        onUpdateShortcut={updateShortcut}
        onResetShortcuts={resetShortcuts}
        aiConfig={aiConfig}
        onSaveAIConfig={setAiConfig}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar (Mode Selector) */}
        <div style={{ width: isSidebarCollapsed ? 64 : sidebarWidth }} className="flex-shrink-0 z-10 border-r border-[#1e1e1e] transition-all duration-300 ease-in-out">
          <ActionPanel
            activeMode={mode}
            onModeChange={setMode}
            onAction={handleAction}
            isProcessing={isProcessing}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Sidebar Resizer */}
        {!isSidebarCollapsed && (
          <div
            className={`w-1 hover:bg-[#007acc] cursor-col-resize z-20 flex-shrink-0 ${isResizingSidebar ? 'bg-[#007acc]' : 'bg-[#252526]'}`}
            onMouseDown={startResizingSidebar}
          ></div>
        )}

        {/* Editors Area */}
        <div className="flex-1 flex min-w-0 bg-[#1e1e1e]">

          {/* Left Pane: Source Input */}
          <div style={{ width: `${leftPaneWidthPercent}%` }} className="flex flex-col min-w-[100px] h-full relative">
            <CodeEditor
              value={input}
              onChange={handleInputChange}
              label="SOURCE"
              files={files}
              activeFileId={activeFileId}
              onTabClick={switchTab}
              onCloseFile={closeFile}
              placeholder="// 在此输入 JSON 或文本..."
              error={validation.isValid ? undefined : validation.error}
              headerActions={
                <button
                  onClick={() => activeFileId && setIsAutoSaveEnabled(!isAutoSaveEnabled)}
                  disabled={!activeFileId}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border ${!activeFileId
                    ? 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
                    : isAutoSaveEnabled
                      ? 'bg-green-900/30 text-green-300 border-green-900/50'
                      : 'text-gray-400 border-transparent hover:bg-[#333]'
                    }`}
                  title={
                    !activeFileId
                      ? "请先打开文件以启用自动保存"
                      : isAutoSaveEnabled
                        ? "自动保存已开启"
                        : "点击开启自动保存"
                  }
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${!activeFileId
                    ? 'bg-gray-700'
                    : isAutoSaveEnabled
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-gray-500'
                    }`}></div>
                  <span>自动保存</span>
                </button>
              }
            />
          </div>

          {/* Pane Resizer */}
          <div
            className={`w-1 hover:bg-[#007acc] cursor-col-resize z-20 flex-shrink-0 ${isResizingPane ? 'bg-[#007acc]' : 'bg-[#252526]'}`}
            onMouseDown={startResizingPane}
          ></div>

          {/* Right Pane: Preview Output */}
          <div className="flex-1 flex flex-col min-w-[100px] h-full relative">
            <CodeEditor
              label="PREVIEW"
              value={output}
              onChange={handleOutputChange}
              readOnly={true} // Default to read-only
              canToggleReadOnly={true} // User can click lock icon to edit
              placeholder="// 结果显示区..."
              error={!previewValidation.isValid ? (previewValidation.error || "Error") : undefined}
            />
          </div>
        </div>

        {/* Drag Overlay */}
        {(isResizingSidebar || isResizingPane) && (
          <div className="absolute inset-0 z-50 cursor-col-resize"></div>
        )}
      </div>

      {/* Minimal Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 text-[11px] text-white select-none z-20 flex-shrink-0">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg> UTF-8</span>
          <span>Length: {input.length}</span>
          {activeFileId && (
            <span className="flex items-center gap-1 text-blue-200">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {files.find(f => f.id === activeFileId)?.name}
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className="opacity-80">当前视图:</span>
          <span className="bg-white text-[#007acc] px-1.5 py-0.5 rounded font-bold text-[11px] shadow-sm leading-none">
            {MODE_LABELS[mode]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;
