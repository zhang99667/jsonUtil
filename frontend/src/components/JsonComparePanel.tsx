import React, { useMemo, useRef, useState } from 'react';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { SimpleEditor } from './SimpleEditor';
import {
  compareJsonSemanticText,
  formatJsonSemanticDiffMarkdown,
  parseJsonSemanticDiffIgnoredPaths,
  parseJsonForSemanticDiff,
  type JsonSemanticDiffItem,
  type JsonSemanticDiffResult,
} from '../utils/jsonSemanticDiff';
import { copyText, getClipboardErrorMessage, readClipboardText } from '../utils/clipboard';
import { formatByteSize, getDocumentStats } from '../utils/documentStats';
import { formatUnknownError } from '../utils/errors';
import { showError, showSuccess } from '../utils/toast';

interface JsonComparePanelProps {
  sourceText: string;
  isOpen: boolean;
  onClose: () => void;
  onLocatePath?: (path: string) => void;
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

const DIFF_ACTION_BUTTON_CLASS_NAME = 'rounded border border-editor-border bg-editor-bg px-1.5 py-0.5 text-[10px] leading-none text-gray-300 transition-colors hover:border-emerald-500/60 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-editor-border disabled:hover:text-gray-300';

const formatSizeLabel = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};

const buildResultSummary = (result: JsonSemanticDiffResult | null): string => {
  if (!result) return '等待对比';
  const ignoredLabel = result.ignoredPaths.length > 0 ? `，忽略 ${result.ignoredPaths.length} 条路径` : '';
  if (result.total === 0) return `${result.ignoredPaths.length > 0 ? '忽略后' : ''}语义一致${ignoredLabel}`;
  return `新增 ${result.added} / 删除 ${result.removed} / 修改 ${result.changed}${ignoredLabel}`;
};

