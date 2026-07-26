import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SETTINGS_DIALOG_TOASTER_ID,
  showError,
  showSettingsDialogError,
  showSettingsDialogSuccess,
  showSuccess,
} from '../utils/toast';
import { AppToastHost } from './AppToastHost';
import { assertElementLike } from './componentElementTestHelpers';

describe('AppToastHost', () => {
  beforeEach(() => {
    vi.spyOn(React, 'useEffect').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('保留主应用 toast 的位置和顶部偏移', () => {
    const tree = AppToastHost({});

    const toastHost = assertElementLike(tree, 'AppToastHost 应返回 React 元素');
    expect(toastHost.type).toBe(Toaster);
    expect(toastHost.props.toasterId).toBeUndefined();
    expect(toastHost.props.position).toBe('top-center');
    expect(toastHost.props.toastOptions).toEqual({
      className: '',
      style: {
        marginTop: '16px',
      },
    });
  });

  it('把命名宿主传给 Toaster，并在卸载时只清理该宿主', () => {
    let cleanup: (() => void) | undefined;
    vi.mocked(React.useEffect).mockImplementation(effect => {
      const effectCleanup = effect();
      cleanup = typeof effectCleanup === 'function' ? effectCleanup : undefined;
    });
    const removeAll = vi.spyOn(toast, 'removeAll').mockImplementation(() => undefined);

    const tree = AppToastHost({
      toasterId: 'settings-dialog',
      dismissOnUnmount: true,
    });

    const toastHost = assertElementLike(tree, '命名 AppToastHost 应返回 React 元素');
    expect(toastHost.props.toasterId).toBe('settings-dialog');
    expect(removeAll).not.toHaveBeenCalled();

    cleanup?.();

    expect(removeAll).toHaveBeenCalledOnce();
    expect(removeAll).toHaveBeenCalledWith('settings-dialog');
  });

  it('即使请求卸载清理，也不会清空默认全局宿主', () => {
    let cleanup: (() => void) | undefined;
    vi.mocked(React.useEffect).mockImplementation(effect => {
      const effectCleanup = effect();
      cleanup = typeof effectCleanup === 'function' ? effectCleanup : undefined;
    });
    const removeAll = vi.spyOn(toast, 'removeAll').mockImplementation(() => undefined);

    AppToastHost({ dismissOnUnmount: true });
    cleanup?.();

    expect(removeAll).not.toHaveBeenCalled();
  });

  it('设置弹窗提示使用命名宿主，默认提示仍使用全局宿主', () => {
    const success = vi.spyOn(toast, 'success').mockImplementation(() => 'success-toast');
    const error = vi.spyOn(toast, 'error').mockImplementation(() => 'error-toast');

    showSuccess('全局成功');
    showError('全局失败');
    showSettingsDialogSuccess('设置成功');
    showSettingsDialogError('设置失败');

    expect(success.mock.calls[0]?.[1]).not.toHaveProperty('toasterId');
    expect(error.mock.calls[0]?.[1]).not.toHaveProperty('toasterId');
    expect(success.mock.calls[1]?.[1]).toMatchObject({
      toasterId: SETTINGS_DIALOG_TOASTER_ID,
    });
    expect(error.mock.calls[1]?.[1]).toMatchObject({
      toasterId: SETTINGS_DIALOG_TOASTER_ID,
    });
  });
});
