import type {
  SchemeQualityLevel,
  SchemeQualitySummaryItem,
} from './schemeQualitySummary';

export const getSchemeQualityClassName = (level: SchemeQualityLevel): string => {
  switch (level) {
    case 'success':
      return 'border-emerald-700/50 bg-emerald-950/30 text-emerald-100';
    case 'warning':
      return 'border-amber-700/50 bg-amber-950/30 text-amber-100';
    case 'error':
      return 'border-red-700/50 bg-red-950/30 text-red-100';
    case 'info':
    default:
      return 'border-cyan-700/50 bg-cyan-950/30 text-cyan-100';
  }
};

export const getSchemeQualityItemClassName = (
  tone: SchemeQualitySummaryItem['tone'] = 'default'
): string => {
  switch (tone) {
    case 'success':
      return 'bg-emerald-900/30 text-emerald-200 border-emerald-700/40';
    case 'warning':
      return 'bg-amber-900/30 text-amber-200 border-amber-700/40';
    case 'cyan':
      return 'bg-cyan-900/30 text-cyan-200 border-cyan-700/40';
    case 'default':
    default:
      return 'bg-editor-bg text-gray-300 border-editor-border';
  }
};
