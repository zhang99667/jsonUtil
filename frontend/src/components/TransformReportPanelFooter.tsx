import React from 'react';
import type {
  TransformReportFooterAction,
  TransformReportFooterActionId,
} from '../utils/transformReportFooterActions';
import { getFooterActionClassName } from '../utils/transformReportPanelStyles';

interface TransformReportPanelFooterProps {
  summary: string;
  actions: TransformReportFooterAction[];
  actionHandlers: Record<TransformReportFooterActionId, () => void>;
}

export const TransformReportPanelFooter: React.FC<TransformReportPanelFooterProps> = ({
  summary,
  actions,
  actionHandlers,
}) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div className="min-w-[220px] flex-1 text-xs text-gray-500">
      {summary}
    </div>
    <div className="min-w-0 flex flex-1 flex-wrap items-center justify-end gap-1.5">
      {actions.map(action => (
        <button
          key={action.id}
          data-tour={action.dataTour}
          onClick={actionHandlers[action.id]}
          disabled={action.disabled}
          className={getFooterActionClassName(action.tone)}
          title={action.title}
          aria-label={action.ariaLabel}
        >
          {action.label}
        </button>
      ))}
    </div>
  </div>
);
