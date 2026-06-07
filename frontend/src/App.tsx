
import React, { lazy, Suspense, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { showSuccess, showError } from './utils/toast';
import { ActionPanel } from './components/ActionPanel';
import { CodeEditor } from './components/Editor';
import { JsonPathPanel } from './components/JsonPathPanel';
import { TemplateFillPanel } from './components/TemplateFillPanel';
import { AiRepairSummaryBanner } from './components/AiRepairSummaryBanner';
import {
  validateJson,
  detectLanguage,
  performTransform,
  performInverseTransform,
  deepParseWithContext,
  inverseWithContext,
  applyTemplate
} from './utils/transformations';
import { fixJsonWithAI } from './services/aiService';
import { UnifiedSettingsModal } from './components/UnifiedSettingsModal';
import { TransformMode, ActionType, ValidationResult, AIConfig, HighlightRange, GeneralSettings, TransformContext, TransformResult } from './types';
import { useShortcuts } from './hooks/useShortcuts';
import { useFileSystem } from './hooks/useFileSystem';
import { useLayout } from './hooks/useLayout';
import { useOnboardingTour } from './hooks/useOnboardingTour';
import { useFeatureTour, FeatureId } from './hooks/useFeatureTour';
import ErrorBoundary from './components/ErrorBoundary';
import { StatusBar } from './components/StatusBar';
import { getDocumentStats } from './utils/documentStats';
import { buildAiRepairSummary } from './utils/aiRepairSummary';
import type { AiRepairSummary } from './utils/aiRepairSummary';
import { copyText } from './utils/clipboard';
import { safeSetStorageItem } from './utils/storage';
import { AI_CONFIG_STORAGE_KEY, GENERAL_SETTINGS_STORAGE_KEY, loadAIConfig, loadGeneralSettings } from './utils/appSettings';
import {
  applyAppBackupContent,
  buildAppBackup,
  notifyAppBackupImported,
  serializeAppBackup,
} from './utils/appBackup';
import { notifyFloatingPanelLayoutReset, resetFloatingPanelLayoutStorage } from './utils/panelLayout';
import { setJsonPointerValue } from './utils/jsonPointer';

const ASYNC_TRANSFORM_THRESHOLD = 200_000;
const ASYNC_VALIDATION_THRESHOLD = 200_000;
const ASYNC_TRANSFORM_PLACEHOLDER = '// 正在处理大文件，请稍候...';
const ASYNC_TRANSFORM_MODES = new Set<TransformMode>([
  TransformMode.FORMAT,
  TransformMode.DEEP_FORMAT,
  TransformMode.MINIFY,
  TransformMode.SORT_KEYS,
]);

const LazySchemeViewerModal = lazy(() => import('./components/SchemeViewerModal').then(module => ({
  default: module.SchemeViewerModal,
})));

type SettingsTab = 'shortcuts' | 'ai' | 'general';

interface AsyncTransformResult {
  input: string;
  mode: TransformMode;
  autoExpandScheme: boolean;
  output: string;
  context?: TransformContext;
}

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

  // 文件系统状态 (Hook) - 移到前面，因为 output 需要使用 activeFileId 和 setFiles
  const {
    files, setFiles, activeFileId, isAutoSaveEnabled, setIsAutoSaveEnabled,
    createNewTab, openFile, openDroppedFile, saveFile, saveSourceAs, closeFile, switchTab, updateActiveFileContent,
    saveViewState
  } = useFileSystem({
    input, setInput, inputRef, setMode, output: '' // 初始为空，后面会更新
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
  const [asyncTransformResult, setAsyncTransformResult] = useState<AsyncTransformResult | null>(null);
  const [isOutputTransforming, setIsOutputTransforming] = useState(false);
  const transformRequestIdRef = useRef(0);
  const sourceValidationRequestIdRef = useRef(0);
  const previewValidationRequestIdRef = useRef(0);
  const outputSyncRequestIdRef = useRef(0);
  const aiRepairSnapshotRef = useRef<string | null>(null);
  const autoExpandScheme = generalSettings.autoExpandSchemeInDeepFormat;
  const shouldUseAsyncTransform = (
    input.length >= ASYNC_TRANSFORM_THRESHOLD &&
    ASYNC_TRANSFORM_MODES.has(mode) &&
    !isUpdatingFromOutput.current
  );

  const validateJsonMaybeAsync = useCallback((value: string): Promise<ValidationResult> => {
    if (value.length < ASYNC_VALIDATION_THRESHOLD) {
      return Promise.resolve(validateJson(value));
    }

    return new Promise(resolve => {
      const worker = new Worker(new URL('./workers/validation.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<{
        id: number;
        validation: ValidationResult;
      }>) => {
        worker.terminate();
        resolve(event.data.validation);
      };
      worker.onerror = (event) => {
        worker.terminate();
        resolve({
          isValid: false,
          error: `JSON 校验失败: ${event.message}`,
        });
      };
      worker.postMessage({ id: 1, input: value });
    });
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
    const worker = new Worker(new URL('./workers/transform.worker.ts', import.meta.url), { type: 'module' });

    setIsOutputTransforming(true);
    setAsyncTransformResult(null);

    worker.onmessage = (event: MessageEvent<{
      id: number;
      output: string;
      context?: TransformContext;
      error?: string;
    }>) => {
      if (event.data.id !== requestId) return;
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
  }, [input, mode, autoExpandScheme, shouldUseAsyncTransform]);

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
    if (!isJsonPathPanelOpen) {
      return '';
    }

    return output;
  }, [output, isJsonPathPanelOpen]);

  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });
  const [aiRepairSummary, setAiRepairSummary] = useState<AiRepairSummary | null>(null);

  const [highlightRange, setHighlightRange] = useState<HighlightRange | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('shortcuts');
  const [isSchemeDecodeOpen, setIsSchemeDecodeOpen] = useState(false);
  const [hasLoadedSchemePanel, setHasLoadedSchemePanel] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<'SOURCE' | 'PREVIEW' | null>(null);

  // 光标位置状态（用于状态栏显示）
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });

  // 拖拽文件状态
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);

  const [aiConfig, setAiConfig] = useState<AIConfig>(loadAIConfig);

  useEffect(() => {
    if (isSchemeDecodeOpen) {
      setHasLoadedSchemePanel(true);
    }
  }, [isSchemeDecodeOpen]);

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
    fetch('/api/visitor/ping').catch(() => {
      // 静默失败，不影响用户体验
    });
  }, []);

  // 统一的保存处理逻辑
  const handleSaveShortcut = useCallback(async () => {
    if (activeEditor === 'PREVIEW' && isOutputTransforming) {
      showError('预览仍在处理，请稍后再保存');
      return;
    }

    if (activeFileId) {
      // 如果已打开文件，根据焦点保存不同内容到该文件
      if (activeEditor === 'PREVIEW') {
        // Preview 聚焦：保存 Preview 内容到文件
        const success = await saveFile(output);
        if (success) showSuccess("已将 PREVIEW 内容保存到文件");
      } else {
        // Source 聚焦：保存 Source 内容到文件
        const success = await saveFile(); // 默认保存 input
        if (success) showSuccess("已将 SOURCE 内容保存到文件");
      }
    } else {
      // 未打开文件：另存为
      if (activeEditor === 'PREVIEW') {
        await savePreview(); // 另存为 Preview
      } else {
        const success = await saveSourceAs(); // 另存为 Source
        if (success) showSuccess("已另存为源文件");
      }
    }
  }, [activeFileId, activeEditor, output, saveFile, saveSourceAs, isOutputTransforming]);

  const handleToggleJsonPath = useCallback(() => {
    const nextOpen = !isJsonPathPanelOpen;
    if (nextOpen && mode !== TransformMode.DEEP_FORMAT) {
      setMode(TransformMode.DEEP_FORMAT);
    }
    setIsJsonPathPanelOpen(nextOpen);
  }, [isJsonPathPanelOpen, mode]);

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
    onFormat: () => setMode(TransformMode.FORMAT),
    onDeepFormat: () => setMode(TransformMode.DEEP_FORMAT),
    onMinify: () => setMode(TransformMode.MINIFY),
    onCloseTab: () => activeFileId && closeFile(activeFileId),
    onToggleJsonPath: handleToggleJsonPath,
    onNewTab: createNewTab
  });

  // 用户引导 (Hook)
  useOnboardingTour();

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
    return getDocumentStats(content);
  }, [input, output, activeEditor]);

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
    let worker: Worker | null = null;
    const timeoutId = setTimeout(() => {
      if (input && input.trim()) {
        // 预处理：移除零宽空格等不可见字符，避免误报
        const cleanInput = input.replace(/[\u200B-\u200D\uFEFF]/g, '');
        const trimmedInput = cleanInput.trim();

        if (trimmedInput.startsWith('{') || trimmedInput.startsWith('[')) {
          const requestId = ++sourceValidationRequestIdRef.current;
          if (cleanInput.length >= ASYNC_VALIDATION_THRESHOLD) {
            worker = new Worker(new URL('./workers/validation.worker.ts', import.meta.url), { type: 'module' });
            worker.onmessage = (event: MessageEvent<{
              id: number;
              validation: ValidationResult;
            }>) => {
              if (event.data.id === sourceValidationRequestIdRef.current) {
                setValidation(event.data.validation);
              }
              worker?.terminate();
              worker = null;
            };
            worker.onerror = (event) => {
              if (requestId === sourceValidationRequestIdRef.current) {
                setValidation({
                  isValid: false,
                  error: `JSON 校验失败: ${event.message}`,
                });
              }
              worker?.terminate();
              worker = null;
            };
            worker.postMessage({ id: requestId, input: cleanInput });
            return;
          }

          setValidation(validateJson(cleanInput));
        } else {
          sourceValidationRequestIdRef.current++;
          setValidation({ isValid: true });
        }
      } else {
        sourceValidationRequestIdRef.current++;
        setValidation({ isValid: true });
      }
    }, 500);
    return () => {
      clearTimeout(timeoutId);
      worker?.terminate();
    };
  }, [input]);

  // 左侧编辑器变更处理
  const handleInputChange = useCallback((newVal: string) => {
    // 实时清理不可见字符
    const cleanVal = newVal.replace(/[\u200B-\u200D\uFEFF]/g, '');
    if (aiRepairSnapshotRef.current !== cleanVal) {
      aiRepairSnapshotRef.current = null;
      setAiRepairSummary(null);
    }
    setInput(cleanVal);

    // 同步更新 Ref 状态
    inputRef.current = cleanVal;

    // 更新活动文件内容缓存
    updateActiveFileContent(cleanVal);

  }, [updateActiveFileContent]);

  // 右侧预览编辑处理（反向转换）
  // 仅在解除只读锁定后触发
  const handleOutputChange = useCallback((newVal: string) => {
    // 暂存编辑值，保持编辑器响应
    pendingOutputValue.current = newVal;

    // 标记输出更新状态
    isUpdatingFromOutput.current = true;

    // 预览内容快速验证
    if (newVal && newVal.trim()) {
      const cleanVal = newVal.replace(/[\u200B-\u200D\uFEFF]/g, '');
      if (cleanVal.trim().startsWith('{') || cleanVal.trim().startsWith('[')) {
        const requestId = ++previewValidationRequestIdRef.current;
        if (cleanVal.length >= ASYNC_VALIDATION_THRESHOLD) {
          setPreviewValidation({ isValid: true });
          validateJsonMaybeAsync(cleanVal).then(result => {
            if (requestId === previewValidationRequestIdRef.current) {
              setPreviewValidation(result);
            }
          });
        } else {
          setPreviewValidation(validateJson(cleanVal));
        }
      } else {
        previewValidationRequestIdRef.current++;
        setPreviewValidation({ isValid: true });
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

  const savePreview = async () => {
    if (isOutputTransforming) {
      showError('预览仍在处理，请稍后再保存');
      return;
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
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('Failed to save preview:', err);
      showError('保存预览结果失败');
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      openDroppedFile(file);
    }
  }, [openDroppedFile]);

  // 模板填充处理
  const handleApplyTemplate = useCallback((templateJson: string) => {
    try {
      const merged = applyTemplate(input, templateJson);
      setInput(merged);
      inputRef.current = merged;
      updateActiveFileContent(merged);
      showSuccess('模板已应用');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '模板应用失败';
      showError(message);
    }
  }, [input, updateActiveFileContent]);

  const handleAction = async (action: ActionType) => {
    if (action === ActionType.AI_FIX) {
      // 触发 AI 修复功能首次使用引导
      triggerFeatureFirstUse(FeatureId.AI_FIX);

      if (!input.trim()) {
        showError('请先输入需要修复的 JSON 内容');
        return;
      }

      if (!aiConfig.apiKey.trim()) {
        showError('请先配置 AI API Key');
        setSettingsInitialTab('ai');
        setIsSettingsModalOpen(true);
        return;
      }

      setIsProcessing(true);
      try {
        // AI 修复针对源输入进行
        const fixed = await fixJsonWithAI(input, aiConfig);
        aiRepairSnapshotRef.current = fixed;
        setAiRepairSummary(buildAiRepairSummary(input, fixed));
        setInput(fixed);
        inputRef.current = fixed; // 同步 Ref 状态
        // 修复后自动切换至格式化视图
        setMode(TransformMode.FORMAT);
        showSuccess("AI 修复成功");
      } catch (e: unknown) {
        // 业务逻辑错误（API Key 缺失、网络错误等）使用 Toast 提示
        const errorMessage = e instanceof Error ? e.message : "AI 修复失败";
        showError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    } else if (action === ActionType.SAVE) {
      if (activeEditor === 'PREVIEW') {
        await savePreview();
      } else {
        // Source Save Logic
        if (activeFileId) {
          // If file is open, save to it
          const success = await saveFile();
          if (success) showSuccess("已保存源文件");
        } else {
          // If no file open, Save As
          const success = await saveSourceAs();
          if (success) showSuccess("已另存为源文件");
        }
      }
    } else if (action === ActionType.OPEN) {
      await openFile();
    } else if (action === ActionType.NEW_TAB) {
      createNewTab();
    }
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
      showError('应用修改失败');
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

  const handleExportSettingsBackup = useCallback(() => {
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
  }, [aiConfig, generalSettings, shortcuts]);

  const handleImportSettingsBackup = useCallback(async (file: File) => {
    try {
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

  return (
    <ErrorBoundary>
    <div ref={appRef} className="flex flex-col h-screen bg-editor-bg text-editor-fg font-sans overflow-hidden select-none">

      <UnifiedSettingsModal
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
            onModeChange={setMode}
            onAction={handleAction}
            isProcessing={isProcessing}
            onOpenSettings={() => {
              setSettingsInitialTab('shortcuts');
              setIsSettingsModalOpen(true);
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onToggleJsonPath={handleToggleJsonPath}
            onToggleSchemeDecode={() => setIsSchemeDecodeOpen(!isSchemeDecodeOpen)}
            onToggleTemplateFill={() => setIsTemplatePanelOpen(!isTemplatePanelOpen)}
          />
        </div>

        {/* 侧边栏调整手柄 */}
        {!isSidebarCollapsed && (
          <div
            className={`absolute top-0 bottom-0 w-1 hover:bg-brand-primary cursor-col-resize z-20 transition-colors delay-100 ${isResizingSidebar ? 'bg-brand-primary' : 'bg-transparent'}`}
            style={{ left: sidebarWidth - 2 }}
            onMouseDown={startResizingSidebar}
          ></div>
        )}

        {/* 双栏编辑器区域 */}
        <div className="flex-1 flex flex-col min-w-0 bg-editor-bg">
          {aiRepairSummary && (
            <AiRepairSummaryBanner
              summary={aiRepairSummary}
              onClose={() => {
                aiRepairSnapshotRef.current = null;
                setAiRepairSummary(null);
              }}
              onCopySuccess={() => showSuccess('已复制 AI 修复摘要')}
              onCopyError={() => showError('复制 AI 修复摘要失败')}
            />
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
              onCloseFile={closeFile}
              onNewTab={createNewTab}
              onSaveViewState={saveViewState}
              restoreViewState={activeFile?.viewState}
              placeholder="// 在此输入 JSON 或文本..."
              error={validation.isValid ? undefined : validation.error}
              headerActions={
                <button
                  data-tour="auto-save"
                  onClick={handleToggleAutoSave}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border ${!activeFileId
                    ? 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
                    : activeFile?.handle && isAutoSaveEnabled
                      ? 'bg-status-success-bg text-status-success-text border-status-success-border'
                      : activeFile?.handle
                        ? 'text-gray-400 border-transparent hover:bg-editor-active'
                        : 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
                    }`}
                  title={
                    !activeFileId
                      ? "请先打开文件以启用自动保存"
                      : !activeFile?.handle
                        ? "请先保存当前标签以启用自动保存"
                        : isAutoSaveEnabled
                        ? "自动保存已开启"
                        : "点击开启自动保存"
                  }
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${!activeFileId
                    ? 'bg-gray-700'
                    : activeFile?.handle && isAutoSaveEnabled
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-gray-500'
                    }`}></div>
                  <span>自动保存</span>
                </button>
              }
            />
          </div>

          {/* 分栏调整手柄 */}
          <div
            className={`w-1 hover:bg-brand-primary cursor-col-resize z-20 flex-shrink-0 transition-colors delay-100 ${isResizingPane ? 'bg-brand-primary' : 'bg-editor-sidebar'}`}
            onMouseDown={startResizingPane}
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
              highlightRange={highlightRange}
              onSchemeEdit={handleSchemeEdit}
              headerActions={
                <button
                  onClick={async () => {
                    if (!output.trim() || isOutputTransforming) return;
                    try {
                      await copyText(output);
                      showSuccess('已复制预览内容');
                    } catch {
                      showError('复制失败');
                    }
                  }}
                  disabled={!output.trim() || isOutputTransforming}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:bg-editor-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isOutputTransforming ? "预览仍在处理，请稍后复制" : "复制预览内容到剪贴板"}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>复制</span>
                </button>
              }
            />
          </div>
          </div>
        </div>

        {/* JSONPath 查询面板 */}
        <JsonPathPanel
          jsonData={jsonPathDataSource}
          isDataPreparing={mode === TransformMode.DEEP_FORMAT && isOutputTransforming}
          isOpen={isJsonPathPanelOpen}
          onClose={() => {
            setIsJsonPathPanelOpen(false);
            setHighlightRange(null); // 关闭时清除高亮
          }}
          onHighlightRange={handleJsonPathHighlight}
        />

        {/* Scheme 解析面板（独立模式） */}
        {hasLoadedSchemePanel && (
          <Suspense fallback={null}>
            <LazySchemeViewerModal
              isOpen={isSchemeDecodeOpen}
              onClose={() => setIsSchemeDecodeOpen(false)}
              standalone={true}
              onApply={(encodedValue: string) => {
                setInput(encodedValue);
                inputRef.current = encodedValue;
                updateActiveFileContent(encodedValue);
              }}
            />
          </Suspense>
        )}

        {/* 模板填充面板 */}
        <TemplateFillPanel
          isOpen={isTemplatePanelOpen}
          onClose={() => setIsTemplatePanelOpen(false)}
          onApplyTemplate={handleApplyTemplate}
          targetError={templateTargetError}
        />

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
        totalLines={documentStats.totalLines}
        maxColumns={documentStats.maxColumns}
        mode={mode}
        activeFileId={activeFileId}
        files={files}
        isAutoSaveEnabled={isAutoSaveEnabled}
        cursorLine={cursorPosition.line}
        cursorColumn={cursorPosition.column}
      />
    </div>
    </ErrorBoundary>
  );
};

export default App;
