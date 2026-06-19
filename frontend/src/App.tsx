
import React, { lazy, Suspense, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { showSuccess, showError } from './utils/toast';
import { ActionPanel } from './components/ActionPanel';
import { CodeEditor } from './components/Editor';
import {
  detectLanguage,
  performTransform,
  performTransformAsync,
  performInverseTransform,
  deepParseWithContext,
  inverseWithContext,
  applyTemplate,
  getStandaloneDeepFormatInputKind,
  isStandaloneDeepFormatInput
} from './utils/transformations';
import { TransformMode, ActionType, ValidationResult, AIConfig, HighlightRange, GeneralSettings, TransformContext, TransformResult, type EditorDiagnosticHighlight } from './types';
import { useShortcuts } from './hooks/useShortcuts';
import { useFileSystem } from './hooks/useFileSystem';
import { useAppUpdateCheck } from './hooks/useAppUpdateCheck';
import { APP_CHANGELOG_OPEN_EVENT, type AppChangelogOpenDetail } from './utils/appEvents';
import {
  LEFT_PANE_MAX_PERCENT,
  LEFT_PANE_MIN_PERCENT,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  clampLayoutValue,
  useLayout,
} from './hooks/useLayout';
import { useOnboardingTour } from './hooks/useOnboardingTour';
import { useFeatureTour, FeatureId } from './hooks/useFeatureTour';
import ErrorBoundary from './components/ErrorBoundary';
import { ConfirmDialog } from './components/ConfirmDialog';
import { StatusBar } from './components/StatusBar';
import { formatByteSize, getDocumentStats } from './utils/documentStats';
import type { AiRepairSummary } from './utils/aiRepairSummary';
import { copyText, getClipboardErrorMessage, readClipboardText } from './utils/clipboard';
import { getDetailedErrorMessage, isAbortError } from './utils/errors';
import { safeSetStorageItem } from './utils/storage';
import { AI_CONFIG_STORAGE_KEY, GENERAL_SETTINGS_STORAGE_KEY, loadAIConfig, loadGeneralSettings } from './utils/appSettings';
import { notifyFloatingPanelLayoutReset, resetFloatingPanelLayoutStorage } from './utils/panelLayout';
import { setJsonPointerValue } from './utils/jsonPointer';
import {
  cleanJsonInput,
  getJsonValidationErrorLocation,
  isJsonContainerCandidate,
  startJsonValidation,
  validateJsonForEditor,
} from './utils/jsonValidation';
import {
  buildTransformContextReport,
  buildTransformQualitySnapshot,
  buildTransformReportView,
  formatTransformContextSummary,
  formatTransformQualitySnapshotDeltaText,
} from './utils/transformSummary';
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
import {
  getSmartInputSuggestion,
  getSmartSuggestionMode,
  type SmartSuggestionActionId,
} from './utils/smartInputSuggestion';

const ASYNC_TRANSFORM_THRESHOLD = 200_000;
const ASYNC_VALIDATION_THRESHOLD = 200_000;
const DOCUMENT_STATS_SCAN_LIMIT = 300_000;
const ASYNC_TRANSFORM_PLACEHOLDER = '// 正在处理，请稍候...';
const SIDEBAR_KEYBOARD_RESIZE_STEP = 16;
const PANE_KEYBOARD_RESIZE_STEP = 5;
const ASYNC_TRANSFORM_MODES = new Set<TransformMode>([
  TransformMode.FORMAT,
  TransformMode.DEEP_FORMAT,
  TransformMode.MINIFY,
  TransformMode.SORT_KEYS,
  TransformMode.JSON_TO_TYPESCRIPT,
]);

const getCopySuccessMessage = (label: string, content: string): string => {
  const stats = getDocumentStats(content);
  return `已复制${label}（${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}）`;
};

const getContentSizeSummary = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};

const getSourceUpdateSuccessMessage = (message: string, content: string): string => (
  `${message}（${getContentSizeSummary(content)}）`
);

const isStandaloneSchemeInput = (value: string): boolean => {
  return isStandaloneDeepFormatInput(value);
};

const LazySchemeViewerModal = lazy(() => import('./components/SchemeViewerModal').then(module => ({
  default: module.SchemeViewerModal,
})));

const LazyJsonPathPanel = lazy(() => import('./components/JsonPathPanel').then(module => ({
  default: module.JsonPathPanel,
})));

const LazyJsonTreePanel = lazy(() => import('./components/JsonTreePanel').then(module => ({
  default: module.JsonTreePanel,
})));

const LazyJsonComparePanel = lazy(() => import('./components/JsonComparePanel').then(module => ({
  default: module.JsonComparePanel,
})));

const LazyJsonSchemaPanel = lazy(() => import('./components/JsonSchemaPanel').then(module => ({
  default: module.JsonSchemaPanel,
})));

const LazyTemplateFillPanel = lazy(() => import('./components/TemplateFillPanel').then(module => ({
  default: module.TemplateFillPanel,
})));

const LazyUnifiedSettingsModal = lazy(() => import('./components/UnifiedSettingsModal').then(module => ({
  default: module.UnifiedSettingsModal,
})));

const LazyAiRepairSummaryBanner = lazy(() => import('./components/AiRepairSummaryBanner').then(module => ({
  default: module.AiRepairSummaryBanner,
})));

const LazyTransformReportPanel = lazy(() => import('./components/TransformReportPanel').then(module => ({
  default: module.TransformReportPanel,
})));

const LazyChangelogModal = lazy(() => import('./components/ChangelogModal').then(module => ({
  default: module.ChangelogModal,
})));

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

interface AsyncTransformResult {
  input: string;
  mode: TransformMode;
  autoExpandScheme: boolean;
  output: string;
  context?: TransformContext;
}

const PLACEHOLDER_FILL_TEMPLATE_KIND = 'json-helper-runtime-placeholder-fill-template';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isPlaceholderFillTemplateJson = (templateJson: string): boolean => {
  try {
    const parsed = JSON.parse(templateJson) as unknown;
    return isRecord(parsed) && parsed.kind === PLACEHOLDER_FILL_TEMPLATE_KIND;
  } catch {
    return false;
  }
};

const setLegacyJsonPathValue = (root: unknown, jsonPath: string, value: string): unknown => {
  const pathParts = jsonPath
    .replace(/^\$\.?/, '')
    .split(/\.|\[|\]/)
    .filter(p => p !== '');

  let current = root as Record<string, unknown> | unknown[];
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    const index = parseInt(part, 10);
    current = (isNaN(index)
      ? (current as Record<string, unknown>)[part]
      : (current as unknown[])[index]) as Record<string, unknown> | unknown[];
  }

  const lastPart = pathParts[pathParts.length - 1];
  const lastIndex = parseInt(lastPart, 10);
  if (isNaN(lastIndex)) {
    (current as Record<string, unknown>)[lastPart] = value;
  } else {
    (current as unknown[])[lastIndex] = value;
  }

  return root;
};

