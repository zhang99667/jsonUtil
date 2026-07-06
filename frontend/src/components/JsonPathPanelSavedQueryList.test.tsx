import { describe, expect, it, vi } from 'vitest';
import { findByType } from './componentElementTestHelpers';
import { JsonPathPanelSavedQueryList } from './JsonPathPanelSavedQueryList';
import { JsonPathPanelSavedQueryRow } from './JsonPathPanelSavedQueryRow';

describe('JsonPathPanelSavedQueryList', () => {
  it('把列表项装配成可选择、可删除的保存查询行', () => {
    const onSelectQuery = vi.fn();
    const onRemoveQuery = vi.fn();
    const onWheel = vi.fn();
    const onScroll = vi.fn();
    const listRef = vi.fn();

    const tree = JsonPathPanelSavedQueryList({
      items: ['$.a', '$.b'],
      tone: 'history',
      className: 'list-shell',
      dataTour: 'jsonpath-history-item',
      selectLabelPrefix: '填入并查询历史记录：',
      removeLabelPrefix: '删除历史记录：',
      listRef,
      onScroll,
      onWheel,
      onSelectQuery,
      onRemoveQuery,
    });
    const rows = findByType(tree, JsonPathPanelSavedQueryRow);

    expect(tree.props).toMatchObject({ className: 'list-shell', ref: listRef, onScroll, onWheel });
    expect(rows).toHaveLength(2);
    expect(rows[0].props).toMatchObject({
      item: '$.a',
      tone: 'history',
      dataTour: 'jsonpath-history-item',
      selectLabel: '填入并查询历史记录：$.a',
      removeLabel: '删除历史记录：$.a',
    });

    (rows[1].props.onSelect as () => void)();
    (rows[1].props.onRemove as () => void)();
    expect(onSelectQuery).toHaveBeenCalledWith('$.b');
    expect(onRemoveQuery).toHaveBeenCalledWith('$.b', 1);
  });
});
