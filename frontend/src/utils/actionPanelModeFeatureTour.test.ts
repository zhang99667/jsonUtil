import { describe, expect, it } from 'vitest';
import { FeatureId } from '../hooks/useFeatureTour';
import { TransformMode } from '../types';
import { getActionPanelModeFeatureTour } from './actionPanelModeFeatureTour';

describe('actionPanelModeFeatureTour', () => {
  it.each([
    [TransformMode.DEEP_FORMAT, FeatureId.DEEP_FORMAT],
    [TransformMode.ESCAPE, FeatureId.ESCAPE],
    [TransformMode.UNESCAPE, FeatureId.ESCAPE],
    [TransformMode.UNICODE_TO_CN, FeatureId.UNICODE_CONVERT],
    [TransformMode.CN_TO_UNICODE, FeatureId.UNICODE_CONVERT],
  ])('将 %s 映射到功能引导 %s', (mode, featureId) => {
    expect(getActionPanelModeFeatureTour(mode)).toBe(featureId);
  });

  it('普通工具模式不触发首次功能引导', () => {
    expect(getActionPanelModeFeatureTour(TransformMode.FORMAT)).toBeNull();
    expect(getActionPanelModeFeatureTour(TransformMode.URL_DECODE)).toBeNull();
    expect(getActionPanelModeFeatureTour(TransformMode.JSON_TO_TYPESCRIPT)).toBeNull();
  });
});
