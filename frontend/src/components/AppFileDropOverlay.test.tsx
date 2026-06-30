import { describe, expect, it } from 'vitest';
import { AppFileDropOverlay } from './AppFileDropOverlay';

interface ElementLike {
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

describe('AppFileDropOverlay', () => {
  it('展示文件拖拽释放提示', () => {
    const tree = AppFileDropOverlay({});

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppFileDropOverlay 应返回 React 元素');
    expect(tree.props['data-tour']).toBe('file-drop-overlay');

    const text = collectText(tree);
    expect(text).toContain('释放以打开文件');
    expect(text).toContain('支持 JSON、TXT、JS、TS 等文本文件');
  });
});
