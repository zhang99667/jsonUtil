import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByType } from '../components/componentElementTestHelpers';
import { useAppChunkLoadRecovery } from './useAppChunkLoadRecovery';

const mocks = vi.hoisted(() => ({
  installChunkLoadRecoveryListeners: vi.fn(),
  toastCustom: vi.fn(),
  useEffect: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: mocks.useEffect,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    custom: mocks.toastCustom,
  },
}));

vi.mock('../utils/chunkLoadRecoveryEvents', () => ({
  installChunkLoadRecoveryListeners: mocks.installChunkLoadRecoveryListeners,
}));

describe('useAppChunkLoadRecovery', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    mocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    mocks.installChunkLoadRecoveryListeners.mockReturnValue(vi.fn());
  });

  it('生产态安装动态 chunk 恢复监听并展示刷新 Toast', () => {
    vi.stubEnv('PROD', true);
    const onBeforeReload = vi.fn();
    const reload = vi.fn();
    const fakeWindow = { location: { reload } };
    vi.stubGlobal('window', fakeWindow);

    useAppChunkLoadRecovery({ onBeforeReload });

    expect(mocks.installChunkLoadRecoveryListeners).toHaveBeenCalledTimes(1);
    expect(mocks.installChunkLoadRecoveryListeners.mock.calls[0][0]).toBe(fakeWindow);

    const promptRefresh = mocks.installChunkLoadRecoveryListeners.mock.calls[0][1];
    if (typeof promptRefresh !== 'function') throw new Error('应安装刷新提示回调');
    promptRefresh();

    expect(mocks.toastCustom).toHaveBeenCalledTimes(1);
    expect(mocks.toastCustom.mock.calls[0][1]).toEqual({
      id: 'json-helper-chunk-load-recovery',
      duration: Infinity,
      position: 'top-center',
    });

    const renderToast = mocks.toastCustom.mock.calls[0][0];
    if (typeof renderToast !== 'function') throw new Error('应传入自定义 Toast 渲染函数');
    const toastTree = renderToast();

    expect(collectText(toastTree)).toContain('页面资源已更新');
    expect(collectText(toastTree)).toContain('当前打开的旧页面无法加载新版资源，刷新后即可恢复。');

    const buttons = findByType(toastTree, 'button');
    expect(buttons.map(button => collectText(button))).toEqual(['刷新页面']);

    clickElement(buttons[0]);
    expect(onBeforeReload).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(onBeforeReload.mock.invocationCallOrder[0]).toBeLessThan(reload.mock.invocationCallOrder[0]);
  });

  it('非生产态不安装动态 chunk 恢复监听', () => {
    vi.stubEnv('PROD', false);

    useAppChunkLoadRecovery();

    expect(mocks.installChunkLoadRecoveryListeners).not.toHaveBeenCalled();
    expect(mocks.toastCustom).not.toHaveBeenCalled();
  });

  it('刷新前草稿保存异常时仍继续刷新页面', () => {
    vi.stubEnv('PROD', true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const reload = vi.fn();
    const error = new Error('storage blocked');
    vi.stubGlobal('window', { location: { reload } });

    useAppChunkLoadRecovery({
      onBeforeReload: () => {
        throw error;
      },
    });

    const promptRefresh = mocks.installChunkLoadRecoveryListeners.mock.calls[0][1];
    if (typeof promptRefresh !== 'function') throw new Error('应安装刷新提示回调');
    promptRefresh();

    const renderToast = mocks.toastCustom.mock.calls[0][0];
    if (typeof renderToast !== 'function') throw new Error('应传入自定义 Toast 渲染函数');
    const toastTree = renderToast();

    clickElement(findByType(toastTree, 'button')[0]);

    expect(warn).toHaveBeenCalledWith('刷新前保存工作区草稿失败', error);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
