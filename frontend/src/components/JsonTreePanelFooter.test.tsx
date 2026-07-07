import { describe, expect, it } from 'vitest';
import type { JsonTreeModel } from '../utils/jsonTreeModel';
import { collectText } from './componentElementTestHelpers';
import { JsonTreePanelFooter } from './JsonTreePanelFooter';

const model: JsonTreeModel = {
  nodes: [],
  totalNodes: 12,
  maxNodes: 10000,
  maxDepth: 16,
  isLimited: false,
};

describe('JsonTreePanelFooter', () => {
  it('加载中和空模型展示基础状态', () => {
    expect(collectText(JsonTreePanelFooter({
      isLoading: true,
      model: null,
      hasActiveFilter: false,
      visibleNodeCount: 0,
      containerCount: 0,
    }))).toContain('结构导航解析中...');

    expect(collectText(JsonTreePanelFooter({
      isLoading: false,
      model: null,
      hasActiveFilter: false,
      visibleNodeCount: 0,
      containerCount: 0,
    }))).toContain('结构导航');
  });

  it('展示节点总数、筛选匹配和截断摘要', () => {
    const filteredText = collectText(JsonTreePanelFooter({
      isLoading: false,
      model: { ...model, isLimited: true, maxNodes: 50 },
      hasActiveFilter: true,
      visibleNodeCount: 3,
      containerCount: 4,
    }));
    const fullText = collectText(JsonTreePanelFooter({
      isLoading: false,
      model,
      hasActiveFilter: false,
      visibleNodeCount: 12,
      containerCount: 4,
    }));

    expect(filteredText).toContain('3/12 个匹配 / 4 个容器，已按 50 节点上限截断');
    expect(fullText).toContain('12 个节点 / 4 个容器');
    expect(fullText).toContain('点击节点可定位，PATH 可复制路径');
  });
});
