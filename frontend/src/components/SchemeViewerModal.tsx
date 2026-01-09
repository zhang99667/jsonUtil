import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { 
  deepDecodeScheme, 
  encodeWithLayers, 
  SchemeDecodeResult,
  SchemeType 
} from '../utils/schemeUtils';

interface SchemeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  path: string;           // JSON Path，如 "$.action_cmd"
  value: string;          // 原始 scheme 字符串
  onApply?: (newValue: string) => void;  // 应用修改后的值
}

const schemeTypeLabels: Record<SchemeType, string> = {
  'url': 'URL',
  'url-encoded': 'URL 编码',
  'base64': 'Base64',
  'jwt': 'JWT Token',
  'json': 'JSON',
  'plain': '纯文本',
};

// 最小尺寸，防止内容折叠
const MIN_WIDTH = 450;
const MIN_HEIGHT = 300;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 600;

export const SchemeViewerModal: React.FC<SchemeViewerModalProps> = ({
  isOpen,
  onClose,
  path,
  value,
  onApply,
}) => {
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  
  // 面板位置和大小（持久化）
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('scheme-panel-position');
      return saved ? JSON.parse(saved) : { x: 150, y: 80 };
    } catch {
      return { x: 150, y: 80 };
    }
  });
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem('scheme-panel-size');
      return saved ? JSON.parse(saved) : { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    } catch {
      return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    }
  });
  
  // 拖拽和调整大小状态
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'width' | 'height' | 'both' | false>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);

  // 解析 scheme（添加空值保护）
  const decodeResult = useMemo<SchemeDecodeResult>(() => {
    if (!value) {
      return {
        original: '',
        decoded: '',
        layers: [],
        isJson: false,
      };
    }
    return deepDecodeScheme(value);
  }, [value]);

  // 初始化编辑内容
  useEffect(() => {
    setEditedContent(decodeResult.decoded);
    setIsEditing(false);
  }, [decodeResult.decoded]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      // 可以添加 toast 提示
    } catch (err) {
      console.error('Failed to copy:', err);
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

  // 保存位置到 localStorage
  useEffect(() => {
    localStorage.setItem('scheme-panel-position', JSON.stringify(position));
  }, [position]);

  // 保存大小到 localStorage
  useEffect(() => {
    localStorage.setItem('scheme-panel-size', JSON.stringify(size));
  }, [size]);

  // 处理拖动和调整大小
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        if (isResizing === 'width') {
          setSize(prev => ({
            ...prev,
            width: Math.max(MIN_WIDTH, startSize.width + deltaX)
          }));
        } else if (isResizing === 'height') {
          setSize(prev => ({
            ...prev,
            height: Math.max(MIN_HEIGHT, startSize.height + deltaY)
          }));
        } else if (isResizing === 'both') {
          setSize({
            width: Math.max(MIN_WIDTH, startSize.width + deltaX),
            height: Math.max(MIN_HEIGHT, startSize.height + deltaY)
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isResizing, resizeStart, startSize]);

  // 拖动面板
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  // 调整大小
  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'width' | 'height' | 'both') => {
    e.stopPropagation();
    setResizeStart({ x: e.clientX, y: e.clientY });
    setStartSize({ width: size.width, height: size.height });
    setIsResizing(direction);
  };

  // 早期返回必须在所有 hooks 之后
  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bg-editor-sidebar border border-editor-border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* 头部 - 可拖动 */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-editor-sidebar border-b border-editor-border rounded-t-lg cursor-grab active:cursor-grabbing flex-shrink-0"
        onMouseDown={handleMouseDown}
      >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔗</span>
            <span className="text-white font-medium">Scheme 解析</span>
            <span className="text-xs text-gray-400 font-mono bg-editor-active px-2 py-0.5 rounded">
              {path}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-editor-active"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex flex-col p-2 gap-2 bg-editor-bg min-h-0 overflow-hidden">
          {/* Scheme 信息 */}
          {decodeResult.schemeInfo && (
            <div className="bg-editor-sidebar rounded-lg p-3 border border-editor-border">
              <div className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Scheme 信息
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-blue-900/50 text-blue-300 px-2.5 py-1 rounded font-mono text-xs">
                  {decodeResult.schemeInfo.protocol}
                </span>
                {decodeResult.schemeInfo.host && (
                  <span className="bg-editor-bg text-gray-300 px-2.5 py-1 rounded text-xs">{decodeResult.schemeInfo.host}</span>
                )}
                {decodeResult.schemeInfo.path && (
                  <span className="bg-editor-bg text-gray-400 px-2.5 py-1 rounded text-xs">{decodeResult.schemeInfo.path}</span>
                )}
              </div>
            </div>
          )}

          {/* 解码层级 */}
          {decodeResult.layers.length > 0 && (
            <div className="bg-editor-sidebar rounded-lg p-3 border border-editor-border">
              <div className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                解码层级
              </div>
              <div className="flex flex-wrap items-center gap-2 bg-editor-bg rounded p-2">
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">原始</span>
                {decodeResult.layers.map((layer, index) => (
                  <React.Fragment key={index}>
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded text-xs font-medium">
                      {layer.description}
                    </span>
                  </React.Fragment>
                ))}
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded font-medium">
                  {decodeResult.isJson ? 'JSON' : '文本'}
                </span>
              </div>
            </div>
          )}

          {/* 原始值预览（折叠） */}
          <details className="bg-editor-sidebar rounded-lg border border-editor-border">
            <summary className="px-3 py-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300 font-medium flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              原始值 <span className="text-gray-500 font-normal">({value?.length || 0} 字符)</span>
            </summary>
            <div className="px-3 pb-3">
              <div className="bg-editor-bg rounded p-2.5 text-xs font-mono text-gray-400 break-all max-h-24 overflow-auto border border-editor-border">
                {value || '(空)'}
              </div>
            </div>
          </details>

          {/* 解码结果（可编辑，使用 SimpleEditor） - 自适应剩余高度 */}
          <div className="bg-editor-sidebar rounded-lg p-3 border border-editor-border flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                解码结果 
                {isEditing && <span className="text-yellow-400 ml-2 font-normal">· 已修改</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono uppercase bg-editor-bg px-1.5 py-0.5 rounded">{editorLanguage}</span>
                {decodeResult.isJson && (
                  <span className="text-[10px] text-status-success-text bg-status-success-bg px-2 py-0.5 rounded border border-status-success-border">
                    Valid JSON
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-[120px]">
              <SimpleEditor
                value={editedContent}
                onChange={handleContentChange}
                language={editorLanguage}
                height="100%"
                className="border border-editor-border rounded h-full"
              />
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-editor-border bg-editor-sidebar flex-shrink-0">
          <div className="text-xs text-gray-500">
            {decodeResult.layers.length > 0 
              ? `${decodeResult.layers.length} 层解码` 
              : '无需解码'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              复制
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
        </div>

        {/* 右侧调整宽度手柄 */}
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-10 group/resize-w"
          onMouseDown={(e) => handleResizeMouseDown(e, 'width')}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-600 rounded-full opacity-0 group-hover/resize-w:opacity-50 transition-opacity"></div>
        </div>

        {/* 底部调整高度手柄 */}
        <div
          className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-10 group/resize-h"
          onMouseDown={(e) => handleResizeMouseDown(e, 'height')}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 bg-gray-600 rounded-full opacity-0 group-hover/resize-h:opacity-50 transition-opacity"></div>
        </div>

        {/* 右下角同时调整宽高手柄 */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 group/resize-both"
          onMouseDown={(e) => handleResizeMouseDown(e, 'both')}
        >
          <svg 
            className="w-3 h-3 text-gray-600 opacity-0 group-hover/resize-both:opacity-70 transition-opacity absolute bottom-0.5 right-0.5" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
    </div>
  );
};