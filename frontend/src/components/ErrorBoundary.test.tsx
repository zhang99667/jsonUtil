import { describe, expect, it } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

interface ElementLike {
  props?: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node
);

const collectText = (node: unknown): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (!isElementLike(node)) return '';
  return collectText(node.props?.children);
};

const createErrorBoundary = (children: string): ErrorBoundary => (
  new (ErrorBoundary as unknown as { new(props: { children: string }): ErrorBoundary })({ children })
);

describe('ErrorBoundary', () => {
  it('正常状态直接渲染子节点', () => {
    const boundary = createErrorBoundary('正常内容');

    expect(boundary.render()).toBe('正常内容');
  });

  it('动态 import 旧 chunk 失效时提示刷新页面', () => {
    const boundary = createErrorBoundary('正常内容');
    boundary.state = ErrorBoundary.getDerivedStateFromError(
      new TypeError('Failed to fetch dynamically imported module: /assets/SchemeViewerModal-old.js')
    );

    const text = collectText(boundary.render());

    expect(text).toContain('页面资源已更新');
    expect(text).toContain('刷新页面');
  });
});
