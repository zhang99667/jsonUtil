import { describe, expect, it } from 'vitest';
import { getReadOnlyUnlockPromptPosition } from './Editor';

describe('getReadOnlyUnlockPromptPosition', () => {
  it('将解锁提示放在内置只读提示右侧并保留边缘间距', () => {
    expect(getReadOnlyUnlockPromptPosition({ top: 48, left: 80 }, 640, 48)).toEqual({
      top: 48,
      left: 80,
    });
  });

  it('在右边界附近时收进编辑器可视范围', () => {
    expect(getReadOnlyUnlockPromptPosition({ top: 8, left: 610 }, 640, 48)).toEqual({
      top: 12,
      left: 532,
    });
  });

  it('没有可见光标位置时回落到内容区附近', () => {
    expect(getReadOnlyUnlockPromptPosition(null, 320, 64)).toEqual({
      top: 32,
      left: 78,
    });
  });
});
