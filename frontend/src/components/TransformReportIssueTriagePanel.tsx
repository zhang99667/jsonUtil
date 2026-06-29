import React from 'react';
import type {
  TransformReportIssueTriageAction,
  TransformReportIssueTriageItem,
} from '../utils/transformReportActionItems';

interface TransformReportIssueTriagePanelProps {
  issuePriorityCount: number;
  issueTriageItems: TransformReportIssueTriageItem[];
  onFilter: (query: string) => void;
  onRunIssueTriageAction: (action: TransformReportIssueTriageAction) => void;
}

export const TransformReportIssueTriagePanel: React.FC<TransformReportIssueTriagePanelProps> = ({
  issuePriorityCount,
  issueTriageItems,
  onFilter,
  onRunIssueTriageAction,
}) => (
  <div
    data-tour="transform-report-issue-triage"
    className="mt-2 rounded border border-rose-800/40 bg-rose-950/15 px-2.5 py-2 text-xs"
  >
    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
      <div className="font-medium text-rose-100">建议优先处理</div>
      <button
        type="button"
        data-tour="transform-report-triage-all"
        onClick={() => onFilter('待处理')}
        className="rounded border border-rose-800/60 bg-editor-bg px-2 py-0.5 text-rose-100 transition-colors hover:bg-rose-900/40"
        title="筛选全部待处理项"
      >
        全部待处理 {issuePriorityCount}
      </button>
    </div>
    <div className="grid gap-1.5 md:grid-cols-3">
      {issueTriageItems.map(item => (
        <div
          key={item.key}
          className="rounded border border-editor-border bg-editor-bg/80 px-2 py-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-gray-200">
              {item.label} {item.count}
            </div>
            <button
              type="button"
              data-tour={`transform-report-triage-action-${item.key}`}
              onClick={() => onRunIssueTriageAction(item.action)}
              className="shrink-0 rounded border border-editor-border bg-editor-sidebar px-2 py-0.5 text-gray-300 transition-colors hover:text-rose-100"
              title={item.title}
            >
              {item.actionLabel}
            </button>
          </div>
          <div className="mt-1 text-gray-500">
            {item.description}
          </div>
        </div>
      ))}
    </div>
  </div>
);
