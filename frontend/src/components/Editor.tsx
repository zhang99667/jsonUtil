
import React, { useEffect, useState, useRef } from 'react';
import Editor, { useMonaco } from "@monaco-editor/react";
import { EditorProps, HighlightRange } from '../types';
import { detectLanguage } from '../utils/transformations';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { computeLineDiff } from '../utils/diffUtils';

export const CodeEditor: React.FC<EditorProps> = ({
  value,
  originalValue,
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
  onNewTab,
  highlightRange,
  onFocus,
  onCursorPositionChange
}) => {
  const [language, setLanguage] = useState<string>('plaintext');
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const decorationsCollectionRef = useRef<any>(null);



  // 滚动条状态 (Hook)
  const {
    scrollContainerRef: tabsContainerRef,
    handleScroll,
    handleMouseDown,
    thumbSize: thumbWidth,
    thumbOffset: thumbLeft,
    showScrollbar,
    isDragging
  } = useCustomScrollbar('horizontal', files?.length);

  useEffect(() => {
    const detected = detectLanguage(value);
    setLanguage(detected);
  }, [value]);

  // 只读属性变更时重置锁定状态
  useEffect(() => {
    if (readOnly) {
      setIsLocked(true);
    }
  }, [readOnly]);

  const effectiveReadOnly = readOnly && (!canToggleReadOnly || isLocked);

  // 变更处理（含只读保护）
  const handleEditorChange = (val: string | undefined) => {
    // 注意：只读模式下拦截变更事件
    // 防止预览更新触发源文件死循环
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



  // 高亮区域渲染
  useEffect(() => {
    if (!editorRef.current || !monaco) return;

    if (highlightRange) {
      // 构造高亮装饰器
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

      // 应用高亮样式
      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.clear();
      }
      decorationsCollectionRef.current = editorRef.current.createDecorationsCollection(newDecorations);

      // 滚动至高亮区域
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
      // 清除高亮
      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.clear();
      }
    }
  }, [highlightRange, monaco]);

  // 版本控制脏检查 (Dirty Diff) 装饰器
  const diffDecorationsRef = useRef<any>(null);

  useEffect(() => {
    if (!editorRef.current || !monaco || originalValue === undefined) return;

    // 如果没有任何变更（内容一致），或者是新建的空文件，清除装饰器
    if (value === originalValue) {
      if (diffDecorationsRef.current) {
        diffDecorationsRef.current.clear();
      }
      return;
    }

    // 防抖计算 Diff
    const timer = setTimeout(() => {
      const diffs = computeLineDiff(originalValue, value);
      const decorations: any[] = [];

      diffs.forEach(diff => {
        let className = '';
        if (diff.type === 'add') className = 'dirty-diff-added';
        else if (diff.type === 'modify') className = 'dirty-diff-modified';

        if (className) decorations.push({
          range: new monaco.Range(diff.startLine, 1, diff.endLine, 1),
          options: {
            isWholeLine: true,
            linesDecorationsClassName: className // Render in the gutter
          }
        });
      });

      if (diffDecorationsRef.current) {
        diffDecorationsRef.current.clear();
      }
      diffDecorationsRef.current = editorRef.current.createDecorationsCollection(decorations);

    }, 200); // 200ms delay

    return () => clearTimeout(timer);

  }, [value, originalValue, monaco]);


  // 新文件打开时自动滚动标签栏
  useEffect(() => {
    if (tabsContainerRef.current && files && files.length > 0) {
      // 仅在新增文件时触发滚动


      // 若当前文件为列表末项，则滚动至最右侧
      const activeIndex = files.findIndex(f => f.id === activeFileId);
      if (activeIndex === files.length - 1) {
        tabsContainerRef.current.scrollTo({ left: tabsContainerRef.current.scrollWidth, behavior: 'smooth' });
      }
    }
  }, [files, activeFileId]);

  const getFileIcon = (filename: string) => {
    if (!filename) return <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        return <span className="text-yellow-400 font-bold text-[11px] w-4 text-center flex-shrink-0">J</span>;
      case 'js':
      case 'jsx':
        return <span className="text-yellow-300 font-bold text-[11px] w-4 text-center flex-shrink-0">JS</span>;
      case 'ts':
      case 'tsx':
        return <span className="text-blue-400 font-bold text-[11px] w-4 text-center flex-shrink-0">TS</span>;
      case 'css':
        return <span className="text-blue-300 font-bold text-[11px] w-4 text-center flex-shrink-0">#</span>;
      case 'html':
        return <span className="text-orange-400 font-bold text-[11px] w-4 text-center flex-shrink-0">&lt;&gt;</span>;
      case 'md':
        return <span className="text-gray-300 font-bold text-[11px] w-4 text-center flex-shrink-0">M↓</span>;
      default:
        return <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#1e1e1e] group">
      {/* 编辑器头部 */}
      <div className="flex items-center bg-[#252526] pl-4 pr-2 border-t border-[#454545] select-none h-9 min-h-[36px] group/header">
        <div className="flex items-center gap-3 h-full flex-1 min-w-0 overflow-hidden">
          <span className={`text-xs font-bold font-mono uppercase flex-shrink-0 ${getLanguageColor(language)}`}>
            {language === 'plaintext' ? 'TXT' : language}
          </span>
          <label className="text-xs font-sans text-gray-300 tracking-wide cursor-default opacity-80 italic flex-shrink-0">
            {label}
          </label>

          {files && (
            <div className="flex-1 h-full relative min-w-0 ml-2 flex flex-col justify-end">
              <div
                data-tour="editor-tabs"
                ref={tabsContainerRef}
                onScroll={handleScroll}
                onWheel={(e) => {
                  if (tabsContainerRef.current) {
                    // 将垂直滚动转换为水平滚动
                    const delta = e.deltaY || e.deltaX;
                    if (delta !== 0) {
                      tabsContainerRef.current.scrollLeft += delta;
                      // 阻止可能的页面滚动 (虽然 overflow-hidden 应该已经处理了)
                      // e.preventDefault(); // React synthetic event doesn't support passive preventDefault well here, but browser native might
                    }
                  }
                }}
                className="flex items-center h-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden scrollbar-hide"
              >
                {files.length > 0 && files.map(file => (
                  <div
                    key={file.id}
                    onClick={() => onTabClick?.(file.id)}
                    className={`flex items-center gap-1.5 px-1.5 h-full border-r border-r-[#252526] text-[13px] select-none cursor-pointer group/tab min-w-[120px] max-w-[200px] flex-shrink-0 ${file.id === activeFileId
                      ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#0078d4]'
                      : 'bg-[#2d2d2d] text-[#969696] border-t-2 border-t-transparent hover:bg-[#2a2d2e]'
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

                {/* 新建标签按钮 */}
                <div className="flex items-center justify-center h-full px-1">
                  <button
                    onClick={() => onNewTab?.()}
                    className="flex items-center justify-center w-6 h-6 rounded-md text-[#969696] hover:text-white hover:bg-[#444] transition-all cursor-pointer flex-shrink-0"
                    title="新建标签 (Cmd+N)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>

              {/* 自定义滚动条 */}
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
          {/* 自定义操作栏 */}
          {headerActions}

          {/* 只读锁定开关 */}
          {canToggleReadOnly && (
            <button
              data-tour="editor-lock"
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

          {/* 自动换行开关 */}
          <button
            data-tour="editor-wrap"
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

      {/* Monaco 编辑器实例 */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onMount={(editor) => {
            editorRef.current = editor;

            // 监听光标位置变化
            editor.onDidChangeCursorPosition((e) => {
              const line = e.position.lineNumber;
              const column = e.position.column;
              onCursorPositionChange?.(line, column);
            });

            editor.onDidFocusEditorText(() => {
              onFocus?.();
            });
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
