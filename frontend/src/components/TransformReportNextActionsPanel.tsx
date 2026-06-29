import React from 'react';
import type {
  TransformReportNextAction,
  TransformReportNextActionItem,
} from '../utils/transformReportActionItems';
import { getNextActionClassName } from '../utils/transformReportPanelStyles';

interface TransformReportNextActionsPanelProps {
  nextActions: TransformReportNextActionItem[];
  onRunNextAction: (action: TransformReportNextAction) => void;
}

export const TransformReportNextActionsPanel: React.FC<TransformReportNextActionsPanelProps> = ({
  nextActions,
  onRunNextAction,
}) => (
  <div
    data-tour="transform-report-next-actions"
    className="mt-2 rounded border border-cyan-800/40 bg-cyan-950/15 px-2.5 py-2 text-xs"
  >
    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
      <div className="font-medium text-cyan-100">真实 response 下一步</div>
      <div className="text-gray-500">推荐 {nextActions.length} 项</div>
    </div>
    <div className="grid gap-1.5 md:grid-cols-3">
      {nextActions.map(item => (
        <button
          key={item.key}
          type="button"
          data-tour={`transform-report-next-action-${item.key}`}
          onClick={() => onRunNextAction(item.action)}
          disabled={item.disabled}
          className={getNextActionClassName(item.tone)}
          title={item.title}
          aria-label={`${item.label}，${item.title}`}
        >
          <span className="block font-medium">{item.label}</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-current/75">
            {item.description}
          </span>
        </button>
      ))}
    </div>
  </div>
);