export const JsonComparePanel: React.FC<JsonComparePanelProps> = ({
  sourceText,
  isOpen,
  onClose,
  onLocatePath,
}) => {
  const compareInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [compareText, setCompareText] = useState('');
  const [ignoredPathsText, setIgnoredPathsText] = useState('');
  const ignoredPaths = useMemo(() => parseJsonSemanticDiffIgnoredPaths(ignoredPathsText), [ignoredPathsText]);
  const diffState = useMemo(() => {
    if (!isOpen || !sourceText.trim() || !compareText.trim()) {
      return {
        result: null as JsonSemanticDiffResult | null,
        error: '',
      };
    }

    try {
      return {
        result: compareJsonSemanticText(sourceText, compareText, { ignoredPaths }),
        error: '',
      };
    } catch (error) {
      return {
        result: null,
        error: formatUnknownError(error),
      };
    }
  }, [compareText, ignoredPaths, isOpen, sourceText]);
  const hasCompareText = compareText.trim().length > 0;
  const canCopyReport = Boolean(diffState.result);

  const handlePasteCompare = async () => {
    try {
      const text = await readClipboardText();
      setCompareText(text);
      showSuccess(`已粘贴对比 JSON（${formatSizeLabel(text)}）`);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '读取剪贴板失败'));
    }
  };

  const handleFormatCompare = () => {
    if (!hasCompareText) return;

    try {
      const parsed = parseJsonForSemanticDiff(compareText);
      const formatted = JSON.stringify(parsed, null, 2);
      setCompareText(formatted);
      showSuccess(`对比 JSON 已格式化（${formatSizeLabel(formatted)}）`);
    } catch (error) {
      showError(formatUnknownError(error));
    }
  };

  const handleCopyReport = async () => {
    if (!diffState.result) return;

    try {
      const report = formatJsonSemanticDiffMarkdown(diffState.result);
      await copyText(report);
      showSuccess(`已复制对比报告（${formatSizeLabel(report)}）`);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制对比报告失败'));
    }
  };

  const handleClear = () => {
    setCompareText('');
    showSuccess('对比 JSON 已清空', 1600);
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
    if (item.kind === 'added' || !onLocatePath) return;
    onLocatePath(item.path);
  };

  const renderDiffRows = () => {
    if (!sourceText.trim()) {
      return (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-gray-400">
          SOURCE 为空
        </div>
      );
    }

    if (!hasCompareText) {
      return (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-gray-400">
          等待对比 JSON
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
      <div className="min-h-0 flex-1 overflow-y-auto" data-tour="json-compare-results">
        <div className="grid grid-cols-[72px_minmax(160px,1.15fr)_minmax(130px,1fr)_minmax(130px,1fr)_108px] border-b border-editor-border bg-editor-sidebar/80 px-3 py-2 text-[11px] font-semibold text-gray-400">
          <div>类型</div>
          <div>路径</div>
          <div>SOURCE</div>
          <div>对比值</div>
          <div>动作</div>
        </div>
        {diffState.result.items.map((item, index) => (
          <div
            key={`${item.kind}-${item.path}-${index}`}
            data-tour="json-compare-row"
            className="grid grid-cols-[72px_minmax(160px,1.15fr)_minmax(130px,1fr)_minmax(130px,1fr)_108px] gap-2 border-b border-editor-border/60 px-3 py-2 text-xs text-gray-300 last:border-b-0 hover:bg-editor-hover/50"
          >
            <div>
              <span className={`rounded border px-1.5 py-0.5 text-[10px] leading-none ${DIFF_KIND_CLASS_NAMES[item.kind]}`}>
                {DIFF_KIND_LABELS[item.kind]}
              </span>
            </div>
            <div className="min-w-0 truncate font-mono text-gray-100" title={item.path}>
              {item.path}
            </div>
            <div className="min-w-0 truncate font-mono text-gray-500" title={item.beforePreview}>
              {item.beforePreview || '-'}
            </div>
            <div className="min-w-0 truncate font-mono text-gray-500" title={item.afterPreview}>
              {item.afterPreview || '-'}
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                data-tour="json-compare-copy-path"
                onClick={() => void handleCopyDiffPath(item)}
                className={DIFF_ACTION_BUTTON_CLASS_NAME}
                title={`复制 JSONPath: ${item.path}`}
                aria-label={`复制差异 JSONPath：${item.path}`}
              >
                Path
              </button>
              <button
                type="button"
                data-tour="json-compare-copy-pointer"
                onClick={() => void handleCopyDiffPointer(item)}
                className={DIFF_ACTION_BUTTON_CLASS_NAME}
                title={`复制 JSON Pointer: ${item.pointer || '/'}`}
                aria-label={`复制差异 JSON Pointer：${item.pointer || '/'}`}
              >
                Ptr
              </button>
              <button
                type="button"
                data-tour="json-compare-locate-source"
                onClick={() => handleLocateDiffPath(item)}
                disabled={item.kind === 'added' || !onLocatePath}
                className={DIFF_ACTION_BUTTON_CLASS_NAME}
                title={item.kind === 'added' ? '新增项仅存在于对比 JSON，无法定位 SOURCE' : `定位 SOURCE: ${item.path}`}
                aria-label={item.kind === 'added' ? `新增项仅存在于对比 JSON：${item.path}` : `定位 SOURCE 差异：${item.path}`}
              >
                定位
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="JSON 对比"
      ariaLabel="JSON 对比"
      initialFocusRef={compareInputRef}
      icon={PanelIcons.Code}
      storageKey="json-compare-panel"
      defaultPosition={{ x: 180, y: 88 }}
      defaultSize={{ width: 860, height: 620 }}
      minSize={{ width: 620, height: 420 }}
      dataTour="json-compare-panel"
      footer={
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-xs text-gray-400">
          <span className="truncate" data-tour="json-compare-summary">
            {buildResultSummary(diffState.result)}
            {diffState.result?.isLimited ? `，已截断前 ${diffState.result.maxDiffs} 条` : ''}
          </span>
          <button
            type="button"
            data-tour="json-compare-copy-markdown"
            onClick={() => void handleCopyReport()}
            disabled={!canCopyReport}
            className="shrink-0 rounded border border-editor-border bg-editor-bg px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
            title={canCopyReport ? '复制 Markdown 对比报告' : '暂无可复制的对比报告'}
            aria-label="复制 JSON 对比报告"
          >
            复制报告
          </button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col bg-editor-bg">
        <div className="grid min-h-[220px] shrink-0 grid-cols-2 border-b border-editor-border">
          <div className="flex min-w-0 flex-col border-r border-editor-border">
            <div className="flex items-center justify-between gap-2 border-b border-editor-border px-3 py-2 text-xs text-gray-400">
              <span className="font-semibold text-gray-300">SOURCE 基线</span>
              <span>{formatSizeLabel(sourceText)}</span>
            </div>
            <SimpleEditor
              value={sourceText}
              readOnly
              language="json"
              height="100%"
              className="min-h-0 flex-1"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-editor-border px-3 py-2">
              <span className="text-xs font-semibold text-gray-300">对比 JSON</span>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  data-tour="json-compare-paste"
                  onClick={() => void handlePasteCompare()}
                  className="rounded border border-editor-border px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-hover"
                  title="从剪贴板粘贴对比 JSON"
                >
                  粘贴
                </button>
                <button
                  type="button"
                  onClick={handleFormatCompare}
                  disabled={!hasCompareText}
                  className="rounded border border-editor-border px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
                  title="格式化对比 JSON"
                >
                  格式化
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!hasCompareText}
                  className="rounded border border-editor-border px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
                  title="清空对比 JSON"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              ref={compareInputRef}
              data-tour="json-compare-target-input"
              value={compareText}
              onChange={(event) => setCompareText(event.target.value)}
              className="min-h-0 flex-1 resize-none bg-editor-bg px-3 py-2 font-mono text-xs leading-5 text-gray-100 outline-none placeholder:text-gray-600"
              placeholder='{"id": 2, "name": "new"}'
              spellCheck={false}
              aria-label="对比 JSON"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 border-b border-editor-border bg-editor-sidebar/60 px-3 py-2 text-xs text-gray-400">
          <label htmlFor="json-compare-ignore-paths" className="shrink-0 font-medium text-gray-300">
            忽略路径
          </label>
          <input
            id="json-compare-ignore-paths"
            data-tour="json-compare-ignore-paths"
            value={ignoredPathsText}
            onChange={(event) => setIgnoredPathsText(event.target.value)}
            className="min-w-0 flex-1 rounded border border-editor-border bg-editor-bg px-2 py-1.5 font-mono text-xs text-gray-100 outline-none transition-colors placeholder:text-gray-600 focus:border-blue-500/70"
            placeholder="$.traceId, $.meta.updatedAt"
            aria-label="JSON 对比忽略路径"
          />
          <span className="hidden shrink-0 text-[11px] text-gray-500 md:inline">
            JSONPath 前缀，逗号分隔
          </span>
        </div>
        {renderDiffRows()}
      </div>
    </DraggablePanel>
  );
};
