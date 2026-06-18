import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { copyText, getClipboardErrorMessage, readClipboardText } from '../utils/clipboard';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import {
  formatJsonSchemaIssueChecklistText,
  formatJsonSchemaValidationReport,
  validateJsonAgainstSchema,
  type JsonSchemaValidationResult,
  type JsonSchemaValidationStatus,
} from '../utils/jsonSchemaValidation';
import { inferJsonSchemaFromText, type JsonSchemaInferenceRequiredMode } from '../utils/jsonSchemaInference';
import { generateJsonSchemaExampleText } from '../utils/jsonSchemaExample';
import {
  JSON_SCHEMA_LIBRARY_STORAGE_KEY,
  MAX_JSON_SCHEMA_LIBRARY_ITEMS,
  formatJsonSchemaLibraryExport,
  importJsonSchemaLibrary,
  parseJsonSchemaLibrary,
  removeJsonSchemaLibraryItem,
  serializeJsonSchemaLibrary,
  upsertJsonSchemaLibraryItem,
  type JsonSchemaLibraryItem,
} from '../utils/jsonSchemaLibrary';
import { safeGetStorageItem, safeSetStorageItem } from '../utils/storage';
import { showError, showSuccess } from '../utils/toast';
import {
  getDurationBucket,
  getTextSizeBucket,
  trackToolEvent,
  type ToolEventStatus,
} from '../utils/productTelemetry';

export const JSON_SCHEMA_STORAGE_KEY = 'json-schema-panel-schema';

const SCHEMA_RESULT_STATUS_ID = 'json-schema-result-status';
const SCHEMA_VALIDATE_BUTTON_DESCRIPTION_ID = 'json-schema-validate-button-description';

interface JsonSchemaPanelProps {
  jsonData: string;
  isOpen: boolean;
  onClose: () => void;
  onLocatePath: (query: string) => void;
  onValidationResult?: (result: JsonSchemaValidationResult | null) => void;
}

const getValidationStatusLabel = (status: JsonSchemaValidationStatus): string => {
  if (status === 'valid') return '通过';
  if (status === 'invalid') return '未通过';
  if (status === 'schema-error') return 'Schema 错误';
  if (status === 'input-error') return '输入错误';
  return '待校验';
};

const getValidationStatusClassName = (status: JsonSchemaValidationStatus): string => {
  if (status === 'valid') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  if (status === 'invalid') return 'border-amber-500/40 bg-amber-500/10 text-amber-100';
  if (status === 'schema-error' || status === 'input-error') return 'border-red-500/40 bg-red-500/10 text-red-100';
  return 'border-gray-600 bg-editor-active text-gray-300';
};

const getToolEventStatus = (status: JsonSchemaValidationStatus): ToolEventStatus => {
  if (status === 'empty') return 'skipped';
  if (status === 'schema-error' || status === 'input-error') return 'error';
  return 'success';
};

