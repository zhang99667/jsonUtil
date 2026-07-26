import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config, Driver } from 'driver.js';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import { loadDriverTour } from '../utils/driverTourLoader';
import { driverTourRuntime } from '../utils/driverTourRuntime';
import { ONBOARDING_TOUR_STEPS } from '../utils/onboardingTourSteps';
import {
  safeReadStorageItem,
  safeSetStorageItem,
} from '../utils/storage';
import { useOnboardingTour } from './useOnboardingTour';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
}));

vi.mock('../utils/driverTourLoader', () => ({
  loadDriverTour: vi.fn(),
}));

vi.mock('../utils/chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

vi.mock('../utils/storage', () => ({
  safeReadStorageItem: vi.fn(),
  safeSetStorageItem: vi.fn(() => true),
}));

type DriverFactory = Awaited<ReturnType<typeof loadDriverTour>>;

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
};

const createDriverDouble = () => ({
  destroy: vi.fn(),
  drive: vi.fn(),
} as unknown as Driver);

const createDriverFactory = (
  driver: Driver,
  onConfig?: (config: Config) => void,
) => vi.fn((config: Config) => {
  onConfig?.(config);
  return driver;
}) as unknown as DriverFactory;

describe('useOnboardingTour', () => {
  let effectCleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    driverTourRuntime.dispose();
    effectCleanup = undefined;
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const cleanup = effect();
      effectCleanup = typeof cleanup === 'function' ? cleanup : undefined;
      return cleanup;
    });
    vi.mocked(safeReadStorageItem).mockReturnValue({ ok: true, value: null });
    vi.stubGlobal('document', {
      querySelector: vi.fn(() => ({})),
    });
  });

  afterEach(() => {
    driverTourRuntime.dispose();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    ['已经完成', { ok: true, value: 'true' }],
    ['本地存储不可用', { ok: false, value: null }],
  ])('%s时不加载引导', async (_label, storageResult) => {
    vi.mocked(safeReadStorageItem).mockReturnValue(storageResult);

    useOnboardingTour();
    await vi.advanceTimersByTimeAsync(1000);

    expect(loadDriverTour).not.toHaveBeenCalled();
  });

  it('卸载后的加载失败不触发恢复事件或警告', async () => {
    const pendingLoad = createDeferred<DriverFactory>();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(loadDriverTour).mockReturnValue(pendingLoad.promise);

    useOnboardingTour();
    await vi.advanceTimersByTimeAsync(1000);
    effectCleanup?.();
    pendingLoad.reject(new Error('旧加载失败'));
    await Promise.resolve();

    expect(dispatchChunkLoadRecoveryEvent).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('卸载后的加载成功不创建或启动实例', async () => {
    const pendingLoad = createDeferred<DriverFactory>();
    const driver = createDriverDouble();
    const createDriver = createDriverFactory(driver);
    vi.mocked(loadDriverTour).mockReturnValue(pendingLoad.promise);

    useOnboardingTour();
    await vi.advanceTimersByTimeAsync(1000);
    effectCleanup?.();
    pendingLoad.resolve(createDriver);
    await Promise.resolve();

    expect(createDriver).not.toHaveBeenCalled();
    expect(driver.drive).not.toHaveBeenCalled();
  });

  it('实例创建失败时执行恢复判定并记录警告', async () => {
    const error = new Error('创建失败');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const createDriver = vi.fn(() => {
      throw error;
    }) as unknown as DriverFactory;
    vi.mocked(loadDriverTour).mockResolvedValue(createDriver);

    useOnboardingTour();
    await vi.advanceTimersByTimeAsync(1000);

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(warn).toHaveBeenCalledWith('启动新手引导失败:', error);
  });

  it('启动和清理同时失败时保留原始错误并清空实例', async () => {
    const error = new Error('启动失败');
    const cleanupError = new Error('清理失败');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const driver = createDriverDouble();
    vi.mocked(driver.drive).mockImplementation(() => {
      throw error;
    });
    vi.mocked(driver.destroy).mockImplementation(() => {
      throw cleanupError;
    });
    vi.mocked(loadDriverTour).mockResolvedValue(createDriverFactory(driver));

    useOnboardingTour();
    await vi.advanceTimersByTimeAsync(1000);

    expect(driver.destroy).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('清理新手引导实例失败:', cleanupError);
    expect(warn).toHaveBeenCalledWith('启动新手引导失败:', error);
    effectCleanup?.();
    expect(driver.destroy).toHaveBeenCalledTimes(1);
  });

  it('启动前过滤不存在的非 body 目标', async () => {
    const querySelector = vi.fn((selector: string) => (
      selector === '[data-tour="toolbar"]' ? null : {}
    ));
    vi.stubGlobal('document', { querySelector });
    const driver = createDriverDouble();
    let receivedConfig: Config | undefined;
    vi.mocked(loadDriverTour).mockResolvedValue(createDriverFactory(
      driver,
      config => {
        receivedConfig = config;
      },
    ));

    useOnboardingTour();
    await vi.advanceTimersByTimeAsync(1000);

    expect(receivedConfig?.steps?.[0]?.element).toBe('body');
    expect(receivedConfig?.steps?.some(
      step => step.element === '[data-tour="toolbar"]',
    )).toBe(false);
    expect(receivedConfig?.steps).toHaveLength(ONBOARDING_TOUR_STEPS.length - 1);
  });

  it('用户关闭引导时记录完成状态并销毁实例', async () => {
    const driver = createDriverDouble();
    let receivedConfig: Config | undefined;
    vi.mocked(loadDriverTour).mockResolvedValue(createDriverFactory(
      driver,
      config => {
        receivedConfig = config;
      },
    ));

    useOnboardingTour();
    await vi.advanceTimersByTimeAsync(1000);
    const onDestroyStarted = receivedConfig?.onDestroyStarted as (() => void) | undefined;
    onDestroyStarted?.();
    onDestroyStarted?.();

    expect(safeSetStorageItem).toHaveBeenCalledTimes(1);
    expect(safeSetStorageItem).toHaveBeenCalledWith(
      'json-helper-onboarding-completed',
      'true',
    );
    expect(driver.destroy).toHaveBeenCalledTimes(1);
  });

  it('组件卸载只销毁实例，不记录完成状态', async () => {
    const driver = createDriverDouble();
    vi.mocked(loadDriverTour).mockResolvedValue(createDriverFactory(driver));

    useOnboardingTour();
    await vi.advanceTimersByTimeAsync(1000);
    effectCleanup?.();

    expect(driver.destroy).toHaveBeenCalledTimes(1);
    expect(safeSetStorageItem).not.toHaveBeenCalled();
  });
});
