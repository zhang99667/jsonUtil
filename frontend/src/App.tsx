
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { showSuccess, showError } from './utils/toast';
import { AppActionSidebar } from './components/AppActionSidebar';
import { AppEditorWorkspace } from './components/AppEditorWorkspace';
import { AppWorkspaceOverlays } from './components/AppWorkspaceOverlays';
import {
  detectLanguage,
  performTransform,
  deepParseWithContext,
  applyTemplate,
  getStandaloneDeepFormatInputKind,
  isStandaloneDeepFormatInput
} from './utils/transformations';
import { TransformMode, ActionType, ValidationResult, AIConfig, HighlightRange, GeneralSettings, TransformContext, type EditorDiagnosticHighlight } from './types';
import { useShortcuts } from './hooks/useShortcuts';
import { useFileSystem } from './hooks/useFileSystem';
import { useAppChunkLoadRecovery } from './hooks/useAppChunkLoadRecovery';
import { useAppLazyPanelWarmup } from './hooks/useAppLazyPanelWarmup';
import { useAppUpdateCheck } from './hooks/useAppUpdateCheck';
import { useAppAsyncTransform } from './hooks/useAppAsyncTransform';
import { useAppFileDrop } from './hooks/useAppFileDrop';
import { useAppAiRepairCommand } from './hooks/useAppAiRepairCommand';
import { useAppCopyCommands } from './hooks/useAppCopyCommands';
import { useAppSaveCommands } from './hooks/useAppSaveCommands';
import { useAppSettingsBackupCommands } from './hooks/useAppSettingsBackupCommands';
import { useAppSmartSuggestionCommands } from './hooks/useAppSmartSuggestionCommands';
import { useAppPreviewOutputSync } from './hooks/useAppPreviewOutputSync';
import {
  useAppSourceReplacementCommands,
  type AppSmartSuggestionOrigin,
} from './hooks/useAppSourceReplacementCommands';
import { APP_CHANGELOG_OPEN_EVENT, type AppChangelogOpenDetail } from './utils/appEvents';
import { useLayout } from './hooks/useLayout';
import { getPaneKeyboardResizePercent, getSidebarKeyboardResizeWidth } from './hooks/layoutKeyboardResize';
import { useOnboardingTour } from './hooks/useOnboardingTour';
import { useFeatureTour, FeatureId } from './hooks/useFeatureTour';
import { AppConfirmDialogs } from './components/AppConfirmDialogs';
import { AppLazyShellModals } from './components/AppLazyShellModals';
import { AppLazyToolPanels } from './components/AppLazyToolPanels';
import ErrorBoundary from './components/ErrorBoundary';
import { StatusBar } from './components/StatusBar';
import {
  createAppLazyPanelLoadState,
  updateAppLazyPanelLoadState,
} from './utils/appLazyPanelLoadState';
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
import type { JsonPathQueryItem } from './utils/jsonPathQuery';
import { getSmartInputSuggestion } from './utils/smartInputSuggestion';
import { buildAppEditorUiState } from './utils/appEditorUiState';
import {
  getContentSizeSummary,
  isPlaceholderFillTemplateJson,
} from './utils/appWorkflowHelpers';
import { setLegacyJsonPathValue } from './utils/appLegacyJsonPath';
import {
  ASYNC_VALIDATION_THRESHOLD,
  DOCUMENT_STATS_SCAN_LIMIT,
} from './utils/appAsyncPolicy';
import {
  getActiveAppDeepFormatResult,
  resolveAppOutputValue,
} from './utils/appAsyncTransformState';

type SettingsTab = 'shortcuts' | 'ai' | 'general';
interface JsonPathQueryRequest {
  id: number;
  query: string;
}

interface JsonTreeFocusRequest {
  id: number;
  path: string;
  pointer: string;
}

interface SchemeInputRequest {
  id: number;
  value: string;
}

interface TemplateFillRequest {
  id: number;
  template: string;
}

