import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SchemeDecodeResult } from '../utils/schemeTypes';
import { DraggablePanel } from './DraggablePanel';
import { SimpleEditor } from './SimpleEditor';
import { SchemeViewerDiagnosticsPanel } from './SchemeViewerDiagnosticsPanel';
import { SchemeViewerFooterActions } from './SchemeViewerFooterActions';
import { findByTypeOrNull, isElementLike } from './componentElementTestHelpers';

const reactMocks = vi.hoisted(() => ({
  effects: [] as Array<() => void>,
  stateSetters: [] as ReturnType<typeof vi.fn>[],
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

const decodeMocks = vi.hoisted(() => ({ useSchemeViewerDecode: vi.fn() }));

const schemeUtilsMocks = vi.hoisted(() => ({ encodeWithLayersResult: vi.fn() }));

const toastMocks = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('react', async importOriginal => {
  const original = await importOriginal<typeof import('react')>();
  const defaultExport = original.default as typeof original.default & Record<string, unknown>;
  return {
    ...original,
    default: {
      ...defaultExport,
      useEffect: reactMocks.useEffect,
      useMemo: reactMocks.useMemo,
      useRef: reactMocks.useRef,
      useState: reactMocks.useState,
    },
    useEffect: reactMocks.useEffect,
    useMemo: reactMocks.useMemo,
    useRef: reactMocks.useRef,
    useState: reactMocks.useState,
  };
});

vi.mock('../hooks/useSchemeViewerDecode', () => ({
  useSchemeViewerDecode: decodeMocks.useSchemeViewerDecode,
}));

vi.mock('../utils/schemeUtils', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/schemeUtils')>(),
  encodeWithLayersResult: schemeUtilsMocks.encodeWithLayersResult,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: toastMocks.error,
    success: vi.fn(),
  },
}));

vi.mock('../hooks/useCustomScrollbar', () => ({
  useCustomScrollbar: () => ({
    scrollContainerRef: { current: null },
    handleScroll: vi.fn(),
    handleMouseDown: vi.fn(),
    thumbSize: 100,
    thumbOffset: 0,
    showScrollbar: false,
  }),
}));

import { SchemeViewerModal } from './SchemeViewerModal';

const BUSINESS_DECODED = JSON.stringify({
  next: { payload: { id: 1 } },
}, null, 2);

const DISPLAY_DECODED = JSON.stringify({
  __scheme__: 'samplevendor://v1/outer/open',
  next: {
    __scheme__: 'sampleapp://v2/inner/open',
    payload: { id: 1 },
  },
}, null, 2);

const decodeResult: SchemeDecodeResult = {
  original: 'samplevendor://v1/outer/open',
  decoded: BUSINESS_DECODED,
  displayDecoded: DISPLAY_DECODED,
  displayHeaders: [],
  layers: [],
  isJson: true,
};

const renderModal = ({
  editedContent = '',
  onApply,
  onClose = vi.fn(),
  readOnly = false,
}: {
  editedContent?: string;
  onApply?: (value: string) => void;
  onClose?: () => void;
  readOnly?: boolean;
} = {}) => {
  let stateIndex = 0;
  reactMocks.useState.mockImplementation((initializer: unknown) => {
    const initialValue = typeof initializer === 'function'
      ? (initializer as () => unknown)()
      : initializer;
    const value = stateIndex === 0 ? editedContent : initialValue;
    const setter = vi.fn();
    stateIndex += 1;
    reactMocks.stateSetters.push(setter);
    return [value, setter];
  });

  const tree = SchemeViewerModal({
    isOpen: true,
    onClose,
    value: decodeResult.original,
    onApply,
    readOnly,
  });
  if (!isElementLike(tree) || tree.type !== DraggablePanel) {
    throw new Error('Scheme 弹窗应直接渲染可拖动面板');
  }
  return tree;
};

describe('SchemeViewerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.effects.length = 0;
    reactMocks.stateSetters.length = 0;
    reactMocks.useEffect.mockImplementation((effect: () => void) => {
      reactMocks.effects.push(effect);
    });
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
    reactMocks.useRef.mockImplementation((value: unknown) => ({ current: value }));
    decodeMocks.useSchemeViewerDecode.mockReturnValue({
      decodeResult,
      decodeMetadata: {
        base64MetaInfo: null,
        commandSummaryInfo: null,
      },
      isDecodePending: false,
      isDecodeCancelled: false,
      hasDecodeFailed: false,
      canCancelDecode: false,
      cancelDecode: vi.fn(),
    });
    schemeUtilsMocks.encodeWithLayersResult.mockReturnValue({
      success: true,
      value: decodeResult.original,
    });
  });

  it('优先把含根与嵌套协议头的展示结果传给编辑器和诊断面板', () => {
    const initialTree = renderModal();

    reactMocks.effects[0]();
    expect(reactMocks.stateSetters[0]).toHaveBeenCalledWith(DISPLAY_DECODED);
    expect(
      findByTypeOrNull(initialTree, SchemeViewerDiagnosticsPanel)?.props.decodedContent,
    ).toBe(DISPLAY_DECODED);

    reactMocks.stateSetters.length = 0;
    const updatedTree = renderModal({ editedContent: DISPLAY_DECODED });
    expect(findByTypeOrNull(updatedTree, SimpleEditor)?.props.value).toBe(DISPLAY_DECODED);
    expect(findByTypeOrNull(updatedTree, SimpleEditor)?.props.showColorPreview).toBe(true);
  });

  it('只读来源头不注册编辑回调或显示应用操作', () => {
    const tree = renderModal({
      editedContent: DISPLAY_DECODED,
      onApply: vi.fn(),
      readOnly: true,
    });
    const editor = findByTypeOrNull(tree, SimpleEditor);
    const footer = tree.props.footer;
    if (!isElementLike(footer) || footer.type !== SchemeViewerFooterActions) {
      throw new Error('Scheme 弹窗应传入底部操作栏');
    }

    expect(editor?.props.readOnly).toBe(true);
    expect(editor?.props.onChange).toBeUndefined();
    expect(footer.props.canShowApplyEdit).toBe(false);
    expect(footer.props.canApplyEdit).toBe(false);
  });

  it('结构变化无法安全回写时保留弹窗和编辑内容', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    schemeUtilsMocks.encodeWithLayersResult.mockReturnValue({
      success: false,
      fallback: decodeResult.original,
    });
    const tree = renderModal({
      editedContent: DISPLAY_DECODED,
      onApply,
      onClose,
    });
    const footer = tree.props.footer;
    if (!isElementLike(footer) || footer.type !== SchemeViewerFooterActions) {
      throw new Error('Scheme 弹窗应传入底部操作栏');
    }

    const onApplyEdit = footer.props.onApplyEdit;
    if (typeof onApplyEdit !== 'function') {
      throw new Error('Scheme 弹窗应提供应用编辑回调');
    }
    onApplyEdit();

    expect(toastMocks.error).toHaveBeenCalledWith(
      '当前结构变化无法安全回写，请恢复协议头或数组顺序',
      { duration: 2400 },
    );
    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
