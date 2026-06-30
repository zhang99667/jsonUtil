
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { showSuccess, showError } from './utils/toast';
import { AppActionSidebar } from './components/AppActionSidebar';
import { AppEditorWorkspace } from './components/AppEditorWorkspace';
import { AppWorkspaceOverlays } from './components/AppWorkspaceOverlays';
import {
  performTransform,
  deepParseWithContext,
  isStandaloneDeepFormatInput
} from './utils/transformations';
import { TransformMode, ActionType, ValidationResult, AIConfig, HighlightRange, GeneralSettings, TransformContext, type EditorDiagnosticHighlight } from './types';
import { useShortcuts } from './hooks/useShortcuts';
import { useFileSystem } from './hooks/useFileSystem';
import { useAppChunkLoadRecovery } from './hooks/useAppChunkLoadRecovery';
import { useAppLazyPanelWarmup } from './hooks/useAppLazyPanelWarmup';
import { useAppUpdateCheck } from './hooks/useAppUpdateCheck';
import { useAppAsyncTransform } from './hooks/useAppAsyncTransform';
import { useAppFileCloseGuard } from './hooks/useAppFileCloseGuard';
import { useAppFileDrop } from './hooks/useAppFileDrop';
import { useAppAiRepairCommand } from './hooks/useAppAiRepairCommand';
import { useAppCopyCommands } from './hooks/useAppCopyCommands';
import { useAppSaveCommands } from './hooks/useAppSaveCommands';
import { useAppSettingsBackupCommands } from './hooks/useAppSettingsBackupCommands';
import { useAppSmartSuggestionCommands } from './hooks/useAppSmartSuggestionCommands';
import { useAppPreviewOutputSync } from './hooks/useAppPreviewOutputSync';
import { useAppLazyPanelLoadState } from './hooks/useAppLazyPanelLoadState';
import { useAppSourceValidation } from './hooks/useAppSourceValidation';
import { useAppTemplateFillCommand } from './hooks/useAppTemplateFillCommand';
import { useAppToolPanelCommands } from './hooks/useAppToolPanelCommands';
import {
  useAppSourceReplacementCommands,
  type AppSmartSuggestionOrigin,
} from './hooks/useAppSourceReplacementCommands';
import { useLayout } from './hooks/useLayout';
import { getPaneKeyboardResizePercent, getSidebarKeyboardResizeWidth } from './hooks/layoutKeyboardResize';
import { useOnboardingTour } from './hooks/useOnboardingTour';
import { useFeatureTour, FeatureId } from './hooks/useFeatureTour';
import { AppConfirmDialogs } from './components/AppConfirmDialogs';
import { AppLazyShellModals } from './components/AppLazyShellModals';
import { AppLazyToolPanels } from './components/AppLazyToolPanels';
import ErrorBoundary from './components/ErrorBoundary';
import { StatusBar } from './components/StatusBar';
import { getDocumentStats } from './utils/documentStats';
import type { AiRepairSummary } from './utils/aiRepairSummary';
import { getDetailedErrorMessage } from './utils/errors';
import { safeSetStorageItem } from './utils/storage';
import { AI_CONFIG_STORAGE_KEY, GENERAL_SETTINGS_STORAGE_KEY, loadAIConfig, loadGeneralSettings } from './utils/appSettings';
import { notifyFloatingPanelLayoutReset, resetFloatingPanelLayoutStorage } from './utils/panelLayout';
import { setJsonPointerValue } from './utils/jsonPointer';
import {
  cleanJsonInput,
  getJsonValidationErrorLocation,
  startJsonValidation,
} from './utils/jsonValidation';
import { formatTransformContextSummary } from './utils/transformContextSummary';
import { initGoogleAnalytics } from './utils/analytics';
import {
  getDurationBucket,
  getTextSizeBucket,
  trackToolEvent,
  type ToolEventStatus,
} from './utils/productTelemetry';
import type { JsonSchemaValidationResult } from './utils/jsonSchemaValidation';
import { getJsonSchemaIssueHighlights } from './utils/jsonSchemaIssueHighlights';
import { getSmartInputSuggestion } from './utils/smartInputSuggestion';
import { buildAppEditorUiState } from './utils/appEditorUiState';
import { getContentSizeSummary } from './utils/appWorkflowHelpers';
import { setLegacyJsonPathValue } from './utils/appLegacyJsonPath';
import {
  ASYNC_VALIDATION_THRESHOLD,
  DOCUMENT_STATS_SCAN_LIMIT,
} from './utils/appAsyncPolicy';
import {
  getActiveAppDeepFormatResult,
  resolveAppOutputValue,
} from './utils/appAsyncTransformState';

