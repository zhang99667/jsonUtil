import { describe, expect, it, vi } from 'vitest';
import type { JsonTreeNode } from '../utils/jsonTreeModel';
import { clickElement, collectText, findByTour, findByType } from './componentElementTestHelpers';
import { JsonTreeNodeListPanel } from './JsonTreeNodeListPanel';

const createNode = (overrides: Partial<JsonTreeNode> = {}): JsonTreeNode => ({
  id: '$',
  path: '$',
  jsonPointer: '',
  parentPath: null,
  ancestorPaths: [],
  keyLabel: '$',
  depth: 0,
  kind: 'object',
  childCount: 1,
  isContainer: true,
  valuePreview: '{ userName: ... }',
  searchText: '$ object userName',
  ...overrides,
});

const createProps = () => ({
  nodes: [
    createNode(),
    createNode({
      id: '$.userName',
      path: '$.userName',
      jsonPointer: '/userName',
      parentPath: '$',
      ancestorPaths: ['$'],
      keyLabel: 'userName',
      depth: 1,
      kind: 'string',
      childCount: 0,
      isContainer: false,
      valuePreview: '"Alice"',
      searchText: '$.userName /userName userName Alice',
    }),
  ],
  selectedPath: '$.userName',
  expandedPaths: new Set<string>(['$']),
  searchText: 'user Alice',
  onToggleNode: vi.fn(),
  onSelectNode: vi.fn(),
  onCopyPath: vi.fn(),
});

describe('JsonTreeNodeListPanel', () => {
  it('渲染列表行、选中态、高亮和节点操作', () => {
    const props = createProps();
    const tree = JsonTreeNodeListPanel(props);
    const rows = findByTour(tree, 'structure-nav-row');
    const rootButtons = findByType(rows[0], 'button');
    const childButtons = findByType(rows[1], 'button');
    const highlightTexts = findByType(tree, 'mark').map(collectText);

    clickElement(rootButtons[0]);
    clickElement(childButtons[1]);
    clickElement(childButtons[2]);

    expect(rows).toHaveLength(2);
    expect(collectText(tree)).toContain('对象');
    expect(collectText(tree)).toContain('字符串');
    expect(String(rows[1].props.className)).toContain('border-emerald');
    expect(rows[1].props.style).toMatchObject({ paddingLeft: '22px' });
    expect(rootButtons[0].props).toMatchObject({
      title: '折叠节点',
      'aria-label': '折叠 $',
    });
    expect(String(findByType(rootButtons[0], 'svg')[0].props.className)).toContain('rotate-90');
    expect(highlightTexts).toEqual(expect.arrayContaining(['user', 'Alice']));
    expect(props.onToggleNode).toHaveBeenCalledWith(props.nodes[0]);
    expect(props.onSelectNode).toHaveBeenCalledWith(props.nodes[1]);
    expect(props.onCopyPath).toHaveBeenCalledWith('$.userName');
  });

  it('叶子节点展示点位并禁用展开入口', () => {
    const leafNode = createNode({
      id: '$.age',
      path: '$.age',
      jsonPointer: '/age',
      parentPath: '$',
      ancestorPaths: ['$'],
      keyLabel: 'age',
      depth: 1,
      kind: 'number',
      childCount: 0,
      isContainer: false,
      valuePreview: '18',
      searchText: '$.age age 18',
    });
    const tree = JsonTreeNodeListPanel({
      ...createProps(),
      nodes: [leafNode],
      selectedPath: null,
      expandedPaths: new Set<string>(),
      searchText: '',
    });
    const row = findByTour(tree, 'structure-nav-row')[0];
    const expandButton = findByType(row, 'button')[0];

    expect(expandButton.props).toMatchObject({
      disabled: true,
      title: '叶子节点',
      'aria-label': '叶子 $.age',
    });
    expect(findByType(expandButton, 'span')).toHaveLength(1);
    expect(findByType(tree, 'mark')).toHaveLength(0);
  });
});
