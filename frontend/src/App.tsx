
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { showSuccess, showError } from './utils/toast';
import { AppActionSidebar } from './components/AppActionSidebar';
import { AppEditorWorkspace } from './components/AppEditorWorkspace';
import { AppWorkspaceOverlays } from './components/AppWorkspaceOverlays';
import { TransformMode, ActionType, ValidationResult, HighlightRange, TransformContext } from './types';
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
import { useAppSettingsState } from './hooks/useAppSettingsState';
import { useAppSmartSuggestionCommands } from './hooks/useAppSmartSuggestionCommands';
import { useAppSmartSuggestionOriginReset } from './hooks/useAppSmartSuggestionOriginReset';
import { useAppPreviewOutputSync } from './hooks/useAppPreviewOutputSync';
import { useAppPreviewDraftFileChangeReset } from './hooks/useAppPreviewDraftFileChangeReset';
import { useAppToolTelemetry } from './hooks/useAppToolTelemetry';
import { useAppVisitorTracking } from './hooks/useAppVisitorTracking';
import {
  useAppPreviewSafeModeSetter,
  useAppPreviewSafeSourceSetter,
} from './hooks/useAppPreviewSafeSetters';
import { useAppActiveFileModeSync } from './hooks/useAppActiveFileModeSync';
import { useAppTransformContextPersistence } from './hooks/useAppTransformContextPersistence';
import { useAppLazyPanelLoadState } from './hooks/useAppLazyPanelLoadState';
import { useAppSourceValidation } from './hooks/useAppSourceValidation';
import { useAppTemplateFillCommand } from './hooks/useAppTemplateFillCommand';
import { useAppPrimaryActionCommand } from './hooks/useAppPrimaryActionCommand';
import { useAppAutoSaveToggleCommand } from './hooks/useAppAutoSaveToggleCommand';
import { useAppSchemeEditCommand } from './hooks/useAppSchemeEditCommand';
import { useAppPanelLayoutResetCommand } from './hooks/useAppPanelLayoutResetCommand';
import { useAppEditorValidationLocations } from './hooks/useAppEditorValidationLocations';
import { useAppSourceInputCommands } from './hooks/useAppSourceInputCommands';
import { useAppToolPanelCommands } from './hooks/useAppToolPanelCommands';
import {
  useAppSourceReplacementCommands,
  type AppSmartSuggestionOrigin,
} from './hooks/useAppSourceReplacementCommands';
import { useAppLayoutController } from './hooks/useAppLayoutController';
import { useOnboardingTour } from './hooks/useOnboardingTour';
import { useFeatureTour, FeatureId } from './hooks/useFeatureTour';
import { AppConfirmDialogs } from './components/AppConfirmDialogs';
import { AppLazyShellModals } from './components/AppLazyShellModals';
import { AppStatusBarController } from './components/AppStatusBarController';
import { AppToolPanelsController } from './components/AppToolPanelsController';
import ErrorBoundary from './components/ErrorBoundary';
import { startJsonValidation } from './utils/jsonValidation';
import type { JsonSchemaValidationResult } from './utils/jsonSchemaValidation';
import { buildAppJsonSchemaEditorFeedback } from './utils/appJsonSchemaEditorFeedback';
import { getSmartInputSuggestion } from './utils/smartInputSuggestion';
import { buildAppEditorUiState } from './utils/appEditorUiState';
import { getContentSizeSummary } from './utils/appWorkflowHelpers';
import {
  ASYNC_VALIDATION_THRESHOLD,
} from './utils/appAsyncPolicy';
import { buildAppTransformOutputState } from './utils/appTransformOutput';

