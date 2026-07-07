import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { JsonTreeCopySearchResultsMenu } from './JsonTreeCopySearchResultsMenu';

const createProps = () => ({
  copyResultsMenuRef: { current: null },
  hasCopyableResults: true,
  onCopySearchResultsJson: vi.fn(),
  onCopySearchResultsMarkdown: vi.fn(),
  onCopySearchResultsCsv: vi.fn(),
});

describe('JsonTreeCopySearchResultsMenu', () => {
  it('有可复制结果时渲染菜单并转发三种复制动作', () => {
    const props = createProps();
    const tree = JsonTreeCopySearchResultsMenu(props);

    clickElement(findByTour(tree, 'structure-nav-copy-search-results')[0]);
    clickElement(findByTour(tree, 'structure-nav-copy-search-results-markdown')[0]);
    clickElement(findByTour(tree, 'structure-nav-copy-search-results-csv')[0]);

    expect(collectText(tree)).toContain('结果JSON 清单Markdown 摘要CSV 摘要');
    expect(findByTour(tree, 'structure-nav-copy-search-results-menu')[0].props).toMatchObject({
      'aria-label': '复制当前筛选结果',
      title: '复制当前筛选结果',
    });
    expect(props.onCopySearchResultsJson).toHaveBeenCalledTimes(1);
    expect(props.onCopySearchResultsMarkdown).toHaveBeenCalledTimes(1);
    expect(props.onCopySearchResultsCsv).toHaveBeenCalledTimes(1);
  });

  it('没有可复制结果时只渲染禁用按钮', () => {
    const tree = JsonTreeCopySearchResultsMenu({
      ...createProps(),
      hasCopyableResults: false,
    });

    expect(findByTour(tree, 'structure-nav-copy-search-results-menu')).toHaveLength(0);
    expect(findByTour(tree, 'structure-nav-copy-search-results')[0].props).toMatchObject({
      disabled: true,
      title: '有搜索或类型筛选结果后可复制',
    });
  });
});
