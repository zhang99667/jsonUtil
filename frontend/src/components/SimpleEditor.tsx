import React, { useMemo } from 'react';
import Editor from '@monaco-editor/react';

export interface SimpleEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;           // 指定语言，不指定则自动检测
  readOnly?: boolean;
  height?: string | number;
  className?: string;
  placeholder?: string;
}

/**
 * 轻量级编辑器组件
 * 封装 Monaco Editor 的基础配置，用于简单的代码展示和编辑场景
 */
export const SimpleEditor: React.FC<SimpleEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = '100%',
  className = '',
  placeholder,
}) => {
  // 自动检测语言
  const detectedLanguage = useMemo(() => {
    if (language) return language;
    if (!value) return 'plaintext';
    
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // 不是有效 JSON
      }
    }
    if (trimmed.startsWith('<')) return 'xml';
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return 'html';
    
    return 'plaintext';
  }, [value, language]);

  const handleChange = (val: string | undefined) => {
    onChange?.(val || '');
  };

  return (
    <div className={`overflow-hidden ${className}`} style={{ height }}>
      <Editor
        height="100%"
        language={detectedLanguage}
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: '"Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          folding: true,
          padding: { top: 8, bottom: 8 },
          scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerBorder: false,
          renderLineHighlight: 'line',
        }}
        loading={
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs bg-editor-bg">
            加载编辑器...
          </div>
        }
      />
    </div>
  );
};