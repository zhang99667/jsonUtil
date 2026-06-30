import { describe, expect, it } from 'vitest';
import {
  APP_UPDATE_CHECK_INITIAL_DELAY_MS,
  APP_UPDATE_CHECK_INTERVAL_MS,
} from './appUpdatePolicy';

describe('appUpdatePolicy', () => {
  it('保持较短的新版本检测窗口，降低旧页面加载过期 chunk 的概率', () => {
    expect(APP_UPDATE_CHECK_INITIAL_DELAY_MS).toBe(5_000);
    expect(APP_UPDATE_CHECK_INTERVAL_MS).toBe(60_000);
  });
});
