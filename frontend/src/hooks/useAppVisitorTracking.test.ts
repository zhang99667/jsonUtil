import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initGoogleAnalytics } from '../utils/analytics';
import { useAppVisitorTracking } from './useAppVisitorTracking';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useRef: vi.fn(() => ({ current: false })),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
}));

vi.mock('../utils/analytics', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/analytics')>(),
  initGoogleAnalytics: vi.fn(),
}));

describe('useAppVisitorTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useEffect.mockImplementation((effect: () => void) => {
      effect();
      effect();
    });
  });

  it('初始化 GA 并上报访客 ping', () => {
    const ping = vi.fn(() => Promise.resolve());

    useAppVisitorTracking({ measurementId: 'G-TEST123', ping });

    expect(initGoogleAnalytics).toHaveBeenCalledWith('G-TEST123');
    expect.soft(initGoogleAnalytics).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledWith('/api/visitor/ping');
    expect.soft(ping).toHaveBeenCalledTimes(1);
    expect(reactMocks.useEffect).toHaveBeenCalledWith(expect.any(Function), ['G-TEST123', ping]);
  });

  it('静默吞掉访客 ping 失败', async () => {
    const ping = vi.fn(() => Promise.reject(new Error('offline')));

    useAppVisitorTracking({ measurementId: 'G-TEST123', ping });
    await Promise.resolve();

    expect(initGoogleAnalytics).toHaveBeenCalledWith('G-TEST123');
    expect(ping).toHaveBeenCalledWith('/api/visitor/ping');
  });
});
