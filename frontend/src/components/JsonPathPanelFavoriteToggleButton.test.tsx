import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, clickElement, findByType } from './componentElementTestHelpers';
import { JsonPathPanelFavoriteToggleButton } from './JsonPathPanelFavoriteToggleButton';

const renderFavoriteButton = (
  overrides: Partial<Parameters<typeof JsonPathPanelFavoriteToggleButton>[0]> = {}
) => JsonPathPanelFavoriteToggleButton({
  isFavorite: false,
  disabled: false,
  title: '收藏当前查询',
  onToggle: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelFavoriteToggleButton', () => {
  it('未收藏状态展示空心星标和可访问文案', () => {
    const onToggle = vi.fn();
    const tree = assertElementLike(renderFavoriteButton({ onToggle }));

    expect(tree.type).toBe('button');
    expect(tree.props['data-tour']).toBe('jsonpath-favorite-toggle');
    expect(tree.props.title).toBe('收藏当前查询');
    expect(tree.props['aria-label']).toBe('收藏当前查询');
    expect(tree.props.className).toContain('border-editor-border');
    expect(findByType(tree, 'svg')[0].props.fill).toBe('none');

    clickElement(tree);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('已收藏状态展示实心星标，空查询时禁用按钮', () => {
    const tree = assertElementLike(renderFavoriteButton({
      isFavorite: true,
      disabled: true,
      title: '取消收藏当前查询',
    }));

    expect(tree.props.disabled).toBe(true);
    expect(tree.props.title).toBe('取消收藏当前查询');
    expect(tree.props.className).toContain('border-amber-400');
    expect(findByType(tree, 'svg')[0].props.fill).toBe('currentColor');
  });
});
