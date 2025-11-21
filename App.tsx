
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { CodeEditor } from './components/Editor';
import { ActionPanel } from './components/ActionPanel';
import {
  validateJson,
  performTransform,
  performInverseTransform
} from './utils/transformations';
import { fixJsonWithAI } from './services/geminiService';
import { TransformMode, ActionType, ValidationResult } from './types';

const App: React.FC = () => {
  // The Source of Truth
  const [input, setInput] = useState<string>('');

  // The View Mode
  const [mode, setMode] = useState<TransformMode>(TransformMode.NONE);

  // Derived Output (The Projection)
  const output = useMemo(() => {
    return performTransform(input, mode);
  }, [input, mode]);

  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(220);
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

    // Guard: If we are in NONE mode, it's a direct mirror, but logic flows through performInverseTransform correctly anyway.
    // Pass 'input' (current source) as originalInput for smart inverse
    const newSource = performInverseTransform(newVal, mode, input);
    setInput(newSource);
  };

  const handleAction = async (action: ActionType) => {
    if (action === ActionType.AI_FIX) {
      if (!input.trim()) return;
      setIsProcessing(true);
      try {
        // AI Fix logic operates on Input directly
        const fixed = await fixJsonWithAI(input);
        setInput(fixed);
        // Automatically switch to Format mode to show the result nicely
        setMode(TransformMode.FORMAT);
      } catch (e: any) {
        setValidation({ isValid: false, error: e.message });
      } finally {
        setIsProcessing(false);
      }
    } else if (action === ActionType.SAVE) {
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

  return (
    <div ref={appRef} className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none">

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar (Mode Selector) */}
        <div style={{ width: sidebarWidth }} className="flex-shrink-0 z-10 border-r border-[#1e1e1e]">
          <ActionPanel
            activeMode={mode}
            onModeChange={setMode}
            onAction={handleAction}
            isProcessing={isProcessing}
          />
        </div>

        {/* Sidebar Resizer */}
        <div
          className={`w-1 hover:bg-[#007acc] cursor-col-resize z-20 flex-shrink-0 ${isResizingSidebar ? 'bg-[#007acc]' : 'bg-[#252526]'}`}
          onMouseDown={startResizingSidebar}
        ></div>

        {/* Editors Area */}
        <div className="flex-1 flex min-w-0 bg-[#1e1e1e]">

          {/* Left Pane: Source Input */}
          <div style={{ width: `${leftPaneWidthPercent}%` }} className="flex flex-col min-w-[100px] h-full relative">
            <CodeEditor
              label="SOURCE"
              value={input}
              onChange={handleInputChange}
              placeholder="// 在此输入 JSON 或文本..."
              error={!validation.isValid ? (validation.error || "Error") : undefined}
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
        </div>
        <div className="flex gap-4">
          <span className="opacity-80">Current View: {mode}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
