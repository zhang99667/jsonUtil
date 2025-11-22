
import React, { useEffect, useState } from 'react';
import Editor, { useMonaco } from "@monaco-editor/react";
import { EditorProps } from '../types';
import { detectLanguage } from '../utils/transformations';

export const CodeEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  readOnly = false,
  canToggleReadOnly = false,
  label,
  error,
  headerActions,
  fileName,
  onCloseFile
}) => {
  const [language, setLanguage] = useState<string>('plaintext');
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const monaco = useMonaco();

  useEffect(() => {
    const detected = detectLanguage(value);
    setLanguage(detected);
  }, [value]);

  // Reset lock state if the prop changes
  useEffect(() => {
    if (readOnly) {
      setIsLocked(true);
    }
  }, [readOnly]);

  const effectiveReadOnly = readOnly && (!canToggleReadOnly || isLocked);

  // Handle change with strict guard
  const handleEditorChange = (val: string | undefined) => {
    // CRITICAL: Do not fire onChange if we are effectively in read-only mode.
    // This prevents loops where the formatted preview might try to update the source.
    if (effectiveReadOnly) return;
    onChange(val || '');
  };

  useEffect(() => {
    if (monaco) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: true,
        enableSchemaRequest: false
      });
    }
  }, [monaco]);

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'json': return 'text-yellow-400';
      case 'javascript': return 'text-yellow-200';
      case 'xml':
      case 'html': return 'text-blue-400';
      case 'css': return 'text-blue-300';
      case 'sql': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const toggleWordWrap = () => {
    setWordWrap(prev => prev === 'on' ? 'off' : 'on');
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#1e1e1e] group">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#252526] px-4 border-t border-[#454545] select-none h-9 min-h-[36px]">
        <div className="flex items-center gap-3 h-full">
          <span className={`text-xs font-bold font-mono uppercase ${getLanguageColor(language)}`}>
            {language === 'plaintext' ? 'TXT' : language}
          </span>
          <label className="text-xs font-sans text-gray-300 tracking-wide cursor-default opacity-80 italic">
            {label}
          </label>

          {fileName && (
            <div className="flex items-center gap-2 px-3 h-full bg-[#1e1e1e] border-t-2 border-t-[#0078d4] border-r border-r-[#252526] text-[13px] text-white relative top-[1px] select-none group/tab">
              <svg className="w-3.5 h-3.5 text-[#e8b05f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="truncate max-w-[150px]">{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile?.();
                }}
                className="opacity-0 group-hover/tab:opacity-100 hover:bg-[#333] rounded p-0.5 transition-all ml-1"
                title="Close"
              >
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {readOnly && !canToggleReadOnly && (
            <span className="text-[10px] text-gray-500 bg-[#333] px-1.5 rounded border border-[#454545]">READ ONLY</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Custom Header Actions */}
          {headerActions}

          {/* Lock Toggle */}
          {canToggleReadOnly && (
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors border ${!isLocked ? 'bg-red-900/30 text-red-300 border-red-900/50' : 'text-gray-400 border-transparent hover:bg-[#333]'}`}
              title={isLocked ? "Click to Edit" : "Unlocked"}
            >
              {isLocked ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span>锁定</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                  <span>编辑</span>
                </>
              )}
            </button>
          )}

          {/* Word Wrap Toggle */}
          <button
            onClick={toggleWordWrap}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border ${wordWrap === 'on' ? 'bg-[#094771] text-white border-[#007acc]' : 'text-gray-400 border-transparent hover:bg-[#333]'}`}
            title="Toggle Word Wrap"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            <span>{wordWrap === 'on' ? '换行' : '不换行'}</span>
          </button>

          {error ? (
            <div className="flex items-center text-[10px] text-red-400 bg-[#3c1515] px-2 py-0.5 rounded border border-red-900/50 shadow-sm">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
              {error}
            </div>
          ) : value && language === 'json' ? (
            <div className="flex items-center text-[10px] text-green-400 bg-[#1e3a2a] px-2 py-0.5 rounded border border-green-900/50">
              Valid JSON
            </div>
          ) : null}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={handleEditorChange}
          options={{
            readOnly: effectiveReadOnly,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: '"Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: wordWrap,
            folding: true,
            contextmenu: true,
            padding: { top: 10, bottom: 10 },
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              vertical: 'visible',
              horizontal: 'visible',
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: 'all',
          }}
          loading={
            <div className="h-full w-full flex items-center justify-center text-[#666] text-xs">
              加载编辑器...
            </div>
          }
        />
      </div>
    </div>
  );
};
