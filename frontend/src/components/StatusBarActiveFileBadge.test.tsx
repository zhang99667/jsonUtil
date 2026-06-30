import { describe, expect, it } from 'vitest';
import type { FileTab } from '../types';
import { StatusBarActiveFileBadge } from './StatusBarActiveFileBadge';

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

const activeFile: FileTab = {
  id: 'file-1',
  name: 'demo.json',
  content: '{"ok":true}',
  path: '/tmp/demo.json',
  isDirty: true,
};

describe('StatusBarActiveFileBadge', () => {
  it('没有打开文件时不渲染文件 badge', () => {
    expect(StatusBarActiveFileBadge({ activeFile: null })).toBeNull();
  });

  it('展示当前文件名并优先使用路径作为提示', () => {
    const tree = StatusBarActiveFileBadge({ activeFile });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('StatusBarActiveFileBadge 应返回 React 元素');
    expect(tree.props.className).toContain('text-blue-200');
    expect(tree.props.title).toBe('/tmp/demo.json');
    expect(collectText(tree)).toContain('demo.json');
  });

  it('没有路径时使用文件名作为提示', () => {
    const tree = StatusBarActiveFileBadge({
      activeFile: { ...activeFile, path: undefined },
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('StatusBarActiveFileBadge 应返回 React 元素');
    expect(tree.props.title).toBe('demo.json');
  });
});