const App: React.FC = () => {
  // 核心状态：输入源
  const [input, setInput] = useState<string>('');

  // 使用 Ref 存储最新输入值，避免预览编辑时的竞态条件
  const inputRef = useRef<string>('');

  // 使用 Ref 阻断输出更新引发的循环更新
  const isUpdatingFromOutput = useRef<boolean>(false);

  // 使用 Ref 暂存待处理的输出值
  const pendingOutputValue = useRef<string>('');
  const cancelOutputDraftRef = useRef<(() => void) | null>(null);

  // 当前转换模式
  const [mode, setMode] = useState<TransformMode>(TransformMode.NONE);

  // 当没有打开文件时，使用 Ref 存储转换上下文（避免无 Tab 场景下丢失 context）
  const fallbackContextRef = useRef<TransformContext | null>(null);

  // 界面布局状态 (Hook) - 移到前面避免依赖问题
  const appRef = useRef<HTMLDivElement>(null);
  const {
    sidebarWidth,
    isSidebarCollapsed, setIsSidebarCollapsed,
    leftPaneWidthPercent,
    isResizingSidebar, isResizingPane,
    startResizingSidebar, startResizingPane,
    handleSidebarResizeKeyDown, handlePaneResizeKeyDown
  } = useAppLayoutController(appRef);

  const handleBeforeFileSystemSourceChange = useCallback(() => {
    cancelOutputDraftRef.current?.();
  }, []);

  // 文件系统状态 (Hook)
  const {
    files, setFiles, activeFileId, isAutoSaveEnabled, setIsAutoSaveEnabled,
    createNewTab, openFile, openDroppedFiles, saveFile, saveSourceAs, closeFile, switchTab, updateActiveFileContent,
    saveViewState, flushWorkspaceDraft
  } = useFileSystem({
    input,
    setInput,
    inputRef,
    mode,
    setMode,
    onBeforeSourceWorkspaceChange: handleBeforeFileSystemSourceChange,
  });

  const {
    generalSettings,
    setGeneralSettings,
    aiConfig,
    setAiConfig,
  } = useAppSettingsState();

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

  const transformOutputState = useMemo(() => {
    const state = buildAppTransformOutputState({
      input,
      mode,
      autoExpandScheme,
      shouldUseAsyncTransform,
      currentAsyncTransformResult,
      isUpdatingFromOutput: isUpdatingFromOutput.current,
      pendingOutputValue: pendingOutputValue.current,
    });

    if (state.shouldClearPendingOutput && !isUpdatingFromOutput.current) {
      pendingOutputValue.current = '';
    }
    return state;
  }, [input, mode, autoExpandScheme, shouldUseAsyncTransform, currentAsyncTransformResult]);
  const {
    activeDeepFormatResult,
    deepFormatWarning,
    deepFormatInfo,
    transformReportContext,
    output,
  } = transformOutputState;

  useAppTransformContextPersistence({
    activeDeepFormatResult,
    activeFileId,
    fallbackContextRef,
    onSetFiles: setFiles,
  });

  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const { cancelOutputDraft, previewValidation, handleOutputChange } = useAppPreviewOutputSync({
    previewText: output,
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
  useEffect(() => {
    cancelOutputDraftRef.current = cancelOutputDraft;
    return () => {
      if (cancelOutputDraftRef.current === cancelOutputDraft) {
        cancelOutputDraftRef.current = null;
      }
    };
  }, [cancelOutputDraft]);
  const setModeWithPreviewDraftCancel = useAppPreviewSafeModeSetter({
    onCancelOutputDraft: cancelOutputDraft,
    onSetMode: setMode,
  });
  const setSourceTextWithPreviewDraftCancel = useAppPreviewSafeSourceSetter({
    onCancelOutputDraft: cancelOutputDraft,
    onSetSourceText: setInput,
  });
  const [highlightRange, setHighlightRange] = useState<HighlightRange | null>(null);
  const [jsonSchemaValidationResult, setJsonSchemaValidationResult] = useState<JsonSchemaValidationResult | null>(null);
  const {
    diagnosticHighlights: jsonSchemaDiagnosticHighlights,
    warning: jsonSchemaWarning,
  } = useMemo(
    () => buildAppJsonSchemaEditorFeedback(input, jsonSchemaValidationResult),
    [input, jsonSchemaValidationResult]
  );

  const [activeEditor, setActiveEditor] = useState<'SOURCE' | 'PREVIEW' | null>(null);
  const {
    sourceErrorLocation,
    previewErrorLocation,
    sourceErrorLocateSignal,
    handleLocateSourceErrorFromStatus,
  } = useAppEditorValidationLocations({
    sourceText: input,
    previewText: output,
    sourceValidation: validation,
    previewValidation,
    onSetActiveEditor: setActiveEditor,
  });
  const [smartSuggestionOrigin, setSmartSuggestionOrigin] = useState<AppSmartSuggestionOrigin | null>(null);
  const {
    aiRepairSummary,
    handleApplyAiRepairResult,
    handleCloseAiRepairSummary,
    handleInputChange: handleRawInputChange,
  } = useAppSourceInputCommands({
    sourceText: input,
    mode,
    inputRef,
    onSetSourceText: setSourceTextWithPreviewDraftCancel,
    onSetMode: setModeWithPreviewDraftCancel,
    onSetSmartSuggestionOrigin: setSmartSuggestionOrigin,
    onUpdateActiveFileContent: updateActiveFileContent,
  });
  const handleInputChange = useCallback((nextValue: string) => {
    cancelOutputDraft();
    handleRawInputChange(nextValue);
  }, [cancelOutputDraft, handleRawInputChange]);
  useAppPreviewDraftFileChangeReset({
    activeFileId,
    onCancelOutputDraft: cancelOutputDraft,
  });

  // 光标位置状态（用于状态栏显示）
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });

  useAppVisitorTracking({ measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID });

  const trackCurrentToolEvent = useAppToolTelemetry({ inputRef });

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
    onSetMode: setModeWithPreviewDraftCancel,
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
    setModeWithPreviewDraftCancel(nextMode);
    trackCurrentToolEvent(nextMode, 'transform_mode');
  }, [setModeWithPreviewDraftCancel, trackCurrentToolEvent]);

  const { handleToggleAutoSave } = useAppAutoSaveToggleCommand({
    hasActiveFile: Boolean(activeFileId),
    activeFileHasHandle: Boolean(activeFile?.handle),
    isAutoSaveEnabled,
    onSetAutoSaveEnabled: setIsAutoSaveEnabled,
  });

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

  useAppActiveFileModeSync({
    activeFileId,
    mode,
    onSetFiles: setFiles,
  });

  const smartSuggestion = useMemo(() => getSmartInputSuggestion(input), [input]);

  useAppSmartSuggestionOriginReset({
    sourceText: input,
    hasSmartSuggestion: Boolean(smartSuggestion),
    smartSuggestionOrigin,
    smartSuggestionOriginTextRef,
    onSetSmartSuggestionOrigin: setSmartSuggestionOrigin,
  });

  useAppSourceValidation({ input, onSetValidation: setValidation });

  const {
    isAiRepairing: isProcessing,
    handleAiRepair,
  } = useAppAiRepairCommand({
    sourceText: input,
    aiConfig,
    onApplyFixedJson: handleApplyAiRepairResult,
    onSetMode: setModeWithPreviewDraftCancel,
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
    onSetMode: setModeWithPreviewDraftCancel,
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
    onSetSourceText: setSourceTextWithPreviewDraftCancel,
    onUpdateActiveFileContent: updateActiveFileContent,
    onSetTemplateApplyQualityDelta: setTemplateApplyQualityDelta,
  });

  const { handleAction } = useAppPrimaryActionCommand({
    onAiRepair: handleAiRepair,
    onToolbarSave: handleToolbarSave,
    onOpenFile: openFile,
    onCreateNewTab: createNewTab,
    onTrackToolEvent: trackCurrentToolEvent,
  });

  const { handleSmartSuggestionAction } = useAppSmartSuggestionCommands({
    currentMode: mode,
    sourceText: input,
    onRunAiFix: () => {
      void handleAction(ActionType.AI_FIX);
    },
    onSetMode: setModeWithPreviewDraftCancel,
    onSetHighlightRange: setHighlightRange,
    onOpenSchemeInput: requestSchemeInput,
    onSetSchemePanelOpen: setIsSchemeDecodeOpen,
    onSetTransformReportOpen: setIsTransformReportOpen,
    onSetJsonTreePanelOpen: setIsJsonTreePanelOpen,
    onSetJsonSchemaPanelOpen: setIsJsonSchemaPanelOpen,
    onTrackToolEvent: trackCurrentToolEvent,
  });

  const { handleSchemeEdit } = useAppSchemeEditCommand({
    previewText: output,
    onPreviewChange: handleOutputChange,
  });

  const { handleResetPanelLayout } = useAppPanelLayoutResetCommand();

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
  return (
    <ErrorBoundary onBeforeReload={flushWorkspaceDraft}>
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
          activeEditor={activeEditor}
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
          onCloseAiRepairSummary={handleCloseAiRepairSummary}
          onCopyAiRepairSummarySuccess={showSuccess}
          onCopyAiRepairSummaryError={showError}
        />

        <AppToolPanelsController
          lazyPanelsLoaded={lazyPanelsLoaded}
          mode={mode}
          input={input}
          jsonPathDataSource={jsonPathDataSource}
          isOutputTransforming={isOutputTransforming}
          transformReportContext={transformReportContext}
          inputRef={inputRef}
          jsonPathQueryRequest={jsonPathQueryRequest}
          jsonTreeFocusRequest={jsonTreeFocusRequest}
          schemeInputRequest={schemeInputRequest}
          templateFillRequest={templateFillRequest}
          isJsonPathPanelOpen={isJsonPathPanelOpen}
          isJsonTreePanelOpen={isJsonTreePanelOpen}
          isJsonComparePanelOpen={isJsonComparePanelOpen}
          isJsonSchemaPanelOpen={isJsonSchemaPanelOpen}
          isTransformReportOpen={isTransformReportOpen}
          isSchemeDecodeOpen={isSchemeDecodeOpen}
          isTemplatePanelOpen={isTemplatePanelOpen}
          templateApplyQualityDelta={templateApplyQualityDelta}
          templateTargetError={templateTargetError}
          onSetSourceText={setSourceTextWithPreviewDraftCancel}
          onUpdateActiveFileContent={updateActiveFileContent}
          onSetJsonTreePanelOpen={setIsJsonTreePanelOpen}
          onSetJsonComparePanelOpen={setIsJsonComparePanelOpen}
          onSetJsonSchemaPanelOpen={setIsJsonSchemaPanelOpen}
          onSetTransformReportOpen={setIsTransformReportOpen}
          onSetSchemeDecodeOpen={setIsSchemeDecodeOpen}
          onSetTemplatePanelOpen={setIsTemplatePanelOpen}
          onSetJsonSchemaValidationResult={setJsonSchemaValidationResult}
          onCloseJsonPathPanel={handleCloseJsonPathPanel}
          onLocateJsonPath={handleLocateJsonPath}
          onLocateJsonPathResultInStructure={handleLocateJsonPathResultInStructure}
          onJsonPathHighlight={setHighlightRange}
          onOpenSchemeFromStructure={handleOpenSchemeFromStructure}
          onOpenSchemeFromReport={handleOpenSchemeFromReport}
          onOpenTemplateFillFromReport={handleOpenTemplateFillFromReport}
          onApplySchemaExampleToSource={handleRequestApplySchemaExampleToSource}
          onInspectSourceFromScheme={handleInspectSourceFromScheme}
          onApplyTemplate={handleApplyTemplate}
        />

        <AppWorkspaceOverlays
          isResizing={isResizingSidebar || isResizingPane}
          isDraggingFile={isDraggingFile}
        />
      </div>

      <AppStatusBarController
        sourceText={input}
        previewText={output}
        activeEditor={activeEditor}
        mode={mode}
        activeFileId={activeFileId}
        files={files}
        isAutoSaveEnabled={isAutoSaveEnabled}
        isSourceLarge={asyncTransformPolicy.isSourceLarge}
        isOutputTransforming={isOutputTransforming}
        isAiRepairing={isProcessing}
        isAiConfigured={Boolean(aiConfig.apiKey.trim())}
        editorUiState={editorUiState}
        onOpenSourceSchemeInput={handleOpenSourceSchemeInput}
        onOpenChangelog={handleOpenChangelog}
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
