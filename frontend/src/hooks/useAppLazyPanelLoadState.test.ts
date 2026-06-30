import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAppLazyPanelLoadState,
  type AppLazyPanelLoadState,
} from '../utils/appLazyPanelLoadState';
import { useAppLazyPanelLoadState } from './useAppLazyPanelLoadState';

const mocks = vi.hoisted(() => ({
  setLoadedState: vi.fn(),
  useEffect: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: mocks.useEffect,
  useState: mocks.useState,
}));

const createOpenState = (overrides: Partial<AppLazyPanelLoadState> = {}): AppLazyPanelLoadState => ({
  ...createAppLazyPanelLoadState(),
  ...overrides,
});

describe('useAppLazyPanelLoadState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useState.mockImplementation((initialState: () => AppLazyPanelLoadState) => [
      initialState(),
      mocks.setLoadedState,
    ]);
    mocks.useEffect.mockImplementation((effect: () => void) => effect());
  });

  it('用默认 unloaded 状态初始化并把打开的面板标记为已加载', () => {
    const loadedState = useAppLazyPanelLoadState(createOpenState({
      jsonPath: true,
      scheme: true,
    }));

    expect(loadedState).toEqual(createAppLazyPanelLoadState());
    expect(mocks.useState).toHaveBeenCalledWith(createAppLazyPanelLoadState);
    expect(mocks.setLoadedState).toHaveBeenCalledTimes(1);

    const updateLoadedState = mocks.setLoadedState.mock.calls[0][0];
    expect(typeof updateLoadedState).toBe('function');
    expect(updateLoadedState(createAppLazyPanelLoadState())).toMatchObject({
      jsonPath: true,
      scheme: true,
      template: false,
    });
  });

  it('面板关闭后仍保持已加载状态，避免懒加载组件反复卸载', () => {
    useAppLazyPanelLoadState(createOpenState());

    const currentLoadedState = createOpenState({ changelog: true });
    const updateLoadedState = mocks.setLoadedState.mock.calls[0][0];

    expect(updateLoadedState(currentLoadedState)).toBe(currentLoadedState);
    expect(updateLoadedState(currentLoadedState).changelog).toBe(true);
  });
});