const App: React.FC = () => {
  // 核心状态：输入源
  const [input, setInput] = useState<string>('');

  // 使用 Ref 存储最新输入值，避免预览编辑时的竞态条件
  const inputRef = useRef<string>('');

  // 使用 Ref 阻断输出更新引发的循环更新
  const isUpdatingFromOutput = useRef<boolean>(false);

  // 使用 Ref 暂存待处理的输出值
  const pendingOutputValue = useRef<string>('');

  // 输出变更防抖定时器
  const outputChangeTimer = useRef<NodeJS.Timeout | null>(null);

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
    const keyboardStep = event.shiftKey ? SIDEBAR_KEYBOARD_RESIZE_STEP * 2 : SIDEBAR_KEYBOARD_RESIZE_STEP;
    let nextWidth: number | null = null;

    if (event.key === 'ArrowLeft') nextWidth = sidebarWidth - keyboardStep;
    if (event.key === 'ArrowRight') nextWidth = sidebarWidth + keyboardStep;
    if (event.key === 'Home') nextWidth = SIDEBAR_MIN_WIDTH;
    if (event.key === 'End') nextWidth = SIDEBAR_MAX_WIDTH;
    if (nextWidth === null) return;

    event.preventDefault();
    setSidebarWidth(clampLayoutValue(nextWidth, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH));
  }, [setSidebarWidth, sidebarWidth]);

  const handlePaneResizeKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const keyboardStep = event.shiftKey ? PANE_KEYBOARD_RESIZE_STEP * 2 : PANE_KEYBOARD_RESIZE_STEP;
    let nextPercent: number | null = null;

    if (event.key === 'ArrowLeft') nextPercent = leftPaneWidthPercent - keyboardStep;
    if (event.key === 'ArrowRight') nextPercent = leftPaneWidthPercent + keyboardStep;
    if (event.key === 'Home') nextPercent = LEFT_PANE_MIN_PERCENT;
    if (event.key === 'End') nextPercent = LEFT_PANE_MAX_PERCENT;
    if (nextPercent === null) return;

    event.preventDefault();
    setLeftPaneWidthPercent(clampLayoutValue(nextPercent, LEFT_PANE_MIN_PERCENT, LEFT_PANE_MAX_PERCENT));
  }, [leftPaneWidthPercent, setLeftPaneWidthPercent]);

  // 文件系统状态 (Hook) - 移到前面，因为 output 需要使用 activeFileId 和 setFiles
  const {
    files, setFiles, activeFileId, isAutoSaveEnabled, setIsAutoSaveEnabled,
    createNewTab, openFile, openDroppedFiles, saveFile, saveSourceAs, closeFile, switchTab, updateActiveFileContent,
    saveViewState
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
  const [isClearSourceConfirmOpen, setIsClearSourceConfirmOpen] = useState(false);
  const [pendingPasteSourceText, setPendingPasteSourceText] = useState<string | null>(null);
  const [pendingApplyPreviewText, setPendingApplyPreviewText] = useState<string | null>(null);
  const [pendingSchemaExampleText, setPendingSchemaExampleText] = useState<string | null>(null);
  const [pendingSchemeInspectSourceText, setPendingSchemeInspectSourceText] = useState<string | null>(null);

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
  const [hasLoadedJsonPathPanel, setHasLoadedJsonPathPanel] = useState(false);
  const [isJsonTreePanelOpen, setIsJsonTreePanelOpen] = useState(false);
  const [hasLoadedJsonTreePanel, setHasLoadedJsonTreePanel] = useState(false);
  const [isJsonComparePanelOpen, setIsJsonComparePanelOpen] = useState(false);
  const [hasLoadedJsonComparePanel, setHasLoadedJsonComparePanel] = useState(false);
  const [isJsonSchemaPanelOpen, setIsJsonSchemaPanelOpen] = useState(false);
  const [hasLoadedJsonSchemaPanel, setHasLoadedJsonSchemaPanel] = useState(false);
  const [jsonPathQueryRequest, setJsonPathQueryRequest] = useState<JsonPathQueryRequest | null>(null);
  const [jsonTreeFocusRequest, setJsonTreeFocusRequest] = useState<JsonTreeFocusRequest | null>(null);
  const [schemeInputRequest, setSchemeInputRequest] = useState<SchemeInputRequest | null>(null);
  const [templateFillRequest, setTemplateFillRequest] = useState<TemplateFillRequest | null>(null);
  const [asyncTransformResult, setAsyncTransformResult] = useState<AsyncTransformResult | null>(null);
  const [isOutputTransforming, setIsOutputTransforming] = useState(false);
  const transformRequestIdRef = useRef(0);
  const jsonPathQueryRequestIdRef = useRef(0);
  const jsonTreeFocusRequestIdRef = useRef(0);
  const schemeInputRequestIdRef = useRef(0);
  const templateFillRequestIdRef = useRef(0);
  const sourceValidationRequestIdRef = useRef(0);
  const previewValidationRequestIdRef = useRef(0);
  const outputSyncRequestIdRef = useRef(0);
  const aiRepairSnapshotRef = useRef<string | null>(null);
  const autoExpandScheme = generalSettings.autoExpandSchemeInDeepFormat;
  const shouldUseTransformWorker = (
    ASYNC_TRANSFORM_MODES.has(mode) &&
    input.length >= ASYNC_TRANSFORM_THRESHOLD &&
    !isUpdatingFromOutput.current
  );
  const shouldUseDynamicTransform = (
    mode === TransformMode.JSON_TO_TYPESCRIPT &&
    input.trim().length > 0 &&
    !isUpdatingFromOutput.current
  );
  const shouldUseAsyncTransform = shouldUseTransformWorker || shouldUseDynamicTransform;

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

  useEffect(() => {
    if (!shouldUseAsyncTransform) {
      setIsOutputTransforming(false);
      setAsyncTransformResult(null);
      return;
    }

    const requestId = ++transformRequestIdRef.current;
    setIsOutputTransforming(true);
    setAsyncTransformResult(null);

    if (!shouldUseTransformWorker) {
      let isCancelled = false;
      performTransformAsync(input, mode)
        .then(output => {
          if (isCancelled || transformRequestIdRef.current !== requestId) return;
          setAsyncTransformResult({
            input,
            mode,
            autoExpandScheme,
            output,
          });
          setIsOutputTransforming(false);
        })
        .catch(error => {
          if (isCancelled || transformRequestIdRef.current !== requestId) return;
          console.warn('异步转换处理失败:', error);
          setAsyncTransformResult({
            input,
            mode,
            autoExpandScheme,
            output: input,
          });
          setIsOutputTransforming(false);
        });

      return () => {
        isCancelled = true;
      };
    }

    const worker = new Worker(new URL('./workers/transform.worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent<{
      id: number;
      output: string;
      context?: TransformContext;
      error?: string;
    }>) => {
      if (event.data.id !== requestId || transformRequestIdRef.current !== requestId) return;
      if (event.data.error) {
        console.warn('大文件转换 Worker 处理失败:', event.data.error);
      }

      setAsyncTransformResult({
        input,
        mode,
        autoExpandScheme,
        output: event.data.output,
        context: event.data.context,
      });
      setIsOutputTransforming(false);
    };

    worker.onerror = (event) => {
      if (transformRequestIdRef.current !== requestId) return;
      console.warn('大文件转换 Worker 运行失败:', event.message);
      setAsyncTransformResult({
        input,
        mode,
        autoExpandScheme,
        output: input,
      });
      setIsOutputTransforming(false);
    };

    worker.postMessage({
      id: requestId,
      input,
      mode,
      options: { autoExpandScheme },
    });

    return () => {
      worker.terminate();
    };
  }, [input, mode, autoExpandScheme, shouldUseAsyncTransform, shouldUseTransformWorker]);

  const currentAsyncTransformResult = useMemo(() => {
    if (
      asyncTransformResult &&
      asyncTransformResult.input === input &&
      asyncTransformResult.mode === mode &&
      asyncTransformResult.autoExpandScheme === autoExpandScheme
    ) {
      return asyncTransformResult;
    }
    return null;
  }, [asyncTransformResult, input, mode, autoExpandScheme]);

  const activeDeepFormatResult = useMemo<TransformResult | null>(() => {
    if (syncDeepFormatResult) {
      return syncDeepFormatResult;
    }
    if (mode === TransformMode.DEEP_FORMAT && currentAsyncTransformResult?.context) {
      return {
        output: currentAsyncTransformResult.output,
        context: currentAsyncTransformResult.context,
      };
    }
    return null;
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
    // 若处于输出编辑状态，优先返回暂存值以避免覆盖用户输入
    if (isUpdatingFromOutput.current && pendingOutputValue.current) {
      return pendingOutputValue.current;
    }

    // 深度格式化模式：使用预计算的结果
    if (mode === TransformMode.DEEP_FORMAT && activeDeepFormatResult) {
      if (!isUpdatingFromOutput.current) {
        pendingOutputValue.current = '';
      }
      return activeDeepFormatResult.output;
    }

    if (shouldUseAsyncTransform) {
      if (currentAsyncTransformResult) {
        if (!isUpdatingFromOutput.current) {
          pendingOutputValue.current = '';
        }
        return currentAsyncTransformResult.output;
      }
      return ASYNC_TRANSFORM_PLACEHOLDER;
    }

    const result = performTransform(input, mode);
    if (!isUpdatingFromOutput.current) {
      pendingOutputValue.current = '';
    }
    return result;
  }, [input, mode, activeDeepFormatResult, shouldUseAsyncTransform, currentAsyncTransformResult]);

  // JSONPath 查询当前 PREVIEW 文本，确保 Worker 返回的高亮范围与右侧编辑器坐标一致
  const jsonPathDataSource = useMemo(() => {
    if (!isJsonPathPanelOpen && !isJsonTreePanelOpen) {
      return '';
    }

    return output;
  }, [output, isJsonPathPanelOpen, isJsonTreePanelOpen]);

  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });
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
  const [hasLoadedSettingsModal, setHasLoadedSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('shortcuts');
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [hasLoadedChangelogModal, setHasLoadedChangelogModal] = useState(false);
  const [changelogSourceMarkdown, setChangelogSourceMarkdown] = useState<string | null>(null);
  const [changelogHighlightedVersion, setChangelogHighlightedVersion] = useState<string | null>(null);
  const [isSchemeDecodeOpen, setIsSchemeDecodeOpen] = useState(false);
  const [hasLoadedSchemePanel, setHasLoadedSchemePanel] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [hasLoadedTemplatePanel, setHasLoadedTemplatePanel] = useState(false);
  const [templateApplyQualityDelta, setTemplateApplyQualityDelta] = useState('');
  const [isTransformReportOpen, setIsTransformReportOpen] = useState(false);
  const [hasLoadedTransformReportPanel, setHasLoadedTransformReportPanel] = useState(false);
  const [activeEditor, setActiveEditor] = useState<'SOURCE' | 'PREVIEW' | null>(null);

  // 光标位置状态（用于状态栏显示）
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });

  // 拖拽文件状态
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);

  const [aiConfig, setAiConfig] = useState<AIConfig>(loadAIConfig);

  useEffect(() => {
    if (isSettingsModalOpen) {
      setHasLoadedSettingsModal(true);
    }
  }, [isSettingsModalOpen]);

  useEffect(() => {
    if (isChangelogModalOpen) {
      setHasLoadedChangelogModal(true);
    }
  }, [isChangelogModalOpen]);

  useEffect(() => {
    if (isJsonPathPanelOpen) {
      setHasLoadedJsonPathPanel(true);
    }
  }, [isJsonPathPanelOpen]);

  useEffect(() => {
    if (isJsonTreePanelOpen) {
      setHasLoadedJsonTreePanel(true);
    }
  }, [isJsonTreePanelOpen]);

  useEffect(() => {
    if (isJsonComparePanelOpen) {
      setHasLoadedJsonComparePanel(true);
    }
  }, [isJsonComparePanelOpen]);

  useEffect(() => {
    if (isJsonSchemaPanelOpen) {
      setHasLoadedJsonSchemaPanel(true);
    }
  }, [isJsonSchemaPanelOpen]);

  useEffect(() => {
    if (isTemplatePanelOpen) {
      setHasLoadedTemplatePanel(true);
    }
  }, [isTemplatePanelOpen]);

  useEffect(() => {
    if (isSchemeDecodeOpen) {
      setHasLoadedSchemePanel(true);
    }
  }, [isSchemeDecodeOpen]);

  useEffect(() => {
    if (isTransformReportOpen) {
      setHasLoadedTransformReportPanel(true);
    }
  }, [isTransformReportOpen]);

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

  // 统一的保存处理逻辑
  const handleSaveShortcut = useCallback(async () => {
    const startedAt = performance.now();
    if (activeEditor === 'PREVIEW' && isOutputTransforming) {
      showError('预览仍在处理，请稍后再保存');
      trackCurrentToolEvent('SAVE_SHORTCUT', 'file', 'skipped', startedAt);
      return;
    }

    let success = false;
    if (activeFileId) {
      // 如果已打开文件，根据焦点保存不同内容到该文件
      if (activeEditor === 'PREVIEW') {
        // Preview 聚焦：保存 Preview 内容到文件
        success = await saveFile(output);
        if (success) showSuccess("已将 PREVIEW 内容保存到文件");
      } else {
        // Source 聚焦：保存 Source 内容到文件
        success = await saveFile(); // 默认保存 input
        if (success) showSuccess("已将 SOURCE 内容保存到文件");
      }
    } else {
      // 未打开文件：另存为
      if (activeEditor === 'PREVIEW') {
        success = await savePreview(); // 另存为 Preview
      } else {
        success = await saveSourceAs(); // 另存为 Source
        if (success) showSuccess("已另存为源文件");
      }
    }
    trackCurrentToolEvent('SAVE_SHORTCUT', 'file', success ? 'success' : 'skipped', startedAt);
  }, [activeFileId, activeEditor, output, saveFile, saveSourceAs, isOutputTransforming, trackCurrentToolEvent]);

  const handleModeChange = useCallback((nextMode: TransformMode) => {
    setMode(nextMode);
    trackCurrentToolEvent(nextMode, 'transform_mode');
  }, [trackCurrentToolEvent]);

  const handleToggleJsonPath = useCallback(() => {
    const nextOpen = !isJsonPathPanelOpen;
    if (nextOpen && mode !== TransformMode.DEEP_FORMAT) {
      setMode(TransformMode.DEEP_FORMAT);
    }
    setIsJsonPathPanelOpen(nextOpen);
    trackCurrentToolEvent(nextOpen ? 'JSONPATH_OPEN' : 'JSONPATH_CLOSE', 'panel');
  }, [isJsonPathPanelOpen, mode, trackCurrentToolEvent]);

  const handleToggleJsonTree = useCallback(() => {
    const nextOpen = !isJsonTreePanelOpen;
    if (nextOpen && mode !== TransformMode.DEEP_FORMAT) {
      setMode(TransformMode.DEEP_FORMAT);
    }
    setIsJsonTreePanelOpen(nextOpen);
    trackCurrentToolEvent(nextOpen ? 'STRUCTURE_NAV_OPEN' : 'STRUCTURE_NAV_CLOSE', 'panel');
  }, [isJsonTreePanelOpen, mode, trackCurrentToolEvent]);

  const handleToggleJsonCompare = useCallback(() => {
    const nextOpen = !isJsonComparePanelOpen;
    setIsJsonComparePanelOpen(nextOpen);
    trackCurrentToolEvent(nextOpen ? 'JSON_COMPARE_OPEN' : 'JSON_COMPARE_CLOSE', 'panel');
  }, [isJsonComparePanelOpen, trackCurrentToolEvent]);

  const handleToggleJsonSchema = useCallback(() => {
    const nextOpen = !isJsonSchemaPanelOpen;
    setIsJsonSchemaPanelOpen(nextOpen);
    trackCurrentToolEvent(nextOpen ? 'SCHEMA_PANEL_OPEN' : 'SCHEMA_PANEL_CLOSE', 'panel');
  }, [isJsonSchemaPanelOpen, trackCurrentToolEvent]);

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
  }, [mode, trackCurrentToolEvent]);

  const handleLocateJsonPathResultInStructure = useCallback((item: JsonPathQueryItem) => {
    setJsonTreeFocusRequest({
      id: ++jsonTreeFocusRequestIdRef.current,
      path: item.path,
      pointer: item.pointer,
    });
    setIsJsonTreePanelOpen(true);
    setIsTransformReportOpen(false);
    trackCurrentToolEvent('STRUCTURE_NAV_LOCATE', 'panel');
  }, [trackCurrentToolEvent]);

  const openStandaloneSchemePanel = useCallback((value: string, eventName: string) => {
    if (!value) return;

    setSchemeInputRequest({
      id: ++schemeInputRequestIdRef.current,
      value,
    });
    setIsSchemeDecodeOpen(true);
    setIsTransformReportOpen(false);
    trackCurrentToolEvent(eventName, 'panel');
  }, [trackCurrentToolEvent]);

  const handleOpenSchemeFromReport = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_REPORT');
  }, [openStandaloneSchemePanel]);

  const handleOpenSchemeFromStructure = useCallback((value: string) => {
    openStandaloneSchemePanel(value, 'SCHEME_OPEN_FROM_STRUCTURE');
    setIsJsonTreePanelOpen(false);
  }, [openStandaloneSchemePanel]);

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
  }, [trackCurrentToolEvent]);

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
  }, [closeFile, files]);

  const cancelPendingCloseFile = useCallback(() => {
    setPendingCloseFileId(null);
  }, []);

  const confirmPendingCloseFile = useCallback(() => {
    if (pendingCloseFileId) {
      closeFile(pendingCloseFileId);
    }
    setPendingCloseFileId(null);
  }, [closeFile, pendingCloseFileId]);

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

  // 用户引导 (Hook)
  useOnboardingTour();

  // 生产环境检测新版本，避免长时间打开的页面停留在旧包
  useAppUpdateCheck();

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
  const smartSuggestion = useMemo(() => getSmartInputSuggestion(input), [input]);

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
    if (aiRepairSnapshotRef.current !== cleanVal) {
      aiRepairSnapshotRef.current = null;
      setAiRepairSummary(null);
    }
    setInput(cleanVal);
    if (mode === TransformMode.NONE && isStandaloneSchemeInput(cleanVal)) {
      setMode(TransformMode.DEEP_FORMAT);
    }

    // 同步更新 Ref 状态
    inputRef.current = cleanVal;

    // 更新活动文件内容缓存
    updateActiveFileContent(cleanVal);

  }, [mode, updateActiveFileContent]);

  const applySchemeInspectSourceText = useCallback((text: string, successMessage: string) => {
    handleInputChange(text);
    setMode(TransformMode.DEEP_FORMAT);
    setHighlightRange(null);
    setIsJsonPathPanelOpen(false);
    setIsTransformReportOpen(true);
    setIsSchemeDecodeOpen(false);
    showSuccess(getSourceUpdateSuccessMessage(successMessage, text));
  }, [handleInputChange]);

  const handleInspectSourceFromScheme = useCallback((value: string) => {
    const sourceText = value;
    const startedAt = performance.now();
    if (!sourceText.trim()) {
      showError('Scheme 原始值为空，暂无可排查内容');
      trackCurrentToolEvent('SCHEME_INSPECT_SOURCE', 'panel', 'skipped', startedAt);
      return;
    }

    if (sourceText === input) {
      setMode(TransformMode.DEEP_FORMAT);
      setHighlightRange(null);
      setIsJsonPathPanelOpen(false);
      setIsTransformReportOpen(true);
      setIsSchemeDecodeOpen(false);
      showSuccess('Scheme 原始值已在 SOURCE 中，已打开深度解析报告');
      trackCurrentToolEvent('SCHEME_INSPECT_SOURCE', 'panel', 'skipped', startedAt);
      return;
    }

    if (input.trim()) {
      setPendingSchemeInspectSourceText(sourceText);
      trackCurrentToolEvent('SCHEME_INSPECT_SOURCE', 'panel', 'skipped', startedAt);
      return;
    }

    applySchemeInspectSourceText(sourceText, '已用 Scheme 原始值开始排查');
    trackCurrentToolEvent('SCHEME_INSPECT_SOURCE', 'panel', 'success', startedAt);
  }, [applySchemeInspectSourceText, input, trackCurrentToolEvent]);

  const handleConfirmSchemeInspectSource = useCallback(() => {
    if (pendingSchemeInspectSourceText === null) return;

    const startedAt = performance.now();
    applySchemeInspectSourceText(pendingSchemeInspectSourceText, '已用 Scheme 原始值替换 SOURCE 并开始排查');
    setPendingSchemeInspectSourceText(null);
    trackCurrentToolEvent('SCHEME_INSPECT_SOURCE', 'panel', 'success', startedAt);
  }, [applySchemeInspectSourceText, pendingSchemeInspectSourceText, trackCurrentToolEvent]);

  const handleCancelSchemeInspectSource = useCallback(() => {
    const startedAt = performance.now();
    setPendingSchemeInspectSourceText(null);
    trackCurrentToolEvent('SCHEME_INSPECT_SOURCE', 'panel', 'cancelled', startedAt);
  }, [trackCurrentToolEvent]);

  const handleCopySource = useCallback(async () => {
    const startedAt = performance.now();
    if (!input.trim()) {
      showError('源内容为空，暂无可复制内容');
      trackCurrentToolEvent('SOURCE_COPY', 'editor', 'skipped', startedAt);
      return;
    }

    try {
      await copyText(input);
      showSuccess(getCopySuccessMessage('源内容', input));
      trackCurrentToolEvent('SOURCE_COPY', 'editor', 'success', startedAt);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制源内容失败'));
      trackCurrentToolEvent('SOURCE_COPY', 'editor', 'error', startedAt);
    }
  }, [input, trackCurrentToolEvent]);

  const handleCopyPreview = useCallback(async () => {
    const startedAt = performance.now();
    if (isOutputTransforming) {
      showError('预览仍在处理，请稍后复制');
      trackCurrentToolEvent('PREVIEW_COPY', 'editor', 'skipped', startedAt);
      return;
    }

    if (!output.trim()) {
      showError('预览内容为空，暂无可复制内容');
      trackCurrentToolEvent('PREVIEW_COPY', 'editor', 'skipped', startedAt);
      return;
    }

    try {
      await copyText(output);
      showSuccess(getCopySuccessMessage('预览内容', output));
      trackCurrentToolEvent('PREVIEW_COPY', 'editor', 'success', startedAt);
    } catch (error) {
      showError(getClipboardErrorMessage(error));
      trackCurrentToolEvent('PREVIEW_COPY', 'editor', 'error', startedAt);
    }
  }, [isOutputTransforming, output, trackCurrentToolEvent]);

  const applySourceTextFromClipboard = useCallback((text: string, successMessage: string) => {
    handleInputChange(text);
    setHighlightRange(null);
    showSuccess(getSourceUpdateSuccessMessage(successMessage, text));
  }, [handleInputChange]);

  const handlePasteSource = useCallback(async () => {
    const startedAt = performance.now();

    try {
      const clipboardText = await readClipboardText();
      if (!clipboardText) {
        showError('剪贴板为空，暂无可粘贴内容');
        trackCurrentToolEvent('SOURCE_PASTE', 'editor', 'skipped', startedAt);
        return;
      }

      if (clipboardText === input) {
        showSuccess('剪贴板内容已在 SOURCE 中');
        trackCurrentToolEvent('SOURCE_PASTE', 'editor', 'skipped', startedAt);
        return;
      }

      if (input.trim()) {
        setPendingPasteSourceText(clipboardText);
        return;
      }

      applySourceTextFromClipboard(clipboardText, '已从剪贴板粘贴到 SOURCE');
      trackCurrentToolEvent('SOURCE_PASTE', 'editor', 'success', startedAt);
    } catch (error) {
      showError(getClipboardErrorMessage(error, '读取剪贴板失败'));
      trackCurrentToolEvent('SOURCE_PASTE', 'editor', 'error', startedAt);
    }
  }, [applySourceTextFromClipboard, input, trackCurrentToolEvent]);

  const handleConfirmPasteSource = useCallback(() => {
    if (pendingPasteSourceText === null) return;

    const startedAt = performance.now();
    applySourceTextFromClipboard(pendingPasteSourceText, '已用剪贴板内容替换 SOURCE');
    setPendingPasteSourceText(null);
    trackCurrentToolEvent('SOURCE_PASTE', 'editor', 'success', startedAt);
  }, [applySourceTextFromClipboard, pendingPasteSourceText, trackCurrentToolEvent]);

  const handleCancelPasteSource = useCallback(() => {
    const startedAt = performance.now();
    setPendingPasteSourceText(null);
    trackCurrentToolEvent('SOURCE_PASTE', 'editor', 'cancelled', startedAt);
  }, [trackCurrentToolEvent]);

  const applyPreviewTextToSource = useCallback((text: string, successMessage: string) => {
    handleInputChange(text);
    setHighlightRange(null);
    showSuccess(getSourceUpdateSuccessMessage(successMessage, text));
  }, [handleInputChange]);

  const handleRequestApplyPreviewToSource = useCallback(() => {
    const startedAt = performance.now();
    if (isOutputTransforming) {
      showError('预览仍在处理，请稍后应用');
      trackCurrentToolEvent('PREVIEW_APPLY_TO_SOURCE', 'editor', 'skipped', startedAt);
      return;
    }

    if (!output.trim()) {
      showError('预览内容为空，暂无可应用内容');
      trackCurrentToolEvent('PREVIEW_APPLY_TO_SOURCE', 'editor', 'skipped', startedAt);
      return;
    }

    if (output === input) {
      showSuccess('PREVIEW 内容已在 SOURCE 中');
      trackCurrentToolEvent('PREVIEW_APPLY_TO_SOURCE', 'editor', 'skipped', startedAt);
      return;
    }

    if (input.trim()) {
      setPendingApplyPreviewText(output);
      return;
    }

    applyPreviewTextToSource(output, '已将 PREVIEW 应用到 SOURCE');
    trackCurrentToolEvent('PREVIEW_APPLY_TO_SOURCE', 'editor', 'success', startedAt);
  }, [applyPreviewTextToSource, input, isOutputTransforming, output, trackCurrentToolEvent]);

  const handleConfirmApplyPreviewToSource = useCallback(() => {
    if (pendingApplyPreviewText === null) return;

    const startedAt = performance.now();
    applyPreviewTextToSource(pendingApplyPreviewText, '已用 PREVIEW 替换 SOURCE');
    setPendingApplyPreviewText(null);
    trackCurrentToolEvent('PREVIEW_APPLY_TO_SOURCE', 'editor', 'success', startedAt);
  }, [applyPreviewTextToSource, pendingApplyPreviewText, trackCurrentToolEvent]);

  const handleCancelApplyPreviewToSource = useCallback(() => {
    const startedAt = performance.now();
    setPendingApplyPreviewText(null);
    trackCurrentToolEvent('PREVIEW_APPLY_TO_SOURCE', 'editor', 'cancelled', startedAt);
  }, [trackCurrentToolEvent]);

  const applySchemaExampleToSource = useCallback((text: string, successMessage: string) => {
    handleInputChange(text);
    setHighlightRange(null);
    showSuccess(getSourceUpdateSuccessMessage(successMessage, text));
  }, [handleInputChange]);

  const handleRequestApplySchemaExampleToSource = useCallback((text: string) => {
    const startedAt = performance.now();
    if (!text.trim()) {
      showError('Schema 示例为空，暂无可应用内容');
      trackCurrentToolEvent('SCHEMA_EXAMPLE_APPLY_TO_SOURCE', 'schema', 'skipped', startedAt);
      return;
    }

    if (text === input) {
      showSuccess('Schema 示例已在 SOURCE 中');
      trackCurrentToolEvent('SCHEMA_EXAMPLE_APPLY_TO_SOURCE', 'schema', 'skipped', startedAt);
      return;
    }

    if (input.trim()) {
      setPendingSchemaExampleText(text);
      return;
    }

    applySchemaExampleToSource(text, '已将 Schema 示例应用到 SOURCE');
    trackCurrentToolEvent('SCHEMA_EXAMPLE_APPLY_TO_SOURCE', 'schema', 'success', startedAt);
  }, [applySchemaExampleToSource, input, trackCurrentToolEvent]);

  const handleConfirmApplySchemaExampleToSource = useCallback(() => {
    if (pendingSchemaExampleText === null) return;

    const startedAt = performance.now();
    applySchemaExampleToSource(pendingSchemaExampleText, '已用 Schema 示例替换 SOURCE');
    setPendingSchemaExampleText(null);
    trackCurrentToolEvent('SCHEMA_EXAMPLE_APPLY_TO_SOURCE', 'schema', 'success', startedAt);
  }, [applySchemaExampleToSource, pendingSchemaExampleText, trackCurrentToolEvent]);

  const handleCancelApplySchemaExampleToSource = useCallback(() => {
    const startedAt = performance.now();
    setPendingSchemaExampleText(null);
    trackCurrentToolEvent('SCHEMA_EXAMPLE_APPLY_TO_SOURCE', 'schema', 'cancelled', startedAt);
  }, [trackCurrentToolEvent]);

  const handleRequestClearSource = useCallback(() => {
    const startedAt = performance.now();
    if (!input.trim()) {
      showError('源内容已经是空的');
      trackCurrentToolEvent('SOURCE_CLEAR', 'editor', 'skipped', startedAt);
      return;
    }

    setIsClearSourceConfirmOpen(true);
  }, [input, trackCurrentToolEvent]);

  const handleConfirmClearSource = useCallback(() => {
    const startedAt = performance.now();
    handleInputChange('');
    setHighlightRange(null);
    setIsClearSourceConfirmOpen(false);
    showSuccess('源内容已清空');
    trackCurrentToolEvent('SOURCE_CLEAR', 'editor', 'success', startedAt);
  }, [handleInputChange, trackCurrentToolEvent]);

  const handleCancelClearSource = useCallback(() => {
    setIsClearSourceConfirmOpen(false);
  }, []);

  // 右侧预览编辑处理（反向转换）
  // 仅在解除只读锁定后触发
  const handleOutputChange = useCallback((newVal: string) => {
    // 暂存编辑值，保持编辑器响应
    pendingOutputValue.current = newVal;

    // 标记输出更新状态
    isUpdatingFromOutput.current = true;

    // 预览内容快速验证
    if (newVal && newVal.trim()) {
      const cleanVal = cleanJsonInput(newVal);
      const requestId = ++previewValidationRequestIdRef.current;
      if (cleanVal.length >= ASYNC_VALIDATION_THRESHOLD) {
        setPreviewValidation({ isValid: true });
        validateJsonMaybeAsync(cleanVal, { requireContainer: true }).then(result => {
          if (requestId === previewValidationRequestIdRef.current) {
            setPreviewValidation(result);
          }
        });
      } else {
        const result = validateJsonForEditor(cleanVal, { requireContainer: true });
        if (requestId === previewValidationRequestIdRef.current) {
          setPreviewValidation(result);
        }
      }
    } else {
      previewValidationRequestIdRef.current++;
      setPreviewValidation({ isValid: true });
    }

    // 重置防抖定时器
    if (outputChangeTimer.current) {
      clearTimeout(outputChangeTimer.current);
    }

    const outputSyncRequestId = ++outputSyncRequestIdRef.current;

    // 执行反向转换（防抖 400ms）
    outputChangeTimer.current = setTimeout(() => {
      // Timer fired, clear the ref so we know it's not pending anymore
      outputChangeTimer.current = null;

      const syncOutputToSource = async () => {
        // 修复：在格式化模式下，如果右侧内容不是有效的 JSON，则不进行同步
        // 避免因语法错误导致反向转换失败，从而将错误内容覆盖到左侧源文件
        if ((mode === TransformMode.FORMAT || mode === TransformMode.DEEP_FORMAT || mode === TransformMode.MINIFY)) {
          const validation = await validateJsonMaybeAsync(newVal);
          if (outputSyncRequestId !== outputSyncRequestIdRef.current) {
            return;
          }
          if (!validation.isValid) {
            // 验证失败，仅重置更新标志（允许用户继续编辑），但不同步回左侧
            setPreviewValidation(validation);
            isUpdatingFromOutput.current = false;
            pendingOutputValue.current = '';
            return;
          }
        }

        if (outputSyncRequestId !== outputSyncRequestIdRef.current) {
          return;
        }

        // 深度格式化模式：使用当前 Tab 的 context 进行精确还原
        let newSource: string;
        if (mode === TransformMode.DEEP_FORMAT) {
          const currentFile = files.find(f => f.id === activeFileId);
          const context = currentFile?.transformContext || fallbackContextRef.current;
          if (context) {
            // 使用精确的上下文还原
            newSource = inverseWithContext(newVal, context);
          } else {
            // 无上下文时回退到旧方法
            newSource = performInverseTransform(newVal, mode, inputRef.current);
          }
        } else {
          // 其他模式使用旧方法
          newSource = performInverseTransform(newVal, mode, inputRef.current);
        }

        setInput(newSource);

        // 同步更新 Ref
        inputRef.current = newSource;

        // 同步更新文件缓存
        updateActiveFileContent(newSource);

        // 重置更新标志 - 延长锁定时间以防止连续删除时的竞态条件
        setTimeout(() => {
          // 只有在没有新的定时器运行时（即用户停止输入 1000ms + 500ms 后），才释放锁定
          if (!outputChangeTimer.current && outputSyncRequestId === outputSyncRequestIdRef.current) {
            isUpdatingFromOutput.current = false;
            pendingOutputValue.current = '';
            // 可选：在此处触发一次强制刷新以应用最终的格式化结果？
            // 目前保持静默，直到下一次输入或模式切换，避免光标跳动
          }
        }, 600);
      };

      void syncOutputToSource();
    }, 400);
  }, [mode, files, activeFileId, updateActiveFileContent, validateJsonMaybeAsync]);

  const savePreview = async (): Promise<boolean> => {
    if (isOutputTransforming) {
      showError('预览仍在处理，请稍后再保存');
      return false;
    }

    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'preview_result.json',
          types: [{
            description: 'JSON File',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(output);
        await writable.close();
      } else {
        // Fallback for browsers without File System Access API
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'preview_result.json';
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
      }
      showSuccess("已保存预览结果");
      return true;
    } catch (err) {
      if (isAbortError(err)) {
        return false;
      }
      console.error('Failed to save preview:', err);
      showError(getDetailedErrorMessage(err, '保存预览结果失败'));
      return false;
    }
  };

  // 拖拽文件事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files?.length) {
      openDroppedFiles(e.dataTransfer.files);
    }
  }, [openDroppedFiles]);

  // 模板填充处理
  const buildCurrentQualitySnapshot = useCallback((source: string) => {
    const { context } = deepParseWithContext(source, {
      autoExpandScheme,
    });
    const report = buildTransformContextReport(context);
    return buildTransformQualitySnapshot(report, buildTransformReportView(report, ''), '');
  }, [autoExpandScheme]);

  const handleApplyTemplate = useCallback((templateJson: string) => {
    try {
      const shouldBuildQualityDelta = isPlaceholderFillTemplateJson(templateJson);
      const beforeSnapshot = shouldBuildQualityDelta
        ? buildCurrentQualitySnapshot(input)
        : null;
      const merged = applyTemplate(input, templateJson);
      if (beforeSnapshot) {
        const afterSnapshot = buildCurrentQualitySnapshot(merged);
        setTemplateApplyQualityDelta(formatTransformQualitySnapshotDeltaText(beforeSnapshot, afterSnapshot));
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

  const handleAction = async (action: ActionType) => {
    const startedAt = performance.now();
    if (action === ActionType.AI_FIX) {
      // 触发 AI 修复功能首次使用引导
      triggerFeatureFirstUse(FeatureId.AI_FIX);

      if (!input.trim()) {
        showError('请先输入需要修复的 JSON 内容');
        trackCurrentToolEvent(action, 'ai', 'skipped', startedAt);
        return;
      }

      setIsProcessing(true);
      try {
        // 智能修复针对源输入进行，优先本地规则，必要时再调用 AI。
        const { fixJsonWithRepairDetails } = await import('./services/aiService');
        const repairResult = await fixJsonWithRepairDetails(input, aiConfig);
        const fixed = repairResult.fixedJson;
        const { buildAiRepairSummary } = await import('./utils/aiRepairSummary');
        aiRepairSnapshotRef.current = fixed;
        setAiRepairSummary(buildAiRepairSummary(input, fixed, {
          repairMethod: repairResult.repairMethod,
          localRuleLabels: repairResult.localRuleLabels,
        }));
        setInput(fixed);
        inputRef.current = fixed; // 同步 Ref 状态
        updateActiveFileContent(fixed);
        // 修复后自动切换至格式化视图
        setMode(TransformMode.FORMAT);
        showSuccess(repairResult.repairMethod === 'local' ? '本地修复成功' : 'AI 修复成功');
        trackCurrentToolEvent(action, 'ai', 'success', startedAt);
      } catch (e: unknown) {
        // 业务逻辑错误（API Key 缺失、网络错误等）使用 Toast 提示
        const errorMessage = e instanceof Error ? e.message : "AI 修复失败";
        showError(errorMessage.includes('API Key 未配置') ? '请先配置 AI API Key' : errorMessage);
        if (errorMessage.includes('API Key')) {
          setSettingsInitialTab('ai');
          setIsSettingsModalOpen(true);
        }
        trackCurrentToolEvent(action, 'ai', 'error', startedAt);
      } finally {
        setIsProcessing(false);
      }
    } else if (action === ActionType.SAVE) {
      let success = false;
      if (activeEditor === 'PREVIEW') {
        success = await savePreview();
      } else {
        // Source Save Logic
        if (activeFileId) {
          // If file is open, save to it
          success = await saveFile();
          if (success) showSuccess("已保存源文件");
        } else {
          // If no file open, Save As
          success = await saveSourceAs();
          if (success) showSuccess("已另存为源文件");
        }
      }
      trackCurrentToolEvent(action, 'file', success ? 'success' : 'skipped', startedAt);
    } else if (action === ActionType.OPEN) {
      await openFile();
      trackCurrentToolEvent(action, 'file', 'success', startedAt);
    } else if (action === ActionType.NEW_TAB) {
      createNewTab();
      trackCurrentToolEvent(action, 'file', 'success', startedAt);
    }
  };

  const handleSmartSuggestionAction = (actionId: SmartSuggestionActionId) => {
    const startedAt = performance.now();
    const suggestedMode = getSmartSuggestionMode(actionId);
    const eventName = `SMART_SUGGESTION_${actionId.toUpperCase().replace(/-/g, '_')}`;

    if (actionId === 'ai-fix') {
      void handleAction(ActionType.AI_FIX);
      return;
    }

    if (suggestedMode && mode !== suggestedMode) {
      setMode(suggestedMode);
    }

    if (actionId === 'deep-format-report') {
      setIsTransformReportOpen(true);
      showSuccess('已切换到嵌套解析并打开报告');
    } else if (actionId === 'scheme-panel') {
      const sourceText = input.trim();
      if (!sourceText) {
        showError('SOURCE 为空，暂无可解析内容');
        trackCurrentToolEvent(eventName, 'smart_suggestion', 'skipped', startedAt);
        return;
      }

      setSchemeInputRequest({
        id: ++schemeInputRequestIdRef.current,
        value: sourceText,
      });
      setIsSchemeDecodeOpen(true);
      setIsTransformReportOpen(false);
      showSuccess('已填入 Scheme 解析');
    } else if (actionId === 'structure-nav') {
      if (mode !== TransformMode.DEEP_FORMAT) {
        setMode(TransformMode.DEEP_FORMAT);
      }
      setIsJsonTreePanelOpen(true);
      showSuccess('已打开结构导航');
    } else if (actionId === 'schema-panel') {
      setIsJsonSchemaPanelOpen(true);
      showSuccess('已打开 Schema 校验');
    } else if (actionId === 'json-to-typescript') {
      showSuccess('已切换到 JSON 转 TS');
    } else if (actionId === 'url-decode') {
      showSuccess('已切换到 URL 解码');
    }

    trackCurrentToolEvent(eventName, 'smart_suggestion', 'success', startedAt);
  };

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

  const handleExportSettingsBackup = useCallback(async () => {
    try {
      const { buildAppBackup, serializeAppBackup } = await import('./utils/appBackup');
      const backup = buildAppBackup({
        generalSettings,
        aiConfig,
        shortcuts,
      });
      const blob = new Blob([serializeAppBackup(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = backup.exportedAt.replace(/[:.]/g, '-');

      link.href = url;
      link.download = `jsonutils-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showSuccess('配置备份已导出，未包含 AI Key');
    } catch (error) {
      showError(getDetailedErrorMessage(error, '导出配置备份失败'));
    }
  }, [aiConfig, generalSettings, shortcuts]);

  const handleImportSettingsBackup = useCallback(async (file: File) => {
    try {
      const { applyAppBackupContent, notifyAppBackupImported } = await import('./utils/appBackup');
      const content = await file.text();
      const result = applyAppBackupContent(content, localStorage, aiConfig);

      setGeneralSettings(result.generalSettings);
      setAiConfig(result.aiConfig);
      replaceShortcuts(result.shortcuts);
      notifyAppBackupImported();
      showSuccess('配置备份已导入，AI Key 已保留');
    } catch (error) {
      showError(error instanceof Error ? error.message : '导入配置备份失败');
    }
  }, [aiConfig, replaceShortcuts]);

  const hasSourceContent = input.trim().length > 0;
  const hasPreviewContent = output.trim().length > 0;
  const isPreviewSameAsSource = output === input;
  const isSourceJsonCandidate = hasSourceContent && isJsonContainerCandidate(input);
  const sourceStandaloneDeepFormatKind = hasSourceContent ? getStandaloneDeepFormatInputKind(input) : null;
  const handleLocateSourceErrorFromStatus = useCallback(() => {
    if (!sourceErrorLocation) return;
    setActiveEditor('SOURCE');
    setSourceErrorLocateSignal(signal => signal + 1);
  }, [sourceErrorLocation]);
  const canUseAutoSave = Boolean(activeFileId && activeFile?.handle);
  const isAutoSaveActive = canUseAutoSave && isAutoSaveEnabled;
  const autoSaveTitle = !activeFileId
    ? '请先打开文件以启用自动保存'
    : !activeFile?.handle
      ? '请先保存当前标签以启用自动保存'
      : isAutoSaveEnabled
        ? '自动保存已开启'
        : '点击开启自动保存';
  const autoSaveAriaLabel = !canUseAutoSave
    ? `自动保存不可用，${autoSaveTitle}`
    : isAutoSaveActive
      ? '自动保存已开启，点击关闭'
      : '自动保存已关闭，点击开启';
  const copySourceTitle = hasSourceContent ? '复制 SOURCE 内容到剪贴板' : 'SOURCE 为空，暂无内容可复制';
  const clearSourceTitle = hasSourceContent ? '清空 SOURCE 内容' : 'SOURCE 为空，暂无内容可清空';
  const sourceAiRepairTitle = isProcessing ? '智能修复中，请等待当前任务完成' : '用智能修复当前 SOURCE JSON 错误';
  const transformReportTitle = (() => {
    if (isOutputTransforming) return '预览仍在处理，请稍后查看报告';
    if (!transformReportContext) return '暂无深度解析报告可查看';
    return '查看深度解析报告';
  })();
  const applyPreviewTitle = (() => {
    if (isOutputTransforming) return '预览仍在处理，请稍后应用';
    if (!hasPreviewContent) return '暂无 PREVIEW 内容可应用';
    if (isPreviewSameAsSource) return 'PREVIEW 与 SOURCE 内容一致，无需应用';
    return '用 PREVIEW 内容替换 SOURCE';
  })();
  const copyPreviewTitle = (() => {
    if (isOutputTransforming) return '预览仍在处理，请稍后复制';
    if (!hasPreviewContent) return '暂无 PREVIEW 内容可复制';
    return '复制预览内容到剪贴板';
  })();
  const clearSourceConfirmMessage = isClearSourceConfirmOpen
    ? `这会清空当前 SOURCE 编辑区内容，并将当前标签标记为未保存。\n当前 SOURCE: ${getContentSizeSummary(input)}`
    : '';
  const pasteSourceConfirmMessage = pendingPasteSourceText === null
    ? ''
    : `这会用剪贴板文本替换当前 SOURCE 编辑区内容，并将当前标签标记为未保存。\n当前 SOURCE: ${getContentSizeSummary(input)}\n剪贴板文本: ${getContentSizeSummary(pendingPasteSourceText)}`;
  const applyPreviewConfirmMessage = pendingApplyPreviewText === null
    ? ''
    : `这会用当前 PREVIEW 内容替换 SOURCE 编辑区，并将当前标签标记为未保存。\n当前 SOURCE: ${getContentSizeSummary(input)}\nPREVIEW: ${getContentSizeSummary(pendingApplyPreviewText)}`;
  const applySchemaExampleConfirmMessage = pendingSchemaExampleText === null
    ? ''
    : `这会用当前 Schema 生成的示例 JSON 替换 SOURCE 编辑区，并将当前标签标记为未保存。\n当前 SOURCE: ${getContentSizeSummary(input)}\nSchema 示例: ${getContentSizeSummary(pendingSchemaExampleText)}`;
  const schemeInspectConfirmMessage = pendingSchemeInspectSourceText === null
    ? ''
    : `这会用 Scheme 面板原始值替换 SOURCE，并切换到嵌套解析、打开深度解析报告。\n当前 SOURCE: ${getContentSizeSummary(input)}\nScheme 原始值: ${getContentSizeSummary(pendingSchemeInspectSourceText)}`;

  return (
    <ErrorBoundary>
    <div ref={appRef} className="flex flex-col h-screen bg-editor-bg text-editor-fg font-sans overflow-hidden select-none">

      {hasLoadedSettingsModal && (
        <Suspense fallback={null}>
          <LazyUnifiedSettingsModal
            isOpen={isSettingsModalOpen}
            initialTab={settingsInitialTab}
            onClose={() => setIsSettingsModalOpen(false)}
            shortcuts={shortcuts}
            onUpdateShortcut={updateShortcut}
            onResetShortcuts={resetShortcuts}
            aiConfig={aiConfig}
            onSaveAIConfig={setAiConfig}
            generalSettings={generalSettings}
            onSaveGeneralSettings={setGeneralSettings}
            onResetPanelLayout={handleResetPanelLayout}
            onExportSettingsBackup={handleExportSettingsBackup}
            onImportSettingsBackup={handleImportSettingsBackup}
          />
        </Suspense>
      )}

      {hasLoadedChangelogModal && (
        <Suspense fallback={null}>
          <LazyChangelogModal
            isOpen={isChangelogModalOpen}
            onClose={handleCloseChangelog}
            sourceMarkdown={changelogSourceMarkdown}
            highlightedVersion={changelogHighlightedVersion}
          />
        </Suspense>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingCloseFile)}
        title="关闭未保存标签"
        message={`文件「${pendingCloseFile?.name || '未命名文件'}」有未保存的修改。\n关闭后这些修改将丢失。`}
        confirmLabel="关闭并丢弃"
        cancelLabel="继续编辑"
        variant="danger"
        onConfirm={confirmPendingCloseFile}
        onCancel={cancelPendingCloseFile}
      />

      <ConfirmDialog
        isOpen={isClearSourceConfirmOpen}
        title="清空源内容"
        message={clearSourceConfirmMessage}
        confirmLabel="清空"
        cancelLabel="继续保留"
        variant="danger"
        onConfirm={handleConfirmClearSource}
        onCancel={handleCancelClearSource}
      />

      <ConfirmDialog
        isOpen={pendingPasteSourceText !== null}
        title="替换源内容"
        message={pasteSourceConfirmMessage}
        confirmLabel="替换"
        cancelLabel="继续保留"
        variant="danger"
        onConfirm={handleConfirmPasteSource}
        onCancel={handleCancelPasteSource}
      />

      <ConfirmDialog
        isOpen={pendingApplyPreviewText !== null}
        title="应用预览到源"
        message={applyPreviewConfirmMessage}
        confirmLabel="应用"
        cancelLabel="继续保留"
        onConfirm={handleConfirmApplyPreviewToSource}
        onCancel={handleCancelApplyPreviewToSource}
      />

      <ConfirmDialog
        isOpen={pendingSchemaExampleText !== null}
        title="应用 Schema 示例到源"
        message={applySchemaExampleConfirmMessage}
        confirmLabel="应用示例"
        cancelLabel="继续保留"
        onConfirm={handleConfirmApplySchemaExampleToSource}
        onCancel={handleCancelApplySchemaExampleToSource}
      />

      <ConfirmDialog
        isOpen={pendingSchemeInspectSourceText !== null}
        title="用 Scheme 原始值排查"
        message={schemeInspectConfirmMessage}
        confirmLabel="替换并排查"
        cancelLabel="继续保留"
        variant="danger"
        onConfirm={handleConfirmSchemeInspectSource}
        onCancel={handleCancelSchemeInspectSource}
      />

      {/* 主工作区容器 */}
      <div
        className="flex-1 flex overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >

        {/* 左侧工具栏 */}
        <div data-tour="toolbar" style={{ width: isSidebarCollapsed ? 64 : sidebarWidth }} className="flex-shrink-0 z-10 border-r border-editor-border transition-all duration-300 ease-in-out h-full overflow-hidden">
          <ActionPanel
            activeMode={mode}
            onModeChange={handleModeChange}
            onAction={handleAction}
            isProcessing={isProcessing}
            onOpenSettings={() => {
              setSettingsInitialTab('shortcuts');
              setIsSettingsModalOpen(true);
              trackCurrentToolEvent('SETTINGS_OPEN', 'panel');
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
            onSmartSuggestionAction={handleSmartSuggestionAction}
          />
        </div>

        {/* 侧边栏调整手柄 */}
        {!isSidebarCollapsed && (
          <div
            data-tour="sidebar-resize-handle"
            role="separator"
            aria-label="调整工具栏宽度"
            aria-orientation="vertical"
            aria-valuemin={SIDEBAR_MIN_WIDTH}
            aria-valuemax={SIDEBAR_MAX_WIDTH}
            aria-valuenow={Math.round(sidebarWidth)}
            aria-valuetext={`工具栏宽度 ${Math.round(sidebarWidth)} 像素`}
            tabIndex={0}
            className={`absolute top-0 bottom-0 w-1 hover:bg-brand-primary focus:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/70 cursor-col-resize z-20 transition-colors delay-100 ${isResizingSidebar ? 'bg-brand-primary' : 'bg-transparent'}`}
            style={{ left: sidebarWidth - 2 }}
            onMouseDown={startResizingSidebar}
            onKeyDown={handleSidebarResizeKeyDown}
            title="拖拽或用方向键调整工具栏宽度"
          ></div>
        )}

        {/* 双栏编辑器区域 */}
        <div className="flex-1 flex flex-col min-w-0 bg-editor-bg">
          {aiRepairSummary && (
            <Suspense fallback={null}>
              <LazyAiRepairSummaryBanner
                summary={aiRepairSummary}
                onClose={() => {
                  aiRepairSnapshotRef.current = null;
                  setAiRepairSummary(null);
                }}
                onCopySuccess={showSuccess}
                onCopyError={(errorMessage) => showError(errorMessage)}
              />
            </Suspense>
          )}

          <div className="flex-1 flex min-h-0">

          {/* 左栏：源文件编辑 */}
          <div data-tour="source-editor" style={{ width: `${leftPaneWidthPercent}%` }} className="flex flex-col min-w-[100px] h-full relative">
            <CodeEditor
              value={input}
              originalValue={activeFile?.savedContent}
              path={activeFileId || undefined}
              onChange={handleInputChange}
              onFocus={() => setActiveEditor('SOURCE')}
              onCursorPositionChange={(line, column) => setCursorPosition({ line, column })}
              label="SOURCE"
              files={files}
              activeFileId={activeFileId}
              onTabClick={switchTab}
              onCloseFile={requestCloseFile}
              onNewTab={createNewTab}
              onSaveViewState={saveViewState}
              restoreViewState={activeFile?.viewState}
              enableSchemeScan={true}
              placeholder="// 在此输入 JSON 或文本..."
              error={validation.isValid ? undefined : validation.error}
              errorLocation={sourceErrorLocation}
              warning={jsonSchemaWarning}
              diagnosticHighlights={jsonSchemaDiagnosticHighlights}
              errorActions={!validation.isValid && hasSourceContent ? (
                <button
                  data-tour="source-error-ai-fix"
                  type="button"
                  onClick={() => void handleAction(ActionType.AI_FIX)}
                  disabled={isProcessing}
                  className="rounded border border-violet-500/50 px-1 py-0 text-[10px] text-violet-100 transition-colors hover:bg-violet-800/40 disabled:cursor-not-allowed disabled:opacity-60"
                  title={sourceAiRepairTitle}
                  aria-label={sourceAiRepairTitle}
                >
                  修复
                </button>
              ) : undefined}
              locateErrorSignal={sourceErrorLocateSignal}
              headerActions={
                <>
                  <button
                    data-tour="paste-source"
                    aria-label="粘贴到源内容"
                    onClick={handlePasteSource}
                    className="editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:bg-editor-active hover:text-blue-200 transition-colors border border-transparent"
                    title="从剪贴板粘贴到 SOURCE"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0a2 2 0 104 0m-4 0a2 2 0 114 0m-2 7v6m0 0l-2-2m2 2l2-2" />
                    </svg>
                    <span className="editor-header-action-label">粘贴</span>
                  </button>
                  <button
                    data-tour="copy-source"
                    aria-label={copySourceTitle}
                    onClick={handleCopySource}
                    disabled={!hasSourceContent}
                    className="editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:bg-editor-active transition-colors border border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    title={copySourceTitle}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="editor-header-action-label">复制源</span>
                  </button>
                  <button
                    data-tour="clear-source"
                    aria-label={clearSourceTitle}
                    onClick={handleRequestClearSource}
                    disabled={!hasSourceContent}
                    className="editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:bg-red-900/30 hover:text-red-200 transition-colors border border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    title={clearSourceTitle}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-8 0h10" />
                    </svg>
                    <span className="editor-header-action-label">清空</span>
                  </button>
                  <button
                    data-tour="auto-save"
                    aria-label={autoSaveAriaLabel}
                    aria-pressed={isAutoSaveActive}
                    onClick={handleToggleAutoSave}
                    className={`editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border ${!activeFileId
                      ? 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
                      : isAutoSaveActive
                        ? 'bg-status-success-bg text-status-success-text border-status-success-border'
                        : canUseAutoSave
                          ? 'text-gray-400 border-transparent hover:bg-editor-active'
                          : 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
                      }`}
                    title={autoSaveTitle}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${!activeFileId
                      ? 'bg-gray-700'
                      : isAutoSaveActive
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-gray-500'
                      }`}></div>
                    <span className="editor-header-action-label">自动保存</span>
                  </button>
                </>
              }
            />
          </div>

          {/* 分栏调整手柄 */}
          <div
            data-tour="editor-pane-resize-handle"
            role="separator"
            aria-label="调整 SOURCE 和 PREVIEW 宽度"
            aria-orientation="vertical"
            aria-valuemin={LEFT_PANE_MIN_PERCENT}
            aria-valuemax={LEFT_PANE_MAX_PERCENT}
            aria-valuenow={Math.round(leftPaneWidthPercent)}
            aria-valuetext={`SOURCE 宽度 ${Math.round(leftPaneWidthPercent)}%`}
            tabIndex={0}
            className={`w-1 hover:bg-brand-primary focus:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/70 cursor-col-resize z-20 flex-shrink-0 transition-colors delay-100 ${isResizingPane ? 'bg-brand-primary' : 'bg-editor-sidebar'}`}
            onMouseDown={startResizingPane}
            onKeyDown={handlePaneResizeKeyDown}
            title="拖拽或用方向键调整 SOURCE/PREVIEW 宽度"
          ></div>

          {/* 右栏：预览与结果 */}
          <div data-tour="preview-editor" className="flex-1 flex flex-col min-w-[100px] h-full relative">
            <CodeEditor
              label="PREVIEW"
              value={output}
              onChange={handleOutputChange}
              onFocus={() => setActiveEditor('PREVIEW')}
              onCursorPositionChange={(line, column) => setCursorPosition({ line, column })}
              readOnly={true} // 默认只读状态
              canToggleReadOnly={!isOutputTransforming} // 转换完成后允许解锁编辑
              placeholder="// 结果显示区..."
              error={!previewValidation.isValid ? (previewValidation.error || "Error") : undefined}
              errorLocation={previewErrorLocation}
              warning={deepFormatWarning}
              info={deepFormatInfo}
              highlightRange={highlightRange}
              onSchemeEdit={handleSchemeEdit}
              headerActions={
                <>
                  {deepFormatInfo && (
                    <button
                      data-tour="transform-report-button"
                      aria-label={transformReportTitle}
                      onClick={() => setIsTransformReportOpen(true)}
                      disabled={!transformReportContext || isOutputTransforming}
                      className="editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-cyan-200 hover:bg-editor-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={transformReportTitle}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-4M5 19h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="editor-header-action-label">报告</span>
                    </button>
                  )}
                  <button
                    data-tour="apply-preview-to-source"
                    aria-label={applyPreviewTitle}
                    onClick={handleRequestApplyPreviewToSource}
                    disabled={!hasPreviewContent || isOutputTransforming || isPreviewSameAsSource}
                    className="editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:bg-editor-active hover:text-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={applyPreviewTitle}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    <span className="editor-header-action-label">应用到源</span>
                  </button>
                  <button
                    data-tour="copy-preview"
                    aria-label={copyPreviewTitle}
                    onClick={handleCopyPreview}
                    disabled={!hasPreviewContent || isOutputTransforming}
                    className="editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:bg-editor-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={copyPreviewTitle}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="editor-header-action-label">复制</span>
                  </button>
                </>
              }
            />
          </div>
          </div>
        </div>

        {/* JSONPath 查询面板 */}
        {hasLoadedJsonPathPanel && (
          <Suspense fallback={null}>
            <LazyJsonPathPanel
              jsonData={jsonPathDataSource}
              isDataPreparing={mode === TransformMode.DEEP_FORMAT && isOutputTransforming}
              externalQueryRequest={jsonPathQueryRequest}
              isOpen={isJsonPathPanelOpen}
              onClose={() => {
                setIsJsonPathPanelOpen(false);
                setHighlightRange(null); // 关闭时清除高亮
              }}
              onHighlightRange={handleJsonPathHighlight}
              onLocateStructure={handleLocateJsonPathResultInStructure}
            />
          </Suspense>
        )}

        {/* JSON 结构导航面板 */}
        {hasLoadedJsonTreePanel && (
          <Suspense fallback={null}>
            <LazyJsonTreePanel
              jsonData={jsonPathDataSource}
              isDataPreparing={mode === TransformMode.DEEP_FORMAT && isOutputTransforming}
              isOpen={isJsonTreePanelOpen}
              externalFocusRequest={jsonTreeFocusRequest}
              onClose={() => setIsJsonTreePanelOpen(false)}
              onLocatePath={handleLocateJsonPath}
              onOpenSchemeValue={handleOpenSchemeFromStructure}
            />
          </Suspense>
        )}

        {/* JSON 语义对比面板 */}
        {hasLoadedJsonComparePanel && (
          <Suspense fallback={null}>
            <LazyJsonComparePanel
              sourceText={input}
              isOpen={isJsonComparePanelOpen}
              onClose={() => setIsJsonComparePanelOpen(false)}
              onLocatePath={handleLocateJsonPath}
            />
          </Suspense>
        )}

        {/* JSON Schema 校验面板 */}
        {hasLoadedJsonSchemaPanel && (
          <Suspense fallback={null}>
            <LazyJsonSchemaPanel
              jsonData={input}
              isOpen={isJsonSchemaPanelOpen}
              onClose={() => {
                setIsJsonSchemaPanelOpen(false);
                setJsonSchemaValidationResult(null);
              }}
              onLocatePath={handleLocateJsonPath}
              onApplyExampleToSource={handleRequestApplySchemaExampleToSource}
              onValidationResult={setJsonSchemaValidationResult}
            />
          </Suspense>
        )}

        {/* 深度解析报告面板 */}
        {hasLoadedTransformReportPanel && (
          <Suspense fallback={null}>
            <LazyTransformReportPanel
              isOpen={isTransformReportOpen}
              onClose={() => setIsTransformReportOpen(false)}
              context={transformReportContext}
              onLocatePath={handleLocateJsonPath}
              onOpenSchemeValue={handleOpenSchemeFromReport}
              onOpenTemplateFill={handleOpenTemplateFillFromReport}
            />
          </Suspense>
        )}

        {/* Scheme 解析面板（独立模式） */}
        {hasLoadedSchemePanel && (
          <Suspense fallback={null}>
            <LazySchemeViewerModal
              isOpen={isSchemeDecodeOpen}
              onClose={() => setIsSchemeDecodeOpen(false)}
              standalone={true}
              initialStandaloneInput={schemeInputRequest?.value}
              initialStandaloneInputKey={schemeInputRequest?.id}
              onApply={(encodedValue: string) => {
                setInput(encodedValue);
                inputRef.current = encodedValue;
                updateActiveFileContent(encodedValue);
              }}
              onInspectOriginal={handleInspectSourceFromScheme}
            />
          </Suspense>
        )}

        {/* 模板填充面板 */}
        {hasLoadedTemplatePanel && (
          <Suspense fallback={null}>
            <LazyTemplateFillPanel
              isOpen={isTemplatePanelOpen}
              onClose={() => setIsTemplatePanelOpen(false)}
              onApplyTemplate={handleApplyTemplate}
              targetError={templateTargetError}
              initialTemplate={templateFillRequest?.template}
              initialTemplateKey={templateFillRequest?.id}
              applyQualityDelta={templateApplyQualityDelta}
            />
          </Suspense>
        )}

        {/* 拖拽遮罩层（防止 iframe/webview 捕获事件） */}
        {(isResizingSidebar || isResizingPane) && (
          <div className="absolute inset-0 z-50 cursor-col-resize"></div>
        )}

        {/* 文件拖拽放置遮罩层 */}
        {isDraggingFile && (
          <div className="absolute inset-0 z-50 bg-brand-primary/10 border-2 border-dashed border-brand-primary rounded-lg flex items-center justify-center pointer-events-none">
            <div className="bg-editor-bg/90 px-6 py-4 rounded-xl border border-brand-primary shadow-lg text-center">
              <svg className="w-10 h-10 mx-auto mb-2 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-white">释放以打开文件</p>
              <p className="text-xs text-gray-400 mt-1">支持 JSON、TXT、JS、TS 等文本文件</p>
            </div>
          </div>
        )}

        {/* Toast Notifications - react-hot-toast */}
        <Toaster
          position="top-center"
          toastOptions={{
            className: '',
            style: {
              marginTop: '16px',
            },
          }}
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
        hasSourceContent={hasSourceContent}
        isSourceJsonCandidate={isSourceJsonCandidate}
        sourceStandaloneDeepFormatKind={sourceStandaloneDeepFormatKind}
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
