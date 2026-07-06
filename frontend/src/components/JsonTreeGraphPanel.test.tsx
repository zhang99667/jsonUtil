import { describe, expect, it, vi } from 'vitest';
import type { JsonTreeGraphView } from '../utils/jsonTreeModel';
import { clickElement, collectText, findByTour, findByType } from './componentElementTestHelpers';
import { JsonTreeGraphPanel } from './JsonTreeGraphPanel';

const graphView: JsonTreeGraphView = {
  nodes: [
    {
      path: '$',
      parentPath: null,
      keyLabel: '$',
      kind: 'object',
      childCount: 1,
      valuePreview: '{ user: ... }',
      depth: 0,
      x: 24,
      y: 24,
      width: 132,
      height: 32,
    },
    {
      path: '$.veryLongUserNameNode',
      parentPath: '$',
      keyLabel: 'veryLongUserNameNode',
      kind: 'string',
      childCount: 0,
      valuePreview: 'very long user display name',
      depth: 1,
      x: 176,
      y: 64,
      width: 132,
      height: 32,
    },
  ],
  edges: [{
    id: '$->$.veryLongUserNameNode',
    fromPath: '$',
    toPath: '$.veryLongUserNameNode',
    x1: 156,
    y1: 40,
    x2: 176,
    y2: 80,
  }],
  width: 360,
  height: 220,
  totalCandidateNodes: 5,
  maxNodes: 2,
  maxDepth: 3,
  isLimited: true,
};

describe('JsonTreeGraphPanel', () => {
  it('渲染图谱摘要、节点和选中态', () => {
    const tree = JsonTreeGraphPanel({
      graphView,
      selectedPath: '$.veryLongUserNameNode',
      onSelectNode: vi.fn(),
    });
    const graphNodes = findByTour(tree, 'structure-nav-graph-node');
    const selectedRect = findByType(graphNodes[1], 'rect')[0];

    expect(collectText(findByTour(tree, 'structure-nav-graph')[0]))
      .toContain('图谱展示 2/5 个节点，上限深度 3 / 2 节点已截断');
    expect(findByType(tree, 'svg')[0].props).toMatchObject({
      role: 'img',
      'aria-label': 'JSON 结构图谱',
      width: 360,
      height: 220,
      viewBox: '0 0 360 220',
    });
    expect(collectText(graphNodes[1])).toContain('veryLongUserN...');
    expect(collectText(graphNodes[1])).toContain('very long user ...');
    expect(selectedRect.props).toMatchObject({
      stroke: '#34d399',
      strokeWidth: '2.5',
      opacity: '1',
    });
  });

  it('未截断图谱不展示截断标记', () => {
    const tree = JsonTreeGraphPanel({
      graphView: {
        ...graphView,
        totalCandidateNodes: graphView.nodes.length,
        isLimited: false,
      },
      selectedPath: null,
      onSelectNode: vi.fn(),
    });

    expect(collectText(findByTour(tree, 'structure-nav-graph')[0])).not.toContain('已截断');
  });

  it('点击和键盘确认会选择节点，其他按键不触发', () => {
    const onSelectNode = vi.fn();
    const tree = JsonTreeGraphPanel({
      graphView,
      selectedPath: null,
      onSelectNode,
    });
    const graphNode = findByTour(tree, 'structure-nav-graph-node')[1];
    const preventDefault = vi.fn();

    clickElement(graphNode);
    (graphNode.props.onKeyDown as (event: { key: string; preventDefault: () => void }) => void)({
      key: 'Enter',
      preventDefault,
    });
    (graphNode.props.onKeyDown as (event: { key: string; preventDefault: () => void }) => void)({
      key: ' ',
      preventDefault,
    });
    (graphNode.props.onKeyDown as (event: { key: string; preventDefault: () => void }) => void)({
      key: 'Escape',
      preventDefault,
    });

    expect(graphNode.props).toMatchObject({
      role: 'button',
      tabIndex: 0,
      'aria-label': '选择节点 $.veryLongUserNameNode',
    });
    expect(onSelectNode).toHaveBeenCalledTimes(3);
    expect(onSelectNode).toHaveBeenNthCalledWith(1, '$.veryLongUserNameNode');
    expect(onSelectNode).toHaveBeenNthCalledWith(2, '$.veryLongUserNameNode');
    expect(onSelectNode).toHaveBeenNthCalledWith(3, '$.veryLongUserNameNode');
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });
});
