import { useCallback, useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';

export interface SynchronizedScrollTopInput {
  sourceScrollTop: number;
  sourceScrollHeight: number;
  sourceHeight: number;
  targetScrollHeight: number;
  targetHeight: number;
}

interface Disposable {
  dispose: () => void;
}

interface EditorBinding {
  instance: editor.IStandaloneCodeEditor;
  allowsScrollPropagation: boolean;
  dispose: () => void;
}

interface PendingProgrammaticScroll {
  target: editor.IStandaloneCodeEditor;
  scrollTop: number;
}

const SCROLL_TOP_EPSILON = 0.5;

const areScrollTopsEqual = (first: number, second: number) => (
  Math.abs(first - second) <= SCROLL_TOP_EPSILON
);

export const getSynchronizedScrollTop = ({
  sourceScrollTop,
  sourceScrollHeight,
  sourceHeight,
  targetScrollHeight,
  targetHeight,
}: SynchronizedScrollTopInput): number => {
  const sourceScrollableHeight = Math.max(0, sourceScrollHeight - sourceHeight);
  const targetScrollableHeight = Math.max(0, targetScrollHeight - targetHeight);
  if (
    sourceScrollableHeight === 0
    || targetScrollableHeight === 0
    || !Number.isFinite(sourceScrollableHeight)
    || !Number.isFinite(targetScrollableHeight)
  ) return 0;

  const finiteSourceScrollTop = Number.isFinite(sourceScrollTop) ? sourceScrollTop : 0;
  const clampedSourceScrollTop = Math.min(
    sourceScrollableHeight,
    Math.max(0, finiteSourceScrollTop),
  );
  return Math.min(
    targetScrollableHeight,
    Math.max(0, (clampedSourceScrollTop / sourceScrollableHeight) * targetScrollableHeight),
  );
};

export const useEditorScrollSync = () => {
  const [isScrollSyncEnabled, setIsScrollSyncEnabled] = useState(false);
  const isScrollSyncEnabledRef = useRef(false);
  const sourceBindingRef = useRef<EditorBinding | null>(null);
  const previewBindingRef = useRef<EditorBinding | null>(null);
  const pendingProgrammaticScrollRef = useRef<PendingProgrammaticScroll | null>(null);

  const toggleScrollSync = useCallback(() => {
    const nextEnabled = !isScrollSyncEnabledRef.current;
    isScrollSyncEnabledRef.current = nextEnabled;
    setIsScrollSyncEnabled(nextEnabled);
  }, []);

  const mountEditor = useCallback((
    side: 'source' | 'preview',
    instance: editor.IStandaloneCodeEditor,
  ) => {
    const bindingRef = side === 'source' ? sourceBindingRef : previewBindingRef;
    bindingRef.current?.dispose();

    let disposed = false;
    const disposables: Disposable[] = [];
    const binding: EditorBinding = {
      instance,
      allowsScrollPropagation: true,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        disposables.forEach(disposable => disposable.dispose());
        editorDomNode?.removeEventListener('wheel', markUserScrollIntent);
        if (pendingProgrammaticScrollRef.current?.target === instance) {
          pendingProgrammaticScrollRef.current = null;
        }
      },
    };
    const markUserScrollIntent = () => {
      binding.allowsScrollPropagation = true;
    };
    const editorDomNode = instance.getDomNode();

    disposables.push(
      instance.onDidChangeModel(() => {
        binding.allowsScrollPropagation = false;
        if (pendingProgrammaticScrollRef.current?.target === instance) {
          pendingProgrammaticScrollRef.current = null;
        }
      }),
      instance.onKeyDown(markUserScrollIntent),
      instance.onMouseDown(markUserScrollIntent),
      instance.onDidScrollChange(event => {
        if (!event.scrollTopChanged) return;

        const pendingScroll = pendingProgrammaticScrollRef.current;
        if (pendingScroll?.target === instance) {
          pendingProgrammaticScrollRef.current = null;
          if (areScrollTopsEqual(event.scrollTop, pendingScroll.scrollTop)) return;
        }
        if (!isScrollSyncEnabledRef.current || !binding.allowsScrollPropagation) return;

        const targetBinding = side === 'source'
          ? previewBindingRef.current
          : sourceBindingRef.current;
        if (!targetBinding) return;

        const target = targetBinding.instance;
        const targetScrollTop = getSynchronizedScrollTop({
          sourceScrollTop: event.scrollTop,
          sourceScrollHeight: instance.getScrollHeight(),
          sourceHeight: instance.getLayoutInfo().height,
          targetScrollHeight: target.getScrollHeight(),
          targetHeight: target.getLayoutInfo().height,
        });
        if (areScrollTopsEqual(target.getScrollTop(), targetScrollTop)) return;

        // 绑定目标实例和期望位置，直到目标滚动事件真正回调再解除
        pendingProgrammaticScrollRef.current = { target, scrollTop: targetScrollTop };
        target.setScrollTop(targetScrollTop);
      }),
    );
    editorDomNode?.addEventListener('wheel', markUserScrollIntent, { passive: true });
    bindingRef.current = binding;
  }, []);

  const onSourceEditorMount = useCallback((instance: editor.IStandaloneCodeEditor) => {
    mountEditor('source', instance);
  }, [mountEditor]);

  const onPreviewEditorMount = useCallback((instance: editor.IStandaloneCodeEditor) => {
    mountEditor('preview', instance);
  }, [mountEditor]);

  useEffect(() => () => {
    sourceBindingRef.current?.dispose();
    previewBindingRef.current?.dispose();
    sourceBindingRef.current = null;
    previewBindingRef.current = null;
    pendingProgrammaticScrollRef.current = null;
  }, []);

  return {
    isScrollSyncEnabled,
    toggleScrollSync,
    onSourceEditorMount,
    onPreviewEditorMount,
  };
};
