import { describe, expect, it } from 'vitest';
import { ActionPanelButtonBadge } from './ActionPanelButtonBadge';
import { ActionPanelEntryButtonContent } from './ActionPanelEntryButtonContent';
import { assertElementLike, collectText, findByType } from './componentElementTestHelpers';

describe('ActionPanelEntryButtonContent', () => {
  it('展开态内容展示标签和可选状态 badge', () => {
    const tree = ActionPanelEntryButtonContent({
      label: '格式化',
      badge: { label: '当前', dataTour: 'active-mode-badge' },
    });

    assertElementLike(tree, '入口按钮内容应返回 React 元素');
    expect(tree.props.className).toContain('justify-between');
    expect(collectText(tree)).toContain('格式化');
    expect(findByType(tree, ActionPanelButtonBadge)[0].props).toMatchObject({
      label: '当前',
      dataTour: 'active-mode-badge',
    });
  });

  it('没有状态 badge 时只展示标签', () => {
    const tree = ActionPanelEntryButtonContent({ label: '压缩' });

    expect(collectText(tree)).toContain('压缩');
    expect(findByType(tree, ActionPanelButtonBadge)).toHaveLength(0);
  });
});
