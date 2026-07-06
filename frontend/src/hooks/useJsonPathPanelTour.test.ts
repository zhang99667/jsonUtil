import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureId, useFeatureTour } from './useFeatureTour';
import { useJsonPathPanelTour } from './useJsonPathPanelTour';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
}));

vi.mock('./useFeatureTour', () => ({
  FeatureId: { JSONPATH: 'jsonpath' },
  useFeatureTour: vi.fn(),
}));

describe('useJsonPathPanelTour', () => {
  const triggerFeatureFirstUse = vi.fn();
  const refreshTour = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useEffect.mockImplementation((effect: () => void) => effect());
    reactMocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
    vi.mocked(useFeatureTour).mockReturnValue({
      triggerFeatureFirstUse,
      refreshTour,
    } as unknown as ReturnType<typeof useFeatureTour>);
  });

  it('首次打开 JSONPath 面板时触发一次功能引导并刷新位置', () => {
    const triggeredRef = { current: false };
    reactMocks.useRef.mockReturnValue(triggeredRef);

    useJsonPathPanelTour(true);
    useJsonPathPanelTour(true);

    expect(triggerFeatureFirstUse).toHaveBeenCalledTimes(1);
    expect(triggerFeatureFirstUse).toHaveBeenCalledWith(FeatureId.JSONPATH);
    expect(refreshTour).toHaveBeenCalledTimes(2);
  });

  it('面板关闭时不触发引导和刷新', () => {
    useJsonPathPanelTour(false);

    expect(triggerFeatureFirstUse).not.toHaveBeenCalled();
    expect(refreshTour).not.toHaveBeenCalled();
  });
});
