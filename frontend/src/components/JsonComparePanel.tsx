import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { SimpleEditor } from './SimpleEditor';
import {
  compareJsonSemanticValues,
  formatJsonSemanticDiffMarkdown,
  parseJsonForSemanticDiff,
  parseJsonSemanticDiffIgnoredPaths,
  type JsonSemanticDiffItem,
  type JsonSemanticDiffResult,
} from '../utils/jsonSemanticDiff';
import { copyText, getClipboardErrorMessage, readClipboardText } from '../utils/clipboard';
import { formatDocumentSize } from '../utils/documentStats';
import { formatUnknownError } from '../utils/errors';
import { showError, showSuccess } from '../utils/toast';
import {
  adjustJsonCompareEditorPercentByKey,
  getJsonCompareEditorPercentFromPointer,
  JSON_COMPARE_EDITOR_DEFAULT_PERCENT,
  JSON_COMPARE_EDITOR_MAX_PERCENT,
  JSON_COMPARE_EDITOR_MIN_PERCENT,
} from './jsonCompareLayout';

interface JsonComparePanelProps {
  sourceText: string;
  isOpen: boolean;
  onClose: () => void;
  onLocatePath?: (path: string) => void;
}

type CompareSide = 'left' | 'right';

interface JsonCompareEditorPaneProps {
  side: CompareSide;
  title: string;
  description: string;
  value: string;
  placeholder: string;
  importSourceButtonRef?: React.RefObject<HTMLButtonElement | null>;
  canImportSource?: boolean;
  onChange: (value: string) => void;
  onImportSource?: () => void;
  onPaste: () => void;
  onFormat: () => void;
  onClear: () => void;
}

const DIFF_KIND_LABELS: Record<JsonSemanticDiffItem['kind'], string> = {
  added: '新增',
  removed: '删除',
  changed: '修改',
};

const DIFF_KIND_CLASS_NAMES: Record<JsonSemanticDiffItem['kind'], string> = {
  added: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  removed: 'border-red-500/30 bg-red-500/10 text-red-200',
  changed: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
};

const TOOLBAR_BUTTON_CLASS_NAME = 'rounded border border-editor-border bg-editor-bg px-2 py-1 text-[11px] text-gray-300 transition-colors hover:border-emerald-500/50 hover:bg-editor-hover hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40';
const DIFF_ACTION_BUTTON_CLASS_NAME = 'rounded border border-editor-border bg-editor-bg px-1.5 py-0.5 text-[10px] leading-none text-gray-300 transition-colors hover:border-emerald-500/60 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-editor-border disabled:hover:text-gray-300';

const buildResultSummary = (result: JsonSemanticDiffResult | null): string => {
  if (!result) return '等待两侧 JSON';
  const ignoredLabel = result.ignoredPaths.length > 0 ? `，忽略 ${result.ignoredPaths.length} 条路径` : '';
  if (result.total === 0) return `${result.ignoredPaths.length > 0 ? '忽略后' : ''}语义一致${ignoredLabel}`;
  return `新增 ${result.added} / 删除 ${result.removed} / 修改 ${result.changed}${ignoredLabel}`;
};

const JsonCompareEditorPane: React.FC<JsonCompareEditorPaneProps> = ({
  side,
  title,
  description,
  value,
  placeholder,
  importSourceButtonRef,
  canImportSource = false,
  onChange,
  onImportSource,
  onPaste,
  onFormat,
  onClear,
}) => {
  const hasValue = value.trim().length > 0;
  const sideLabel = side === 'left' ? '基准' : '对比';

  return (
    <section
      className={`flex min-w-0 flex-1 flex-col overflow-hidden ${side === 'left' ? 'border-r border-editor-border' : ''}`}
      aria-label={`${sideLabel} JSON 输入区`}
    >
      <div className="flex min-h-[58px] shrink-0 items-center justify-between gap-3 border-b border-editor-border bg-editor-sidebar/80 px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-100">{title}</span>
            <span className="rounded-full border border-editor-border bg-editor-bg px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
              {formatDocumentSize(value)}
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] text-gray-500" title={description}>{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {onImportSource && (
            <button
              ref={importSourceButtonRef}
              type="button"
              data-tour="json-compare-import-source"
              onClick={onImportSource}
              disabled={!canImportSource}
              className={`${TOOLBAR_BUTTON_CLASS_NAME} border-emerald-500/40 text-emerald-200`}
              title="把当前主编辑器 SOURCE 载入为基准"
            >
              载入 SOURCE
            </button>
          )}
          <button
            type="button"
            data-tour={`json-compare-${side}-paste`}
            onClick={onPaste}
            className={TOOLBAR_BUTTON_CLASS_NAME}
            title={`从剪贴板粘贴${sideLabel} JSON`}
          >
            粘贴
          </button>
          <button
            type="button"
            data-tour={`json-compare-${side}-format`}
            onClick={onFormat}
            disabled={!hasValue}
            className={TOOLBAR_BUTTON_CLASS_NAME}
          >
            格式化
          </button>
          <button
            type="button"
            data-tour={`json-compare-${side}-clear`}
            onClick={onClear}
            disabled={!hasValue}
            className={TOOLBAR_BUTTON_CLASS_NAME}
          >
            清空
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-editor-bg" data-tour={`json-compare-${side}-editor`}>
        <SimpleEditor
          path={`json-compare-${side}.json`}
          value={value}
          onChange={onChange}
          language="json"
          height="100%"
          className="h-full min-h-0"
          placeholder={placeholder}
          ariaLabel={`${sideLabel} JSON 编辑器`}
        />
      </div>
    </section>
  );
};

