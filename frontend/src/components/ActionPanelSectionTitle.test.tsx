import { describe, expect, it } from 'vitest';
import { ActionPanelSectionTitle } from './ActionPanelSectionTitle';
import { assertElementLike } from './componentElementTestHelpers';

describe('ActionPanelSectionTitle', () => {
  it('折叠态不占用列表标题空间', () => {
    expect(ActionPanelSectionTitle({
      title: '预览 / 输出',
      isCollapsed: true,
    })).toBeNull();
  });

  it('展开态输出标题并标记首组间距', () => {
    const tree = ActionPanelSectionTitle({
      title: '预览 / 输出',
      isCollapsed: false,
      isFirst: true,
    });

    const title = assertElementLike(tree, 'ActionPanelSectionTitle 应返回 React 元素');
    expect(title.props.children).toBe('预览 / 输出');
    expect(title.props.className).toContain('mt-2');
  });
});
