import React, { useState, useEffect, useMemo } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { validateJson } from '../utils/transformations';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { TEMPLATE_FILL_STORAGE_KEY, loadTemplateFillConfig } from '../utils/appSettings';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { formatByteSize, getDocumentStats } from '../utils/documentStats';
import { safeSetStorageItem } from '../utils/storage';
import toast from 'react-hot-toast';

interface TemplateFillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (templateJson: string) => void;
  targetError?: string;
  initialTemplate?: string;
  initialTemplateKey?: number;
  applyQualityDelta?: string;
}

const formatTemplateSizeLabel = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};

interface PlaceholderTemplateSummary {
  total: number;
  filled: number;
  suggested: number;
  pending: number;
}

interface PlaceholderTemplateSource {
  sourcePath: string;
  sourceLabel?: string;
  sourceOriginalPreview?: string;
}

interface PlaceholderTemplateSuggestion {
  replacement: string;
  sourcePath: string;
  sourceLabel?: string;
  reason?: string;
}

interface PlaceholderTemplateDetail {
  value: string;
  replacement: string;
  description?: string;
  suggestion?: PlaceholderTemplateSuggestion;
  sources: PlaceholderTemplateSource[];
}

interface PlaceholderTemplateDraft {
  placeholders: Record<string, string>;
  placeholderDetails: PlaceholderTemplateDetail[];
}

const PLACEHOLDER_FILL_TEMPLATE_KIND = 'json-helper-runtime-placeholder-fill-template';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const readString = (record: Record<string, unknown>, key: string): string | undefined => (
  typeof record[key] === 'string' ? record[key] : undefined
);

const readPlaceholderSources = (value: unknown): PlaceholderTemplateSource[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap(source => {
    if (!isRecord(source)) return [];

    const sourcePath = readString(source, 'sourcePath');
    if (!sourcePath) return [];

    return [{
      sourcePath,
      ...(readString(source, 'sourceLabel') ? { sourceLabel: readString(source, 'sourceLabel') } : {}),
      ...(readString(source, 'sourceOriginalPreview') ? { sourceOriginalPreview: readString(source, 'sourceOriginalPreview') } : {}),
    }];
  });
};

const readPlaceholderSuggestion = (value: unknown): PlaceholderTemplateSuggestion | undefined => {
  if (!isRecord(value)) return undefined;

  const replacement = readString(value, 'replacement');
  const sourcePath = readString(value, 'sourcePath');
  if (!replacement || !sourcePath) return undefined;

  return {
    replacement,
    sourcePath,
    ...(readString(value, 'sourceLabel') ? { sourceLabel: readString(value, 'sourceLabel') } : {}),
    ...(readString(value, 'reason') ? { reason: readString(value, 'reason') } : {}),
  };
};

const parsePlaceholderTemplateDraft = (templateText: string): PlaceholderTemplateDraft | null => {
  if (!templateText.trim()) return null;

  try {
    const parsed = JSON.parse(templateText) as unknown;
    if (!isRecord(parsed) || parsed.kind !== PLACEHOLDER_FILL_TEMPLATE_KIND) return null;
    if (!isRecord(parsed.placeholders)) return null;

    const placeholders = Object.fromEntries(
      Object.entries(parsed.placeholders).filter((entry): entry is [string, string] => (
        typeof entry[1] === 'string'
      ))
    );
    const detailRows = Array.isArray(parsed.placeholderDetails)
      ? parsed.placeholderDetails.flatMap(detail => {
        if (!isRecord(detail)) return [];

        const value = readString(detail, 'value');
        if (!value) return [];

        return [{
          value,
          replacement: readString(detail, 'replacement') ?? placeholders[value] ?? '',
          ...(readString(detail, 'description') ? { description: readString(detail, 'description') } : {}),
          ...(readPlaceholderSuggestion(detail.suggestion) ? { suggestion: readPlaceholderSuggestion(detail.suggestion) } : {}),
          sources: readPlaceholderSources(detail.sources),
        }];
      })
      : [];
    const details = detailRows.length > 0
      ? detailRows
      : Object.entries(placeholders).map(([value, replacement]) => ({
        value,
        replacement,
        sources: [],
      }));

    if (details.length === 0) return null;

    return {
      placeholders,
      placeholderDetails: details,
    };
  } catch {
    return null;
  }
};

