import React from 'react';
import type { JsonTreeGraphEdge, JsonTreeGraphView, JsonTreeNodeKind } from '../utils/jsonTreeModel';

interface JsonTreeGraphPanelProps {
  graphView: JsonTreeGraphView;
  selectedPath: string | null;
  onSelectNode: (path: string) => void;
}

const getGraphNodePalette = (kind: JsonTreeNodeKind) => {
  if (kind === 'object') return { fill: '#172554', stroke: '#3b82f6', badge: '#60a5fa' };
  if (kind === 'array') return { fill: '#164e63', stroke: '#06b6d4', badge: '#67e8f9' };
  if (kind === 'string') return { fill: '#064e3b', stroke: '#10b981', badge: '#6ee7b7' };
  if (kind === 'number') return { fill: '#78350f', stroke: '#f59e0b', badge: '#fcd34d' };
  if (kind === 'boolean') return { fill: '#4c1d95', stroke: '#8b5cf6', badge: '#c4b5fd' };
  return { fill: '#1f2937', stroke: '#6b7280', badge: '#d1d5db' };
};

const truncateGraphText = (value: string, maxLength: number): string => (
  value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 3))}...`
);

const getGraphEdgePath = (edge: Pick<JsonTreeGraphEdge, 'x1' | 'y1' | 'x2' | 'y2'>): string => {
  const controlOffset = Math.max(24, Math.abs(edge.x2 - edge.x1) / 2);
  return `M ${edge.x1} ${edge.y1} C ${edge.x1 + controlOffset} ${edge.y1}, ${edge.x2 - controlOffset} ${edge.y2}, ${edge.x2} ${edge.y2}`;
};

export const JsonTreeGraphPanel: React.FC<JsonTreeGraphPanelProps> = ({
  graphView,
  selectedPath,
  onSelectNode,
}) => {
  const handleGraphNodeKeyDown = (event: React.KeyboardEvent<SVGGElement>, path: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelectNode(path);
  };

  return (
    <div data-tour="structure-nav-graph" className="min-h-0 flex-1 overflow-auto bg-editor-bg p-3">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2 text-[11px] text-gray-500">
        <span className="truncate">
          图谱展示 {graphView.nodes.length}/{graphView.totalCandidateNodes} 个节点，上限深度 {graphView.maxDepth} / {graphView.maxNodes} 节点
        </span>
        {graphView.isLimited && (
          <span className="shrink-0 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-100">
            已截断
          </span>
        )}
      </div>
      <svg
        role="img"
        aria-label="JSON 结构图谱"
        width={graphView.width}
        height={graphView.height}
        viewBox={`0 0 ${graphView.width} ${graphView.height}`}
        className="rounded border border-editor-border bg-editor-sidebar/50"
      >
        <defs>
          <pattern id="json-tree-graph-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={graphView.width} height={graphView.height} fill="url(#json-tree-graph-grid)" />
        {graphView.edges.map(edge => (
          <path
            key={edge.id}
            d={getGraphEdgePath(edge)}
            fill="none"
            stroke="rgba(148,163,184,0.34)"
            strokeWidth="1.5"
          />
        ))}
        {graphView.nodes.map(node => {
          const isSelected = selectedPath === node.path;
          const palette = getGraphNodePalette(node.kind);
          return (
            <g
              key={node.path}
              role="button"
              tabIndex={0}
              data-tour="structure-nav-graph-node"
              aria-label={`选择节点 ${node.path}`}
              onClick={() => onSelectNode(node.path)}
              onKeyDown={(event) => handleGraphNodeKeyDown(event, node.path)}
              className="cursor-pointer outline-none"
            >
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx="6"
                fill={palette.fill}
                stroke={isSelected ? '#34d399' : palette.stroke}
                strokeWidth={isSelected ? '2.5' : '1.4'}
                opacity={isSelected ? '1' : '0.86'}
              />
              <circle
                cx={node.x + 12}
                cy={node.y + node.height / 2}
                r="3.5"
                fill={palette.badge}
              />
              <text
                x={node.x + 22}
                y={node.y + 13}
                fill="#f8fafc"
                fontSize="10.5"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                pointerEvents="none"
              >
                {truncateGraphText(node.keyLabel, 16)}
              </text>
              <text
                x={node.x + 22}
                y={node.y + 26}
                fill="#94a3b8"
                fontSize="9.5"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                pointerEvents="none"
              >
                {truncateGraphText(node.valuePreview, 18)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
