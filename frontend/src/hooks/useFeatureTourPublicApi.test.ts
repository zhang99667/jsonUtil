import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Driver } from 'driver.js';
import { loadDriverTour } from '../utils/driverTourLoader';
import { safeReadStorageItem } from '../utils/storage';
import { FeatureId, useFeatureTour } from './useFeatureTour';

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

vi.mock('../utils/storage', () => ({
  safeReadStorageItem: vi.fn(),
  safeRemoveStorageItem: vi.fn(),
  safeSetStorageItem: vi.fn(() => true),
}));

type DriverFactory = Awaited<ReturnType<typeof loadDriverTour>>;

describe('useFeatureTour 公开接口', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    reactMocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
    vi.mocked(safeReadStorageItem).mockReturnValue({ ok: true, value: null });
  });

  it('完成状态只由实际存储值决定', () => {
    vi.mocked(safeReadStorageItem)
      .mockReturnValueOnce({ ok: true, value: 'completed' })
      .mockReturnValueOnce({ ok: true, value: null })
      .mockReturnValueOnce({ ok: false, value: null });
    const { hasCompletedTour } = useFeatureTour();

    expect(hasCompletedTour(FeatureId.AI_FIX)).toBe(true);
    expect(hasCompletedTour(FeatureId.AI_FIX)).toBe(false);
    expect(hasCompletedTour(FeatureId.AI_FIX)).toBe(false);
  });

  it('本地存储不可用时只检查一次并跳过自动引导', () => {
    vi.mocked(safeReadStorageItem).mockReturnValue({ ok: false, value: null });
    vi.mocked(loadDriverTour).mockReturnValue(new Promise<DriverFactory>(() => undefined));

    useFeatureTour().triggerFeatureFirstUse(FeatureId.AI_FIX);

    expect(safeReadStorageItem).toHaveBeenCalledTimes(1);
    expect(loadDriverTour).not.toHaveBeenCalled();
  });

  it('强制启动完全绕过存储读取', () => {
    vi.mocked(loadDriverTour).mockReturnValue(new Promise<DriverFactory>(() => undefined));

    void useFeatureTour().startFeatureTour(FeatureId.AI_FIX, true);

    expect(safeReadStorageItem).not.toHaveBeenCalled();
    expect(loadDriverTour).toHaveBeenCalledTimes(1);
  });

  it('刷新位置只调用 Driver 刷新接口', () => {
    const driver = { drive: vi.fn(), refresh: vi.fn() } as unknown as Driver;
    let refIndex = 0;
    reactMocks.useRef.mockImplementation((initialValue: unknown) => (
      refIndex++ === 0 ? { current: driver } : { current: initialValue }
    ));

    useFeatureTour().refreshTour();

    expect(driver.refresh).toHaveBeenCalledTimes(1);
    expect(driver.drive).not.toHaveBeenCalled();
  });
});
