import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour, findByTypeAndText } from './componentElementTestHelpers';
import { JsonTreeSearchHistoryPanel } from './JsonTreeSearchHistoryPanel';

describe('JsonTreeSearchHistoryPanel', () => {
  it('没有历史时不渲染', () => {
    expect(JsonTreeSearchHistoryPanel({
      searchHistory: [],
      onFillSearchHistory: vi.fn(),
      onRemoveSearchHistory: vi.fn(),
      onClearSearchHistory: vi.fn(),
    })).toBeNull();
  });

  it('渲染历史项并转发填入、删除和清空操作', () => {
    const onFillSearchHistory = vi.fn();
    const onRemoveSearchHistory = vi.fn();
    const onClearSearchHistory = vi.fn();
    const tree = JsonTreeSearchHistoryPanel({
      searchHistory: ['$.url', 'storeId'],
      onFillSearchHistory,
      onRemoveSearchHistory,
      onClearSearchHistory,
    });

    const historyItems = findByTour(tree, 'structure-nav-search-history-item');
    clickElement(historyItems[0]);
    clickElement(findByTypeAndText(tree, 'button', '×')[1]);
    clickElement(findByTypeAndText(tree, 'button', '清空')[0]);

    expect(collectText(findByTour(tree, 'structure-nav-search-history')[0])).toContain('最近$.url×storeId×清空');
    expect(historyItems[0].props).toMatchObject({
      title: '$.url\n点击填入结构搜索',
      'aria-label': '填入结构搜索历史：$.url',
    });
    expect(onFillSearchHistory).toHaveBeenCalledWith('$.url');
    expect(onRemoveSearchHistory).toHaveBeenCalledWith('storeId');
    expect(onClearSearchHistory).toHaveBeenCalledTimes(1);
  });
});