const buildPlaceholderTemplateSummary = (templateText: string): PlaceholderTemplateSummary | null => {
  const draft = parsePlaceholderTemplateDraft(templateText);
  if (!draft) return null;

  const total = draft.placeholderDetails.length;
  const filled = draft.placeholderDetails.filter(detail => detail.replacement.trim().length > 0).length;
  const suggested = draft.placeholderDetails.filter(detail => Boolean(detail.suggestion)).length;

  return {
    total,
    filled,
    suggested,
    pending: Math.max(total - filled, 0),
  };
};

const updatePlaceholderReplacement = (
  templateText: string,
  placeholderValue: string,
  replacement: string
): string => {
  const parsed = JSON.parse(templateText) as unknown;
  if (!isRecord(parsed) || parsed.kind !== PLACEHOLDER_FILL_TEMPLATE_KIND) return templateText;
  if (!isRecord(parsed.placeholders)) return templateText;

  const placeholders = {
    ...parsed.placeholders,
    [placeholderValue]: replacement,
  };
  const placeholderDetails = Array.isArray(parsed.placeholderDetails)
    ? parsed.placeholderDetails.map(detail => {
      if (!isRecord(detail) || detail.value !== placeholderValue) return detail;
      return {
        ...detail,
        replacement,
      };
    })
    : parsed.placeholderDetails;

  return JSON.stringify({
    ...parsed,
    placeholders,
    ...(Array.isArray(placeholderDetails) ? { placeholderDetails } : {}),
  }, null, 2);
};

