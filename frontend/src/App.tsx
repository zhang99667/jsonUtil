
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { showSuccess, showError } from './utils/toast';
import { ActionPanel } from './components/ActionPanel';
import { CodeEditor } from './components/Editor';
import { JsonPathPanel } from './components/JsonPathPanel';
import { SchemeViewerModal } from './components/SchemeViewerModal';
import { TemplateFillPanel } from './components/TemplateFillPanel';
import {
  validateJson,
  performTransform,
  performInverseTransform,
  deepParseWithContext,
  inverseWithContext,
  applyTemplate
} from './utils/transformations';
import { fixJsonWithAI } from './services/aiService';
import { UnifiedSettingsModal } from './components/UnifiedSettingsModal';
import { TransformMode, ActionType, ValidationResult, AIConfig, AIProvider, HighlightRange, GeneralSettings, DEFAULT_GENERAL_SETTINGS } from './types';
import { parse } from 'json-source-map';
import { JSONPath } from 'jsonpath-plus';
import { useShortcuts } from './hooks/useShortcuts';
import { useFileSystem } from './hooks/useFileSystem';
import { useLayout } from './hooks/useLayout';
import { useOnboardingTour } from './hooks/useOnboardingTour';
import { useFeatureTour, FeatureId } from './hooks/useFeatureTour';
import ErrorBoundary from './components/ErrorBoundary';
import { StatusBar } from './components/StatusBar';

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
  const fallbackContextRef = useRef<import('./types').TransformContext | null>(null);

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
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() => {
    const saved = localStorage.getItem('json-helper-general-settings');
    return saved ? JSON.parse(saved) : DEFAULT_GENERAL_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('json-helper-general-settings', JSON.stringify(generalSettings));
  }, [generalSettings]);

  // 深度格式化结果和上下文（避免在 output 计算中产生副作用）
  const deepFormatResult = useMemo(() => {
    if (mode === TransformMode.DEEP_FORMAT) {
      return deepParseWithContext(input, {
        autoExpandScheme: generalSettings.autoExpandSchemeInDeepFormat,
      });
    }
    return null;
  }, [input, mode, generalSettings.autoExpandSchemeInDeepFormat]);

  // 保存深度格式化上下文到文件（副作用独立处理）
  useEffect(() => {
    if (deepFormatResult) {
      if (activeFileId) {
        setFiles(prev => prev.map(f =>
          f.id === activeFileId
            ? { ...f, transformContext: deepFormatResult.context }
            : f
        ));
      } else {
        fallbackContextRef.current = deepFormatResult.context;
      }
    }
  }, [deepFormatResult, activeFileId, setFiles]);

  // 计算派生输出（纯计算，无副作用）
  const output = useMemo(() => {
    // 若处于输出编辑状态，优先返回暂存值以避免覆盖用户输入
    if (isUpdatingFromOutput.current && pendingOutputValue.current) {
      return pendingOutputValue.current;
    }

    // 深度格式化模式：使用预计算的结果
    if (mode === TransformMode.DEEP_FORMAT && deepFormatResult) {
      if (!isUpdatingFromOutput.current) {
        pendingOutputValue.current = '';
      }
      return deepFormatResult.output;
    }

    const result = performTransform(input, mode);
    if (!isUpdatingFromOutput.current) {
      pendingOutputValue.current = '';
    }
    return result;
  }, [input, mode, deepFormatResult]);

  // JSONPath 查询专用数据源（强制深度格式化）
  // 确保查询功能支持嵌套 JSON 搜索
  const deepFormattedOutput = useMemo(() => {
    // 性能优化：复用现有深度格式化结果
    if (mode === TransformMode.DEEP_FORMAT && deepFormatResult) {
      return deepFormatResult.output;
    }
    return performTransform(input, TransformMode.DEEP_FORMAT);
  }, [input, mode, deepFormatResult]);

  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });

  const [highlightRange, setHighlightRange] = useState<HighlightRange | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isJsonPathPanelOpen, setIsJsonPathPanelOpen] = useState(false);
  const [isSchemeDecodeOpen, setIsSchemeDecodeOpen] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<'SOURCE' | 'PREVIEW' | null>(null);

  // 光标位置状态（用于状态栏显示）
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });

  // 拖拽文件状态
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);

  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('json-helper-ai-config');
    return saved ? JSON.parse(saved) : {
      provider: AIProvider.GEMINI,
      apiKey: '',
      model: 'gemini-2.0-flash'
    };
  });

  useEffect(() => {
    localStorage.setItem('json-helper-ai-config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  // 访客统计打点 (仅统计前台页面访问)
  useEffect(() => {
    fetch('/api/visitor/ping').catch(() => {
      // 静默失败，不影响用户体验
    });
  }, []);

  // 统一的保存处理逻辑
  const handleSaveShortcut = useCallback(async () => {
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
  }, [activeFileId, activeEditor, output, saveFile, saveSourceAs]);

  // 快捷键状态 (Hook)
  const { shortcuts, updateShortcut, resetShortcuts } = useShortcuts({
    onSave: handleSaveShortcut,
    onFormat: () => setMode(TransformMode.FORMAT),
    onDeepFormat: () => setMode(TransformMode.DEEP_FORMAT),
    onMinify: () => setMode(TransformMode.MINIFY),
    onCloseTab: () => activeFileId && closeFile(activeFileId),
    onToggleJsonPath: () => setIsJsonPathPanelOpen(prev => !prev),
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
    const lines = content.split('\n');
    const totalLines = lines.length;
    // 使用 reduce 循环替代 Math.max(...spread)，避免大文件时栈溢出
    const maxColumns = lines.reduce((max, line) => Math.max(max, line.length), 0);
    return { totalLines, maxColumns };
  }, [input, output, activeEditor]);


  // 输入变更验证（防抖）
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (input && input.trim()) {
        // 预处理：移除零宽空格等不可见字符，避免误报
        const cleanInput = input.replace(/[\u200B-\u200D\uFEFF]/g, '');

        if (cleanInput.trim().startsWith('{') || cleanInput.trim().startsWith('[')) {
          setValidation(validateJson(cleanInput));
        } else {
          setValidation({ isValid: true });
        }
      } else {
        setValidation({ isValid: true });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [input]);

  // 左侧编辑器变更处理
  const handleInputChange = useCallback((newVal: string) => {
    // 实时清理不可见字符
    const cleanVal = newVal.replace(/[\u200B-\u200D\uFEFF]/g, '');
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
        setPreviewValidation(validateJson(cleanVal));
      } else {
        setPreviewValidation({ isValid: true });
      }
    } else {
      setPreviewValidation({ isValid: true });
    }

    // 重置防抖定时器
    if (outputChangeTimer.current) {
      clearTimeout(outputChangeTimer.current);
    }

    // 执行反向转换（防抖 150ms）
    outputChangeTimer.current = setTimeout(() => {
      // Timer fired, clear the ref so we know it's not pending anymore
      outputChangeTimer.current = null;

      // 修复：在格式化模式下，如果右侧内容不是有效的 JSON，则不进行同步
      // 避免因语法错误导致反向转换失败，从而将错误内容覆盖到左侧源文件
      if ((mode === TransformMode.FORMAT || mode === TransformMode.DEEP_FORMAT || mode === TransformMode.MINIFY)) {
        const validation = validateJson(newVal);
        if (!validation.isValid) {
          // 验证失败，仅重置更新标志（允许用户继续编辑），但不同步回左侧
          isUpdatingFromOutput.current = false;
          pendingOutputValue.current = '';
          return;
        }
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
        if (!outputChangeTimer.current) {
          isUpdatingFromOutput.current = false;
          pendingOutputValue.current = '';
          // 可选：在此处触发一次强制刷新以应用最终的格式化结果？
          // 目前保持静默，直到下一次输入或模式切换，避免光标跳动
        }
      }, 600); // 增加延迟至 500ms
    }, 400); // 防抖延迟增加到 1000ms
  }, [mode, files, activeFileId, updateActiveFileContent]);

  const savePreview = async () => {
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
        URL.revokeObjectURL(url);
      }
      showSuccess("已保存预览结果");
    } catch (err) {
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

      if (!input.trim()) return;
      setIsProcessing(true);
      try {
        // AI 修复针对源输入进行
        const fixed = await fixJsonWithAI(input, aiConfig);
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
  const handleSchemeEdit = useCallback((jsonPath: string, newValue: string) => {
    try {
      const parsed = JSON.parse(output);

      // 解析 JSON Path (如 $.action_cmd 或 $.data.items[0].url)
      const pathParts = jsonPath
        .replace(/^\$\.?/, '') // 移除开头的 $. 或 $
        .split(/\.|\[|\]/)
        .filter(p => p !== '');

      // 遍历到目标位置并设置新值
      let current = parsed;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        const index = parseInt(part, 10);
        current = isNaN(index) ? current[part] : current[index];
      }

      // 设置最后一个键的值
      const lastPart = pathParts[pathParts.length - 1];
      const lastIndex = parseInt(lastPart, 10);
      if (isNaN(lastIndex)) {
        current[lastPart] = newValue;
      } else {
        current[lastIndex] = newValue;
      }

      // 格式化并触发更新
      const updatedOutput = JSON.stringify(parsed, null, 2);
      handleOutputChange(updatedOutput);

      showSuccess('Scheme 修改已应用');
    } catch (err) {
      console.error('Failed to apply scheme edit:', err);
      showError('应用修改失败');
    }
  }, [output, handleOutputChange]);

  // 处理 JSONPath 查询定位
  const handleJsonPathQuery = (queryString: string, resultIndex: number) => {
    // 1. 强制切换至深度格式化模式以支持嵌套查询
    if (mode !== TransformMode.DEEP_FORMAT) {
      setMode(TransformMode.DEEP_FORMAT);
    }

    // 2. 解析当前输出以生成 Source Map
    // 基于当前输入重新计算深度格式化结果以确保准确性
    const currentOutput = performTransform(input, TransformMode.DEEP_FORMAT);

    try {
      // 3. 生成 Source Map
      const { pointers } = parse(currentOutput);

      // 4. 获取查询结果的 JSON Pointer 路径
      // jsonpath-plus 的 resultType: 'pointer' 返回 JSON Pointer 格式 (e.g. /users/0/name)
      const paths = JSONPath({
        path: queryString,
        json: JSON.parse(currentOutput),
        resultType: 'pointer'
      });

      if (paths && paths.length > 0) {
        // 使用传入的 resultIndex 定位到特定结果
        const pointer = paths[resultIndex] || paths[0]; // 如果索引越界，回退到第一个

        // 5. 映射路径至代码位置
        if (pointers[pointer]) {
          const { value, key, valueEnd, keyEnd } = pointers[pointer];
          // 优先高亮值区域，如果是对象/数组，高亮整个块
          const loc = value || key;

          if (loc) {
            setHighlightRange({
              startLine: loc.line + 1, // 坐标转换：0-based 转 1-based
              startColumn: loc.column + 1,
              endLine: valueEnd ? valueEnd.line + 1 : loc.line + 1,
              endColumn: valueEnd ? valueEnd.column + 1 : loc.column + 1 + (queryString.length) // 估算
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to locate JSON path:", e);
    }
  };

  return (
    <ErrorBoundary>
    <div ref={appRef} className="flex flex-col h-screen bg-editor-bg text-editor-fg font-sans overflow-hidden select-none">

      <UnifiedSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        shortcuts={shortcuts}
        onUpdateShortcut={updateShortcut}
        onResetShortcuts={resetShortcuts}
        aiConfig={aiConfig}
        onSaveAIConfig={setAiConfig}
        generalSettings={generalSettings}
        onSaveGeneralSettings={setGeneralSettings}
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
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onToggleJsonPath={() => setIsJsonPathPanelOpen(!isJsonPathPanelOpen)}
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
        <div className="flex-1 flex min-w-0 bg-editor-bg">

          {/* 左栏：源文件编辑 */}
          <div data-tour="source-editor" style={{ width: `${leftPaneWidthPercent}%` }} className="flex flex-col min-w-[100px] h-full relative">
            <CodeEditor
              value={input}
              originalValue={activeFileId ? files.find(f => f.id === activeFileId)?.savedContent : undefined}
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
              restoreViewState={activeFileId ? files.find(f => f.id === activeFileId)?.viewState : undefined}
              placeholder="// 在此输入 JSON 或文本..."
              error={validation.isValid ? undefined : validation.error}
              headerActions={
                <button
                  data-tour="auto-save"
                  onClick={() => activeFileId && setIsAutoSaveEnabled(!isAutoSaveEnabled)}
                  disabled={!activeFileId}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border ${!activeFileId
                    ? 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
                    : isAutoSaveEnabled
                      ? 'bg-status-success-bg text-status-success-text border-status-success-border'
                      : 'text-gray-400 border-transparent hover:bg-editor-active'
                    }`}
                  title={
                    !activeFileId
                      ? "请先打开文件以启用自动保存"
                      : isAutoSaveEnabled
                        ? "自动保存已开启"
                        : "点击开启自动保存"
                  }
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${!activeFileId
                    ? 'bg-gray-700'
                    : isAutoSaveEnabled
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
              canToggleReadOnly={true} // 允许解锁编辑
              placeholder="// 结果显示区..."
              error={!previewValidation.isValid ? (previewValidation.error || "Error") : undefined}
              highlightRange={highlightRange}
              onSchemeEdit={handleSchemeEdit}
              headerActions={
                <button
                  onClick={async () => {
                    if (!output.trim()) return;
                    try {
                      await navigator.clipboard.writeText(output);
                      showSuccess('已复制预览内容');
                    } catch {
                      showError('复制失败');
                    }
                  }}
                  disabled={!output.trim()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 hover:bg-editor-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="复制预览内容到剪贴板"
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

        {/* JSONPath 查询面板 */}
        <JsonPathPanel
          jsonData={deepFormattedOutput} // 使用深度格式化数据源
          isOpen={isJsonPathPanelOpen}
          onClose={() => {
            setIsJsonPathPanelOpen(false);
            setHighlightRange(null); // 关闭时清除高亮
          }}
          onQueryResult={handleJsonPathQuery}
        />

        {/* Scheme 解析面板（独立模式） */}
        <SchemeViewerModal
          isOpen={isSchemeDecodeOpen}
          onClose={() => setIsSchemeDecodeOpen(false)}
          standalone={true}
          onApply={(encodedValue: string) => {
            setInput(encodedValue);
            inputRef.current = encodedValue;
            updateActiveFileContent(encodedValue);
          }}
        />

        {/* 模板填充面板 */}
        <TemplateFillPanel
          isOpen={isTemplatePanelOpen}
          onClose={() => setIsTemplatePanelOpen(false)}
          onApplyTemplate={handleApplyTemplate}
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
        cursorLine={cursorPosition.line}
        cursorColumn={cursorPosition.column}
      />
    </div>
    </ErrorBoundary>
  );
};

export default App;
