import type { SmartInputSuggestion, SmartSuggestionAction } from './smartInputSuggestion';

export const getActionPanelSmartSuggestionToneClassName = (
  tone: SmartInputSuggestion['tone'] | null | undefined,
): string => {
  if (tone === 'emerald') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
  if (tone === 'amber') return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  if (tone === 'violet') return 'border-violet-500/30 bg-violet-500/10 text-violet-100';
  if (tone === 'rose') return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
  return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
};

export const getActionPanelSmartSuggestionOriginLabel = (
  origin: 'clipboard' | null | undefined,
): string => (
  origin === 'clipboard' ? '剪贴板识别' : ''
);

export const getVisibleActionPanelSmartSuggestionActions = (
  suggestion: SmartInputSuggestion,
): SmartSuggestionAction[] => (
  suggestion.actions.slice(0, 3)
);
