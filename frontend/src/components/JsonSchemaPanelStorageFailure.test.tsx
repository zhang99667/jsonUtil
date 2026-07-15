import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findByTourOrNull } from './componentElementTestHelpers';

const reactMocks = vi.hoisted(() => ({
  stateSetters: [] as ReturnType<typeof vi.fn>[],
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const telemetryMocks = vi.hoisted(() => ({
  trackToolEvent: vi.fn(),
}));

const clipboardMocks = vi.hoisted(() => ({
  copyText: vi.fn(),
  readClipboardText: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const original = await importOriginal<typeof import('react')>();
  const defaultExport = original.default as typeof original.default & Record<string, unknown>;
  return {
    ...original,
    default: {
      ...defaultExport,
      useEffect: reactMocks.useEffect,
    },
    useCallback: reactMocks.useCallback,
    useEffect: reactMocks.useEffect,
    useMemo: reactMocks.useMemo,
    useRef: reactMocks.useRef,
    useState: reactMocks.useState,
  };
});

vi.mock('../utils/storage', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/storage')>(),
  safeGetStorageItem: storageMocks.get,
  safeSetStorageItem: storageMocks.set,
}));

vi.mock('../utils/toast', () => toastMocks);

vi.mock('../utils/productTelemetry', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/productTelemetry')>(),
  trackToolEvent: telemetryMocks.trackToolEvent,
}));

vi.mock('../utils/clipboard', () => ({
  copyText: clipboardMocks.copyText,
  getClipboardErrorMessage: vi.fn((_: unknown, fallback: string) => fallback),
  readClipboardText: clipboardMocks.readClipboardText,
}));

import { JsonSchemaPanel, JSON_SCHEMA_STORAGE_KEY } from './JsonSchemaPanel';
import { JSON_SCHEMA_LIBRARY_STORAGE_KEY } from '../utils/jsonSchemaLibrary';

const storedItem = {
  id: 'schema-existing',
  name: '已有 Schema',
  schemaText: '{"title":"已有 Schema","type":"object"}',
  updatedAt: 1,
};

const renderPanel = () => JsonSchemaPanel({
  jsonData: '{"ok":true}',
  isOpen: true,
  onClose: vi.fn(),
  onLocatePath: vi.fn(),
});

const clickTourAction = (tree: unknown, dataTour: string) => {
  const action = findByTourOrNull(tree, dataTour);
  if (!action || typeof action.props.onClick !== 'function') {
    throw new Error(`未找到可点击的操作: ${dataTour}`);
  }
  action.props.onClick();
};

describe('JsonSchemaPanel 收藏存储失败边界', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.stateSetters.length = 0;
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation(() => undefined);
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
    reactMocks.useRef.mockImplementation((value: unknown) => ({ current: value }));
    reactMocks.useState.mockImplementation((initializer: unknown) => {
      const value = typeof initializer === 'function'
        ? (initializer as () => unknown)()
        : initializer;
      const setter = vi.fn();
      reactMocks.stateSetters.push(setter);
      return [value, setter];
    });
    storageMocks.get.mockImplementation((key: string) => {
      if (key === JSON_SCHEMA_STORAGE_KEY) return '{"title":"新收藏","type":"object"}';
      if (key === JSON_SCHEMA_LIBRARY_STORAGE_KEY) return JSON.stringify([storedItem]);
      return null;
    });
    storageMocks.set.mockReturnValue(false);
    clipboardMocks.readClipboardText.mockResolvedValue('{"title":"导入 Schema","type":"object"}');
  });

  it.each([
    ['收藏', 'json-schema-save'],
    ['删除', 'json-schema-library-remove'],
  ])('%s写入失败时保留内存列表且不报成功', (_, dataTour) => {
    const tree = renderPanel();

    clickTourAction(tree, dataTour);

    expect(storageMocks.set).toHaveBeenCalledOnce();
    expect(reactMocks.stateSetters[1]).not.toHaveBeenCalled();
    expect(toastMocks.showError).toHaveBeenCalledWith('保存 Schema 收藏失败，请检查浏览器存储空间');
    expect(toastMocks.showSuccess).not.toHaveBeenCalled();
  });

  it('写入成功后再提交内存列表并提示成功', () => {
    storageMocks.set.mockReturnValue(true);
    const tree = renderPanel();

    clickTourAction(tree, 'json-schema-save');

    expect(storageMocks.set).toHaveBeenCalledOnce();
    expect(reactMocks.stateSetters[1]).toHaveBeenCalledOnce();
    expect(storageMocks.set.mock.invocationCallOrder[0]).toBeLessThan(
      reactMocks.stateSetters[1].mock.invocationCallOrder[0],
    );
    expect(toastMocks.showError).not.toHaveBeenCalled();
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('已收藏 Schema: 新收藏');
  });

  it('导入写入失败时记录失败而不是成功', async () => {
    const tree = renderPanel();

    clickTourAction(tree, 'json-schema-library-import');

    await vi.waitFor(() => expect(storageMocks.set).toHaveBeenCalledOnce());
    expect(reactMocks.stateSetters[1]).not.toHaveBeenCalled();
    expect(telemetryMocks.trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'SCHEMA_LIBRARY_IMPORT',
      status: 'error',
    }));
    expect(toastMocks.showSuccess).not.toHaveBeenCalled();
  });
});
