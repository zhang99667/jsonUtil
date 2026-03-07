

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Editor, { useMonaco } from "@monaco-editor/react";
import type { editor } from 'monaco-editor';
import { EditorProps, HighlightRange } from '../types';
import { detectLanguage } from '../utils/transformations';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { computeLineDiff } from '../utils/diffUtils';
import { findSchemesInJson, SchemeLocation } from '../utils/schemeUtils';
import { SchemeViewerModal } from './SchemeViewerModal';
import { TabBar } from './TabBar';

// 扩展 EditorProps 以支持 scheme 修改回调
interface ExtendedEditorProps extends EditorProps {
  onSchemeEdit?: (path: string, newValue: string) => void;
}

export const CodeEditor: React.FC<ExtendedEditorProps> = ({
  value,
  originalValue,
  path,
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
  onCursorPositionChange,
  onSchemeEdit
}) => {
  const [language, setLanguage] = useState<string>('plaintext');
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const monaco = useMonaco();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  // Scheme 检测状态
  const [schemeLocations, setSchemeLocations] = useState<SchemeLocation[]>([]);
  const schemeLocationsRef = useRef<SchemeLocation[]>([]); // 用于 onMount 闭包访问最新值
  const schemeDecorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const [schemeModal, setSchemeModal] = useState<{
    isOpen: boolean;
    path: string;
    value: string;
  }>({ isOpen: false, path: '', value: '' });



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

  // 检测 JSON 中的 scheme 字符串（仅在 PREVIEW 面板启用）
  useEffect(() => {
    // 只有当 onSchemeEdit 存在时（即 PREVIEW 面板）才检测 scheme
    if (onSchemeEdit && language === 'json' && value) {
      // 防抖检测 - 增加延迟避免频繁计算
      const timer = setTimeout(() => {
        const locations = findSchemesInJson(value);
        setSchemeLocations(locations);
        schemeLocationsRef.current = locations; // 同步到 ref
      }, 500); // 从 300ms 增加到 500ms
      return () => clearTimeout(timer);
    } else {
      setSchemeLocations([]);
      schemeLocationsRef.current = [];
    }
  }, [value, language, onSchemeEdit]);

  // 渲染 scheme 图标装饰器
  useEffect(() => {
    if (!editorRef.current || !monaco || schemeLocations.length === 0) {
      // 清除旧装饰器
      if (schemeDecorationsRef.current) {
        schemeDecorationsRef.current.clear();
      }
      return;
    }

    const decorations = schemeLocations.map(loc => ({
      range: new monaco.Range(loc.line, 1, loc.line, 1),
      options: {
        glyphMarginClassName: 'scheme-glyph-icon',
        glyphMarginHoverMessage: { value: `🔗 点击解析 Scheme (${loc.schemeType})` },
      }
    }));

    if (schemeDecorationsRef.current) {
      schemeDecorationsRef.current.clear();
    }
    schemeDecorationsRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [schemeLocations, monaco]);

  // 处理 scheme 图标点击
  const handleSchemeClick = useCallback((lineNumber: number) => {
    const location = schemeLocations.find(loc => loc.line === lineNumber);
    if (location) {
      setSchemeModal({
        isOpen: true,
        path: location.path,
        value: location.value,
      });
    }
  }, [schemeLocations]);

  // 处理 scheme 编辑应用
  const handleSchemeApply = useCallback((newValue: string) => {
    if (onSchemeEdit && schemeModal.path) {
      onSchemeEdit(schemeModal.path, newValue);
    }
    setSchemeModal({ isOpen: false, path: '', value: '' });
  }, [onSchemeEdit, schemeModal.path]);

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
  const diffDecorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

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
      const decorations: editor.IModelDeltaDecoration[] = [];

      diffs.forEach(diff => {
        let className = '';
        if (diff.type === 'add') className = 'dirty-diff-added';
        else if (diff.type === 'modify') className = 'dirty-diff-modified';
        else if (diff.type === 'delete') className = 'dirty-diff-deleted';

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

  return (
    <div className="flex flex-col h-full bg-editor-bg border-r border-editor-bg group">
      {/* 编辑器头部 */}
      <div className="flex items-center bg-editor-sidebar pl-4 pr-2 border-t border-editor-border select-none h-9 min-h-[36px] group/header">
        <div className="flex items-center gap-3 h-full flex-1 min-w-0 overflow-hidden">
          <span className={`text-xs font-bold font-mono uppercase flex-shrink-0 ${getLanguageColor(language)}`}>
            {language === 'plaintext' ? 'TXT' : language}
          </span>
          <label className="text-xs font-sans text-gray-300 tracking-wide cursor-default opacity-80 italic flex-shrink-0">
            {label}
          </label>

          {files && onTabClick && onCloseFile && onNewTab && (
            <TabBar
              files={files}
              activeFileId={activeFileId || null}
              onTabClick={onTabClick}
              onCloseFile={onCloseFile}
              onNewTab={onNewTab}
              tabsContainerRef={tabsContainerRef}
              onScroll={handleScroll}
              showScrollbar={showScrollbar}
              thumbWidth={thumbWidth}
              thumbLeft={thumbLeft}
              onScrollbarMouseDown={handleMouseDown}
            />
          )}

          {readOnly && !canToggleReadOnly && (
            <span className="text-[10px] text-gray-500 bg-editor-border px-1.5 rounded border border-editor-active flex-shrink-0">READ ONLY</span>
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
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors border ${!isLocked ? 'bg-red-900/30 text-red-300 border-red-900/50' : 'text-gray-400 border-transparent hover:bg-editor-border'}`}
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
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border ${wordWrap === 'on' ? 'bg-brand-primary text-white border-brand-primary' : 'text-gray-400 border-transparent hover:bg-editor-border'}`}
            title="Toggle Word Wrap"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            <span>{wordWrap === 'on' ? '换行' : '不换行'}</span>
          </button>

          {error ? (
            <div className="flex items-center text-[10px] text-status-error-text bg-status-error-bg px-2 py-0.5 rounded border border-status-error-border shadow-sm">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
              {error}
            </div>
          ) : value && language === 'json' ? (
            <div className="flex items-center text-[10px] text-status-success-text bg-status-success-bg px-2 py-0.5 rounded border border-status-success-border">
              Valid JSON
            </div>
          ) : null}
        </div>
      </div>

      {/* Monaco 编辑器实例 */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          path={path}
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

            // 监听 glyph margin 点击事件（scheme 图标）
            // 使用 ref 访问最新的 schemeLocations，避免闭包捕获旧值
            editor.onMouseDown((e) => {
              // MouseTargetType.GUTTER_GLYPH_MARGIN = 2
              if (e.target.type === 2) {
                const lineNumber = e.target.position?.lineNumber;
                if (lineNumber) {
                  // 直接使用 ref 获取最新的 locations
                  const location = schemeLocationsRef.current.find(loc => loc.line === lineNumber);
                  if (location) {
                    setSchemeModal({
                      isOpen: true,
                      path: location.path,
                      value: location.value,
                    });
                  }
                }
              }
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
            glyphMargin: schemeLocations.length > 0, // 有 scheme 时显示 glyph margin
          }}
          loading={
            <div className="h-full w-full flex items-center justify-center text-editor-fg-dim text-xs">
              加载编辑器...
            </div>
          }
        />
      </div>

      {/* Scheme 解析弹窗 */}
      <SchemeViewerModal
        isOpen={schemeModal.isOpen}
        onClose={() => setSchemeModal({ isOpen: false, path: '', value: '' })}
        path={schemeModal.path}
        value={schemeModal.value}
        onApply={onSchemeEdit ? handleSchemeApply : undefined}
      />
    </div>
  );
};
