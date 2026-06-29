export type ReportNextActionTone = 'primary' | 'purple' | 'rose' | 'cyan';
export type ReportFooterActionTone = 'cyan' | 'neutral' | 'muted' | 'success';

const NEXT_ACTION_BASE_CLASS_NAME = 'rounded border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const FOOTER_ACTION_BASE_CLASS_NAME = 'whitespace-nowrap px-2.5 py-1 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const getCoverageClassName = (level: 'success' | 'info' | 'warning'): string => {
  if (level === 'success') return 'border-emerald-700/50 bg-emerald-900/20 text-emerald-100';
  if (level === 'warning') return 'border-amber-700/50 bg-amber-900/20 text-amber-100';
  return 'border-sky-700/50 bg-sky-900/20 text-sky-100';
};

export const getNextActionClassName = (tone: ReportNextActionTone): string => {
  if (tone === 'primary') {
    return `${NEXT_ACTION_BASE_CLASS_NAME} border-teal-700/70 bg-teal-950/35 text-teal-100 hover:bg-teal-900/55`;
  }
  if (tone === 'purple') {
    return `${NEXT_ACTION_BASE_CLASS_NAME} border-violet-700/70 bg-violet-950/35 text-violet-100 hover:bg-violet-900/55`;
  }
  if (tone === 'rose') {
    return `${NEXT_ACTION_BASE_CLASS_NAME} border-rose-700/70 bg-rose-950/30 text-rose-100 hover:bg-rose-900/50`;
  }
  return `${NEXT_ACTION_BASE_CLASS_NAME} border-cyan-800/70 bg-cyan-950/30 text-cyan-100 hover:bg-cyan-900/50`;
};

export const getFooterActionClassName = (tone: ReportFooterActionTone): string => {
  if (tone === 'cyan') {
    return `${FOOTER_ACTION_BASE_CLASS_NAME} bg-cyan-900/40 text-cyan-100 hover:bg-cyan-800/60`;
  }
  if (tone === 'success') {
    return `${FOOTER_ACTION_BASE_CLASS_NAME} bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60`;
  }
  if (tone === 'muted') {
    return `${FOOTER_ACTION_BASE_CLASS_NAME} bg-editor-active text-gray-300 hover:bg-editor-border`;
  }
  return `${FOOTER_ACTION_BASE_CLASS_NAME} bg-editor-active text-gray-200 hover:bg-editor-border`;
};
