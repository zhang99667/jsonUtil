import { describe, expect, it, vi } from 'vitest';
import {
  buildJsonTreeArrayTablePreview,
  filterJsonTreeArrayTablePreviewColumns,
} from '../utils/jsonTreeModel';
import { clickElement, collectText, findByTour, findByType } from './componentElementTestHelpers';
import { JsonTreeArrayTablePreviewPanel } from './JsonTreeArrayTablePreviewPanel';

const createPreview = () => buildJsonTreeArrayTablePreview(JSON.stringify({
  items: [
    { id: 1, name: 'Alice', note: 'first' },
    { id: 2, name: 'Bob', note: 'second' },
    { id: 3, name: 'Carol', note: 'third' },
  ],
}), '/items', {
  maxRows: 2,
  maxColumns: 2,
});

describe('JsonTreeArrayTablePreviewPanel', () => {
  it('缺少预览数据时不渲染', () => {
    expect(JsonTreeArrayTablePreviewPanel({
      sourcePreview: null,
      preview: null,
      tableColumnFilter: '',
      onTableColumnFilterChange: vi.fn(),
      onCopyTableJson: vi.fn(),
      onCopyTableCsv: vi.fn(),
    })).toBeNull();
  });

  it('渲染对象数组预览并转发表格操作', () => {
    const preview = createPreview();
    if (!preview) throw new Error('expected preview fixture');
    const onTableColumnFilterChange = vi.fn();
    const onCopyTableJson = vi.fn();
    const onCopyTableCsv = vi.fn();
    const tree = JsonTreeArrayTablePreviewPanel({
      sourcePreview: preview,
      preview,
      tableColumnFilter: '',
      onTableColumnFilterChange,
      onCopyTableJson,
      onCopyTableCsv,
    });

    expect(collectText(findByTour(tree, 'structure-nav-table-preview')[0]))
      .toContain('对象数组预览: 2/3 行，2/3 列，已截断');
    expect(findByType(tree, 'table')).toHaveLength(1);
    expect(collectText(tree)).toContain('Alice');
    expect(collectText(tree)).toContain('Bob');

    const input = findByTour(tree, 'structure-nav-table-column-filter')[0];
    const onChange = input.props.onChange as (event: { target: { value: string } }) => void;
    onChange({ target: { value: 'name' } });
    clickElement(findByTour(tree, 'structure-nav-copy-table-json')[0]);
    clickElement(findByTour(tree, 'structure-nav-copy-table-csv')[0]);

    expect(input.props).toMatchObject({
      value: '',
      'aria-label': '筛选表格列名',
    });
    expect(onTableColumnFilterChange).toHaveBeenCalledWith('name');
    expect(onCopyTableJson).toHaveBeenCalledWith(preview);
    expect(onCopyTableCsv).toHaveBeenCalledWith(preview);
  });

  it('列筛选无结果时展示空态并禁用复制按钮', () => {
    const sourcePreview = createPreview();
    if (!sourcePreview) throw new Error('expected preview fixture');
    const emptyPreview = filterJsonTreeArrayTablePreviewColumns(sourcePreview, 'missing');
    const tree = JsonTreeArrayTablePreviewPanel({
      sourcePreview,
      preview: emptyPreview,
      tableColumnFilter: 'missing',
      onTableColumnFilterChange: vi.fn(),
      onCopyTableJson: vi.fn(),
      onCopyTableCsv: vi.fn(),
    });

    expect(collectText(tree)).toContain('列筛选 0/3');
    expect(collectText(tree)).toContain('没有匹配的表格列。');
    expect(findByType(tree, 'table')).toHaveLength(0);
    expect(findByTour(tree, 'structure-nav-copy-table-json')[0].props.disabled).toBe(true);
    expect(findByTour(tree, 'structure-nav-copy-table-csv')[0].props.disabled).toBe(true);
  });
});
