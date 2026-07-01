import React from 'react';

export type TransformReportSummaryMetricButtonTone = 'cyan' | 'teal' | 'slate' | 'rose' | 'amber' | 'sky' | 'violet' | 'violetAction';

interface TransformReportSummaryMetricButtonInput {
  children: React.ReactNode;
  dataTour: string;
  title: string;
  tone: TransformReportSummaryMetricButtonTone;
  disabled?: boolean;
  onClick: () => void;
}

export interface TransformReportSummaryFilterButtonItem {
  label: string;
  count: number;
  query: string;
  dataTour: string;
  title: string;
  tone: TransformReportSummaryMetricButtonTone;
}

interface TransformReportSummaryFilterButtonInput extends TransformReportSummaryFilterButtonItem {
  onFilter: (query: string) => void;
}

const toneClassName: Record<TransformReportSummaryMetricButtonTone, string> = {
  cyan: 'bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded hover:bg-cyan-900/50 transition-colors',
  teal: 'bg-teal-950/40 text-teal-100 border border-teal-800/60 px-2 py-0.5 rounded hover:bg-teal-900/55 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  slate: 'bg-slate-900/45 text-slate-100 border border-slate-700/60 px-2 py-0.5 rounded hover:bg-slate-800/60 transition-colors',
  rose: 'bg-rose-950/35 text-rose-100 border border-rose-700/60 px-2 py-0.5 rounded hover:bg-rose-900/55 transition-colors',
  amber: 'bg-amber-900/30 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded hover:bg-amber-800/50 transition-colors',
  sky: 'bg-sky-900/30 text-sky-200 border border-sky-700/50 px-2 py-0.5 rounded hover:bg-sky-800/50 transition-colors',
  violet: 'bg-violet-900/30 text-violet-200 border border-violet-700/50 px-2 py-0.5 rounded hover:bg-violet-800/50 transition-colors',
  violetAction: 'bg-violet-950/40 text-violet-100 border border-violet-700/60 px-2 py-0.5 rounded hover:bg-violet-900/55 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
};

export const renderTransformReportSummaryMetricButton = ({
  children,
  dataTour,
  title,
  tone,
  disabled,
  onClick,
}: TransformReportSummaryMetricButtonInput) => (
  <button
    type="button"
    data-tour={dataTour}
    onClick={onClick}
    disabled={disabled}
    className={toneClassName[tone]}
    title={title}
  >
    {children}
  </button>
);

export const renderTransformReportSummaryFilterButton = ({
  label, count, query, dataTour, title, tone, onFilter,
}: TransformReportSummaryFilterButtonInput) => renderTransformReportSummaryMetricButton({
  dataTour,
  title,
  tone,
  onClick: () => onFilter(query),
  children: <>{label} {count}</>,
});