type TransformSummaryModule = typeof import('./utils/transformSummary');

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

  const hasUnsavedChanges = useMemo(() => {
    if (files.some(file => file.isDirty)) {
      return true;
    }

    return !activeFileId && input.trim().length > 0;
  }, [files, activeFileId, input]);

  const activeFile = useMemo(
    () => activeFileId ? files.find(file => file.id === activeFileId) || null : null,
    [activeFileId, files]
  );
  const [pendingCloseFileId, setPendingCloseFileId] = useState<string | null>(null);
  const pendingCloseFile = useMemo(
    () => pendingCloseFileId ? files.find(file => file.id === pendingCloseFileId) || null : null,
    [files, pendingCloseFileId]
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const [isJsonPathPanelOpen, setIsJsonPathPanelOpen] = useState(false);
  const [isJsonTreePanelOpen, setIsJsonTreePanelOpen] = useState(false);
  const [isJsonComparePanelOpen, setIsJsonComparePanelOpen] = useState(false);
  const [isJsonSchemaPanelOpen, setIsJsonSchemaPanelOpen] = useState(false);
  const [jsonPathQueryRequest, setJsonPathQueryRequest] = useState<JsonPathQueryRequest | null>(null);
  const [jsonTreeFocusRequest, setJsonTreeFocusRequest] = useState<JsonTreeFocusRequest | null>(null);
  const [schemeInputRequest, setSchemeInputRequest] = useState<SchemeInputRequest | null>(null);
  const [templateFillRequest, setTemplateFillRequest] = useState<TemplateFillRequest | null>(null);
  const jsonPathQueryRequestIdRef = useRef(0);
  const jsonTreeFocusRequestIdRef = useRef(0);
  const schemeInputRequestIdRef = useRef(0);
  const templateFillRequestIdRef = useRef(0);
  const sourceValidationRequestIdRef = useRef(0);
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

  // JSONPath 查询当前 PREVIEW 文本，确保 Worker 返回的高亮范围与右侧编辑器坐标一致
  const jsonPathDataSource = useMemo(() => {
    if (!isJsonPathPanelOpen && !isJsonTreePanelOpen) {
      return '';
    }

    return output;
  }, [output, isJsonPathPanelOpen, isJsonTreePanelOpen]);

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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('shortcuts');
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [changelogSourceMarkdown, setChangelogSourceMarkdown] = useState<string | null>(null);
  const [changelogHighlightedVersion, setChangelogHighlightedVersion] = useState<string | null>(null);
  const [isSchemeDecodeOpen, setIsSchemeDecodeOpen] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [templateApplyQualityDelta, setTemplateApplyQualityDelta] = useState('');
  const [isTransformReportOpen, setIsTransformReportOpen] = useState(false);
  const [lazyPanelsLoaded, setLazyPanelsLoaded] = useState(createAppLazyPanelLoadState);
  const [activeEditor, setActiveEditor] = useState<'SOURCE' | 'PREVIEW' | null>(null);
  const [smartSuggestionOrigin, setSmartSuggestionOrigin] = useState<AppSmartSuggestionOrigin | null>(null);

  // 光标位置状态（用于状态栏显示）
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });

  const [aiConfig, setAiConfig] = useState<AIConfig>(loadAIConfig);

  useEffect(() => {
    setLazyPanelsLoaded(current => updateAppLazyPanelLoadState(current, {
      settings: isSettingsModalOpen,
      changelog: isChangelogModalOpen,
      jsonPath: isJsonPathPanelOpen,
      jsonTree: isJsonTreePanelOpen,
      jsonCompare: isJsonComparePanelOpen,
      jsonSchema: isJsonSchemaPanelOpen,
      scheme: isSchemeDecodeOpen,
      template: isTemplatePanelOpen,
      transformReport: isTransformReportOpen,
    }));
  }, [
    isChangelogModalOpen,
    isJsonComparePanelOpen,
    isJsonPathPanelOpen,
    isJsonSchemaPanelOpen,
    isJsonTreePanelOpen,
    isSchemeDecodeOpen,
    isSettingsModalOpen,
    isTemplatePanelOpen,
    isTransformReportOpen,
  ]);

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

  const handleToggleJsonPath = useCallback(() => {
    const nextOpen = !isJsonPathPanelOpen;
    if (nextOpen && mode !== TransformMode.DEEP_FORMAT) {
      setMode(TransformMode.DEEP_FORMAT);
    }
    setIsJsonPathPanelOpen(nextOpen);
    trackCurrentToolEvent(nextOpen ? 'JSONPATH_OPEN' : 'JSONPATH_CLOSE', 'panel');
  }, [isJsonPathPanelOpen, mode, setIsJsonPathPanelOpen, setMode, trackCurrentToolEvent]);

  const handleToggleJsonTree = useCallback(() => {
    const nextOpen = !isJsonTreePanelOpen;
    if (nextOpen && mode !== TransformMode.DEEP_FORMAT) {
      setMode(TransformMode.DEEP_FORMAT);
    }
    setIsJsonTreePanelOpen(nextOpen);
    trackCurrentToolEvent(nextOpen ? 'STRUCTURE_NAV_OPEN' : 'STRUCTURE_NAV_CLOSE', 'panel');
  }, [isJsonTreePanelOpen, mode, setIsJsonTreePanelOpen, setMode, trackCurrentToolEvent]);

  const handleToggleJsonCompare = useCallback(() => {
    const nextOpen = !isJsonComparePanelOpen;
    setIsJsonComparePanelOpen(nextOpen);
    trackCurrentToolEvent(nextOpen ? 'JSON_COMPARE_OPEN' : 'JSON_COMPARE_CLOSE', 'panel');
  }, [isJsonComparePanelOpen, setIsJsonComparePanelOpen, trackCurrentToolEvent]);

  const handleToggleJsonSchema = useCallback(() => {
    const nextOpen = !isJsonSchemaPanelOpen;
    setIsJsonSchemaPanelOpen(nextOpen);
    trackCurrentToolEvent(nextOpen ? 'SCHEMA_PANEL_OPEN' : 'SCHEMA_PANEL_CLOSE', 'panel');
  }, [isJsonSchemaPanelOpen, setIsJsonSchemaPanelOpen, trackCurrentToolEvent]);

  const handleOpenSettingsPanel = useCallback(() => {
    setSettingsInitialTab('shortcuts');
    setIsSettingsModalOpen(true);
    trackCurrentToolEvent('SETTINGS_OPEN', 'panel');
  }, [setIsSettingsModalOpen, setSettingsInitialTab, trackCurrentToolEvent]);

  const handleLocateJsonPath = useCallback((query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    if (mode !== TransformMode.DEEP_FORMAT) {
      setMode(TransformMode.DEEP_FORMAT);
    }

    setHighlightRange(null);
    setJsonPathQueryRequest({
      id: ++jsonPathQueryRequestIdRef.current,
      query: normalizedQuery,
    });
    setIsJsonPathPanelOpen(true);
    setIsTransformReportOpen(false);
    trackCurrentToolEvent('JSONPATH_LOCATE', 'panel');
  }, [mode, setHighlightRange, setIsJsonPathPanelOpen, setIsTransformReportOpen, setJsonPathQueryRequest, setMode, trackCurrentToolEvent]);

  const handleLocateJsonPathResultInStructure = useCallback((item: JsonPathQueryItem) => {
    setJsonTreeFocusRequest({
      id: ++jsonTreeFocusRequestIdRef.current,
      path: item.path,
      pointer: item.pointer,
    });
    setIsJsonTreePanelOpen(true);
    setIsTransformReportOpen(false);
    trackCurrentToolEvent('STRUCTURE_NAV_LOCATE', 'panel');
  }, [setIsJsonTreePanelOpen, setIsTransformReportOpen, setJsonTreeFocusRequest, trackCurrentToolEvent]);

  const openStandaloneSchemePanel = useCallback((value: string, eventName: string) => {
    if (!value) return;

    setSchemeInputRequest({
      id: ++schemeInputRequestIdRef.current,
      value,
    });
    setIsSchemeDecodeOpen(true);
    setIsTransformReportOpen(false);
    trackCurrentToolEvent(eventName, 'panel');
  }, [setIsSchemeDecodeOpen, setIsTransformReportOpen, setSchemeInputRequest, trackCurrentToolEvent]);

  const handleOpenSchemeFromReport = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_REPORT');
  }, [openStandaloneSchemePanel]);

  const handleOpenSchemeFromStructure = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_STRUCTURE');
    setIsJsonTreePanelOpen(false);
  }, [openStandaloneSchemePanel, setIsJsonTreePanelOpen]);

  const handleOpenSchemeFromSourceStatus = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_SOURCE_STATUS');
  }, [openStandaloneSchemePanel]);

  const handleOpenSourceSchemeInput = useCallback(() => {
    const value = input.trim();
    if (!value || !getStandaloneDeepFormatInputKind(value)) return;

    handleOpenSchemeFromSourceStatus(value);
  }, [handleOpenSchemeFromSourceStatus, input]);

  const handleOpenChangelog = useCallback((detail?: AppChangelogOpenDetail) => {
    setChangelogSourceMarkdown(detail?.changelogMarkdown?.trim() ? detail.changelogMarkdown : null);
    setChangelogHighlightedVersion(detail?.version || null);
    setIsChangelogModalOpen(true);
  }, []);

  const handleCloseChangelog = useCallback(() => {
    setIsChangelogModalOpen(false);
  }, []);

  const handleOpenTemplateFillFromReport = useCallback((template: string) => {
    if (!template) return;

    setTemplateApplyQualityDelta('');
    setTemplateFillRequest({
      id: ++templateFillRequestIdRef.current,
      template,
    });
    setIsTemplatePanelOpen(true);
    setIsTransformReportOpen(false);
    trackCurrentToolEvent('TEMPLATE_OPEN_FROM_REPORT', 'panel');
  }, [setIsTemplatePanelOpen, setIsTransformReportOpen, setTemplateApplyQualityDelta, setTemplateFillRequest, trackCurrentToolEvent]);

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

  const requestCloseFile = useCallback((fileId: string) => {
    const fileToClose = files.find(file => file.id === fileId);
    if (!fileToClose) return;

    if (fileToClose.isDirty) {
      setPendingCloseFileId(fileId);
      return;
    }

    closeFile(fileId);
  }, [closeFile, files, setPendingCloseFileId]);

  const cancelPendingCloseFile = useCallback(() => {
    setPendingCloseFileId(null);
  }, [setPendingCloseFileId]);

  const confirmPendingCloseFile = useCallback(() => {
    if (pendingCloseFileId) {
      closeFile(pendingCloseFileId);
    }
    setPendingCloseFileId(null);
  }, [closeFile, pendingCloseFileId, setPendingCloseFileId]);

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

  useEffect(() => {
    const handleChangelogOpen = (event: Event) => {
      const detail = event instanceof CustomEvent
        ? event.detail as AppChangelogOpenDetail | undefined
        : undefined;
      handleOpenChangelog(detail);
    };

    window.addEventListener(APP_CHANGELOG_OPEN_EVENT, handleChangelogOpen);
    return () => window.removeEventListener(APP_CHANGELOG_OPEN_EVENT, handleChangelogOpen);
  }, [handleOpenChangelog]);

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

  const templateTargetError = useMemo(() => {
    if (!isTemplatePanelOpen) return '';

    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return '请先在 SOURCE 输入合法 JSON';
    }

    if (detectLanguage(trimmedInput) !== 'json') {
      return '当前 SOURCE 不是合法 JSON，无法应用模板';
    }

    if (!validation.isValid) {
      return validation.error
        ? `当前 SOURCE JSON 无效: ${validation.error}`
        : '当前 SOURCE JSON 无效';
    }

    return '';
  }, [input, isTemplatePanelOpen, validation]);


  // 输入变更验证（防抖）
  useEffect(() => {
    let validationTask: ReturnType<typeof startJsonValidation> | null = null;
    const timeoutId = setTimeout(() => {
      if (input && input.trim()) {
        // 预处理：移除零宽空格等不可见字符，避免误报
        const cleanInput = cleanJsonInput(input);
        const requestId = ++sourceValidationRequestIdRef.current;
        validationTask = startJsonValidation(cleanInput, ASYNC_VALIDATION_THRESHOLD, { requireContainer: true });
        validationTask.promise.then(result => {
          if (requestId === sourceValidationRequestIdRef.current) {
            setValidation(result);
          }
        });
      } else {
        sourceValidationRequestIdRef.current++;
        setValidation({ isValid: true });
      }
    }, 500);
    return () => {
      clearTimeout(timeoutId);
      validationTask?.cancel();
    };
  }, [input]);

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

  const handleOpenAiSettings = useCallback(() => {
    setSettingsInitialTab('ai');
    setIsSettingsModalOpen(true);
  }, [setIsSettingsModalOpen, setSettingsInitialTab]);

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

  // 模板填充处理
  const buildCurrentQualitySnapshot = useCallback((source: string, summaryModule: TransformSummaryModule) => {
    const {
      buildTransformContextReport,
      buildTransformQualitySnapshot,
      buildTransformReportView,
    } = summaryModule;
    const { context } = deepParseWithContext(source, {
      autoExpandScheme,
    });
    const report = buildTransformContextReport(context);
    return buildTransformQualitySnapshot(report, buildTransformReportView(report, ''), '');
  }, [autoExpandScheme]);

  const handleApplyTemplate = useCallback(async (templateJson: string) => {
    try {
      const sourceBeforeApply = input;
      const shouldBuildQualityDelta = isPlaceholderFillTemplateJson(templateJson);
      const summaryModule = shouldBuildQualityDelta
        ? await import('./utils/transformSummary')
        : null;
      if (summaryModule && inputRef.current !== sourceBeforeApply) {
        setTemplateApplyQualityDelta('');
        showError('内容已变化，请重新应用模板');
        return;
      }
      const beforeSnapshot = shouldBuildQualityDelta
        ? buildCurrentQualitySnapshot(sourceBeforeApply, summaryModule)
        : null;
      const merged = applyTemplate(sourceBeforeApply, templateJson);
      if (beforeSnapshot) {
        const afterSnapshot = buildCurrentQualitySnapshot(merged, summaryModule);
        setTemplateApplyQualityDelta(summaryModule.formatTransformQualitySnapshotDeltaText(beforeSnapshot, afterSnapshot));
      } else {
        setTemplateApplyQualityDelta('');
      }
      setInput(merged);
      inputRef.current = merged;
      updateActiveFileContent(merged);
      showSuccess(beforeSnapshot ? '占位符已回填，质量对比已更新' : '模板已应用');
    } catch (e: unknown) {
      setTemplateApplyQualityDelta('');
      const message = e instanceof Error ? e.message : '模板应用失败';
      showError(message);
    }
  }, [autoExpandScheme, buildCurrentQualitySnapshot, input, updateActiveFileContent]);

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
    schemeInputRequestIdRef,
    onRunAiFix: () => {
      void handleAction(ActionType.AI_FIX);
    },
    onSetMode: setMode,
    onSetHighlightRange: setHighlightRange,
    onSetSchemeInputRequest: setSchemeInputRequest,
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
          onToggleSchemeDecode={() => {
            const nextOpen = !isSchemeDecodeOpen;
            setIsSchemeDecodeOpen(nextOpen);
            trackCurrentToolEvent(nextOpen ? 'SCHEME_PANEL_OPEN' : 'SCHEME_PANEL_CLOSE', 'panel');
          }}
          onToggleTemplateFill={() => {
            const nextOpen = !isTemplatePanelOpen;
            setTemplateApplyQualityDelta('');
            setIsTemplatePanelOpen(nextOpen);
            trackCurrentToolEvent(nextOpen ? 'TEMPLATE_PANEL_OPEN' : 'TEMPLATE_PANEL_CLOSE', 'panel');
          }}
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
            onClose: () => {
              setIsJsonPathPanelOpen(false);
              setHighlightRange(null);
            },
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
