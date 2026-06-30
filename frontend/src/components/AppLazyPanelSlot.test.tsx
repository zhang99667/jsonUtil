import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';
import { AppLazyPanelSlot } from './AppLazyPanelSlot';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

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

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppLazyPanelSlot 应返回 React 元素');
    expect(tree.type).toBe(Suspense);
    expect(tree.props.fallback).toBeNull();
    expect(tree.props.children).toBe(child);
  });
});
