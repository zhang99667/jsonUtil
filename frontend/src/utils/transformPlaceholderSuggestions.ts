import {
  buildPlaceholderReplacementSuggestion,
  type PlaceholderReplacementSuggestion,
} from './transformPlaceholderSuggestionBuilder';
import type { TransformPlaceholderSuggestionView } from './transformPlaceholderSuggestionTypes';

export {
  isSafePlaceholderReplacement,
  normalizeReplacementSourceLabel,
} from './transformPlaceholderSuggestionRules';

export type {
  PlaceholderReplacementCandidate,
} from './transformPlaceholderSuggestionRules';

export type { PlaceholderReplacementSuggestion } from './transformPlaceholderSuggestionBuilder';
export type {
  TransformPlaceholderSuggestionGroup,
  TransformPlaceholderSuggestionRecord,
  TransformPlaceholderSuggestionView,
} from './transformPlaceholderSuggestionTypes';

export const buildPlaceholderReplacementSuggestions = (
  reportView: TransformPlaceholderSuggestionView,
  suggestionSourceView = reportView
): Map<string, PlaceholderReplacementSuggestion> => {
  const suggestions = new Map<string, PlaceholderReplacementSuggestion>();
  if (suggestionSourceView.isRecordTruncated) return suggestions;

  reportView.runtimePlaceholderGroups.forEach(group => {
    const suggestion = buildPlaceholderReplacementSuggestion(group.value, suggestionSourceView.records);
    if (!suggestion) return;

    suggestions.set(group.value, suggestion);
  });

  return suggestions;
};
