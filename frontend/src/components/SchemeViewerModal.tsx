import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { 
  deepDecodeScheme, 
  encodeWithLayers, 
  SchemeDecodeResult,
  SchemeType 
} from '../utils/schemeUtils';
import { QRCodeCanvas } from 'qrcode.react';

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
  
  // 二维码状态
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeType, setQRCodeType] = useState<'original' | 'decoded'>('original');
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  
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

  // 下载二维码
  const handleDownloadQRCode = () => {
    const canvas = qrCodeRef.current;
    if (!canvas) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `scheme-qrcode-${qrCodeType}.png`;
    link.href = url;
    link.click();
  };

  // 获取二维码内容
  const qrCodeContent = useMemo(() => {
    return qrCodeType === 'original' ? actualValue : editedContent;
  }, [qrCodeType, actualValue, editedContent]);

  // 检查内容是否适合生成二维码（不超过约2953字符）
  const isQRCodeValid = useMemo(() => {
    return qrCodeContent && qrCodeContent.length > 0 && qrCodeContent.length <= 2953;
  }, [qrCodeContent]);
  
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
      <div className="flex items-center gap-1.5">
        <button
          onClick={onClose}
          className="px-2.5 py-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          关闭
        </button>
        <button
          onClick={() => setShowQRCode(!showQRCode)}
          disabled={!actualValue}
          className={`px-2.5 py-1 text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            showQRCode 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-editor-active text-gray-200 hover:bg-editor-border'
          }`}
          title="生成二维码"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          二维码
        </button>
        <button
          onClick={handleCopyOriginal}
          disabled={!actualValue}
          className="px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          复制原始值
        </button>
        <button
          onClick={handleCopy}
          disabled={!editedContent}
          className="px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制解码结果
        </button>
        {onApply && isEditing && (
          <button
            onClick={handleApply}
            className="px-2.5 py-1 text-sm bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {/* 独立模式：输入区域 */}
          {standalone && (
            <div className="bg-editor-sidebar rounded p-3 border border-editor-border">
              <div className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                输入原始值
              </div>
              <textarea
                value={standaloneInput}
                onChange={(e) => setStandaloneInput(e.target.value)}
                placeholder="粘贴需要解码的内容..."
                className="w-full h-20 bg-editor-bg text-gray-200 text-sm px-3 py-2 rounded border border-editor-border focus:border-emerald-500 focus:outline-none font-mono resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{standaloneInput.length} 字符</span>
                <button
                  onClick={() => setStandaloneInput('')}
                  disabled={!standaloneInput}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  清空
                </button>
              </div>
            </div>
          )}

          {/* 上方信息卡片区域 */}
          {(decodeResult.schemeInfo || decodeResult.layers.length > 0) && (
            <div className="bg-editor-sidebar rounded p-3 border border-editor-border flex flex-col gap-2">
              {/* Scheme 信息 */}
              {decodeResult.schemeInfo && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Scheme:
                  </span>
                  <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded font-mono text-xs">
                    {decodeResult.schemeInfo.protocol}
                  </span>
                  {decodeResult.schemeInfo.host && (
                    <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded text-xs">{decodeResult.schemeInfo.host}</span>
                  )}
                  {decodeResult.schemeInfo.path && (
                    <span className="bg-editor-bg text-gray-400 px-2 py-0.5 rounded text-xs truncate max-w-[200px]" title={decodeResult.schemeInfo.path}>
                      {decodeResult.schemeInfo.path}
                    </span>
                  )}
                </div>
              )}

              {/* 解码层级 */}
              {decodeResult.layers.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    解码:
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">原始</span>
                  {decodeResult.layers.map((layer, index) => (
                    <React.Fragment key={index}>
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded text-xs font-medium">
                        {layer.description}
                      </span>
                    </React.Fragment>
                  ))}
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded font-medium">
                    {decodeResult.isJson ? 'JSON' : '文本'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 原始值预览（非独立模式下折叠显示） */}
          {!standalone && (
            <details className="bg-editor-sidebar rounded border border-editor-border">
              <summary className="px-3 py-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                原始值 <span className="text-gray-500 font-normal">({actualValue?.length || 0} 字符)</span>
              </summary>
              <div className="px-3 pb-2">
                <div className="bg-editor-bg rounded p-2 text-xs font-mono text-gray-400 break-all max-h-20 overflow-auto border border-editor-border">
                  {actualValue || '(空)'}
                </div>
              </div>
            </details>
          )}

          {/* 二维码区域 */}
          {showQRCode && (
            <div className="bg-editor-sidebar rounded p-3 border border-editor-border">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  二维码
                </div>
                <div className="flex items-center gap-2">
                  {/* 类型切换 */}
                  <div className="flex items-center bg-editor-bg rounded p-0.5 text-xs">
                    <button
                      onClick={() => setQRCodeType('original')}
                      className={`px-2 py-1 rounded transition-colors ${
                        qrCodeType === 'original' 
                          ? 'bg-editor-active text-white' 
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      原始值
                    </button>
                    <button
                      onClick={() => setQRCodeType('decoded')}
                      className={`px-2 py-1 rounded transition-colors ${
                        qrCodeType === 'decoded' 
                          ? 'bg-editor-active text-white' 
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      解码结果
                    </button>
                  </div>
                  {/* 下载按钮 */}
                  <button
                    onClick={handleDownloadQRCode}
                    disabled={!isQRCodeValid}
                    className="px-2 py-1 text-xs bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="下载二维码"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载
                  </button>
                </div>
              </div>
              
              {/* 二维码显示 */}
              <div className="flex flex-col items-center justify-center py-4 bg-white rounded">
                {isQRCodeValid ? (
                  <QRCodeCanvas
                    ref={qrCodeRef}
                    value={qrCodeContent}
                    size={200}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm">
                      {!qrCodeContent 
                        ? '无内容可生成二维码' 
                        : '内容过长，无法生成二维码（最大约 2953 字符）'
                      }
                    </p>
                    {qrCodeContent && (
                      <p className="text-xs mt-1">当前长度: {qrCodeContent.length} 字符</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* 内容长度提示 */}
              {isQRCodeValid && (
                <div className="text-xs text-gray-500 text-center mt-2">
                  {qrCodeType === 'original' ? '原始值' : '解码结果'}: {qrCodeContent.length} 字符
                </div>
              )}
            </div>
          )}

          {/* 解码结果（可编辑，使用 SimpleEditor） */}
          <div className="bg-editor-sidebar rounded p-3 border border-editor-border flex-1 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                解码结果
                {isEditing && <span className="text-yellow-400 ml-2 font-normal">· 已修改</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono uppercase bg-editor-bg px-1.5 py-0.5 rounded">{editorLanguage}</span>
                {decodeResult.isJson && (
                  <span className="text-xs text-status-success-text bg-status-success-bg px-2 py-0.5 rounded border border-status-success-border">
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