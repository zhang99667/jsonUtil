import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour, findByType, findByTypeAndText } from './componentElementTestHelpers';
import { JsonTreeCopySearchResultsMenu } from './JsonTreeCopySearchResultsMenu';
import { JsonTreeToolbar } from './JsonTreeToolbar';

const createProps = () => ({
  searchInputRef: { current: null },
  copyResultsMenuRef: { current: null },
  searchText: '$.url',
  kindFilter: 'all' as const,
  viewMode: 'list' as const,
  hasCopyableResults: true,
  canExpandCollapse: true,
  onSearchTextChange: vi.fn(),
  onSearchInputKeyDown: vi.fn(),
  onKindFilterChange: vi.fn(),
  onViewModeChange: vi.fn(),
  onCopySearchResultsJson: vi.fn(),
  onCopySearchResultsMarkdown: vi.fn(),
  onCopySearchResultsCsv: vi.fn(),
  onExpandAll: vi.fn(),
  onCollapseAll: vi.fn(),
});

describe('JsonTreeToolbar', () => {
  it('渲染搜索、类型筛选、视图切换和结果复制入口', () => {
    const props = createProps();
    const tree = JsonTreeToolbar(props);
    const searchInput = findByTour(tree, 'structure-nav-search')[0];
    const kindFilter = findByTour(tree, 'structure-nav-kind-filter')[0];
    const graphButton = findByTour(tree, 'structure-nav-view-graph')[0];
    const copyMenu = findByType(tree, JsonTreeCopySearchResultsMenu)[0];

    (searchInput.props.onChange as (event: { target: { value: string } }) => void)({
      target: { value: 'storeId' },
    });
    (searchInput.props.onKeyDown as (event: { key: string }) => void)({ key: 'Enter' });
    (kindFilter.props.onChange as (event: { target: { value: string } }) => void)({
      target: { value: 'string' },
    });
    clickElement(graphButton);
    (copyMenu.props.onCopySearchResultsJson as () => void)();
    (copyMenu.props.onCopySearchResultsMarkdown as () => void)();
    (copyMenu.props.onCopySearchResultsCsv as () => void)();
    clickElement(findByTypeAndText(tree, 'button', '展开')[0]);
    clickElement(findByTypeAndText(tree, 'button', '折叠')[0]);

    expect(collectText(tree)).toContain('全部类型');
    expect(searchInput.props).toMatchObject({
      value: '$.url',
      'aria-label': '搜索 JSON 结构',
    });
    expect(kindFilter.props.value).toBe('all');
    expect(findByTour(tree, 'structure-nav-view-list')[0].props['aria-pressed']).toBe(true);
    expect(graphButton.props['aria-pressed']).toBe(false);
    expect(copyMenu.props).toMatchObject({
      copyResultsMenuRef: props.copyResultsMenuRef,
      hasCopyableResults: true,
    });
    expect(props.onSearchTextChange).toHaveBeenCalledWith('storeId');
    expect(props.onSearchInputKeyDown).toHaveBeenCalledWith({ key: 'Enter' });
    expect(props.onKindFilterChange).toHaveBeenCalledWith('string');
    expect(props.onViewModeChange).toHaveBeenCalledWith('graph');
    expect(props.onCopySearchResultsJson).toHaveBeenCalledTimes(1);
    expect(props.onCopySearchResultsMarkdown).toHaveBeenCalledTimes(1);
    expect(props.onCopySearchResultsCsv).toHaveBeenCalledTimes(1);
    expect(props.onExpandAll).toHaveBeenCalledTimes(1);
    expect(props.onCollapseAll).toHaveBeenCalledTimes(1);
  });

  it('无可复制结果时展示禁用结果按钮并继承展开禁用态', () => {
    const tree = JsonTreeToolbar({
      ...createProps(),
      hasCopyableResults: false,
      canExpandCollapse: false,
    });
    const copyMenu = findByType(tree, JsonTreeCopySearchResultsMenu)[0];

    expect(copyMenu.props.hasCopyableResults).toBe(false);
    expect(findByType(tree, 'button').filter(button => collectText(button) === '展开')[0].props.disabled).toBe(true);
    expect(findByType(tree, 'button').filter(button => collectText(button) === '折叠')[0].props.disabled).toBe(true);
  });
});
