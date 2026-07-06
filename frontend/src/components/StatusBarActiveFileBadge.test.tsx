import { describe, expect, it } from 'vitest';
import type { FileTab } from '../types';
import { assertElementLike, collectText } from './componentElementTestHelpers';
import { StatusBarActiveFileBadge } from './StatusBarActiveFileBadge';

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
    const tree = assertElementLike(
      StatusBarActiveFileBadge({ activeFile }),
      'StatusBarActiveFileBadge 应返回 React 元素'
    );

    expect(tree.props.className).toContain('text-blue-200');
    expect(tree.props.title).toBe('/tmp/demo.json');
    expect(collectText(tree)).toContain('demo.json');
  });

  it('没有路径时使用文件名作为提示', () => {
    const tree = assertElementLike(
      StatusBarActiveFileBadge({
        activeFile: { ...activeFile, path: undefined },
      }),
      'StatusBarActiveFileBadge 应返回 React 元素'
    );

    expect(tree.props.title).toBe('demo.json');
  });
});
