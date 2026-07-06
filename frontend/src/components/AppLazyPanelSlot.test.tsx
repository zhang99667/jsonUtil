import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';
import { AppLazyPanelSlot } from './AppLazyPanelSlot';
import { assertElementLike } from './componentElementTestHelpers';

describe('AppLazyPanelSlot', () => {
  it('未加载时不渲染懒加载插槽', () => {
    const tree = AppLazyPanelSlot({
      isLoaded: false,
      children: 'panel',
    });

    expect(tree).toBeNull();
  });

  it('已加载时用空 fallback Suspense 包裹面板', () => {
    const child = <span data-testid="panel">panel</span>;
    const tree = AppLazyPanelSlot({
      isLoaded: true,
      children: child,
    });

    const root = assertElementLike(tree, 'AppLazyPanelSlot 应返回 React 元素');
    expect(root.type).toBe(Suspense);
    expect(root.props.fallback).toBeNull();
    expect(root.props.children).toBe(child);
  });
});
