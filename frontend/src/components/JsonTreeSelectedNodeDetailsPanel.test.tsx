import { describe, expect, it, vi } from 'vitest';
import type { JsonStringSemanticHint } from '../utils/jsonValueSemantics';
import type { JsonTreeNode } from '../utils/jsonTreeModel';
import { buildJsonTreeArrayTablePreview } from '../utils/jsonTreeModel';
import { clickElement, collectText, findByTour, findByType, findByTypeAndText } from './componentElementTestHelpers';
import { JsonTreeArrayTablePreviewPanel } from './JsonTreeArrayTablePreviewPanel';
import { JsonTreeSelectedNodeDetailsPanel } from './JsonTreeSelectedNodeDetailsPanel';

const createNode = (overrides: Partial<JsonTreeNode> = {}): JsonTreeNode => ({
  id: '$.url',
  path: '$.url',
  jsonPointer: '/url',
  parentPath: '$',
  ancestorPaths: ['$'],
  keyLabel: 'url',
  depth: 1,
  kind: 'string',
  childCount: 0,
  isContainer: false,
  valuePreview: '"https://example.com/page"',
  searchText: '$.url /url url https://example.com/page',
  ...overrides,
});

const semanticHints: JsonStringSemanticHint[] = [{
  kind: 'url',
  label: 'URL',
  detail: 'https://example.com/page',
}];

const baseProps = {
  selectedNode: createNode(),
  selectedSemanticHints: [] as JsonStringSemanticHint[],
  selectedArrayTablePreview: null,
  visibleArrayTablePreview: null,
  tableColumnFilter: '',
  canQuerySelectedField: false,
  canOpenSelectedSemanticValue: false,
  onCopyPath: vi.fn(),
  onCopyPointer: vi.fn(),
  onCopyNodeValue: vi.fn(),
  onCopyNodeSubtree: vi.fn(),
  onCopyNodeTypeScript: vi.fn(),
  onQuerySelectedField: vi.fn(),
  onOpenSelectedSemanticValue: vi.fn(),
  onTableColumnFilterChange: vi.fn(),
  onCopyTableJson: vi.fn(),
  onCopyTableCsv: vi.fn(),
};

describe('JsonTreeSelectedNodeDetailsPanel', () => {
  it('渲染选中节点详情并转发基础操作', () => {
    const props = {
      ...baseProps,
      selectedSemanticHints: semanticHints,
      canQuerySelectedField: true,
      canOpenSelectedSemanticValue: true,
      onCopyPath: vi.fn(),
      onCopyPointer: vi.fn(),
      onCopyNodeValue: vi.fn(),
      onQuerySelectedField: vi.fn(),
      onOpenSelectedSemanticValue: vi.fn(),
    };
    const tree = JsonTreeSelectedNodeDetailsPanel(props);

    expect(collectText(tree)).toContain('字符串');
    expect(collectText(tree)).toContain('$.url');
    expect(collectText(tree)).toContain('/url');
    expect(collectText(findByTour(tree, 'structure-nav-semantic-hints')[0]))
      .toContain('URLhttps://example.com/page');

    clickElement(findByTypeAndText(tree, 'button', 'PATH')[0]);
    clickElement(findByTypeAndText(tree, 'button', 'Pointer')[0]);
    clickElement(findByTypeAndText(tree, 'button', '复制值')[0]);
    clickElement(findByTypeAndText(tree, 'button', '格式化值')[0]);
    clickElement(findByTour(tree, 'structure-nav-query-same-field')[0]);
    clickElement(findByTour(tree, 'structure-nav-open-semantic-value')[0]);

    expect(props.onCopyPath).toHaveBeenCalledWith('$.url');
    expect(props.onCopyPointer).toHaveBeenCalledWith(props.selectedNode);
    expect(props.onCopyNodeValue).toHaveBeenNthCalledWith(1, props.selectedNode, false);
    expect(props.onCopyNodeValue).toHaveBeenNthCalledWith(2, props.selectedNode, true);
    expect(props.onQuerySelectedField).toHaveBeenCalledWith(props.selectedNode);
    expect(props.onOpenSelectedSemanticValue).toHaveBeenCalledTimes(1);
  });

  it('容器节点渲染子树、TS 和表格预览入口', () => {
    const selectedNode = createNode({
      id: '$.items',
      path: '$.items',
      jsonPointer: '/items',
      keyLabel: 'items',
      kind: 'array',
      childCount: 2,
      isContainer: true,
      valuePreview: '[{...}, {...}]',
    });
    const preview = buildJsonTreeArrayTablePreview(JSON.stringify({
      items: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    }), '/items');
    if (!preview) throw new Error('expected table preview');

    const props = {
      ...baseProps,
      selectedNode,
      selectedArrayTablePreview: preview,
      visibleArrayTablePreview: preview,
      tableColumnFilter: 'name',
      onCopyNodeSubtree: vi.fn(),
      onCopyNodeTypeScript: vi.fn(),
      onTableColumnFilterChange: vi.fn(),
      onCopyTableJson: vi.fn(),
      onCopyTableCsv: vi.fn(),
    };
    const tree = JsonTreeSelectedNodeDetailsPanel(props);
    const tablePreviewPanel = findByType(tree, JsonTreeArrayTablePreviewPanel)[0];

    clickElement(findByTour(tree, 'structure-nav-copy-subtree')[0]);
    clickElement(findByTour(tree, 'structure-nav-copy-typescript')[0]);
    (tablePreviewPanel.props.onTableColumnFilterChange as (value: string) => void)('id');
    (tablePreviewPanel.props.onCopyTableJson as (value: typeof preview) => void)(preview);
    (tablePreviewPanel.props.onCopyTableCsv as (value: typeof preview) => void)(preview);

    expect(collectText(tree)).toContain('数组');
    expect(tablePreviewPanel.props).toMatchObject({
      sourcePreview: preview,
      preview,
      tableColumnFilter: 'name',
    });
    expect(props.onCopyNodeSubtree).toHaveBeenCalledWith(selectedNode);
    expect(props.onCopyNodeTypeScript).toHaveBeenCalledWith(selectedNode);
    expect(props.onTableColumnFilterChange).toHaveBeenCalledWith('id');
    expect(props.onCopyTableJson).toHaveBeenCalledWith(preview);
    expect(props.onCopyTableCsv).toHaveBeenCalledWith(preview);
  });
});