export const JsonComparePanel: React.FC<JsonComparePanelProps> = ({
  sourceText,
  isOpen,
  onClose,
  onLocatePath,
}) => {
  const sourceImportButtonRef = useRef<HTMLButtonElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const hasInitializedLeftRef = useRef(false);
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [ignoredPathsText, setIgnoredPathsText] = useState('');
  const [editorAreaPercent, setEditorAreaPercent] = useState(JSON_COMPARE_EDITOR_DEFAULT_PERCENT);

  useEffect(() => {
    if (!isOpen || hasInitializedLeftRef.current) return;
    hasInitializedLeftRef.current = true;
    setLeftText(sourceText);
  }, [isOpen, sourceText]);

  useEffect(() => () => dragCleanupRef.current?.(), []);

  const ignoredPaths = useMemo(
    () => parseJsonSemanticDiffIgnoredPaths(ignoredPathsText),
    [ignoredPathsText],
  );
  const diffState = useMemo(() => {
    if (!isOpen || !leftText.trim() || !rightText.trim()) {
      return { result: null as JsonSemanticDiffResult | null, error: '' };
    }

    let leftValue;
    let rightValue;
    try {
      leftValue = parseJsonForSemanticDiff(leftText);
    } catch (error) {
      return { result: null, error: `基准 JSON：${formatUnknownError(error)}` };
    }
    try {
      rightValue = parseJsonForSemanticDiff(rightText);
    } catch (error) {
      return { result: null, error: `对比 JSON：${formatUnknownError(error)}` };
    }

    return {
      result: compareJsonSemanticValues(leftValue, rightValue, { ignoredPaths }),
      error: '',
    };
  }, [ignoredPaths, isOpen, leftText, rightText]);

  const hasLeftText = leftText.trim().length > 0;
  const hasRightText = rightText.trim().length > 0;
  const canCopyReport = Boolean(diffState.result);
  const canLocateCurrentSource = Boolean(onLocatePath && leftText === sourceText);

  const updateSide = (side: CompareSide, text: string) => {
    if (side === 'left') setLeftText(text);
    else setRightText(text);
  };

  const handlePaste = async (side: CompareSide) => {
    try {
      const text = await readClipboardText();
      updateSide(side, text);
      showSuccess(`已粘贴${side === 'left' ? '基准' : '对比'} JSON（${formatDocumentSize(text)}）`);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '读取剪贴板失败'));
    }
  };

  const handleFormat = (side: CompareSide) => {
    const text = side === 'left' ? leftText : rightText;
    if (!text.trim()) return;

    try {
      const formatted = JSON.stringify(parseJsonForSemanticDiff(text), null, 2);
      updateSide(side, formatted);
      showSuccess(`${side === 'left' ? '基准' : '对比'} JSON 已格式化（${formatDocumentSize(formatted)}）`);
    } catch (error) {
      showError(formatUnknownError(error));
    }
  };

  const handleImportSource = () => {
    setLeftText(sourceText);
    showSuccess(`已载入当前 SOURCE（${formatDocumentSize(sourceText)}）`);
  };

  const handleClear = (side: CompareSide) => {
    updateSide(side, '');
    showSuccess(`${side === 'left' ? '基准' : '对比'} JSON 已清空`, 1600);
  };

  const handleCopyReport = async () => {
    if (!diffState.result) return;
    try {
      const report = formatJsonSemanticDiffMarkdown(diffState.result);
      await copyText(report);
      showSuccess(`已复制对比报告（${formatDocumentSize(report)}）`);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制对比报告失败'));
    }
  };

  const handleCopyDiffPath = async (item: JsonSemanticDiffItem) => {
    try {
      await copyText(item.path);
      showSuccess(`已复制 JSONPath: ${item.path}`);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制 JSONPath 失败'));
    }
  };

  const handleCopyDiffPointer = async (item: JsonSemanticDiffItem) => {
    try {
      await copyText(item.pointer);
      showSuccess(`已复制 JSON Pointer: ${item.pointer || '/'}`);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制 JSON Pointer 失败'));
    }
  };

  const handleLocateDiffPath = (item: JsonSemanticDiffItem) => {
    if (item.kind === 'added' || !canLocateCurrentSource) return;
    onLocatePath?.(item.path);
  };

  const handleSeparatorMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    event.preventDefault();
    dragCleanupRef.current?.();

    const bounds = workspace.getBoundingClientRect();
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      setEditorAreaPercent(getJsonCompareEditorPercentFromPointer(
        moveEvent.clientY,
        bounds.top,
        bounds.height,
      ));
    };
    const cleanup = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', cleanup);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      dragCleanupRef.current = null;
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', cleanup);
    dragCleanupRef.current = cleanup;
  };

  const handleSeparatorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const nextPercent = adjustJsonCompareEditorPercentByKey(editorAreaPercent, event.key);
    if (nextPercent === null) return;
    event.preventDefault();
    setEditorAreaPercent(nextPercent);
  };

  const renderDiffRows = () => {
    if (!hasLeftText || !hasRightText) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            双输入语义对比
          </div>
          <p className="text-sm text-gray-300">请分别在上方粘贴基准 JSON 和对比 JSON</p>
          <p className="text-xs text-gray-500">两侧内容齐全后，差异会在这里实时更新</p>
        </div>
      );
    }

    if (diffState.error) {
      return (
        <div className="m-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm leading-6 text-red-100">
          {diffState.error}
        </div>
      );
    }

    if (!diffState.result || diffState.result.total === 0) {
      return (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-emerald-200">
          两份 JSON 语义一致
        </div>
      );
    }

    return (
      <div className="min-h-0 flex-1 overflow-auto" data-tour="json-compare-results">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[72px_minmax(160px,1.15fr)_minmax(130px,1fr)_minmax(130px,1fr)_108px] border-b border-editor-border bg-editor-sidebar/80 px-3 py-2 text-[11px] font-semibold text-gray-400">
            <div>类型</div><div>路径</div><div>基准值</div><div>对比值</div><div>动作</div>
          </div>
          {diffState.result.items.map((item, index) => (
            <div
              key={`${item.kind}-${item.path}-${index}`}
              data-tour="json-compare-row"
              className="grid grid-cols-[72px_minmax(160px,1.15fr)_minmax(130px,1fr)_minmax(130px,1fr)_108px] gap-2 border-b border-editor-border/60 px-3 py-2 text-xs text-gray-300 last:border-b-0 hover:bg-editor-hover/50"
            >
              <div><span className={`rounded border px-1.5 py-0.5 text-[10px] leading-none ${DIFF_KIND_CLASS_NAMES[item.kind]}`}>{DIFF_KIND_LABELS[item.kind]}</span></div>
              <div className="min-w-0 truncate font-mono text-gray-100" title={item.path}>{item.path}</div>
              <div className="min-w-0 truncate font-mono text-gray-500" title={item.beforePreview}>{item.beforePreview || '-'}</div>
              <div className="min-w-0 truncate font-mono text-gray-500" title={item.afterPreview}>{item.afterPreview || '-'}</div>
              <div className="flex min-w-0 items-center gap-1">
                <button type="button" data-tour="json-compare-copy-path" onClick={() => void handleCopyDiffPath(item)} className={DIFF_ACTION_BUTTON_CLASS_NAME} aria-label={`复制差异 JSONPath：${item.path}`}>Path</button>
                <button type="button" data-tour="json-compare-copy-pointer" onClick={() => void handleCopyDiffPointer(item)} className={DIFF_ACTION_BUTTON_CLASS_NAME} aria-label={`复制差异 JSON Pointer：${item.pointer || '/'}`}>Ptr</button>
                <button
                  type="button"
                  data-tour="json-compare-locate-source"
                  onClick={() => handleLocateDiffPath(item)}
                  disabled={item.kind === 'added' || !canLocateCurrentSource}
                  className={DIFF_ACTION_BUTTON_CLASS_NAME}
                  title={!canLocateCurrentSource ? '基准草稿与当前主 SOURCE 不同，不能定位主编辑器' : (item.kind === 'added' ? '新增项仅存在于对比 JSON' : `定位主 SOURCE: ${item.path}`)}
                >
                  定位
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="JSON 对比"
      ariaLabel="JSON 对比"
      initialFocusRef={sourceImportButtonRef}
      icon={PanelIcons.Code}
      headerExtra={<span className="ml-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">双栏语义工作台</span>}
      storageKey="json-compare-panel"
      defaultPosition={{ x: 64, y: 48 }}
      defaultSize={{ width: 1120, height: 760 }}
      minSize={{ width: 760, height: 560 }}
      dataTour="json-compare-panel"
      footer={
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-xs text-gray-400">
          <span className="truncate" data-tour="json-compare-summary">
            {diffState.error || buildResultSummary(diffState.result)}
            {diffState.result?.isLimited ? `，已截断前 ${diffState.result.maxDiffs} 条` : ''}
          </span>
          <button type="button" data-tour="json-compare-copy-markdown" onClick={() => void handleCopyReport()} disabled={!canCopyReport} className="shrink-0 rounded border border-editor-border bg-editor-bg px-2 py-1 text-xs text-gray-300 transition-colors hover:border-emerald-500/50 hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50">复制报告</button>
        </div>
      }
    >
      <div ref={workspaceRef} className="flex min-h-0 flex-1 flex-col bg-editor-bg">
        <div className="flex min-h-[220px] shrink-0 overflow-hidden border-b border-editor-border" style={{ height: `${editorAreaPercent}%` }}>
          <JsonCompareEditorPane
            side="left"
            title="基准 JSON"
            description="独立草稿；可载入当前 SOURCE，也可直接粘贴任意 JSON"
            value={leftText}
            placeholder="在此粘贴第一份 JSON"
            importSourceButtonRef={sourceImportButtonRef}
            canImportSource={Boolean(sourceText)}
            onChange={setLeftText}
            onImportSource={handleImportSource}
            onPaste={() => void handlePaste('left')}
            onFormat={() => handleFormat('left')}
            onClear={() => handleClear('left')}
          />
          <JsonCompareEditorPane
            side="right"
            title="对比 JSON"
            description="粘贴第二份 JSON；支持对象、数组与 JSON Lines"
            value={rightText}
            placeholder="在此粘贴第二份 JSON"
            onChange={setRightText}
            onPaste={() => void handlePaste('right')}
            onFormat={() => handleFormat('right')}
            onClear={() => handleClear('right')}
          />
        </div>

        <div
          role="separator"
          aria-label="调整 JSON 输入区高度"
          aria-orientation="horizontal"
          aria-valuemin={JSON_COMPARE_EDITOR_MIN_PERCENT}
          aria-valuemax={JSON_COMPARE_EDITOR_MAX_PERCENT}
          aria-valuenow={editorAreaPercent}
          aria-valuetext={`输入区占 ${editorAreaPercent}%`}
          tabIndex={0}
          data-tour="json-compare-input-resizer"
          onMouseDown={handleSeparatorMouseDown}
          onKeyDown={handleSeparatorKeyDown}
          className="group relative z-10 h-3 shrink-0 cursor-row-resize border-b border-editor-border bg-editor-sidebar/80 outline-none transition-colors hover:bg-emerald-500/10 focus-visible:bg-emerald-500/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/60"
          title="上下拖动调整输入区；也可使用方向键"
        >
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-editor-border bg-editor-bg px-2 py-0.5 text-[9px] text-gray-500 shadow transition-colors group-hover:border-emerald-500/40 group-hover:text-emerald-200">
            <span className="h-px w-5 bg-current" />拖动<span className="h-px w-5 bg-current" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-b border-editor-border bg-editor-sidebar/60 px-3 py-2 text-xs text-gray-400">
          <label htmlFor="json-compare-ignore-paths" className="shrink-0 font-medium text-gray-300">忽略路径</label>
          <input
            id="json-compare-ignore-paths"
            data-tour="json-compare-ignore-paths"
            value={ignoredPathsText}
            onChange={(event) => setIgnoredPathsText(event.target.value)}
            className="min-w-0 flex-1 rounded border border-editor-border bg-editor-bg px-2 py-1.5 font-mono text-xs text-gray-100 outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/70"
            placeholder="$.traceId, $.meta.updatedAt"
            aria-label="JSON 对比忽略路径"
          />
          <span className="hidden shrink-0 text-[11px] text-gray-500 lg:inline">JSONPath 前缀，逗号分隔</span>
        </div>
        {renderDiffRows()}
      </div>
    </DraggablePanel>
  );
};