export const JsonSchemaPanel: React.FC<JsonSchemaPanelProps> = ({
  jsonData,
  isOpen,
  onClose,
  onLocatePath,
  onValidationResult,
}) => {
  const schemaInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [schemaText, setSchemaText] = useState(() => safeGetStorageItem(JSON_SCHEMA_STORAGE_KEY) || '');
  const [schemaLibrary, setSchemaLibrary] = useState<JsonSchemaLibraryItem[]>(() => (
    parseJsonSchemaLibrary(safeGetStorageItem(JSON_SCHEMA_LIBRARY_STORAGE_KEY))
  ));
  const [schemaRequiredMode, setSchemaRequiredMode] = useState<JsonSchemaInferenceRequiredMode>('strict');
  const [result, setResult] = useState<JsonSchemaValidationResult | null>(null);

  const validateButtonDisabledReason = useMemo(() => {
    if (!jsonData.trim()) return '请先在 SOURCE 输入 JSON';
    if (!schemaText.trim()) return '请先粘贴 JSON Schema';
    return '';
  }, [jsonData, schemaText]);
  const isValidateDisabled = Boolean(validateButtonDisabledReason);
  const canCopySchema = Boolean(schemaText.trim());
  const canCopySchemaExample = Boolean(schemaText.trim());
  const canCopyIssueChecklist = Boolean(result?.issues.length);

  const handleSchemaChange = useCallback((value: string) => {
    setSchemaText(value);
    safeSetStorageItem(JSON_SCHEMA_STORAGE_KEY, value);
    setResult(null);
    onValidationResult?.(null);
  }, [onValidationResult]);

  const persistSchemaLibrary = useCallback((items: JsonSchemaLibraryItem[]) => {
    setSchemaLibrary(items);
    safeSetStorageItem(JSON_SCHEMA_LIBRARY_STORAGE_KEY, serializeJsonSchemaLibrary(items));
  }, []);

  const handleValidate = useCallback(() => {
    const startedAt = performance.now();
    const nextResult = validateJsonAgainstSchema(jsonData, schemaText);
    setResult(nextResult);
    onValidationResult?.(nextResult);
    trackToolEvent({
      eventName: 'SCHEMA_VALIDATE',
      category: 'schema',
      status: getToolEventStatus(nextResult.status),
      inputSizeBucket: getTextSizeBucket(jsonData),
      durationBucket: getDurationBucket(performance.now() - startedAt),
    });
  }, [jsonData, onValidationResult, schemaText]);

  React.useEffect(() => {
    setResult(null);
    onValidationResult?.(null);
  }, [jsonData, onValidationResult]);

  React.useEffect(() => {
    const handleBackupImported = () => {
      setSchemaLibrary(parseJsonSchemaLibrary(safeGetStorageItem(JSON_SCHEMA_LIBRARY_STORAGE_KEY)));
    };

    window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
  }, []);

  const handlePasteSchema = useCallback(async () => {
    try {
      const text = await readClipboardText();
      handleSchemaChange(text);
      showSuccess('已粘贴 Schema');
    } catch (error) {
      showError(getClipboardErrorMessage(error, '读取剪贴板失败'));
    }
  }, [handleSchemaChange]);

  const handleGenerateSchema = useCallback(() => {
    const startedAt = performance.now();
    const inferenceResult = inferJsonSchemaFromText(jsonData, { requiredMode: schemaRequiredMode });
    if (!inferenceResult.schemaText) {
      trackToolEvent({
        eventName: 'SCHEMA_INFER',
        category: 'schema',
        status: 'error',
        inputSizeBucket: getTextSizeBucket(jsonData),
        durationBucket: getDurationBucket(performance.now() - startedAt),
        source: schemaRequiredMode,
      });
      showError(inferenceResult.error || '生成 Schema 失败');
      return;
    }

    handleSchemaChange(inferenceResult.schemaText);
    trackToolEvent({
      eventName: 'SCHEMA_INFER',
      category: 'schema',
      status: 'success',
      inputSizeBucket: getTextSizeBucket(jsonData),
      durationBucket: getDurationBucket(performance.now() - startedAt),
      source: schemaRequiredMode,
    });
    showSuccess(`已根据 SOURCE 生成${schemaRequiredMode === 'strict' ? '严格' : '宽松'} Schema`);
    requestAnimationFrame(() => schemaInputRef.current?.focus());
  }, [handleSchemaChange, jsonData, schemaRequiredMode]);

  const handleCopyReport = useCallback(async () => {
    if (!result) return;

    try {
      await copyText(formatJsonSchemaValidationReport(result));
      showSuccess('已复制 Schema 校验报告');
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制报告失败'));
    }
  }, [result]);

  const handleCopySchema = useCallback(async () => {
    if (!schemaText.trim()) return;

    try {
      await copyText(schemaText);
      trackToolEvent({
        eventName: 'SCHEMA_COPY',
        category: 'schema',
        status: 'success',
        inputSizeBucket: getTextSizeBucket(schemaText),
      });
      showSuccess('已复制当前 Schema');
    } catch (error) {
      trackToolEvent({
        eventName: 'SCHEMA_COPY',
        category: 'schema',
        status: 'error',
        inputSizeBucket: getTextSizeBucket(schemaText),
      });
      showError(getClipboardErrorMessage(error, '复制 Schema 失败'));
    }
  }, [schemaText]);

  const handleCopySchemaExample = useCallback(async () => {
    if (!schemaText.trim()) return;

    const startedAt = performance.now();
    const exampleResult = generateJsonSchemaExampleText(schemaText);
    if (!exampleResult.exampleText) {
      trackToolEvent({
        eventName: 'SCHEMA_EXAMPLE_COPY',
        category: 'schema',
        status: 'error',
        inputSizeBucket: getTextSizeBucket(schemaText),
        durationBucket: getDurationBucket(performance.now() - startedAt),
      });
      showError(exampleResult.error || '生成示例 JSON 失败');
      return;
    }

    try {
      await copyText(exampleResult.exampleText);
      trackToolEvent({
        eventName: 'SCHEMA_EXAMPLE_COPY',
        category: 'schema',
        status: 'success',
        inputSizeBucket: getTextSizeBucket(schemaText),
        durationBucket: getDurationBucket(performance.now() - startedAt),
      });
      showSuccess('已复制 Schema 示例 JSON');
    } catch (error) {
      trackToolEvent({
        eventName: 'SCHEMA_EXAMPLE_COPY',
        category: 'schema',
        status: 'error',
        inputSizeBucket: getTextSizeBucket(schemaText),
        durationBucket: getDurationBucket(performance.now() - startedAt),
      });
      showError(getClipboardErrorMessage(error, '复制示例失败'));
    }
  }, [schemaText]);

  const handleCopyIssueChecklist = useCallback(async () => {
    if (!result || result.issues.length === 0) return;

    try {
      await copyText(formatJsonSchemaIssueChecklistText(result));
      showSuccess('已复制 Schema 修复清单');
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制清单失败'));
    }
  }, [result]);

  const handleClearSchema = useCallback(() => {
    handleSchemaChange('');
    setResult(null);
    onValidationResult?.(null);
    schemaInputRef.current?.focus();
  }, [handleSchemaChange, onValidationResult]);

  const handleSaveSchema = useCallback(() => {
    if (!schemaText.trim()) return;

    const nextLibrary = upsertJsonSchemaLibraryItem(schemaLibrary, schemaText);
    persistSchemaLibrary(nextLibrary);
    showSuccess(`已收藏 Schema: ${nextLibrary[0]?.name || '未命名 Schema'}`);
  }, [persistSchemaLibrary, schemaLibrary, schemaText]);

  const handleLoadSchema = useCallback((item: JsonSchemaLibraryItem) => {
    handleSchemaChange(item.schemaText);
    showSuccess(`已载入 Schema: ${item.name}`);
    requestAnimationFrame(() => schemaInputRef.current?.focus());
  }, [handleSchemaChange]);

  const handleRemoveSchema = useCallback((itemId: string) => {
    persistSchemaLibrary(removeJsonSchemaLibraryItem(schemaLibrary, itemId));
    showSuccess('已删除 Schema 收藏');
  }, [persistSchemaLibrary, schemaLibrary]);

  const handleExportSchemaLibrary = useCallback(async () => {
    if (schemaLibrary.length === 0) return;

    const exportText = formatJsonSchemaLibraryExport(schemaLibrary);
    try {
      await copyText(exportText);
      trackToolEvent({
        eventName: 'SCHEMA_LIBRARY_EXPORT',
        category: 'schema',
        status: 'success',
        inputSizeBucket: getTextSizeBucket(exportText),
      });
      showSuccess(`已复制 ${schemaLibrary.length} 个 Schema 收藏`);
    } catch (error) {
      trackToolEvent({
        eventName: 'SCHEMA_LIBRARY_EXPORT',
        category: 'schema',
        status: 'error',
        inputSizeBucket: getTextSizeBucket(exportText),
      });
      showError(getClipboardErrorMessage(error, '导出收藏失败'));
    }
  }, [schemaLibrary]);

  const handleImportSchemaLibrary = useCallback(async () => {
    try {
      const text = await readClipboardText();
      const importResult = importJsonSchemaLibrary(schemaLibrary, text);
      if (!importResult) {
        trackToolEvent({
          eventName: 'SCHEMA_LIBRARY_IMPORT',
          category: 'schema',
          status: 'error',
          inputSizeBucket: getTextSizeBucket(text),
        });
        showError('剪贴板中未识别到可导入的 Schema');
        return;
      }

      persistSchemaLibrary(importResult.items);
      trackToolEvent({
        eventName: 'SCHEMA_LIBRARY_IMPORT',
        category: 'schema',
        status: 'success',
        inputSizeBucket: getTextSizeBucket(text),
      });
      const skippedText = importResult.skippedCount > 0 ? `，跳过 ${importResult.skippedCount} 个重复项` : '';
      showSuccess(`已导入 ${importResult.importedCount} 个 Schema${skippedText}`);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '导入收藏失败'));
    }
  }, [persistSchemaLibrary, schemaLibrary]);

  const footer = (
    <>
      <div id={SCHEMA_VALIDATE_BUTTON_DESCRIPTION_ID} className="text-xs text-gray-500">
        {validateButtonDisabledReason || '校验当前 SOURCE JSON'}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          data-tour="json-schema-copy-schema"
          onClick={() => void handleCopySchema()}
          disabled={!canCopySchema}
          title={canCopySchema ? '复制当前 Schema 文本' : 'Schema 为空，暂无内容可复制'}
          className="rounded border border-editor-border px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          复制Schema
        </button>
        <button
          type="button"
          data-tour="json-schema-copy-example"
          onClick={() => void handleCopySchemaExample()}
          disabled={!canCopySchemaExample}
          title={canCopySchemaExample ? '根据当前 Schema 复制一份示例 JSON' : 'Schema 为空，暂无内容可生成示例'}
          className="rounded border border-editor-border px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          复制示例
        </button>
        <button
          type="button"
          data-tour="json-schema-copy-checklist"
          onClick={() => void handleCopyIssueChecklist()}
          disabled={!canCopyIssueChecklist}
          title={canCopyIssueChecklist ? '复制当前失败项的修复清单' : '校验失败后可复制修复清单'}
          className="rounded border border-editor-border px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          复制清单
        </button>
        <button
          type="button"
          data-tour="json-schema-copy-report"
          onClick={handleCopyReport}
          disabled={!result}
          className="rounded border border-editor-border px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          复制报告
        </button>
        <button
          type="button"
          data-tour="json-schema-validate-button"
          onClick={handleValidate}
          disabled={isValidateDisabled}
          aria-describedby={SCHEMA_VALIDATE_BUTTON_DESCRIPTION_ID}
          title={validateButtonDisabledReason || '校验当前 SOURCE JSON'}
          className="rounded bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
        >
          校验
        </button>
      </div>
    </>
  );

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="JSON Schema 校验"
      ariaLabel="JSON Schema 校验"
      initialFocusRef={schemaInputRef}
      icon={PanelIcons.Code}
      storageKey="json-schema-panel"
      defaultPosition={{ x: 280, y: 120 }}
      defaultSize={{ width: 760, height: 560 }}
      minSize={{ width: 520, height: 360 }}
      footer={footer}
      dataTour="json-schema-panel"
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
        <div className="flex min-h-0 flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-300">Schema</span>
            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Schema 生成必填策略"
                className="flex shrink-0 overflow-hidden rounded border border-editor-border"
              >
                {(['strict', 'loose'] as const).map(mode => {
                  const isActive = schemaRequiredMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      data-tour={`json-schema-generate-mode-${mode}`}
                      onClick={() => setSchemaRequiredMode(mode)}
                      className={`px-1.5 py-1 text-[11px] transition-colors ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'bg-editor-bg text-gray-400 hover:bg-editor-hover hover:text-gray-200'
                      }`}
                      aria-pressed={isActive}
                      title={mode === 'strict' ? '生成 required 约束，适合锁定当前样例' : '不生成 required 约束，适合团队复用'}
                    >
                      {mode === 'strict' ? '严格' : '宽松'}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                data-tour="json-schema-generate"
                onClick={handleGenerateSchema}
                disabled={!jsonData.trim()}
                title={jsonData.trim() ? `根据当前 SOURCE 生成${schemaRequiredMode === 'strict' ? '严格' : '宽松'} Schema` : '请先在 SOURCE 输入 JSON'}
                className="rounded border border-editor-border px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                生成
              </button>
              <button
                type="button"
                data-tour="json-schema-paste"
                onClick={() => void handlePasteSchema()}
                className="rounded border border-editor-border px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-hover"
              >
                粘贴
              </button>
              <button
                type="button"
                data-tour="json-schema-clear"
                onClick={handleClearSchema}
                disabled={!schemaText}
                className="rounded border border-editor-border px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-900/30 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                清空
              </button>
              <button
                type="button"
                data-tour="json-schema-save"
                onClick={handleSaveSchema}
                disabled={!schemaText.trim()}
                className="rounded border border-editor-border px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                收藏
              </button>
            </div>
          </div>
          <textarea
            ref={schemaInputRef}
            data-tour="json-schema-input"
            value={schemaText}
            onChange={(event) => handleSchemaChange(event.target.value)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded border border-editor-border bg-editor-bg p-3 font-mono text-xs leading-5 text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            placeholder='{"type":"object","required":["id"]}'
          />
          <div
            data-tour="json-schema-library"
            className="mt-2 flex max-h-28 min-h-[74px] flex-col rounded border border-editor-border bg-editor-bg/60"
          >
            <div className="flex items-center justify-between border-b border-editor-border px-2 py-1.5">
              <span className="text-[11px] font-semibold text-gray-400">
                收藏 {schemaLibrary.length}/{MAX_JSON_SCHEMA_LIBRARY_ITEMS}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  data-tour="json-schema-library-import"
                  onClick={() => void handleImportSchemaLibrary()}
                  className="rounded border border-editor-border px-1.5 py-0.5 text-[11px] text-gray-400 transition-colors hover:bg-editor-hover hover:text-gray-200"
                >
                  导入
                </button>
                <button
                  type="button"
                  data-tour="json-schema-library-export"
                  onClick={() => void handleExportSchemaLibrary()}
                  disabled={schemaLibrary.length === 0}
                  className="rounded border border-editor-border px-1.5 py-0.5 text-[11px] text-gray-400 transition-colors hover:bg-editor-hover hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  导出
                </button>
              </div>
            </div>
            {schemaLibrary.length === 0 ? (
              <div className="flex flex-1 items-center px-2 py-2 text-xs text-gray-600">
                暂无收藏 Schema
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-1">
                {schemaLibrary.map(item => (
                  <div
                    key={item.id}
                    data-tour="json-schema-library-item"
                    className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-editor-hover"
                  >
                    <button
                      type="button"
                      data-tour="json-schema-library-load"
                      onClick={() => handleLoadSchema(item)}
                      className="min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-xs text-gray-300 transition-colors hover:text-emerald-100"
                      title={item.name}
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      data-tour="json-schema-library-remove"
                      onClick={() => handleRemoveSchema(item.id)}
                      className="shrink-0 rounded px-1.5 py-1 text-xs text-gray-500 transition-colors hover:bg-red-900/30 hover:text-red-100"
                      title={`删除 ${item.name}`}
                      aria-label={`删除 Schema 收藏 ${item.name}`}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded border border-editor-border bg-editor-bg">
          <div className="flex items-center justify-between gap-2 border-b border-editor-border px-3 py-2">
            <span className="text-xs font-semibold text-gray-300">结果</span>
            <span
              id={SCHEMA_RESULT_STATUS_ID}
              data-tour="json-schema-status"
              className={`rounded border px-2 py-0.5 text-xs ${getValidationStatusClassName(result?.status || 'empty')}`}
            >
              {getValidationStatusLabel(result?.status || 'empty')}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {!result ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-gray-500">
                粘贴 Schema 后点击校验
              </div>
            ) : (
              <div aria-describedby={SCHEMA_RESULT_STATUS_ID} className="space-y-3">
                <div
                  data-tour="json-schema-summary"
                  className={`rounded border px-3 py-2 text-sm ${getValidationStatusClassName(result.status)}`}
                >
                  {result.summary}
                </div>

                {(result.issueKeywordGroups.length > 0 || result.issuePathList.length > 0) && (
                  <div
                    data-tour="json-schema-issue-distribution"
                    className="rounded border border-editor-border bg-editor-sidebar/70 px-3 py-2"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-300">修复概览</span>
                      <span className="text-[11px] text-gray-500">{result.issueCount} 个问题</span>
                    </div>
                    {result.issueKeywordGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {result.issueKeywordGroups.map(group => (
                          <span
                            key={group.key}
                            className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100"
                          >
                            <code>{group.key}</code>
                            <span className="ml-1 text-amber-200/80">{group.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {result.issuePathList.length > 0 && (
                      <div data-tour="json-schema-issue-path-list" className="mt-2">
                        <div className="mb-1 text-[11px] font-semibold text-gray-500">路径清单</div>
                        <div className="space-y-1">
                          {result.issuePathList.map(path => (
                            <button
                              key={path}
                              type="button"
                              onClick={() => onLocatePath(path)}
                              className="block w-full truncate rounded border border-transparent px-2 py-1 text-left font-mono text-[11px] text-emerald-200 transition-colors hover:border-editor-border hover:bg-editor-hover"
                              title={path}
                            >
                              {path}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {result.issues.length > 0 && (
                  <div data-tour="json-schema-issues" className="space-y-2">
                    {result.issues.map((issue, index) => (
                      <div
                        key={`${issue.path}:${issue.keyword}:${index}`}
                        className="rounded border border-editor-border bg-editor-sidebar p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <code className="min-w-0 truncate text-xs text-emerald-200" title={issue.path}>
                            {issue.path}
                          </code>
                          <button
                            type="button"
                            data-tour="json-schema-locate-issue"
                            onClick={() => onLocatePath(issue.path)}
                            className="shrink-0 rounded border border-editor-border px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-hover"
                          >
                            定位
                          </button>
                        </div>
                        <div className="text-xs leading-5 text-gray-300">
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-amber-100">
                            {issue.keyword}
                          </span>
                          <span className="ml-2">{issue.message}</span>
                        </div>
                        <div className="mt-2 rounded border border-emerald-500/20 bg-emerald-500/5 px-2 py-1.5 text-xs leading-5 text-emerald-100">
                          建议: {issue.suggestion}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-gray-500" title={issue.schemaPath}>
                          {issue.schemaPath}
                        </div>
                      </div>
                    ))}
                    {result.issueCount > result.shownIssueCount && (
                      <div className="rounded border border-editor-border bg-editor-sidebar px-3 py-2 text-xs text-gray-500">
                        还有 {result.issueCount - result.shownIssueCount} 个问题未展示
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
};
