import React, { useState, useEffect, useMemo } from 'react';
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

  // 早期返回必须在所有 hooks 之后
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-editor-bg border border-editor-border rounded-lg shadow-2xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
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
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Scheme 信息 */}
          {decodeResult.schemeInfo && (
            <div className="bg-editor-sidebar rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-2">Scheme 信息</div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">
                  {decodeResult.schemeInfo.protocol}
                </span>
                {decodeResult.schemeInfo.host && (
                  <span className="text-gray-300">{decodeResult.schemeInfo.host}</span>
                )}
                {decodeResult.schemeInfo.path && (
                  <span className="text-gray-400">{decodeResult.schemeInfo.path}</span>
                )}
              </div>
            </div>
          )}

          {/* 解码层级 */}
          {decodeResult.layers.length > 0 && (
            <div className="bg-editor-sidebar rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-2">解码层级</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">原始</span>
                {decodeResult.layers.map((layer, index) => (
                  <React.Fragment key={index}>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="bg-editor-active text-gray-200 px-2 py-0.5 rounded text-xs">
                      {layer.description}
                    </span>
                  </React.Fragment>
                ))}
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs text-green-400">
                  {decodeResult.isJson ? 'JSON' : '文本'}
                </span>
              </div>
            </div>
          )}

          {/* 原始值预览（折叠） */}
          <details className="bg-editor-sidebar rounded-lg">
            <summary className="px-3 py-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              原始值 ({value?.length || 0} 字符)
            </summary>
            <div className="px-3 pb-3">
              <div className="bg-editor-bg rounded p-2 text-xs font-mono text-gray-400 break-all max-h-20 overflow-auto">
                {value || '(空)'}
              </div>
            </div>
          </details>

          {/* 解码结果（可编辑，使用 SimpleEditor） */}
          <div className="bg-editor-sidebar rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-400">
                解码结果 
                {isEditing && <span className="text-yellow-400 ml-2">· 已修改</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono uppercase">{editorLanguage}</span>
                {decodeResult.isJson && (
                  <span className="text-xs bg-green-900/40 text-green-300 px-2 py-0.5 rounded">
                    Valid JSON
                  </span>
                )}
              </div>
            </div>
            <SimpleEditor
              value={editedContent}
              onChange={handleContentChange}
              language={editorLanguage}
              height={256}
              className="border border-editor-border rounded"
            />
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-editor-border bg-editor-sidebar">
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
      </div>
    </div>
  );
};