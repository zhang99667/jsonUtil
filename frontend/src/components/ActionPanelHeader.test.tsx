import { describe, expect, it, vi } from 'vitest';
import { ActionPanelHeader } from './ActionPanelHeader';
import { collectText, findByType } from './componentElementTestHelpers';

describe('ActionPanelHeader', () => {
  it('展开态展示产品名与核心任务并保留折叠按钮语义', () => {
    const onToggleCollapse = vi.fn();
    const tree = ActionPanelHeader({ isCollapsed: false, onToggleCollapse });

    expect(collectText(tree)).toContain('JSONUtils');
    expect(collectText(tree)).toContain('格式化 · 校验 · 修复');
    expect(findByType(tree, 'h1')).toHaveLength(0);
    const guideLink = findByType(tree, 'a')[0];
    expect(guideLink.props.href).toBe('/guides/');
    expect(guideLink.props.title).toBe('查看 JSONUtils 使用指南');
    const button = findByType(tree, 'button')[0];
    expect(button.props['aria-label']).toBe('折叠工具栏');
    expect(button.props['aria-expanded']).toBe(true);

    const handleClick = button.props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('折叠按钮应透传点击回调');
    handleClick();
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('折叠态隐藏标题并切换展开语义', () => {
    const tree = ActionPanelHeader({ isCollapsed: true, onToggleCollapse: vi.fn() });
    const button = findByType(tree, 'button')[0];

    expect(collectText(tree)).not.toContain('JSONUtils');
    expect(button.props['aria-label']).toBe('展开工具栏');
    expect(button.props.title).toBe('展开');
    expect(button.props['aria-expanded']).toBe(false);
  });
});
