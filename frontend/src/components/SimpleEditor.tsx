import React, { useMemo, useCallback, useLayoutEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { tryParseJsonValue } from '../utils/jsonValueGuards';
import type { SchemeDisplayHeaderRecord } from '../utils/schemeTypes';

export type SimpleEditorDisplayHeader = Pick<
  SchemeDisplayHeaderRecord,
  'headerKey' | 'header' | 'source'
>;

export interface SimpleEditorProps {
  value: string;
  onChange?: (value: string) => void;
  path?: string;
  ariaLabel?: string;
  language?: string;           // 指定语言，不指定则自动检测
  readOnly?: boolean;
  height?: string | number;
  className?: string;
  placeholder?: string;
  showColorPreview?: boolean;
  displayHeaders?: readonly SimpleEditorDisplayHeader[];
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDisplayHeaderKind = (headerKey: string): 'url' | 'scheme' => (
  headerKey.startsWith('__url') ? 'url' : 'scheme'
);

const getDisplayHeaderLabel = (headerKey: string): string => (
  getDisplayHeaderKind(headerKey) === 'url' ? 'URL 来源' : 'Scheme 来源'
);

/**
 * 轻量级编辑器组件
 * 封装 Monaco Editor 的基础配置，用于简单的代码展示和编辑场景
 */
export const SimpleEditor: React.FC<SimpleEditorProps> = React.memo(({
  value,
  onChange,
  path,
  ariaLabel,
  language,
  readOnly = false,
  height = '100%',
  className = '',
  placeholder,
  showColorPreview = false,
  displayHeaders = [],
}) => {
  const monaco = useMonaco();
  // 自动检测语言
  const detectedLanguage = useMemo(() => {
    if (language) return language;
    if (!value) return 'plaintext';

    const trimmed = value.trim();
    if (
      (trimmed.startsWith('{') || trimmed.startsWith('['))
      && tryParseJsonValue(trimmed) !== undefined
    ) {
      return 'json';
    }
    if (trimmed.startsWith('<')) return 'xml';
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return 'html';

    return 'plaintext';
  }, [value, language]);

  const [mountedEditor, setMountedEditor] = useState<editor.IStandaloneCodeEditor | null>(null);

  useLayoutEffect(() => {
    if (!mountedEditor || !monaco || detectedLanguage !== 'json' || displayHeaders.length === 0) return;

    const model = mountedEditor.getModel();
    if (!model) return;

    const pendingHeaders = new Map<string, SimpleEditorDisplayHeader[]>();
    displayHeaders.forEach(header => {
      const entries = pendingHeaders.get(header.headerKey) || [];
      entries.push(header);
      pendingHeaders.set(header.headerKey, entries);
    });

    const decorations: editor.IModelDeltaDecoration[] = [];
    const widgets: Array<{
      label: HTMLElement;
      widget: editor.IContentWidget;
    }> = [];

    for (let lineNumber = 1; lineNumber <= model.getLineCount(); lineNumber += 1) {
      const lineContent = model.getLineContent(lineNumber);
      pendingHeaders.forEach((headers, headerKey) => {
        if (headers.length === 0) return;

        const keyMatch = new RegExp(`("${escapeRegExp(headerKey)}")\\s*:`).exec(lineContent);
        if (!keyMatch) return;

        const header = headers.shift();
        if (!header) return;

        const startColumn = keyMatch.index + 1;
        const keyLength = keyMatch[1].length;
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn,
            endLineNumber: lineNumber,
            endColumn: startColumn + keyLength,
          },
          options: {
            inlineClassName: 'scheme-display-header-inline-hidden',
          },
        });

        const label = document.createElement('span');
        const labelText = getDisplayHeaderLabel(header.headerKey);
        label.className = 'scheme-display-header-inline-label';
        label.textContent = labelText;
        label.title = `协议头: ${header.header}\n点击左侧小眼睛查看完整原始地址`;
        label.setAttribute('aria-label', `${labelText}，协议头：${header.header}`);
        label.setAttribute('data-source-kind', getDisplayHeaderKind(header.headerKey));
        label.setAttribute('data-source-header', header.header);

        const widget: editor.IContentWidget = {
          allowEditorOverflow: false,
          suppressMouseDown: true,
          getId: () => `scheme-display-header-inline-${lineNumber}-${header.headerKey}`,
          getDomNode: () => label,
          getPosition: () => ({
            position: { lineNumber, column: startColumn },
            preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
          }),
        };
        mountedEditor.addContentWidget(widget);
        widgets.push({ label, widget });
      });
    }

    const decorationCollection = mountedEditor.createDecorationsCollection(decorations);
    return () => {
      decorationCollection.clear();
      widgets.forEach(({ widget }) => mountedEditor.removeContentWidget(widget));
    };
  }, [detectedLanguage, displayHeaders, monaco, mountedEditor, value]);

  const handleChange = useCallback((val: string | undefined) => {
    onChange?.(val || '');
  }, [onChange]);

  return (
    <div className={`overflow-hidden ${className}`} style={{ height }}>
      <Editor
        height="100%"
        path={path}
        language={detectedLanguage}
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        onMount={instance => setMountedEditor(instance)}
        options={{
          readOnly,
          ariaLabel,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: '"Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          folding: true,
          hover: {
            enabled: true,
            delay: 450,
            sticky: true,
          },
          padding: { top: 8, bottom: 8 },
          scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerBorder: false,
          renderLineHighlight: 'line',
          ...(placeholder ? { placeholder } : {}),
          ...(showColorPreview && detectedLanguage === 'json'
            ? {
                colorDecorators: true,
                defaultColorDecorators: 'always' as const,
              }
            : {}),
        }}
        loading={
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs bg-editor-bg">
            加载编辑器...
          </div>
        }
      />
    </div>
  );
});
