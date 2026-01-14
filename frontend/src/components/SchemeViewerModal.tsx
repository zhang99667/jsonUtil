import React, { useState, useEffect, useMemo } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
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

export const SchemeViewerModal: React.FC<SchemeViewerModalProps> = ({
  isOpen,
  onClose,
  path,
  value,
  onApply,
}) => {
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

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

  // 头部额外内容：path 标签
  const headerExtra = (
    <span 
      className="text-xs text-gray-400 font-mono bg-editor-active px-2 py-0.5 rounded truncate max-w-[200px]" 
      title={path}
    >
      {path}
    </span>
  );

  // 底部操作栏
  const footer = (
    <>
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
    </DraggablePanel>
  );
};