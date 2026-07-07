import React from 'react';
import type { JsonTreeModel } from '../utils/jsonTreeModel';

interface JsonTreePanelFooterProps {
  isLoading: boolean;
  model: JsonTreeModel | null;
  hasActiveFilter: boolean;
  visibleNodeCount: number;
  containerCount: number;
}

const getJsonTreePanelFooterSummary = ({
  isLoading,
  model,
  hasActiveFilter,
  visibleNodeCount,
  containerCount,
}: JsonTreePanelFooterProps): string => {
  if (isLoading) return '结构导航解析中...';
  if (!model) return '结构导航';

  const nodeSummary = hasActiveFilter
    ? `${visibleNodeCount}/${model.totalNodes} 个匹配`
    : `${model.totalNodes} 个节点`;
  const limitSummary = model.isLimited ? `，已按 ${model.maxNodes} 节点上限截断` : '';
  return `${nodeSummary} / ${containerCount} 个容器${limitSummary}`;
};

export const JsonTreePanelFooter: React.FC<JsonTreePanelFooterProps> = (props) => (
  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-xs text-gray-400">
    <span className="truncate">
      {getJsonTreePanelFooterSummary(props)}
    </span>
    <span className="shrink-0">点击节点可定位，PATH 可复制路径</span>
  </div>
);