export const TemplateFillPanel: React.FC<TemplateFillPanelProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  targetError,
  initialTemplate,
  initialTemplateKey,
  applyQualityDelta,
}) => {
  // 从 localStorage 恢复模板内容
  const [template, setTemplate] = useState<string>(() => loadTemplateFillConfig().template);

  // 实时 JSON 校验
  const validation = useMemo(() => {
    if (!template.trim()) return { isValid: true };
    return validateJson(template);
  }, [template]);
  const placeholderTemplateSummary = useMemo(() => (
    buildPlaceholderTemplateSummary(template)
  ), [template]);
  const placeholderTemplateDraft = useMemo(() => (
    parsePlaceholderTemplateDraft(template)
  ), [template]);

  // 自动保存到 localStorage
  useEffect(() => {
    safeSetStorageItem(TEMPLATE_FILL_STORAGE_KEY, JSON.stringify({
      template,
      lastUpdated: Date.now(),
    }));
  }, [template]);

  // 外部报告面板可把生成的回填模板直接送入当前面板
  useEffect(() => {
    if (!initialTemplate || initialTemplateKey === undefined) return;

    setTemplate(initialTemplate);
  }, [initialTemplate, initialTemplateKey]);

  // 配置备份导入后同步刷新已挂载面板中的模板内容
  useEffect(() => {
    const handleBackupImported = () => {
      setTemplate(loadTemplateFillConfig().template);
    };

    window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
  }, []);

  const handleApply = () => {
    if (targetError) return;
    onApplyTemplate(template);
  };

  const handleClear = () => {
    setTemplate('');
    toast.success('模板已清空', { duration: 1600 });
  };

  const handleFormatTemplate = () => {
    if (!template.trim() || !validation.isValid) return;

    const formattedTemplate = JSON.stringify(JSON.parse(template), null, 2);
    setTemplate(formattedTemplate);
    toast.success(`模板已格式化（${formatTemplateSizeLabel(formattedTemplate)}）`, { duration: 1600 });
  };

  const handleCopyQualityDelta = async () => {
    if (!applyQualityDelta) return;

    try {
      await copyText(applyQualityDelta);
      toast.success(`已复制质量对比（${formatTemplateSizeLabel(applyQualityDelta)}）`, { duration: 1600 });
    } catch (error) {
      console.warn('复制模板质量对比失败:', error);
      toast.error(getClipboardErrorMessage(error), { duration: 2000 });
    }
  };

  const handlePlaceholderReplacementChange = (placeholderValue: string, replacement: string) => {
    try {
      setTemplate(updatePlaceholderReplacement(template, placeholderValue, replacement));
    } catch (error) {
      console.warn('更新占位符 replacement 失败:', error);
    }
  };

  const handleUsePlaceholderSuggestion = (detail: PlaceholderTemplateDetail) => {
    if (!detail.suggestion) return;

    handlePlaceholderReplacementChange(detail.value, detail.suggestion.replacement);
    toast.success('已采用候选 replacement', { duration: 1400 });
  };

  const hasTemplateContent = template.trim().length > 0;
  const clearTemplateTitle = hasTemplateContent ? '清空当前模板内容' : '模板为空，暂无内容可清空';
  const formatTemplateTitle = !hasTemplateContent
    ? '模板为空，暂无内容可格式化'
    : validation.isValid
      ? '格式化模板 JSON'
      : '请先修正模板 JSON 后再格式化';
  const applyTemplateTitle = targetError ||
    (!hasTemplateContent
      ? '模板为空，暂无内容可应用'
      : validation.isValid
        ? '应用模板到 SOURCE'
        : '请先修正模板 JSON 后再应用');

  // 底部操作栏
  const footer = (
    <>
      <button
        data-tour="template-clear-button"
        onClick={handleClear}
        disabled={!hasTemplateContent}
        title={clearTemplateTitle}
        aria-label={`清空模板，${clearTemplateTitle}`}
        className="px-2.5 py-1 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        清空模板
      </button>
      <button
        data-tour="template-format-button"
        onClick={handleFormatTemplate}
        disabled={!hasTemplateContent || !validation.isValid}
        title={formatTemplateTitle}
        aria-label={`格式化模板，${formatTemplateTitle}`}
        className="px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        格式化模板
      </button>
      <button
        data-tour="template-apply-button"
        onClick={handleApply}
        disabled={!hasTemplateContent || !validation.isValid || Boolean(targetError)}
        title={applyTemplateTitle}
        aria-label={`应用模板到当前 JSON，${applyTemplateTitle}`}
        className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        应用模板到当前 JSON
      </button>
    </>
  );

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="JSON 模板填充"
      icon={PanelIcons.Code}
      storageKey="template-fill-panel"
      defaultPosition={{ x: 200, y: 100 }}
      defaultSize={{ width: 520, height: 500 }}
      minSize={{ width: 380, height: 300 }}
      footer={footer}
      dataTour="template-fill-panel"
    >
      <div className="flex-1 flex flex-col min-h-0 p-2 gap-2 bg-editor-bg">
        {/* 提示文字 */}
        <div className="text-xs text-gray-500 px-1">
          输入 JSON 模板，普通模板会深度合并，占位符回填模板会替换当前 JSON 中的运行时占位符。
        </div>

        {placeholderTemplateSummary && (
          <div
            data-tour="template-fill-placeholder-summary"
            className="rounded border border-violet-800/40 bg-violet-950/25 px-2.5 py-1.5 text-xs text-violet-100"
          >
            回填模板: replacement {placeholderTemplateSummary.filled}/{placeholderTemplateSummary.total}
            {placeholderTemplateSummary.suggested > 0 && (
              <span> · 候选 {placeholderTemplateSummary.suggested}</span>
            )}
            {placeholderTemplateSummary.pending > 0 && (
              <span> · 待补 {placeholderTemplateSummary.pending}</span>
            )}
          </div>
        )}

        {placeholderTemplateDraft && (
          <div
            data-tour="template-fill-placeholder-form"
            className="max-h-48 overflow-auto rounded border border-violet-800/40 bg-editor-sidebar text-xs"
          >
            {placeholderTemplateDraft.placeholderDetails.map(detail => {
              const source = detail.sources[0];
              return (
                <div
                  key={detail.value}
                  data-tour="template-fill-placeholder-row"
                  className="grid grid-cols-[minmax(120px,1fr)_minmax(140px,1.2fr)_auto] gap-2 border-b border-editor-border/70 px-2 py-2 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-violet-100" title={detail.value}>
                      {detail.value}
                    </div>
                    {detail.description && (
                      <div className="mt-0.5 line-clamp-2 text-[10px] text-gray-500" title={detail.description}>
                        {detail.description}
                      </div>
                    )}
                  </div>
                  <input
                    data-tour="template-fill-placeholder-replacement"
                    value={detail.replacement}
                    onChange={(event) => handlePlaceholderReplacementChange(detail.value, event.target.value)}
                    className="min-w-0 rounded border border-editor-border bg-editor-bg px-2 py-1 font-mono text-xs text-gray-100 outline-none focus:border-violet-600"
                    placeholder="replacement"
                    spellCheck={false}
                    title={`填写 ${detail.value} 的 replacement`}
                    aria-label={`${detail.value} replacement`}
                  />
                  <button
                    type="button"
                    data-tour="template-fill-use-suggestion"
                    onClick={() => handleUsePlaceholderSuggestion(detail)}
                    disabled={!detail.suggestion}
                    className="whitespace-nowrap rounded border border-violet-700/60 bg-violet-950/40 px-2 py-1 text-violet-100 transition-colors hover:bg-violet-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={detail.suggestion ? `采用候选：${detail.suggestion.sourcePath}` : '暂无候选 replacement'}
                    aria-label={`采用 ${detail.value} 候选 replacement`}
                  >
                    采用候选
                  </button>
                  {(detail.suggestion || source) && (
                    <div className="col-span-3 min-w-0 truncate text-[10px] text-gray-500">
                      {detail.suggestion && (
                        <span title={detail.suggestion.reason || detail.suggestion.sourcePath}>
                          候选来源: {detail.suggestion.sourceLabel || detail.suggestion.sourcePath}
                        </span>
                      )}
                      {!detail.suggestion && source && (
                        <span title={source.sourceOriginalPreview || source.sourcePath}>
                          来源: {source.sourceLabel || source.sourcePath}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 模板编辑区 */}
        <div className="flex-1 min-h-[120px] border border-editor-border rounded overflow-hidden">
          <SimpleEditor
            value={template}
            onChange={setTemplate}
            language="json"
            height="100%"
            placeholder='例如: {"env": "test", "debug": true}'
          />
        </div>

        {/* 错误提示 */}
        {template.trim() && !validation.isValid && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {validation.error}
          </div>
        )}

        {targetError && (
          <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded px-2.5 py-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z" />
            </svg>
            {targetError}
          </div>
        )}

        {applyQualityDelta && (
          <div
            data-tour="template-fill-quality-delta"
            className="rounded border border-emerald-800/40 bg-emerald-950/20 px-2.5 py-2 text-xs text-emerald-100"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">最近回填质量变化</div>
              <button
                type="button"
                data-tour="template-fill-copy-quality-delta"
                onClick={handleCopyQualityDelta}
                title="复制最近回填质量变化"
                aria-label="复制质量对比，复制最近回填质量变化"
                className="shrink-0 rounded border border-emerald-800/60 bg-editor-bg px-2 py-0.5 text-emerald-100 transition-colors hover:bg-emerald-900/30"
              >
                复制质量对比
              </button>
            </div>
            <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-emerald-50/90">
              {applyQualityDelta}
            </pre>
          </div>
        )}

        {/* 操作提示 */}
        <div className="text-[10px] text-gray-600 px-1">
          数组将被整体替换，嵌套对象会递归合并。
        </div>
      </div>
    </DraggablePanel>
  );
};
