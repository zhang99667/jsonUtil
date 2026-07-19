import React, { Suspense, lazy, useEffect, useState } from 'react';
import type { ExtendedEditorProps } from './Editor';

const LazyCodeEditor = lazy(() => import('./Editor').then(module => ({
  default: module.CodeEditor,
})));

const EditorFallback: React.FC<ExtendedEditorProps & { isLoading?: boolean; onActivate: () => void }> = ({
  value,
  onChange,
  onFocus,
  label,
  placeholder,
  readOnly = false,
  isLoading = false,
  headerActions,
  error,
  errorActions,
  warning,
  info,
  onActivate,
}) => {
  const status = error || warning || info;

  return (
    <div className="flex h-full flex-col border-r border-editor-bg bg-editor-bg">
    <div className="editor-header flex h-9 min-h-[36px] items-center border-t border-editor-border bg-editor-sidebar pl-4 pr-2">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <span className="shrink-0 font-mono text-xs font-bold uppercase text-gray-300">TXT</span>
        <span className="shrink-0 text-xs italic text-gray-300">{label}</span>
        <span className="truncate text-[10px] text-gray-300">
          {isLoading ? '加载高级编辑器…' : '聚焦后启用高级编辑器'}
        </span>
      </div>
      {headerActions && (
        <div className="editor-header-actions ml-2 flex min-w-0 shrink items-center gap-1 overflow-hidden">
          {headerActions}
          {status && (
            <span
              className="editor-header-status max-w-[220px] truncate rounded border border-editor-active bg-editor-border px-2 py-0.5 text-[10px] text-gray-200"
              title={status}
            >
              {status}
            </span>
          )}
          {error && errorActions}
        </div>
      )}
    </div>
    <textarea
      data-editor-fallback
      aria-label={`${label} 基础编辑器`}
      className="min-h-0 flex-1 resize-none border-0 bg-editor-bg p-3 font-mono text-[13px] leading-5 text-editor-fg outline-none placeholder:text-gray-400"
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      spellCheck={false}
      onFocus={() => {
        onActivate();
        onFocus?.();
      }}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
    </div>
  );
};

export const DeferredCodeEditor: React.FC<ExtendedEditorProps> = (props) => {
  const [isActivated, setIsActivated] = useState(false);
  const activate = () => setIsActivated(true);

  useEffect(() => {
    if (props.value) setIsActivated(true);
  }, [props.value]);

  if (!isActivated) {
    return (
      <div className="h-full">
        <EditorFallback {...props} onActivate={activate} />
      </div>
    );
  }

  return (
    <Suspense fallback={<EditorFallback {...props} isLoading onActivate={activate} />}>
      <LazyCodeEditor {...props} focusOnMount />
    </Suspense>
  );
};
