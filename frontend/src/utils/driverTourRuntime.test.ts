import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Driver } from 'driver.js';
import { createDriverTourRuntime } from './driverTourRuntime';

const createDriver = () => ({
  destroy: vi.fn(),
  drive: vi.fn(),
  refresh: vi.fn(),
} as unknown as Driver);

describe('driverTourRuntime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('全局后发运行会销毁旧实例并使旧运行失效', () => {
    const runtime = createDriverTourRuntime();
    const firstDriver = createDriver();
    const secondDriver = createDriver();
    const onComplete = vi.fn();
    const firstRun = runtime.begin();
    firstRun.adopt(firstDriver);

    const secondRun = runtime.begin();
    secondRun.adopt(secondDriver);
    firstRun.cancel();

    expect(firstDriver.destroy).toHaveBeenCalledTimes(1);
    expect(secondDriver.destroy).not.toHaveBeenCalled();
    expect(firstRun.isCurrent()).toBe(false);
    expect(firstRun.complete(onComplete)).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
    expect(secondRun.isCurrent()).toBe(true);
  });

  it('dispose 会清理当前实例和延迟驱动', async () => {
    const runtime = createDriverTourRuntime();
    const driver = createDriver();
    const run = runtime.begin();
    run.adopt(driver);
    run.driveAfter(500);

    runtime.dispose();
    await vi.advanceTimersByTimeAsync(500);

    expect(run.isCurrent()).toBe(false);
    expect(driver.destroy).toHaveBeenCalledTimes(1);
    expect(driver.drive).not.toHaveBeenCalled();
  });

  it('晚到实例无法接管且会被销毁', () => {
    const runtime = createDriverTourRuntime();
    const firstRun = runtime.begin();
    runtime.begin();
    const lateDriver = createDriver();

    expect(firstRun.adopt(lateDriver)).toBe(false);
    expect(lateDriver.destroy).toHaveBeenCalledTimes(1);
  });

  it('取消运行会清除延迟驱动', async () => {
    const runtime = createDriverTourRuntime();
    const driver = createDriver();
    const run = runtime.begin();
    run.adopt(driver);
    run.driveAfter(500);

    run.cancel();
    await vi.advanceTimersByTimeAsync(500);

    expect(driver.destroy).toHaveBeenCalledTimes(1);
    expect(driver.drive).not.toHaveBeenCalled();
  });

  it('完成只记录当前运行一次并销毁实例', () => {
    const runtime = createDriverTourRuntime();
    const driver = createDriver();
    const onComplete = vi.fn();
    const run = runtime.begin();
    run.adopt(driver);

    expect(run.complete(onComplete)).toBe(true);
    expect(run.complete(onComplete)).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(driver.destroy).toHaveBeenCalledTimes(1);
  });

  it('销毁异常先清空所有权且不阻止后发运行', () => {
    const destroyError = new Error('销毁失败');
    const onDestroyError = vi.fn();
    const runtime = createDriverTourRuntime();
    const driver = createDriver();
    vi.mocked(driver.destroy).mockImplementation(() => {
      throw destroyError;
    });
    const firstRun = runtime.begin({ onDestroyError });
    firstRun.adopt(driver);

    const secondRun = runtime.begin();

    expect(onDestroyError).toHaveBeenCalledWith(destroyError);
    expect(firstRun.isCurrent()).toBe(false);
    expect(secondRun.isCurrent()).toBe(true);
  });

  it('驱动异常保留原始错误并在清理失败后清空所有权', () => {
    const driveError = new Error('驱动失败');
    const destroyError = new Error('清理失败');
    const onDriveError = vi.fn();
    const onDestroyError = vi.fn();
    const runtime = createDriverTourRuntime();
    const driver = createDriver();
    vi.mocked(driver.drive).mockImplementation(() => {
      throw driveError;
    });
    vi.mocked(driver.destroy).mockImplementation(() => {
      throw destroyError;
    });
    const run = runtime.begin({ onDriveError, onDestroyError });
    run.adopt(driver);

    expect(run.drive()).toBe(false);
    expect(onDestroyError).toHaveBeenCalledWith(destroyError);
    expect(onDriveError).toHaveBeenCalledWith(driveError);
    expect(run.isCurrent()).toBe(false);
    expect(runtime.begin().isCurrent()).toBe(true);
  });

  it('refresh 只刷新当前实例并处理异常', () => {
    const refreshError = new Error('刷新失败');
    const onRefreshError = vi.fn();
    const runtime = createDriverTourRuntime();
    const driver = createDriver();
    const run = runtime.begin({ onRefreshError });
    run.adopt(driver);

    runtime.refresh();
    expect(driver.refresh).toHaveBeenCalledTimes(1);

    vi.mocked(driver.refresh).mockImplementation(() => {
      throw refreshError;
    });
    runtime.refresh();
    expect(onRefreshError).toHaveBeenCalledWith(refreshError);

    run.cancel();
    runtime.refresh();
    expect(driver.refresh).toHaveBeenCalledTimes(2);
  });
});
