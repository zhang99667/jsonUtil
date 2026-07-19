

import React, { Suspense, useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import Editor, { useMonaco } from "@monaco-editor/react";
import type { editor } from 'monaco-editor';
import { EditorProps, HighlightRange } from '../types';
import { detectLanguage } from '../utils/transformations';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { computeLineDiff, shouldSkipLineDiff } from '../utils/diffUtils';
import type { SchemeLocation } from '../utils/schemeScanner';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { showError, showSuccess } from '../utils/toast';
import { useEditorSchemeScan } from '../hooks/useEditorSchemeScan';
import { TabBar } from './TabBar';
import { LazySchemeViewerModal } from './appLazyPanels';
import { buildEditorTabViewStateHandlers } from './editorTabViewStateHandlers';
import {
  canApplyEditorSchemeModal,
  createClosedEditorSchemeModal,
  createOpenEditorSchemeModal,
  shouldCloseEditorSchemeModal,
} from './editorSchemeModalState';

const READ_ONLY_UNLOCK_PROMPT_MARGIN = 12;
const READ_ONLY_UNLOCK_PROMPT_WIDTH = 96;
const READ_ONLY_UNLOCK_PROMPT_GAP = 8;
const READ_ONLY_UNLOCK_PROMPT_HIDE_DELAY_MS = 5_000;

export interface ReadOnlyUnlockPromptPosition {
  top: number;
  left: number;
}

export const getReadOnlyUnlockPromptPosition = (
  anchorPosition: { top: number; left: number } | null,
  editorWidth: number,
  contentLeft: number
): ReadOnlyUnlockPromptPosition => {
  const top = Math.max(READ_ONLY_UNLOCK_PROMPT_MARGIN, anchorPosition?.top ?? 32);
  const baseLeft = anchorPosition?.left ?? contentLeft + 14;
  const maxLeft = Math.max(
    READ_ONLY_UNLOCK_PROMPT_MARGIN,
    editorWidth - READ_ONLY_UNLOCK_PROMPT_WIDTH - READ_ONLY_UNLOCK_PROMPT_MARGIN
  );

  return {
    top,
    left: Math.min(Math.max(baseLeft, READ_ONLY_UNLOCK_PROMPT_MARGIN), maxLeft),
  };
};

type MonacoJsonDefaults = {
  json?: {
    jsonDefaults?: {
      setDiagnosticsOptions: (options: {
        validate: boolean;
        allowComments: boolean;
        enableSchemaRequest: boolean;
      }) => void;
    };
  };
};

// 扩展 EditorProps 以支持 Scheme 修改回调
export interface ExtendedEditorProps extends EditorProps {
  enableSchemeScan?: boolean;
  errorActions?: React.ReactNode;
  onSchemeEdit?: (path: string, newValue: string, pointer?: string) => void;
  focusOnMount?: boolean;
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
  errorLocation,
  errorActions,
  locateErrorSignal,
  warning,
  info,
  headerActions,
  files,
  activeFileId,
  onTabClick,
  onCloseFile,
  onNewTab,
  highlightRange,
  diagnosticHighlights,
  onFocus,
  onCursorPositionChange,
  onSaveViewState,
  restoreViewState,
  enableSchemeScan = false,
  onSchemeEdit,
  focusOnMount = false,
}) => {
  const [language, setLanguage] = useState<string>('plaintext');
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [readOnlyUnlockPrompt, setReadOnlyUnlockPrompt] = useState<ReadOnlyUnlockPromptPosition | null>(null);
  const monaco = useMonaco();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const diagnosticDecorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const readOnlyUnlockPromptTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const effectiveReadOnlyRef = useRef<boolean>(false);
  const canToggleReadOnlyRef = useRef<boolean>(canToggleReadOnly);

  // Scheme 检测状态
  const {
    schemeLocations,
    schemeScanWarning,
    schemeLocationsRef,
    schemeLocationsSourceRef,
  } = useEditorSchemeScan(value, {
    enabled: Boolean((enableSchemeScan || onSchemeEdit) && language === 'json'),
  });
  const schemeDecorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const [schemeModal, setSchemeModal] = useState(createClosedEditorSchemeModal);
  const [hasLoadedSchemeModal, setHasLoadedSchemeModal] = useState(false);



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

  useEffect(() => {
    if (schemeModal.isOpen) {
      setHasLoadedSchemeModal(true);
    }
  }, [schemeModal.isOpen]);

  useEffect(() => {
    setSchemeModal(current => (
      shouldCloseEditorSchemeModal(current, value)
        ? createClosedEditorSchemeModal()
        : current
    ));
  }, [value]);

  // 渲染 Scheme 图标装饰器
  useLayoutEffect(() => {
    if (!editorRef.current || !monaco || schemeLocations.length === 0) {
      // 清除旧装饰器
      if (schemeDecorationsRef.current) {
        schemeDecorationsRef.current.clear();
      }
      return;
    }

    const decorations = schemeLocations.map(loc => {
      const hoverText = loc.label
        ? `🔗 点击解析 Scheme (${loc.schemeType})\n\n业务字段: \`${loc.label}\``
        : `🔗 点击解析 Scheme (${loc.schemeType})`;

      return {
        range: new monaco.Range(loc.line, loc.column, loc.endLine, loc.endColumn),
        options: {
          glyphMarginClassName: 'scheme-glyph-icon',
          glyphMarginHoverMessage: { value: hoverText },
          inlineClassName: 'scheme-inline-highlight',
          hoverMessage: { value: hoverText },
        }
      };
    });

    if (schemeDecorationsRef.current) {
      schemeDecorationsRef.current.clear();
    }
    schemeDecorationsRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [schemeLocations, monaco]);

  const openSchemeLocation = useCallback((location: SchemeLocation) => {
    const source = schemeLocationsSourceRef.current;
    if (!source) return;
    setSchemeModal(createOpenEditorSchemeModal(location, source));
  }, [schemeLocationsSourceRef]);

  const findSchemeLocationAtPosition = useCallback((lineNumber: number, column: number) => (
    schemeLocationsRef.current.find(loc => {
      if (lineNumber < loc.line || lineNumber > loc.endLine) return false;
      if (lineNumber === loc.line && column < loc.column) return false;
      if (lineNumber === loc.endLine && column > loc.endColumn) return false;
      return true;
    })
  ), []);

  // 处理 Scheme 编辑应用
  const handleSchemeApply = useCallback((newValue: string) => {
    if (onSchemeEdit && canApplyEditorSchemeModal(schemeModal, value)) {
      onSchemeEdit(schemeModal.path, newValue, schemeModal.pointer);
    }
    setSchemeModal(createClosedEditorSchemeModal());
  }, [onSchemeEdit, schemeModal, value]);

  const editorWarning = [warning, schemeScanWarning].filter(Boolean).join('；');

  // 只读属性变更时重置锁定状态
  useEffect(() => {
    if (readOnly) {
      setIsLocked(true);
    }
  }, [readOnly]);

  const effectiveReadOnly = readOnly && (!canToggleReadOnly || isLocked);
  const lockToggleTitle = isLocked
    ? `${label} 已锁定，点击解锁编辑`
    : `${label} 可编辑，点击重新锁定`;
  const locateErrorLabel = errorLocation
    ? `${label} 定位到第 ${errorLocation.line} 行，第 ${errorLocation.column} 列`
    : '';
  const copyErrorLabel = `${label} 复制错误信息`;
  const schemeCountLabel = `${label} 中发现 ${schemeLocations.length} 个可点击 Scheme/CMD 字段`;

  useEffect(() => {
    effectiveReadOnlyRef.current = effectiveReadOnly;
    canToggleReadOnlyRef.current = canToggleReadOnly;
  }, [canToggleReadOnly, effectiveReadOnly]);

  const clearReadOnlyUnlockPromptTimer = useCallback(() => {
    if (readOnlyUnlockPromptTimerRef.current === null) return;
    window.clearTimeout(readOnlyUnlockPromptTimerRef.current);
    readOnlyUnlockPromptTimerRef.current = null;
  }, []);

  const hideReadOnlyUnlockPrompt = useCallback(() => {
    clearReadOnlyUnlockPromptTimer();
    setReadOnlyUnlockPrompt(null);
  }, [clearReadOnlyUnlockPromptTimer]);

  const showReadOnlyUnlockPrompt = useCallback(() => {
    const editorInstance = editorRef.current;
    if (!editorInstance || !effectiveReadOnlyRef.current || !canToggleReadOnlyRef.current) return;

    window.setTimeout(() => {
      requestAnimationFrame(() => {
        const latestEditor = editorRef.current;
        if (!latestEditor || !effectiveReadOnlyRef.current || !canToggleReadOnlyRef.current) return;

        const layoutInfo = latestEditor.getLayoutInfo();
        const editorDomNode = latestEditor.getDomNode();
        const readOnlyMessageNode = editorDomNode?.querySelector<HTMLElement>('.monaco-editor-overlaymessage');
        let anchorPosition: { top: number; left: number } | null = null;

        if (editorDomNode && readOnlyMessageNode) {
          const editorRect = editorDomNode.getBoundingClientRect();
          const messageRect = readOnlyMessageNode.getBoundingClientRect();
          anchorPosition = {
            top: messageRect.top - editorRect.top,
            left: messageRect.right - editorRect.left + READ_ONLY_UNLOCK_PROMPT_GAP,
          };
        } else {
          const cursorPosition = latestEditor.getPosition();
          const visiblePosition = cursorPosition
            ? latestEditor.getScrolledVisiblePosition(cursorPosition)
            : null;
          anchorPosition = visiblePosition
            ? { top: visiblePosition.top - 4, left: visiblePosition.left + 14 }
            : null;
        }

        setReadOnlyUnlockPrompt(getReadOnlyUnlockPromptPosition(
          anchorPosition,
          layoutInfo.width,
          layoutInfo.contentLeft
        ));
        clearReadOnlyUnlockPromptTimer();
        readOnlyUnlockPromptTimerRef.current = window.setTimeout(() => {
          setReadOnlyUnlockPrompt(null);
          readOnlyUnlockPromptTimerRef.current = null;
        }, READ_ONLY_UNLOCK_PROMPT_HIDE_DELAY_MS);
      });
    });
  }, [clearReadOnlyUnlockPromptTimer]);

  const unlockReadOnlyEditor = useCallback(() => {
    if (!canToggleReadOnly) return;
    setIsLocked(false);
    hideReadOnlyUnlockPrompt();
    requestAnimationFrame(() => editorRef.current?.focus());
  }, [canToggleReadOnly, hideReadOnlyUnlockPrompt]);

  useEffect(() => {
    if (effectiveReadOnly && canToggleReadOnly) return;
    hideReadOnlyUnlockPrompt();
  }, [canToggleReadOnly, effectiveReadOnly, hideReadOnlyUnlockPrompt]);

  useEffect(() => hideReadOnlyUnlockPrompt, [hideReadOnlyUnlockPrompt]);

  // 变更处理（含只读保护）
  const handleEditorChange = (val: string | undefined) => {
    // 注意：只读模式下拦截变更事件
    // 防止预览更新触发源文件死循环
    if (effectiveReadOnly) return;
    onChange(val || '');
  };

  useEffect(() => {
    if (monaco) {
      // Monaco 新版本类型未直接暴露 jsonDefaults，这里只收窄到实际使用的诊断配置 API
      const jsonDefaults = (monaco.languages as unknown as MonacoJsonDefaults).json?.jsonDefaults;
      jsonDefaults?.setDiagnosticsOptions({
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
  const isWordWrapEnabled = wordWrap === 'on';

  const {
    handleTabClick,
    handleCloseFile,
    handleNewTab,
  } = buildEditorTabViewStateHandlers({
    activeFileId,
    saveEditorViewState: () => editorRef.current?.saveViewState(),
    onSaveViewState,
    onTabClick,
    onCloseFile,
    onNewTab,
  });

  const handleLocateError = useCallback(() => {
    if (!editorRef.current || !monaco || !errorLocation) return;

    const position = {
      lineNumber: errorLocation.line,
      column: Math.max(1, errorLocation.column),
    };

    editorRef.current.revealPositionInCenter(position, monaco.editor.ScrollType.Smooth);
    editorRef.current.setPosition(position);
    editorRef.current.focus();
  }, [errorLocation, monaco]);

  useEffect(() => {
    if (!locateErrorSignal) return;
    handleLocateError();
  }, [handleLocateError, locateErrorSignal]);

  useEffect(() => {
    if (!editorRef.current || !monaco) return;

    if (!diagnosticHighlights || diagnosticHighlights.length === 0) {
      diagnosticDecorationsRef.current?.clear();
      return;
    }

    const decorations: editor.IModelDeltaDecoration[] = diagnosticHighlights.map(issue => ({
      range: new monaco.Range(
        issue.range.startLine,
        issue.range.startColumn,
        issue.range.endLine,
        issue.range.endColumn
      ),
      options: {
        className: 'schema-issue-highlight',
        hoverMessage: {
          value: `**JSON Schema** \`${issue.path}\`\n\n\`${issue.keyword}\`: ${issue.message}`,
        },
        overviewRuler: {
          color: 'rgba(248, 113, 113, 0.9)',
          position: monaco.editor.OverviewRulerLane.Right,
        },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }));

    diagnosticDecorationsRef.current?.clear();
    diagnosticDecorationsRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [diagnosticHighlights, monaco]);

  const handleCopyError = useCallback(async () => {
    if (!error) return;

    try {
      await copyText(error);
      showSuccess('已复制错误信息');
    } catch (copyError) {
      showError(getClipboardErrorMessage(copyError, '复制错误信息失败'));
    }
  }, [error]);

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

  // 版本控制未保存差异装饰器
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

    // 大文件跳过行级未保存差异，避免主线程长时间比较。
    if (shouldSkipLineDiff(originalValue, value)) {
      if (diffDecorationsRef.current) {
        diffDecorationsRef.current.clear();
      }
      return;
    }

    // 防抖计算差异
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
            linesDecorationsClassName: className // 渲染在编辑器行号槽
          }
        });
      });

      if (diffDecorationsRef.current) {
        diffDecorationsRef.current.clear();
      }
      diffDecorationsRef.current = editorRef.current.createDecorationsCollection(decorations);

    }, 200); // 200ms 防抖

    return () => clearTimeout(timer);

  }, [value, originalValue, monaco]);

  // 记录上一个 activeFileId，用于切换标签时恢复新标签的视图状态
  const prevActiveFileIdRef = useRef<string | null | undefined>(activeFileId);

  // 标签切换前已同步保存旧标签的 `viewState`，这里只负责恢复新标签，避免保存到错误标签页。
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const prevId = prevActiveFileIdRef.current;

    // 恢复新标签的视图状态
    if (activeFileId && activeFileId !== prevId && restoreViewState) {
      // 延迟恢复，确保 Monaco 已完成 model 切换
      requestAnimationFrame(() => {
        editor.restoreViewState(restoreViewState as import('monaco-editor').editor.ICodeEditorViewState);
      });
    }

    prevActiveFileIdRef.current = activeFileId;
  }, [activeFileId, restoreViewState]);


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
      <div className="editor-header flex items-center bg-editor-sidebar pl-4 pr-2 border-t border-editor-border select-none h-9 min-h-[36px] group/header">
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
              onTabClick={handleTabClick}
              onCloseFile={handleCloseFile}
              onNewTab={handleNewTab}
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

        <div className="editor-header-actions flex min-w-0 items-center gap-1 flex-shrink ml-2 overflow-hidden">
          {/* 自定义操作栏 */}
          {headerActions}

          {/* 只读锁定开关 */}
          {canToggleReadOnly && (
            <button
              data-tour="editor-lock"
              type="button"
              onClick={() => {
                setIsLocked(!isLocked);
                hideReadOnlyUnlockPrompt();
              }}
              aria-label={lockToggleTitle}
              aria-pressed={!isLocked}
              className={`editor-header-action flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${!isLocked ? 'bg-red-900/30 text-red-300 border-red-900/50' : 'text-gray-400 border-transparent hover:bg-editor-border'}`}
              title={lockToggleTitle}
            >
              {isLocked ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="editor-header-action-label">锁定</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                  <span className="editor-header-action-label">编辑</span>
                </>
              )}
            </button>
          )}

          {/* 自动换行开关 */}
          <button
            data-tour="editor-wrap"
            onClick={toggleWordWrap}
            aria-label="自动换行"
            aria-pressed={isWordWrapEnabled}
            className={`editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border ${isWordWrapEnabled ? 'border-transparent bg-editor-active text-white shadow-[inset_0_-1px_0_rgba(96,165,250,0.78)]' : 'text-gray-400 border-transparent hover:bg-editor-border'}`}
            title={isWordWrapEnabled ? '自动换行已开启，点击关闭' : '自动换行已关闭，点击开启'}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            <span className="editor-header-action-label">{isWordWrapEnabled ? '换行' : '不换行'}</span>
          </button>

          {schemeLocations.length > 0 && (
            <span
              data-tour="editor-scheme-count"
              className="editor-header-status flex-shrink-0 rounded border border-teal-700/50 bg-teal-900/25 px-2 py-0.5 text-[10px] text-teal-100"
              title={schemeCountLabel}
              aria-label={schemeCountLabel}
            >
              <span className="editor-header-status-label">Scheme </span>{schemeLocations.length}
            </span>
          )}

          {error ? (
            <div className="editor-header-status editor-header-status-message flex min-w-0 shrink items-center gap-1 text-[10px] text-status-error-text bg-status-error-bg px-2 py-0.5 rounded border border-status-error-border shadow-sm max-w-[220px]">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
              <span data-tour="editor-error-message" className="truncate" title={error}>
                {error}
              </span>
              {errorLocation && (
                <button
                  data-tour="editor-locate-error"
                  type="button"
                  onClick={handleLocateError}
                  className="ml-1 rounded border border-red-700/50 px-1 py-0 text-[10px] text-red-100 transition-colors hover:bg-red-800/40"
                  title={locateErrorLabel}
                  aria-label={locateErrorLabel}
                >
                  定位
                </button>
              )}
              <button
                data-tour="editor-copy-error"
                type="button"
                onClick={handleCopyError}
                className="rounded border border-red-700/50 px-1 py-0 text-[10px] text-red-100 transition-colors hover:bg-red-800/40"
                title={copyErrorLabel}
                aria-label={copyErrorLabel}
              >
                复制
              </button>
              {errorActions}
            </div>
          ) : editorWarning ? (
            <div className="editor-header-status flex items-center text-[10px] text-amber-200 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-700/50 shadow-sm">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5"></span>
              <span className="editor-header-status-label">{editorWarning}</span>
            </div>
          ) : info ? (
            <div className="editor-header-status flex items-center text-[10px] text-cyan-200 bg-cyan-900/30 px-2 py-0.5 rounded border border-cyan-700/50 shadow-sm">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-1.5"></span>
              <span className="editor-header-status-label">{info}</span>
            </div>
          ) : value && language === 'json' ? (
            <div className="editor-header-status flex items-center text-[10px] text-status-success-text bg-status-success-bg px-2 py-0.5 rounded border border-status-success-border" title="Valid JSON">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
              <span className="editor-header-status-label">Valid JSON</span>
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
          onMount={(editor, monacoApi) => {
            editorRef.current = editor;
            if (focusOnMount) editor.focus();

            // 监听光标位置变化
            editor.onDidChangeCursorPosition((e) => {
              const line = e.position.lineNumber;
              const column = e.position.column;
              onCursorPositionChange?.(line, column);
            });

            editor.onDidFocusEditorText(() => {
              onFocus?.();
            });

            editor.onDidAttemptReadOnlyEdit(showReadOnlyUnlockPrompt);

            // 监听图标边栏点击事件（Scheme 图标）
            // 使用 ref 访问最新的 schemeLocations，避免闭包捕获旧值
            editor.onMouseDown((e) => {
              const position = e.target.position;
              if (position) {
                const location = findSchemeLocationAtPosition(position.lineNumber, position.column);
                if (location) {
                  openSchemeLocation(location);
                  return;
                }
              }

              if (e.target.type === monacoApi.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                const lineNumber = position?.lineNumber;
                if (lineNumber) {
                  // 直接使用 Ref 获取最新的位置列表
                  const location = schemeLocationsRef.current.find(loc => loc.line === lineNumber);
                  if (location) {
                    openSchemeLocation(location);
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
            wordWrap,
            folding: true,
            contextmenu: true,
            hover: {
              enabled: true,
              delay: 450,
              sticky: true,
            },
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
            glyphMargin: schemeLocations.length > 0, // 存在 Scheme 时显示图标边栏
            readOnlyMessage: {
              value: canToggleReadOnly ? '只读预览，可点旁边“解锁”编辑。' : '当前编辑器为只读。',
            },
          }}
          loading={
            <div className="h-full w-full flex items-center justify-center text-editor-fg-dim text-xs">
              加载编辑器...
            </div>
          }
        />
        {readOnlyUnlockPrompt && effectiveReadOnly && canToggleReadOnly && (
          <div
            data-tour="editor-readonly-unlock-prompt"
            className="absolute z-[10050] flex items-center rounded-md border border-sky-400/45 bg-editor-sidebar/95 p-1 text-xs text-gray-200 shadow-[0_12px_28px_rgba(0,0,0,0.42)] backdrop-blur"
            style={{
              top: readOnlyUnlockPrompt.top,
              left: readOnlyUnlockPrompt.left,
            }}
            role="status"
            aria-label="只读预览，可解锁编辑"
            aria-live="polite"
          >
            <button
              type="button"
              onClick={unlockReadOnlyEditor}
              className="flex items-center gap-1 rounded border border-sky-500/55 bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-medium text-sky-100 transition-colors hover:border-sky-300/70 hover:bg-sky-500/25"
              title={`${label} 解锁编辑`}
              aria-label={`${label} 解锁编辑`}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              解锁
            </button>
          </div>
        )}
      </div>

      {/* Scheme 解析弹窗 */}
      {hasLoadedSchemeModal && (
        <Suspense fallback={null}>
          <LazySchemeViewerModal
            isOpen={schemeModal.isOpen}
            onClose={() => setSchemeModal(createClosedEditorSchemeModal())}
            path={schemeModal.path}
            value={schemeModal.value}
            sourceLabel={schemeModal.label}
            onApply={onSchemeEdit ? handleSchemeApply : undefined}
          />
        </Suspense>
      )}
    </div>
  );
};
