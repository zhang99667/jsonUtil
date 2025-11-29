
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ActionPanel } from './components/ActionPanel';
import { CodeEditor } from './components/Editor';
import { JsonPathPanel } from './components/JsonPathPanel';
import {
  validateJson,
  performTransform,
  performInverseTransform
} from './utils/transformations';
import { fixJsonWithAI } from './services/aiService';
import { UnifiedSettingsModal } from './components/UnifiedSettingsModal';
import { TransformMode, ActionType, ValidationResult, ShortcutConfig, ShortcutKey, ShortcutAction, FileTab, AIConfig, AIProvider, HighlightRange } from './types';
import { parse } from 'json-source-map';
import { JSONPath } from 'jsonpath-plus';
import { useShortcuts } from './hooks/useShortcuts';
import { useFileSystem } from './hooks/useFileSystem';
import { useLayout } from './hooks/useLayout';



const MODE_LABELS: Record<TransformMode, string> = {
  [TransformMode.NONE]: '原始视图',
  [TransformMode.FORMAT]: '格式化',
  [TransformMode.DEEP_FORMAT]: '深度格式化',
  [TransformMode.MINIFY]: '压缩',
  [TransformMode.ESCAPE]: '转义',
  [TransformMode.UNESCAPE]: '反转义',
  [TransformMode.UNICODE_TO_CN]: 'Unicode 转中文',
  [TransformMode.CN_TO_UNICODE]: '中文 转 Unicode',
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

  // 计算派生输出
  const output = useMemo(() => {
    // 若处于输出编辑状态，优先返回暂存值以避免覆盖用户输入
    if (isUpdatingFromOutput.current && pendingOutputValue.current) {
      return pendingOutputValue.current;
    }
    const result = performTransform(input, mode);
    // 模式切换或新转换时清除暂存值
    if (!isUpdatingFromOutput.current) {
      pendingOutputValue.current = '';
    }
    return result;
  }, [input, mode]);

  // JSONPath 查询专用数据源（强制深度格式化）
  // 确保查询功能支持嵌套 JSON 搜索
  const deepFormattedOutput = useMemo(() => {
    // 性能优化：复用现有深度格式化结果
    if (mode === TransformMode.DEEP_FORMAT && !isUpdatingFromOutput.current) {
      return output;
    }
    return performTransform(input, TransformMode.DEEP_FORMAT);
  }, [input, mode, output]);

  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });

  const [highlightRange, setHighlightRange] = useState<HighlightRange | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isJsonPathPanelOpen, setIsJsonPathPanelOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<'SOURCE' | 'PREVIEW' | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

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

  // 界面布局状态 (Hook)
  const appRef = useRef<HTMLDivElement>(null);
  const {
    sidebarWidth, setSidebarWidth,
    isSidebarCollapsed, setIsSidebarCollapsed,
    leftPaneWidthPercent, setLeftPaneWidthPercent,
    isResizingSidebar, isResizingPane,
    startResizingSidebar, startResizingPane
  } = useLayout(appRef);

  // 文件系统状态 (Hook)
  const {
    files, setFiles, activeFileId, isAutoSaveEnabled, setIsAutoSaveEnabled,
    createNewTab, openFile, saveFile, saveSourceAs, closeFile, switchTab, updateActiveFileContent
  } = useFileSystem({
    input, setInput, inputRef, setMode, output
  });

  // 统一的保存处理逻辑
  const handleSaveShortcut = useCallback(async () => {
    if (activeFileId) {
      // 如果已打开文件，根据焦点保存不同内容到该文件
      if (activeEditor === 'PREVIEW') {
        // Preview 聚焦：保存 Preview 内容到文件
        const success = await saveFile(output);
        if (success) showToast("已将预览结果保存到文件");
      } else {
        // Source 聚焦：保存 Source 内容到文件
        const success = await saveFile(); // 默认保存 input
        if (success) showToast("已保存源文件");
      }
    } else {
      // 未打开文件：另存为
      if (activeEditor === 'PREVIEW') {
        await savePreview(); // 另存为 Preview
      } else {
        const success = await saveSourceAs(); // 另存为 Source
        if (success) showToast("已另存为源文件");
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

  // 同步模式变更到活动文件
  useEffect(() => {
    if (activeFileId) {
      setFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, mode } : f
      ));
    }
  }, [mode, activeFileId]);


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
  const handleInputChange = (newVal: string) => {
    // 实时清理不可见字符
    const cleanVal = newVal.replace(/[\u200B-\u200D\uFEFF]/g, '');
    setInput(cleanVal);

    // 同步更新 Ref 状态
    inputRef.current = cleanVal;

    // 更新活动文件内容缓存
    updateActiveFileContent(cleanVal);

    // 移除模式重置逻辑，保持当前视图模式
    // if (mode !== TransformMode.NONE) {
    //   setMode(TransformMode.NONE);
    // }
  };

  // 右侧预览编辑处理（反向转换）
  // 仅在解除只读锁定后触发
  const handleOutputChange = (newVal: string) => {
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

      // 使用 Ref 获取最新输入源，避免闭包陷阱
      const newSource = performInverseTransform(newVal, mode, inputRef.current);
      setInput(newSource);

      // 同步更新 Ref
      inputRef.current = newSource;

      // 同步更新文件缓存
      updateActiveFileContent(newSource);

      // 重置更新标志
      setTimeout(() => {
        isUpdatingFromOutput.current = false;
        pendingOutputValue.current = '';
      }, 100);
    }, 150); // 防抖延迟 150ms
  };



  const savePreview = async () => {
    try {
      // @ts-ignore - Window interface extension
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
      showToast("已保存预览结果");
    } catch (err) {
      console.error('Failed to save preview:', err);
    }
  };

  const handleAction = async (action: ActionType) => {
    if (action === ActionType.AI_FIX) {
      if (!input.trim()) return;
      setIsProcessing(true);
      try {
        // AI 修复针对源输入进行
        const fixed = await fixJsonWithAI(input, aiConfig);
        setInput(fixed);
        inputRef.current = fixed; // 同步 Ref 状态
        // 修复后自动切换至格式化视图
        setMode(TransformMode.FORMAT);
      } catch (e: any) {
        setValidation({ isValid: false, error: e.message });
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
          if (success) showToast("已保存源文件");
        } else {
          // If no file open, Save As
          const success = await saveSourceAs();
          if (success) showToast("已另存为源文件");
        }
      }
    } else if (action === ActionType.OPEN) {
      await openFile();
    } else if (action === ActionType.NEW_TAB) {
      createNewTab();
    }
  };





  // 处理 JSONPath 查询定位
  const handleJsonPathQuery = (resultString: string) => {
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
        path: resultString, // 这里 resultString 其实是 query 表达式，我们需要修改 JsonPathPanel 传回 query
        json: JSON.parse(currentOutput),
        resultType: 'pointer'
      });

      if (paths && paths.length > 0) {
        // 取第一个匹配项
        const pointer = paths[0];

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
              endColumn: valueEnd ? valueEnd.column + 1 : loc.column + 1 + (resultString.length) // 估算
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to locate JSON path:", e);
    }
  };

  return (
    <div ref={appRef} className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none">

      <UnifiedSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        shortcuts={shortcuts}
        onUpdateShortcut={updateShortcut}
        onResetShortcuts={resetShortcuts}
        aiConfig={aiConfig}
        onSaveAIConfig={setAiConfig}
      />

      {/* 主工作区容器 */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* 左侧工具栏 */}
        <div style={{ width: isSidebarCollapsed ? 64 : sidebarWidth }} className="flex-shrink-0 z-10 border-r border-[#1e1e1e] transition-all duration-300 ease-in-out">
          <ActionPanel
            activeMode={mode}
            onModeChange={setMode}
            onAction={handleAction}
            isProcessing={isProcessing}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onToggleJsonPath={() => setIsJsonPathPanelOpen(!isJsonPathPanelOpen)}
          />
        </div>

        {/* 侧边栏调整手柄 */}
        {!isSidebarCollapsed && (
          <div
            className={`w-1 hover:bg-[#007acc] cursor-col-resize z-20 flex-shrink-0 ${isResizingSidebar ? 'bg-[#007acc]' : 'bg-[#252526]'}`}
            onMouseDown={startResizingSidebar}
          ></div>
        )}

        {/* 双栏编辑器区域 */}
        <div className="flex-1 flex min-w-0 bg-[#1e1e1e]">

          {/* 左栏：源文件编辑 */}
          <div style={{ width: `${leftPaneWidthPercent}%` }} className="flex flex-col min-w-[100px] h-full relative">
            <CodeEditor
              value={input}
              onChange={handleInputChange}
              onFocus={() => setActiveEditor('SOURCE')}
              label="SOURCE"
              files={files}
              activeFileId={activeFileId}
              onTabClick={switchTab}
              onCloseFile={closeFile}
              onNewTab={createNewTab}
              placeholder="// 在此输入 JSON 或文本..."
              error={validation.isValid ? undefined : validation.error}
              headerActions={
                <button
                  onClick={() => activeFileId && setIsAutoSaveEnabled(!isAutoSaveEnabled)}
                  disabled={!activeFileId}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border ${!activeFileId
                    ? 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
                    : isAutoSaveEnabled
                      ? 'bg-green-900/30 text-green-300 border-green-900/50'
                      : 'text-gray-400 border-transparent hover:bg-[#333]'
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
            className={`w-1 hover:bg-[#007acc] cursor-col-resize z-20 flex-shrink-0 ${isResizingPane ? 'bg-[#007acc]' : 'bg-[#252526]'}`}
            onMouseDown={startResizingPane}
          ></div>

          {/* 右栏：预览与结果 */}
          <div className="flex-1 flex flex-col min-w-[100px] h-full relative">
            <CodeEditor
              label="PREVIEW"
              value={output}
              onChange={handleOutputChange}
              onFocus={() => setActiveEditor('PREVIEW')}
              readOnly={true} // 默认只读状态
              canToggleReadOnly={true} // 允许解锁编辑
              placeholder="// 结果显示区..."
              error={!previewValidation.isValid ? (previewValidation.error || "Error") : undefined}
              highlightRange={highlightRange}
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

        {/* 拖拽遮罩层（防止 iframe/webview 捕获事件） */}
        {(isResizingSidebar || isResizingPane) && (
          <div className="absolute inset-0 z-50 cursor-col-resize"></div>
        )}

        {/* Toast Notification */}
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-[#007acc] text-white px-4 py-2 rounded shadow-lg text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {toast.message}
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 text-[11px] text-white select-none z-20 flex-shrink-0">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg> UTF-8</span>
          <span>Length: {input.length}</span>
          {activeFileId && (
            <span className="flex items-center gap-1 text-blue-200">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {files.find(f => f.id === activeFileId)?.name}
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className="opacity-80">当前视图:</span>
          <span className="bg-white text-[#007acc] px-1.5 py-0.5 rounded font-bold text-[11px] shadow-sm leading-none">
            {MODE_LABELS[mode]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;
