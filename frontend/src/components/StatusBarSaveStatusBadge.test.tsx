import { describe, expect, it } from 'vitest';
import type { StatusBarBadgeState } from '../utils/statusBarState';
import { assertElementLike } from './componentElementTestHelpers';
import { StatusBarSaveStatusBadge } from './StatusBarSaveStatusBadge';

const status: StatusBarBadgeState = {
  label: '未保存',
  className: 'bg-yellow-100 text-yellow-800',
  title: '当前文件有未保存修改',
};

describe('StatusBarSaveStatusBadge', () => {
  it('展示保存状态文案、样式和提示', () => {
    const tree = assertElementLike(
      StatusBarSaveStatusBadge({ status }),
      'StatusBarSaveStatusBadge 应返回 React 元素'
    );

    expect(tree.props['data-tour']).toBe('save-status');
    expect(tree.props.className).toContain('bg-yellow-100');
    expect(tree.props.title).toBe(status.title);
    expect(tree.props.children).toBe(status.label);
  });
});
