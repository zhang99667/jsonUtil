import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config, Driver } from 'driver.js';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import { loadDriverTour } from '../utils/driverTourLoader';
import { driverTourRuntime } from '../utils/driverTourRuntime';
import { safeReadStorageItem, safeSetStorageItem } from '../utils/storage';
import { FeatureId, useFeatureTour } from './useFeatureTour';
import { useOnboardingTour } from './useOnboardingTour';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
}));

vi.mock('../utils/driverTourLoader', () => ({
  loadDriverTour: vi.fn(),
}));

vi.mock('../utils/chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

vi.mock('../utils/storage', () => ({
  safeReadStorageItem: vi.fn(),
  safeRemoveStorageItem: vi.fn(),
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
  refresh: vi.fn(),
} as unknown as Driver);

const createDriverFactory = (
  driver: Driver,
  onConfig?: (config: Config) => void,
) => vi.fn((config: Config) => {
  onConfig?.(config);
  return driver;
}) as unknown as DriverFactory;

describe('useFeatureTour', () => {
  let effectCleanup: (() => void) | undefined;
  let latestEffect: (() => void | (() => void)) | undefined;
  let replayEffectInStrictMode = false;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    effectCleanup = undefined;
    latestEffect = undefined;
    replayEffectInStrictMode = false;
    driverTourRuntime.dispose();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useRef.mockImplementation((initialValue: unknown) => {
      return { current: initialValue };
    });
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      latestEffect = effect;
      const cleanup = effect();
      effectCleanup = typeof cleanup === 'function' ? cleanup : undefined;
      if (replayEffectInStrictMode && effectCleanup) {
        effectCleanup();
        const replayCleanup = effect();
        effectCleanup = typeof replayCleanup === 'function' ? replayCleanup : undefined;
      }
      return effectCleanup;
    });
    vi.mocked(safeReadStorageItem).mockReturnValue({ ok: true, value: null });
    vi.stubGlobal('document', { querySelector: vi.fn(() => ({})) });
  });

  afterEach(() => {
    driverTourRuntime.dispose();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const useFeatureTourForTest = () => useFeatureTour();

  it('StrictMode 重放清理后仍能启动当前引导', async () => {
    replayEffectInStrictMode = true;
    const driver = createDriverDouble();
    const createDriver = createDriverFactory(driver);
    vi.mocked(loadDriverTour).mockResolvedValue(createDriver);

    await useFeatureTourForTest().startFeatureTour(FeatureId.AI_FIX, true);
    await vi.advanceTimersByTimeAsync(500);

    expect(driver.drive).toHaveBeenCalledTimes(1);
  });

  it('并发加载乱序完成时只让最后一次启动拥有实例', async () => {
    const firstLoad = createDeferred<DriverFactory>();
    const secondLoad = createDeferred<DriverFactory>();
    const firstDriver = createDriverDouble();
    const secondDriver = createDriverDouble();
    const firstFactory = createDriverFactory(firstDriver);
    const secondFactory = createDriverFactory(secondDriver);
    vi.mocked(loadDriverTour)
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(secondLoad.promise);
    const firstTour = useFeatureTourForTest();
    const secondTour = useFeatureTourForTest();

    const firstStart = firstTour.startFeatureTour(FeatureId.AI_FIX, true);
    const secondStart = secondTour.startFeatureTour(FeatureId.DEEP_FORMAT, true);
    secondLoad.resolve(secondFactory);
    await secondStart;
    firstLoad.resolve(firstFactory);
    await firstStart;
    await vi.advanceTimersByTimeAsync(500);

    expect(firstFactory).not.toHaveBeenCalled();
    expect(firstDriver.drive).not.toHaveBeenCalled();
    expect(secondFactory).toHaveBeenCalledTimes(1);
    expect(secondDriver.destroy).not.toHaveBeenCalled();
    expect(secondDriver.drive).toHaveBeenCalledTimes(1);
  });

  it('首秒内功能引导后发启动会取消待加载的新手引导', async () => {
    const featureDriver = createDriverDouble();
    vi.mocked(loadDriverTour).mockResolvedValue(createDriverFactory(featureDriver));

    useOnboardingTour();
    await useFeatureTourForTest().startFeatureTour(FeatureId.AI_FIX, true);
    await vi.advanceTimersByTimeAsync(1000);

    expect(loadDriverTour).toHaveBeenCalledTimes(1);
    expect(featureDriver.drive).toHaveBeenCalledTimes(1);
  });

  it('StrictMode 清理使第一代尚未完成的加载永久失效', async () => {
    const pendingLoad = createDeferred<DriverFactory>();
    const driver = createDriverDouble();
    const createDriver = createDriverFactory(driver);
    vi.mocked(loadDriverTour).mockReturnValue(pendingLoad.promise);
    const startPromise = useFeatureTourForTest().startFeatureTour(FeatureId.AI_FIX, true);

    effectCleanup?.();
    const replayCleanup = latestEffect?.();
    effectCleanup = typeof replayCleanup === 'function' ? replayCleanup : undefined;
    pendingLoad.resolve(createDriver);
    await startPromise;
    await vi.advanceTimersByTimeAsync(500);

    expect(createDriver).not.toHaveBeenCalled();
    expect(driver.drive).not.toHaveBeenCalled();
  });

  it('被后续启动替换的加载失败时不触发恢复副作用', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const firstLoad = createDeferred<DriverFactory>();
    const secondLoad = createDeferred<DriverFactory>();
    const secondDriver = createDriverDouble();
    vi.mocked(loadDriverTour)
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(secondLoad.promise);
    const { startFeatureTour } = useFeatureTourForTest();

    const firstStart = startFeatureTour(FeatureId.AI_FIX, true);
    const secondStart = startFeatureTour(FeatureId.DEEP_FORMAT, true);
    secondLoad.resolve(createDriverFactory(secondDriver));
    await secondStart;
    firstLoad.reject(new Error('旧加载失败'));
    await firstStart;

    expect(dispatchChunkLoadRecoveryEvent).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('实例创建后在延迟启动前卸载时只销毁不驱动', async () => {
    const driver = createDriverDouble();
    vi.mocked(loadDriverTour).mockResolvedValue(createDriverFactory(driver));

    await useFeatureTourForTest().startFeatureTour(FeatureId.AI_FIX, true);
    effectCleanup?.();
    await vi.advanceTimersByTimeAsync(500);

    expect(driver.destroy).toHaveBeenCalledTimes(1);
    expect(driver.drive).not.toHaveBeenCalled();
  });

  it('卸载后忽略尚未完成的组件加载', async () => {
    const pendingLoad = createDeferred<DriverFactory>();
    const driver = createDriverDouble();
    const createDriver = createDriverFactory(driver);
    vi.mocked(loadDriverTour).mockReturnValue(pendingLoad.promise);
    const startPromise = useFeatureTourForTest().startFeatureTour(FeatureId.AI_FIX, true);

    effectCleanup?.();
    pendingLoad.resolve(createDriver);
    await startPromise;
    await vi.advanceTimersByTimeAsync(500);

    expect(createDriver).not.toHaveBeenCalled();
    expect(driver.drive).not.toHaveBeenCalled();
  });

  it('实例创建失败时执行恢复判定并记录中文警告', async () => {
    const error = new Error('创建失败');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(loadDriverTour).mockResolvedValue(vi.fn(() => {
      throw error;
    }) as unknown as DriverFactory);

    await useFeatureTourForTest().startFeatureTour(FeatureId.AI_FIX, true);

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(warn).toHaveBeenCalledWith('启动功能引导失败:', error);
  });

  it('延迟驱动失败时清理实例并记录原始错误', async () => {
    const error = new Error('驱动失败');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const driver = createDriverDouble();
    vi.mocked(driver.drive).mockImplementation(() => {
      throw error;
    });
    vi.mocked(loadDriverTour).mockResolvedValue(createDriverFactory(driver));

    await useFeatureTourForTest().startFeatureTour(FeatureId.AI_FIX, true);
    await vi.advanceTimersByTimeAsync(500);

    expect(driver.destroy).toHaveBeenCalledTimes(1);
    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(warn).toHaveBeenCalledWith('启动功能引导失败:', error);
  });

  it('用户关闭功能引导时只记录一次完成状态', async () => {
    const driver = createDriverDouble();
    let receivedConfig: Config | undefined;
    vi.mocked(loadDriverTour).mockResolvedValue(createDriverFactory(driver, config => {
      receivedConfig = config;
    }));

    await useFeatureTourForTest().startFeatureTour(FeatureId.AI_FIX, true);
    const onDestroyStarted = receivedConfig?.onDestroyStarted as (() => void) | undefined;
    onDestroyStarted?.();
    onDestroyStarted?.();

    expect(safeSetStorageItem).toHaveBeenCalledTimes(1);
    expect(safeSetStorageItem).toHaveBeenCalledWith(
      'json-helper-feature-tour-ai-fix',
      'completed',
    );
    expect(driver.destroy).toHaveBeenCalledTimes(1);
  });
});
