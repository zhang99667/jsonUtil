import { describe, expect, it } from 'vitest';
import {
  createAppLazyPanelLoadState,
  updateAppLazyPanelLoadState,
} from './appLazyPanelLoadState';

describe('appLazyPanelLoadState', () => {
  it('默认所有懒加载面板都未加载', () => {
    expect(createAppLazyPanelLoadState()).toEqual({
      settings: false,
      changelog: false,
      jsonPath: false,
      jsonTree: false,
      jsonCompare: false,
      jsonSchema: false,
      scheme: false,
      template: false,
      transformReport: false,
    });
  });

  it('打开过的面板会被标记为已加载并保持粘性', () => {
    const current = createAppLazyPanelLoadState();
    const next = updateAppLazyPanelLoadState(current, {
      ...createAppLazyPanelLoadState(),
      jsonPath: true,
      scheme: true,
    });

    expect(next).toMatchObject({
      jsonPath: true,
      scheme: true,
      settings: false,
    });

    const closedAgain = updateAppLazyPanelLoadState(next, createAppLazyPanelLoadState());
    expect(closedAgain).toBe(next);
    expect(closedAgain.jsonPath).toBe(true);
    expect(closedAgain.scheme).toBe(true);
  });

  it('没有新增打开面板时复用原对象，避免无意义渲染', () => {
    const current = {
      ...createAppLazyPanelLoadState(),
      changelog: true,
    };

    expect(updateAppLazyPanelLoadState(current, {
      ...createAppLazyPanelLoadState(),
      changelog: true,
    })).toBe(current);
  });
});