const App: React.FC = () => {
  // 核心状态：输入源
  const [input, setInput] = useState<string>('');

  // 使用 Ref 存储最新输入值，避免预览编辑时的竞态条件
  const inputRef = useRef<string>('');

  // 使用 Ref 阻断输出更新引发的循环更新
  const isUpdatingFromOutput = useRef<boolean>(false);

  // 使用 Ref 暂存待处理的输出值
  const pendingOutputValue = useRef<string>('');

  // 当前转换模式
  const [mode, setMode] = useState<TransformMode>(TransformMode.NONE);

  // 当没有打开文件时，使用 Ref 存储转换上下文（避免无 Tab 场景下丢失 context）
  const fallbackContextRef = useRef<TransformContext | null>(null);

  // 界面布局状态 (Hook) - 移到前面避免依赖问题
  const appRef = useRef<HTMLDivElement>(null);
  const {
    sidebarWidth, setSidebarWidth,
    isSidebarCollapsed, setIsSidebarCollapsed,
    leftPaneWidthPercent, setLeftPaneWidthPercent,
    isResizingSidebar, isResizingPane,
    startResizingSidebar, startResizingPane
  } = useLayout(appRef);

  const handleSidebarResizeKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const nextWidth = getSidebarKeyboardResizeWidth(sidebarWidth, event.key, event.shiftKey);
    if (nextWidth === null) return;

    event.preventDefault();
    setSidebarWidth(nextWidth);
  }, [setSidebarWidth, sidebarWidth]);

  const handlePaneResizeKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const nextPercent = getPaneKeyboardResizePercent(leftPaneWidthPercent, event.key, event.shiftKey);
    if (nextPercent === null) return;

    event.preventDefault();
    setLeftPaneWidthPercent(nextPercent);
  }, [leftPaneWidthPercent, setLeftPaneWidthPercent]);

  // 文件系统状态 (Hook) - 移到前面，因为 output 需要使用 activeFileId 和 setFiles
  const {
    files, setFiles, activeFileId, isAutoSaveEnabled, setIsAutoSaveEnabled,
    createNewTab, openFile, openDroppedFiles, saveFile, saveSourceAs, closeFile, switchTab, updateActiveFileContent,
    saveViewState, flushWorkspaceDraft
  } = useFileSystem({
    input, setInput, inputRef, mode, setMode, output: '' // 初始为空，后面会更新
  });

  // 通用设置状态 + localStorage 持久化（需在 deepFormatResult 之前声明）
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(loadGeneralSettings);

  useEffect(() => {
    safeSetStorageItem(GENERAL_SETTINGS_STORAGE_KEY, JSON.stringify(generalSettings));
  }, [generalSettings]);

  const activeFile = useMemo(
    () => activeFileId ? files.find(file => file.id === activeFileId) || null : null,
    [activeFileId, files]
  );
  const {
    cancelPendingCloseFile,
    confirmPendingCloseFile,
    pendingCloseFile,
    requestCloseFile,
  } = useAppFileCloseGuard({
    files,
    activeFileId,
    sourceText: input,
    onCloseFile: closeFile,
  });

  const aiRepairSnapshotRef = useRef<string | null>(null);
  const smartSuggestionOriginTextRef = useRef('');
  const autoExpandScheme = generalSettings.autoExpandSchemeInDeepFormat;
  const {
    asyncTransformPolicy,
    currentAsyncTransformResult,
    isOutputTransforming,
    shouldUseAsyncTransform,
  } = useAppAsyncTransform({
    input,
    mode,
    isUpdatingFromOutput: isUpdatingFromOutput.current,
    autoExpandScheme,
  });

  const validateJsonMaybeAsync = useCallback((
    value: string,
    options?: { requireContainer?: boolean }
  ): Promise<ValidationResult> => {
    return startJsonValidation(value, ASYNC_VALIDATION_THRESHOLD, options).promise;
  }, []);

  // 深度格式化结果和上下文（避免在 output 计算中产生副作用）
  const syncDeepFormatResult = useMemo(() => {
    if (mode === TransformMode.DEEP_FORMAT && !shouldUseAsyncTransform) {
      return deepParseWithContext(input, {
        autoExpandScheme,
      });
    }
    return null;
  }, [input, mode, autoExpandScheme, shouldUseAsyncTransform]);

  const activeDeepFormatResult = useMemo(() => {
    return getActiveAppDeepFormatResult(syncDeepFormatResult, mode, currentAsyncTransformResult);
  }, [syncDeepFormatResult, mode, currentAsyncTransformResult]);

  const deepFormatWarning = useMemo(() => {
    if (mode !== TransformMode.DEEP_FORMAT) return undefined;
    const warnings = activeDeepFormatResult?.context.warnings || [];
    if (warnings.length === 0) return undefined;

    const firstWarning = warnings[0];
    return warnings.length === 1
      ? `${firstWarning.message}: ${firstWarning.path} (${firstWarning.length} 字符，阈值 ${firstWarning.limit})`
      : `已跳过 ${warnings.length} 个字符串递归展开，首个位置 ${firstWarning.path}: ${firstWarning.message}`;
  }, [activeDeepFormatResult, mode]);

  const deepFormatInfo = useMemo(() => {
    if (mode !== TransformMode.DEEP_FORMAT || !activeDeepFormatResult) return undefined;
    return formatTransformContextSummary(activeDeepFormatResult.context);
  }, [activeDeepFormatResult, mode]);
  const transformReportContext = mode === TransformMode.DEEP_FORMAT
    ? activeDeepFormatResult?.context || null
    : null;

  // 保存深度格式化上下文到文件（副作用独立处理）
  useEffect(() => {
    if (activeDeepFormatResult) {
      if (activeFileId) {
        setFiles(prev => prev.map(f =>
          f.id === activeFileId
            ? { ...f, transformContext: activeDeepFormatResult.context }
            : f
        ));
      } else {
        fallbackContextRef.current = activeDeepFormatResult.context;
      }
    }
  }, [activeDeepFormatResult, activeFileId, setFiles]);

  // 计算派生输出（纯计算，无副作用）
  const output = useMemo(() => {
    const resolvedOutput = resolveAppOutputValue({
      isUpdatingFromOutput: isUpdatingFromOutput.current,
      pendingOutputValue: pendingOutputValue.current,
      mode,
      activeDeepFormatResult,
      shouldUseAsyncTransform,
      currentAsyncTransformResult,
      getFallbackOutput: () => performTransform(input, mode),
    });

    if (resolvedOutput.shouldClearPendingOutput && !isUpdatingFromOutput.current) {
      pendingOutputValue.current = '';
    }
    return resolvedOutput.output;
  }, [input, mode, activeDeepFormatResult, shouldUseAsyncTransform, currentAsyncTransformResult]);

  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const { previewValidation, handleOutputChange } = useAppPreviewOutputSync({
    files,
    activeFileId,
    mode,
    inputRef,
    fallbackContextRef,
    isUpdatingFromOutput,
    pendingOutputValue,
    validateJsonMaybeAsync,
    onSetInput: setInput,
    onUpdateActiveFileContent: updateActiveFileContent,
  });
  const [aiRepairSummary, setAiRepairSummary] = useState<AiRepairSummary | null>(null);
  const [sourceErrorLocateSignal, setSourceErrorLocateSignal] = useState(0);
  const sourceErrorLocation = useMemo(
    () => validation.isValid ? null : getJsonValidationErrorLocation(input, validation.error),
    [input, validation]
  );
  const previewErrorLocation = useMemo(
    () => previewValidation.isValid ? null : getJsonValidationErrorLocation(output, previewValidation.error),
    [output, previewValidation]
  );

  const [highlightRange, setHighlightRange] = useState<HighlightRange | null>(null);
  const [jsonSchemaValidationResult, setJsonSchemaValidationResult] = useState<JsonSchemaValidationResult | null>(null);
  const jsonSchemaDiagnosticHighlights = useMemo<EditorDiagnosticHighlight[]>(() => (
    getJsonSchemaIssueHighlights(input, jsonSchemaValidationResult).map(({ range, issue }) => ({
      range,
      path: issue.path,
      keyword: issue.keyword,
      message: issue.message,
    }))
  ), [input, jsonSchemaValidationResult]);
  const jsonSchemaWarning = useMemo(() => {
    if (!jsonSchemaValidationResult || jsonSchemaValidationResult.status !== 'invalid') return '';
    return `Schema 未通过 ${jsonSchemaValidationResult.issueCount} 个问题`;
  }, [jsonSchemaValidationResult]);

  const [activeEditor, setActiveEditor] = useState<'SOURCE' | 'PREVIEW' | null>(null);
  const [smartSuggestionOrigin, setSmartSuggestionOrigin] = useState<AppSmartSuggestionOrigin | null>(null);

  // 光标位置状态（用于状态栏显示）
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });

  const [aiConfig, setAiConfig] = useState<AIConfig>(loadAIConfig);

  useEffect(() => {
    safeSetStorageItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    if (!aiRepairSummary) return;
    if (aiRepairSnapshotRef.current !== input) {
      aiRepairSnapshotRef.current = null;
      setAiRepairSummary(null);
    }
  }, [input, aiRepairSummary]);

  // 访客统计打点 (仅统计前台页面访问)
  useEffect(() => {
    initGoogleAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID);

    fetch('/api/visitor/ping').catch(() => {
      // 静默失败，不影响用户体验
    });
  }, []);

  const trackCurrentToolEvent = useCallback((
    eventName: string,
    category: string,
    status: ToolEventStatus = 'success',
    startedAt?: number
  ) => {
    const durationMs = typeof startedAt === 'number' ? performance.now() - startedAt : 0;
    trackToolEvent({
      eventName,
      category,
      status,
      inputSizeBucket: getTextSizeBucket(inputRef.current),
      durationBucket: getDurationBucket(durationMs),
    });
  }, []);

  const {
    changelogHighlightedVersion,
    changelogSourceMarkdown,
    handleCloseChangelog,
    handleCloseJsonPathPanel,
    handleLocateJsonPath,
    handleLocateJsonPathResultInStructure,
    handleOpenAiSettings,
    handleOpenChangelog,
    handleOpenSchemeFromReport,
    handleOpenSchemeFromStructure,
    handleOpenSettingsPanel,
    handleOpenSourceSchemeInput,
    handleOpenTemplateFillFromReport,
    handleToggleJsonCompare,
    handleToggleJsonPath,
    handleToggleJsonSchema,
    handleToggleJsonTree,
    handleToggleSchemeDecode,
    handleToggleTemplateFill,
    isChangelogModalOpen,
    isJsonComparePanelOpen,
    isJsonPathPanelOpen,
    isJsonSchemaPanelOpen,
    isJsonTreePanelOpen,
    isSchemeDecodeOpen,
    isSettingsModalOpen,
    isTemplatePanelOpen,
    isTransformReportOpen,
    jsonPathQueryRequest,
    jsonTreeFocusRequest,
    requestSchemeInput,
    schemeInputRequest,
    setIsJsonComparePanelOpen,
    setIsJsonPathPanelOpen,
    setIsJsonSchemaPanelOpen,
    setIsJsonTreePanelOpen,
    setIsSchemeDecodeOpen,
    setIsSettingsModalOpen,
    setIsTemplatePanelOpen,
    setIsTransformReportOpen,
    setTemplateApplyQualityDelta,
    settingsInitialTab,
    templateApplyQualityDelta,
    templateFillRequest,
  } = useAppToolPanelCommands({
    mode,
    sourceText: input,
    onSetMode: setMode,
    onSetHighlightRange: setHighlightRange,
    onTrackToolEvent: trackCurrentToolEvent,
  });

  const lazyPanelsLoaded = useAppLazyPanelLoadState({
    settings: isSettingsModalOpen,
    changelog: isChangelogModalOpen,
    jsonPath: isJsonPathPanelOpen,
    jsonTree: isJsonTreePanelOpen,
    jsonCompare: isJsonComparePanelOpen,
    jsonSchema: isJsonSchemaPanelOpen,
    scheme: isSchemeDecodeOpen,
    template: isTemplatePanelOpen,
    transformReport: isTransformReportOpen,
  });

  // JSONPath 查询当前 PREVIEW 文本，确保 Worker 返回的高亮范围与右侧编辑器坐标一致
  const jsonPathDataSource = useMemo(() => {
    if (!isJsonPathPanelOpen && !isJsonTreePanelOpen) {
      return '';
    }

    return output;
  }, [output, isJsonPathPanelOpen, isJsonTreePanelOpen]);

  const { handleSaveShortcut, handleToolbarSave } = useAppSaveCommands({
    activeEditor,
    hasActiveFile: Boolean(activeFileId),
    activeFileHasHandle: Boolean(activeFile?.handle),
    previewText: output,
    isOutputTransforming,
    onSaveFile: saveFile,
    onSaveSourceAs: saveSourceAs,
    onTrackToolEvent: trackCurrentToolEvent,
  });

  const handleModeChange = useCallback((nextMode: TransformMode) => {
    setMode(nextMode);
    trackCurrentToolEvent(nextMode, 'transform_mode');
  }, [setMode, trackCurrentToolEvent]);

  const handleToggleAutoSave = useCallback(() => {
    if (!activeFileId) {
      showError('请先打开或保存文件后再启用自动保存');
      return;
    }

    if (!activeFile?.handle) {
      showError('请先保存当前标签后再启用自动保存');
      return;
    }

    const nextEnabled = !isAutoSaveEnabled;
    setIsAutoSaveEnabled(nextEnabled);
    showSuccess(nextEnabled ? '自动保存已开启' : '自动保存已关闭');
  }, [activeFileId, activeFile, isAutoSaveEnabled, setIsAutoSaveEnabled]);

  // 快捷键状态 (Hook)
  const { shortcuts, updateShortcut, resetShortcuts, replaceShortcuts } = useShortcuts({
    onSave: handleSaveShortcut,
    onFormat: () => handleModeChange(TransformMode.FORMAT),
    onDeepFormat: () => handleModeChange(TransformMode.DEEP_FORMAT),
    onMinify: () => handleModeChange(TransformMode.MINIFY),
    onCloseTab: () => activeFileId && requestCloseFile(activeFileId),
    onToggleJsonPath: handleToggleJsonPath,
    onNewTab: () => {
      createNewTab();
      trackCurrentToolEvent(ActionType.NEW_TAB, 'file');
    }
  });

  const { handleExportSettingsBackup, handleImportSettingsBackup } = useAppSettingsBackupCommands({
    generalSettings,
    aiConfig,
    shortcuts,
    onSetGeneralSettings: setGeneralSettings,
    onSetAIConfig: setAiConfig,
    onReplaceShortcuts: replaceShortcuts,
  });

  // 用户引导 (Hook)
  useOnboardingTour();

  // 生产环境检测新版本，避免长时间打开的页面停留在旧包
  useAppUpdateCheck();
  useAppChunkLoadRecovery({ onBeforeReload: flushWorkspaceDraft });
  useAppLazyPanelWarmup();

  // 功能级引导 (Hook)
  const { triggerFeatureFirstUse } = useFeatureTour();

  // 同步模式变更到活动文件
  useEffect(() => {
    if (activeFileId) {
      setFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, mode } : f
      ));
    }
  }, [mode, activeFileId]);

  // 计算文档统计信息（根据当前焦点区域）
  const documentStats = useMemo(() => {
    const content = activeEditor === 'PREVIEW' ? output : input;
    return getDocumentStats(content, { maxScanLength: DOCUMENT_STATS_SCAN_LIMIT });
  }, [input, output, activeEditor]);
  const isSourceLarge = asyncTransformPolicy.isSourceLarge;
  const isAiConfigured = Boolean(aiConfig.apiKey.trim());
  const smartSuggestion = useMemo(() => getSmartInputSuggestion(input), [input]);

  useEffect(() => {
    if (!smartSuggestionOrigin) return;
    if (input === smartSuggestionOriginTextRef.current && smartSuggestion) return;

    smartSuggestionOriginTextRef.current = '';
    setSmartSuggestionOrigin(null);
  }, [input, smartSuggestion, smartSuggestionOrigin]);

  useAppSourceValidation({ input, onSetValidation: setValidation });

  // 左侧编辑器变更处理
  const handleInputChange = useCallback((newVal: string) => {
    // 实时清理不可见字符
    const cleanVal = cleanJsonInput(newVal);
    setSmartSuggestionOrigin(null);
    if (aiRepairSnapshotRef.current !== cleanVal) {
      aiRepairSnapshotRef.current = null;
      setAiRepairSummary(null);
    }
    setInput(cleanVal);
    if (mode === TransformMode.NONE && isStandaloneDeepFormatInput(cleanVal)) {
      setMode(TransformMode.DEEP_FORMAT);
    }

    // 同步更新 Ref 状态
    inputRef.current = cleanVal;

    // 更新活动文件内容缓存
    updateActiveFileContent(cleanVal);

  }, [mode, setAiRepairSummary, setInput, setMode, setSmartSuggestionOrigin, updateActiveFileContent]);

  const handleApplyAiRepairResult = useCallback((fixedJson: string, summary: AiRepairSummary) => {
    setAiRepairSummary(summary);
    setInput(fixedJson);
    inputRef.current = fixedJson;
    updateActiveFileContent(fixedJson);
  }, [setAiRepairSummary, setInput, updateActiveFileContent]);

  const {
    isAiRepairing: isProcessing,
    handleAiRepair,
  } = useAppAiRepairCommand({
    sourceText: input,
    aiConfig,
    aiRepairSnapshotRef,
    onApplyFixedJson: handleApplyAiRepairResult,
    onSetMode: setMode,
    onOpenAiSettings: handleOpenAiSettings,
    onTriggerFeatureFirstUse: () => triggerFeatureFirstUse(FeatureId.AI_FIX),
    onTrackToolEvent: trackCurrentToolEvent,
  });

  const {
    isClearSourceConfirmOpen,
    pendingPasteSourceText,
    pendingApplyPreviewText,
    pendingSchemaExampleText,
    pendingSchemeInspectSourceText,
    handleInspectSourceFromScheme,
    handleConfirmSchemeInspectSource,
    handleCancelSchemeInspectSource,
    handlePasteSource,
    handleConfirmPasteSource,
    handleCancelPasteSource,
    handleRequestApplyPreviewToSource,
    handleConfirmApplyPreviewToSource,
    handleCancelApplyPreviewToSource,
    handleRequestApplySchemaExampleToSource,
    handleConfirmApplySchemaExampleToSource,
    handleCancelApplySchemaExampleToSource,
    handleRequestClearSource,
    handleConfirmClearSource,
    handleCancelClearSource,
  } = useAppSourceReplacementCommands({
    input,
    output,
    isOutputTransforming,
    smartSuggestionOriginTextRef,
    onInputChange: handleInputChange,
    onSetMode: setMode,
    onSetHighlightRange: setHighlightRange,
    onSetJsonPathPanelOpen: setIsJsonPathPanelOpen,
    onSetTransformReportOpen: setIsTransformReportOpen,
    onSetSchemeDecodeOpen: setIsSchemeDecodeOpen,
    onSetSmartSuggestionOrigin: setSmartSuggestionOrigin,
    onTrackToolEvent: trackCurrentToolEvent,
  });

  const { handleCopySource, handleCopyPreview } = useAppCopyCommands({
    sourceText: input,
    previewText: output,
    isOutputTransforming,
    onTrackToolEvent: trackCurrentToolEvent,
  });

  const {
    isDraggingFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useAppFileDrop({ onDropFiles: openDroppedFiles });

  const { handleApplyTemplate, templateTargetError } = useAppTemplateFillCommand({
    sourceText: input,
    inputRef,
    autoExpandScheme,
    validation,
    isTemplatePanelOpen,
    onSetSourceText: setInput,
    onUpdateActiveFileContent: updateActiveFileContent,
    onSetTemplateApplyQualityDelta: setTemplateApplyQualityDelta,
  });

  const handleAction = useCallback(async (action: ActionType) => {
    if (action === ActionType.AI_FIX) {
      await handleAiRepair();
      return;
    }

    if (action === ActionType.SAVE) {
      await handleToolbarSave();
      return;
    }

    const startedAt = performance.now();
    if (action === ActionType.OPEN) {
      await openFile();
      trackCurrentToolEvent(action, 'file', 'success', startedAt);
    } else if (action === ActionType.NEW_TAB) {
      createNewTab();
      trackCurrentToolEvent(action, 'file', 'success', startedAt);
    }
  }, [
    createNewTab,
    handleAiRepair,
    handleToolbarSave,
    openFile,
    trackCurrentToolEvent,
  ]);

  const { handleSmartSuggestionAction } = useAppSmartSuggestionCommands({
    currentMode: mode,
    sourceText: input,
    onRunAiFix: () => {
      void handleAction(ActionType.AI_FIX);
    },
    onSetMode: setMode,
    onSetHighlightRange: setHighlightRange,
    onOpenSchemeInput: requestSchemeInput,
    onSetSchemePanelOpen: setIsSchemeDecodeOpen,
    onSetTransformReportOpen: setIsTransformReportOpen,
    onSetJsonTreePanelOpen: setIsJsonTreePanelOpen,
    onSetJsonSchemaPanelOpen: setIsJsonSchemaPanelOpen,
    onTrackToolEvent: trackCurrentToolEvent,
  });

  // 处理 Scheme 编辑：将修改后的值应用到 JSON 对应路径
  const handleSchemeEdit = useCallback((jsonPath: string, newValue: string, pointer?: string) => {
    try {
      const parsed: unknown = JSON.parse(output);
      const updatedRoot = pointer !== undefined
        ? setJsonPointerValue(parsed, pointer, newValue)
        : setLegacyJsonPathValue(parsed, jsonPath, newValue);

      // 格式化并触发更新
      const updatedOutput = JSON.stringify(updatedRoot, null, 2);
      handleOutputChange(updatedOutput);

      showSuccess('Scheme 修改已应用');
    } catch (err) {
      console.error('Failed to apply scheme edit:', err);
      showError(getDetailedErrorMessage(err, '应用修改失败'));
    }
  }, [output, handleOutputChange]);

  const handleJsonPathHighlight = useCallback((range: HighlightRange | null) => {
    setHighlightRange(range);
  }, []);

  const handleResetPanelLayout = useCallback(() => {
    resetFloatingPanelLayoutStorage();
    notifyFloatingPanelLayoutReset();
    showSuccess('浮动面板布局已恢复默认');
  }, []);

  const editorUiState = buildAppEditorUiState({
    sourceText: input,
    previewText: output,
    isProcessing,
    isOutputTransforming,
    hasActiveFile: Boolean(activeFileId),
    activeFileHasHandle: Boolean(activeFile?.handle),
    isAutoSaveEnabled,
    hasTransformReportContext: Boolean(transformReportContext),
    isClearSourceConfirmOpen,
    pendingPasteSourceText,
    pendingApplyPreviewText,
    pendingSchemaExampleText,
    pendingSchemeInspectSourceText,
  });
  const handleLocateSourceErrorFromStatus = useCallback(() => {
    if (!sourceErrorLocation) return;
    setActiveEditor('SOURCE');
    setSourceErrorLocateSignal(signal => signal + 1);
  }, [sourceErrorLocation]);

  return (
    <ErrorBoundary>
    <div ref={appRef} className="flex flex-col h-screen bg-editor-bg text-editor-fg font-sans overflow-hidden select-none">

      <AppLazyShellModals
        lazyPanelsLoaded={lazyPanelsLoaded}
        settingsModal={{
          isOpen: isSettingsModalOpen,
          initialTab: settingsInitialTab,
          onClose: () => setIsSettingsModalOpen(false),
          shortcuts,
          onUpdateShortcut: updateShortcut,
          onResetShortcuts: resetShortcuts,
          aiConfig,
          onSaveAIConfig: setAiConfig,
          generalSettings,
          onSaveGeneralSettings: setGeneralSettings,
          onResetPanelLayout: handleResetPanelLayout,
          onExportSettingsBackup: handleExportSettingsBackup,
          onImportSettingsBackup: handleImportSettingsBackup,
        }}
        changelogModal={{
          isOpen: isChangelogModalOpen,
          onClose: handleCloseChangelog,
          sourceMarkdown: changelogSourceMarkdown,
          highlightedVersion: changelogHighlightedVersion,
        }}
      />

      <AppConfirmDialogs
        pendingCloseFileName={pendingCloseFile ? pendingCloseFile.name : null}
        isClearSourceConfirmOpen={isClearSourceConfirmOpen}
        hasPendingPasteSourceText={pendingPasteSourceText !== null}
        hasPendingApplyPreviewText={pendingApplyPreviewText !== null}
        hasPendingSchemaExampleText={pendingSchemaExampleText !== null}
        hasPendingSchemeInspectSourceText={pendingSchemeInspectSourceText !== null}
        editorUiState={editorUiState}
        onConfirmCloseFile={confirmPendingCloseFile}
        onCancelCloseFile={cancelPendingCloseFile}
        onConfirmClearSource={handleConfirmClearSource}
        onCancelClearSource={handleCancelClearSource}
        onConfirmPasteSource={handleConfirmPasteSource}
        onCancelPasteSource={handleCancelPasteSource}
        onConfirmApplyPreviewToSource={handleConfirmApplyPreviewToSource}
        onCancelApplyPreviewToSource={handleCancelApplyPreviewToSource}
        onConfirmApplySchemaExampleToSource={handleConfirmApplySchemaExampleToSource}
        onCancelApplySchemaExampleToSource={handleCancelApplySchemaExampleToSource}
        onConfirmSchemeInspectSource={handleConfirmSchemeInspectSource}
        onCancelSchemeInspectSource={handleCancelSchemeInspectSource}
      />

      {/* 主工作区容器 */}
      <div
        className="flex-1 flex overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >

        <AppActionSidebar
          activeMode={mode}
          onModeChange={handleModeChange}
          onAction={handleAction}
          isProcessing={isProcessing}
          onOpenSettings={handleOpenSettingsPanel}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sidebarWidth={sidebarWidth}
          isResizing={isResizingSidebar}
          onStartResize={startResizingSidebar}
          onResizeKeyDown={handleSidebarResizeKeyDown}
          isJsonPathOpen={isJsonPathPanelOpen}
          isJsonTreeOpen={isJsonTreePanelOpen}
          isJsonCompareOpen={isJsonComparePanelOpen}
          isSchemeDecodeOpen={isSchemeDecodeOpen}
          isTemplateFillOpen={isTemplatePanelOpen}
          isJsonSchemaOpen={isJsonSchemaPanelOpen}
          onToggleJsonPath={handleToggleJsonPath}
          onToggleJsonTree={handleToggleJsonTree}
          onToggleJsonCompare={handleToggleJsonCompare}
          onToggleJsonSchema={handleToggleJsonSchema}
          onToggleSchemeDecode={handleToggleSchemeDecode}
          onToggleTemplateFill={handleToggleTemplateFill}
          smartSuggestion={smartSuggestion}
          smartSuggestionOrigin={smartSuggestionOrigin}
          onSmartSuggestionAction={handleSmartSuggestionAction}
        />

        <AppEditorWorkspace
          input={input}
          output={output}
          activeFile={activeFile}
          activeFileId={activeFileId}
          files={files}
          leftPaneWidthPercent={leftPaneWidthPercent}
          isPaneResizing={isResizingPane}
          isProcessing={isProcessing}
          isOutputTransforming={isOutputTransforming}
          aiRepairSummary={aiRepairSummary}
          sourceValidation={validation}
          previewValidation={previewValidation}
          sourceErrorLocation={sourceErrorLocation}
          previewErrorLocation={previewErrorLocation}
          sourceErrorLocateSignal={sourceErrorLocateSignal}
          jsonSchemaWarning={jsonSchemaWarning}
          jsonSchemaDiagnosticHighlights={jsonSchemaDiagnosticHighlights}
          deepFormatWarning={deepFormatWarning}
          deepFormatInfo={deepFormatInfo}
          hasTransformReportContext={Boolean(transformReportContext)}
          highlightRange={highlightRange}
          editorUiState={editorUiState}
          onInputChange={handleInputChange}
          onOutputChange={handleOutputChange}
          onSourceFocus={() => setActiveEditor('SOURCE')}
          onPreviewFocus={() => setActiveEditor('PREVIEW')}
          onCursorPositionChange={(line, column) => setCursorPosition({ line, column })}
          onTabClick={switchTab}
          onCloseFile={requestCloseFile}
          onNewTab={createNewTab}
          onSaveViewState={saveViewState}
          onSourceAiFix={() => void handleAction(ActionType.AI_FIX)}
          onPasteSource={handlePasteSource}
          onCopySource={handleCopySource}
          onClearSource={handleRequestClearSource}
          onToggleAutoSave={handleToggleAutoSave}
          onOpenTransformReport={() => setIsTransformReportOpen(true)}
          onApplyPreviewToSource={handleRequestApplyPreviewToSource}
          onCopyPreview={handleCopyPreview}
          onSchemeEdit={handleSchemeEdit}
          onPaneResizeMouseDown={startResizingPane}
          onPaneResizeKeyDown={handlePaneResizeKeyDown}
          onCloseAiRepairSummary={() => {
            aiRepairSnapshotRef.current = null;
            setAiRepairSummary(null);
          }}
          onCopyAiRepairSummarySuccess={showSuccess}
          onCopyAiRepairSummaryError={showError}
        />

        <AppLazyToolPanels
          lazyPanelsLoaded={lazyPanelsLoaded}
          jsonPathPanel={{
            jsonData: jsonPathDataSource,
            isDataPreparing: mode === TransformMode.DEEP_FORMAT && isOutputTransforming,
            externalQueryRequest: jsonPathQueryRequest,
            isOpen: isJsonPathPanelOpen,
            onClose: handleCloseJsonPathPanel,
            onHighlightRange: handleJsonPathHighlight,
            onLocateStructure: handleLocateJsonPathResultInStructure,
          }}
          jsonTreePanel={{
            jsonData: jsonPathDataSource,
            isDataPreparing: mode === TransformMode.DEEP_FORMAT && isOutputTransforming,
            isOpen: isJsonTreePanelOpen,
            externalFocusRequest: jsonTreeFocusRequest,
            onClose: () => setIsJsonTreePanelOpen(false),
            onLocatePath: handleLocateJsonPath,
            onOpenSchemeValue: handleOpenSchemeFromStructure,
          }}
          jsonComparePanel={{
            sourceText: input,
            isOpen: isJsonComparePanelOpen,
            onClose: () => setIsJsonComparePanelOpen(false),
            onLocatePath: handleLocateJsonPath,
          }}
          jsonSchemaPanel={{
            jsonData: input,
            isOpen: isJsonSchemaPanelOpen,
            onClose: () => {
              setIsJsonSchemaPanelOpen(false);
              setJsonSchemaValidationResult(null);
            },
            onLocatePath: handleLocateJsonPath,
            onApplyExampleToSource: handleRequestApplySchemaExampleToSource,
            onValidationResult: setJsonSchemaValidationResult,
          }}
          transformReportPanel={{
            isOpen: isTransformReportOpen,
            onClose: () => setIsTransformReportOpen(false),
            context: transformReportContext,
            onLocatePath: handleLocateJsonPath,
            onOpenSchemeValue: handleOpenSchemeFromReport,
            onOpenTemplateFill: handleOpenTemplateFillFromReport,
          }}
          schemePanel={{
            isOpen: isSchemeDecodeOpen,
            onClose: () => setIsSchemeDecodeOpen(false),
            standalone: true,
            initialStandaloneInput: schemeInputRequest?.value,
            initialStandaloneInputKey: schemeInputRequest?.id,
            onApply: (encodedValue: string) => {
              setInput(encodedValue);
              inputRef.current = encodedValue;
              updateActiveFileContent(encodedValue);
            },
            onInspectOriginal: handleInspectSourceFromScheme,
          }}
          templatePanel={{
            isOpen: isTemplatePanelOpen,
            onClose: () => setIsTemplatePanelOpen(false),
            onApplyTemplate: handleApplyTemplate,
            targetError: templateTargetError,
            initialTemplate: templateFillRequest?.template,
            initialTemplateKey: templateFillRequest?.id,
            applyQualityDelta: templateApplyQualityDelta,
          }}
        />

        <AppWorkspaceOverlays
          isResizing={isResizingSidebar || isResizingPane}
          isDraggingFile={isDraggingFile}
        />
      </div>

      {/* 底部状态栏 */}
      <StatusBar
        inputLength={input.length}
        activeContentLength={documentStats.characterCount}
        activeContentByteLength={documentStats.utf8ByteLength}
        totalLines={documentStats.totalLines}
        maxColumns={documentStats.maxColumns}
        isStatsLimited={documentStats.isLimited}
        mode={mode}
        activeFileId={activeFileId}
        files={files}
        isAutoSaveEnabled={isAutoSaveEnabled}
        isSourceLarge={isSourceLarge}
        isOutputTransforming={isOutputTransforming}
        isAiRepairing={isProcessing}
        isAiConfigured={isAiConfigured}
        hasSourceContent={editorUiState.hasSourceContent}
        isSourceJsonCandidate={editorUiState.isSourceJsonCandidate}
        sourceStandaloneDeepFormatKind={editorUiState.sourceStandaloneDeepFormatKind}
        onOpenSourceSchemeInput={handleOpenSourceSchemeInput}
        onOpenChangelog={() => handleOpenChangelog()}
        sourceValidation={validation}
        sourceValidationLocation={sourceErrorLocation}
        onLocateSourceError={handleLocateSourceErrorFromStatus}
        cursorLine={cursorPosition.line}
        cursorColumn={cursorPosition.column}
      />
    </div>
    </ErrorBoundary>
  );
};

export default App;
