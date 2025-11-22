
import React, { useEffect, useState, useRef } from 'react';
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
  files,
  activeFileId,
  onTabClick,
  onCloseFile,
  highlightRange
}) => {
  const [language, setLanguage] = useState<string>('plaintext');
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const decorationsCollectionRef = useRef<any>(null);

  // Custom Scrollbar State
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startScrollLeft, setStartScrollLeft] = useState(0);

  // Update scroll dimensions
  const updateScrollDimensions = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setScrollLeft(scrollLeft);
      setScrollWidth(scrollWidth);
      setClientWidth(clientWidth);
    }
  };

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollDimensions();
    });

    resizeObserver.observe(container);
    // Also observe children to detect content changes
    Array.from(container.children).forEach(child => resizeObserver.observe(child as Element));

    return () => resizeObserver.disconnect();
  }, [files?.length]); // Only re-attach when number of files changes, not content

  // Handle scroll event
  const handleScroll = () => {
    updateScrollDimensions();
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
    setStartScrollLeft(scrollLeft);
    e.preventDefault();
  };

  // Handle drag move and end
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !tabsContainerRef.current) return;

      const delta = e.pageX - startX;
      const scrollRatio = scrollWidth / clientWidth;
      const newScrollLeft = startScrollLeft + delta * scrollRatio;

      tabsContainerRef.current.scrollLeft = newScrollLeft;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, startScrollLeft, scrollWidth, clientWidth]);

  // Calculate thumb styles
  // Ensure thumb is at least 20px wide so it's always clickable
  const rawThumbWidth = (clientWidth / scrollWidth) * 100;
  const thumbWidth = Math.max(rawThumbWidth, (20 / clientWidth) * 100 * (scrollWidth / clientWidth)); // Approximate min width logic

  // Adjust left position to account for min-width
  const effectiveThumbWidth = Math.max(rawThumbWidth, 5); // Min 5% width
  const thumbLeft = (scrollLeft / (scrollWidth - clientWidth)) * (100 - effectiveThumbWidth);

  // Show scrollbar if content overflows
  const showScrollbar = scrollWidth > clientWidth + 1; // +1 for subpixel safety

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



  // Handle Highlight Range
  useEffect(() => {
    if (!editorRef.current || !monaco) return;

    if (highlightRange) {
      // Create decoration
      const newDecorations = [
        {
          range: new monaco.Range(
            highlightRange.startLine,
            highlightRange.startColumn,
            highlightRange.endLine,
            highlightRange.endColumn
          ),
          options: {
            isWholeLine: false,
            className: 'jsonpath-highlight', // 使用自定义 CSS 类
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        }
      ];

      // Apply decorations
      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.clear();
      }
      decorationsCollectionRef.current = editorRef.current.createDecorationsCollection(newDecorations);

      // Reveal range
      editorRef.current.revealRangeInCenter(
        new monaco.Range(
          highlightRange.startLine,
          highlightRange.startColumn,
          highlightRange.endLine,
          highlightRange.endColumn
        ),
        monaco.editor.ScrollType.Smooth
      );
    } else {
      // Clear decorations if highlightRange is null
      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.clear();
      }
    }
  }, [highlightRange, monaco]);

  // Auto-scroll to end when a new file is opened
  useEffect(() => {
    if (tabsContainerRef.current && files && files.length > 0) {
      // We only want to scroll to end if a *new* file was added (length increased).
      // For now, let's just scroll to the active file if it's not visible? 
      // The requirement is "newly opened file... automatically scroll to end".
      // Simple heuristic: if activeFile is the last one, scroll to end.
      const activeIndex = files.findIndex(f => f.id === activeFileId);
      if (activeIndex === files.length - 1) {
        tabsContainerRef.current.scrollTo({ left: tabsContainerRef.current.scrollWidth, behavior: 'smooth' });
      }
    }
  }, [files, activeFileId]); // Corrected dependencies

  const getFileIcon = (filename: string) => {
    if (!filename) return <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        return <span className="text-yellow-400 font-bold text-[10px] w-3.5 text-center flex-shrink-0">J</span>;
      case 'js':
      case 'jsx':
        return <span className="text-yellow-300 font-bold text-[10px] w-3.5 text-center flex-shrink-0">JS</span>;
      case 'ts':
      case 'tsx':
        return <span className="text-blue-400 font-bold text-[10px] w-3.5 text-center flex-shrink-0">TS</span>;
      case 'css':
        return <span className="text-blue-300 font-bold text-[10px] w-3.5 text-center flex-shrink-0">#</span>;
      case 'html':
        return <span className="text-orange-400 font-bold text-[10px] w-3.5 text-center flex-shrink-0">&lt;&gt;</span>;
      case 'md':
        return <span className="text-gray-300 font-bold text-[10px] w-3.5 text-center flex-shrink-0">M↓</span>;
      default:
        return <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#1e1e1e] group">
      {/* Header */}
      <div className="flex items-center bg-[#252526] pl-4 pr-2 border-t border-[#454545] select-none h-9 min-h-[36px] group/header">
        <div className="flex items-center gap-3 h-full flex-1 min-w-0 overflow-hidden">
          <span className={`text-xs font-bold font-mono uppercase flex-shrink-0 ${getLanguageColor(language)}`}>
            {language === 'plaintext' ? 'TXT' : language}
          </span>
          <label className="text-xs font-sans text-gray-300 tracking-wide cursor-default opacity-80 italic flex-shrink-0">
            {label}
          </label>

          {files && files.length > 0 && (
            <div className="flex-1 h-full relative min-w-0 ml-2 flex flex-col justify-end">
              <div
                ref={tabsContainerRef}
                onScroll={handleScroll}
                className="flex items-center h-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden scrollbar-hide"
              >
                {files.map(file => (
                  <div
                    key={file.id}
                    onClick={() => onTabClick?.(file.id)}
                    className={`flex items-center gap-2 px-3 h-full border-r border-r-[#252526] text-[13px] select-none cursor-pointer group/tab min-w-[120px] max-w-[200px] flex-shrink-0 ${file.id === activeFileId
                      ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#0078d4] relative top-[1px]'
                      : 'bg-[#2d2d2d] text-[#969696] border-t border-t-transparent hover:bg-[#2a2d2e] mb-[1px]'
                      }`}
                    title={file.name}
                  >
                    {getFileIcon(file.name)}
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseFile?.(file.id);
                      }}
                      className={`rounded-md p-1 transition-all ml-1 flex-shrink-0 ${file.id === activeFileId ? 'opacity-0 group-hover/tab:opacity-100 hover:bg-[#333]' : 'opacity-0 group-hover/tab:opacity-100 hover:bg-[#444]'}`}
                      title="Close"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Overlay Scrollbar */}
              {showScrollbar && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] z-10 opacity-0 group-hover/header:opacity-100 transition-opacity duration-200">
                  <div
                    className="h-full bg-[#424242] hover:bg-[#4f4f4f] rounded-full cursor-pointer relative"
                    style={{
                      width: `${thumbWidth}%`,
                      left: `${thumbLeft}%`
                    }}
                    onMouseDown={handleMouseDown}
                  />
                </div>
              )}
            </div>
          )}

          {readOnly && !canToggleReadOnly && (
            <span className="text-[10px] text-gray-500 bg-[#333] px-1.5 rounded border border-[#454545] flex-shrink-0">READ ONLY</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
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
          onMount={(editor) => {
            editorRef.current = editor;
          }}
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
