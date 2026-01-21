import React, { useState, useEffect, useMemo } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { 
  deepDecodeScheme, 
  encodeWithLayers, 
  SchemeDecodeResult,
  SchemeType 
} from '../utils/schemeUtils';

interface SchemeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  path?: string;           // JSON Path，如 "$.action_cmd"（独立模式下可选）
  value?: string;          // 原始 scheme 字符串（独立模式下可选）
  onApply?: (newValue: string) => void;  // 应用修改后的值
  standalone?: boolean;    // 是否为独立模式（侧边栏打开，可手动输入）
}

const schemeTypeLabels: Record<SchemeType, string> = {
  'url': 'URL',
  'url-encoded': 'URL 编码',
  'base64': 'Base64',
  'jwt': 'JWT Token',
  'json': 'JSON',
  'plain': '纯文本',
};

export const SchemeViewerModal: React.FC<SchemeViewerModalProps> = ({
  isOpen,
  onClose,
  path,
  value,
  onApply,
  standalone = false,
}) => {
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  
  // 独立模式下的输入值
  const [standaloneInput, setStandaloneInput] = useState<string>('');
  
  // 实际使用的原始值：独立模式用输入值，否则用 prop 传入的值
  const actualValue = standalone ? standaloneInput : (value || '');

  // 自定义滚动条 Hook
  const {
    scrollContainerRef,
    handleScroll,
    handleMouseDown: handleScrollbarMouseDown,
    thumbSize: thumbHeight,
    thumbOffset: thumbTop,
    showScrollbar,
  } = useCustomScrollbar('vertical', actualValue);

  // 解析 scheme（添加空值保护）
  const decodeResult = useMemo<SchemeDecodeResult>(() => {
    if (!actualValue) {
      return {
        original: '',
        decoded: '',
        layers: [],
        isJson: false,
      };
    }
    return deepDecodeScheme(actualValue);
  }, [actualValue]);

  // 初始化编辑内容
  useEffect(() => {
    setEditedContent(decodeResult.decoded);
    setIsEditing(false);
  }, [decodeResult.decoded]);

  // 独立模式打开时清空之前的输入
  useEffect(() => {
    if (isOpen && standalone) {
      // 可以选择保留上次输入或清空
      // setStandaloneInput('');
    }
  }, [isOpen, standalone]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      // 可以添加 toast 提示
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(actualValue);
      // 可以添加 toast 提示
    } catch (err) {
      console.error('Failed to copy original:', err);
    }
  };

  const handleApply = () => {
    if (onApply) {
      // 将编辑后的内容按原编码层级重新编码
      const encoded = encodeWithLayers(editedContent, decodeResult.layers);
      onApply(encoded);
    }
    onClose();
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setIsEditing(true);
  };
  
  // 自动检测语言
  const editorLanguage = useMemo(() => {
    if (decodeResult.isJson) return 'json';
    // 尝试检测其他格式
    const trimmed = editedContent.trim();
    if (trimmed.startsWith('<')) return 'xml';
    return 'plaintext';
  }, [decodeResult.isJson, editedContent]);

  // 头部额外内容：非独立模式显示 path 标签
  const headerExtra = !standalone && path ? (
    <span 
      className="text-xs text-gray-400 font-mono bg-editor-active px-2 py-0.5 rounded truncate max-w-[200px]" 
      title={path}
    >
      {path}
    </span>
  ) : null;

  // 底部操作栏
  const footer = (
    <>
      <div className="text-xs text-gray-500">
        {decodeResult.layers.length > 0 
          ? `${decodeResult.layers.length} 层解码` 
          : actualValue ? '无需解码' : '请输入待解码内容'}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          关闭
        </button>
        <button
          onClick={handleCopyOriginal}
          disabled={!actualValue}
          className="px-3 py-1.5 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          复制原始值
        </button>
        <button
          onClick={handleCopy}
          disabled={!editedContent}
          className="px-3 py-1.5 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制解码结果
        </button>
        {onApply && isEditing && (
          <button
            onClick={handleApply}
            className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            应用修改
          </button>
        )}
      </div>
    </>
  );

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Scheme 解析"
      icon={PanelIcons.Link}
      headerExtra={headerExtra}
      storageKey="scheme-panel"
      defaultPosition={{ x: 150, y: 80 }}
      defaultSize={{ width: 600, height: 600 }}
      minSize={{ width: 450, height: 300 }}
      footer={footer}
    >
      {/* 内容区域 */}
      <div className="flex-1 flex flex-col min-h-0 relative group/content">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 flex flex-col p-2 gap-1.5 bg-editor-bg min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        >
          {/* 独立模式：输入区域 - 紧凑版 */}
          {standalone && (
            <div className="bg-editor-sidebar rounded p-2 border border-editor-border">
              <div className="text-[11px] text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                输入原始值
              </div>
              <textarea
                value={standaloneInput}
                onChange={(e) => setStandaloneInput(e.target.value)}
                placeholder="粘贴需要解码的内容..."
                className="w-full h-20 bg-editor-bg text-gray-200 text-xs px-2 py-1.5 rounded border border-editor-border focus:border-emerald-500 focus:outline-none font-mono resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-500">{standaloneInput.length} 字符</span>
                <button
                  onClick={() => setStandaloneInput('')}
                  disabled={!standaloneInput}
                  className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  清空
                </button>
              </div>
            </div>
          )}

          {/* 上方信息卡片区域 - 横向紧凑布局 */}
          {(decodeResult.schemeInfo || decodeResult.layers.length > 0) && (
            <div className="bg-editor-sidebar rounded p-2 border border-editor-border flex flex-col gap-1.5">
              {/* Scheme 信息 - 紧凑单行 */}
              {decodeResult.schemeInfo && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Scheme:
                  </span>
                  <span className="bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                    {decodeResult.schemeInfo.protocol}
                  </span>
                  {decodeResult.schemeInfo.host && (
                    <span className="bg-editor-bg text-gray-300 px-1.5 py-0.5 rounded text-[10px]">{decodeResult.schemeInfo.host}</span>
                  )}
                  {decodeResult.schemeInfo.path && (
                    <span className="bg-editor-bg text-gray-400 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[150px]" title={decodeResult.schemeInfo.path}>
                      {decodeResult.schemeInfo.path}
                    </span>
                  )}
                </div>
              )}

              {/* 解码层级 - 紧凑单行 */}
              {decodeResult.layers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    解码:
                  </span>
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">原始</span>
                  {decodeResult.layers.map((layer, index) => (
                    <React.Fragment key={index}>
                      <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="bg-emerald-900/40 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {layer.description}
                      </span>
                    </React.Fragment>
                  ))}
                  <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-[10px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded font-medium">
                    {decodeResult.isJson ? 'JSON' : '文本'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 原始值预览（非独立模式下折叠显示） - 更紧凑 */}
          {!standalone && (
            <details className="bg-editor-sidebar rounded border border-editor-border">
              <summary className="px-2 py-1.5 text-[11px] text-gray-400 cursor-pointer hover:text-gray-300 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                原始值 <span className="text-gray-500 font-normal">({actualValue?.length || 0} 字符)</span>
              </summary>
              <div className="px-2 pb-2">
                <div className="bg-editor-bg rounded p-1.5 text-[10px] font-mono text-gray-400 break-all max-h-16 overflow-auto border border-editor-border">
                  {actualValue || '(空)'}
                </div>
              </div>
            </details>
          )}

          {/* 解码结果（可编辑，使用 SimpleEditor） - 占据剩余全部空间 */}
          <div className="bg-editor-sidebar rounded p-2 border border-editor-border flex-1 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
              <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                解码结果
                {isEditing && <span className="text-yellow-400 ml-1.5 font-normal">· 已修改</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 font-mono uppercase bg-editor-bg px-1 py-0.5 rounded">{editorLanguage}</span>
                {decodeResult.isJson && (
                  <span className="text-[9px] text-status-success-text bg-status-success-bg px-1.5 py-0.5 rounded border border-status-success-border">
                    Valid JSON
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-[120px]">
              {actualValue ? (
                <SimpleEditor
                  value={editedContent}
                  onChange={handleContentChange}
                  language={editorLanguage}
                  height="100%"
                  className="border border-editor-border rounded h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs border border-editor-border rounded bg-editor-bg">
                  {standalone ? '请在上方输入待解码的内容' : '无内容'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 自定义滚动条 */}
        {showScrollbar && (
          <div className="absolute right-0 top-0 bottom-0 w-[6px] z-10 opacity-0 group-hover/content:opacity-100 transition-opacity duration-200">
            <div
              className="w-full bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer relative"
              style={{
                height: `${thumbHeight}%`,
                top: `${thumbTop}%`
              }}
              onMouseDown={handleScrollbarMouseDown}
            />
          </div>
        )}
      </div>
    </DraggablePanel>
  );
};