import {
  collectPlaceholderReplacementCandidates,
  getPlaceholderReplacementAliases,
  getUniquePlaceholderReplacementCandidates,
  type PlaceholderReplacementCandidate,
  type TransformPlaceholderSuggestionSourceRecord,
} from './transformPlaceholderSuggestionRules';

export interface PlaceholderReplacementSuggestion extends PlaceholderReplacementCandidate {
  reason: string;
}

export const buildPlaceholderReplacementSuggestion = (
  placeholderValue: string,
  records: readonly TransformPlaceholderSuggestionSourceRecord[]
): PlaceholderReplacementSuggestion | null => {
  const aliases = getPlaceholderReplacementAliases(placeholderValue);
  if (aliases.length === 0) return null;

  const candidates = collectPlaceholderReplacementCandidates(
    records,
    aliases,
    placeholderValue
  );
  const uniqueCandidates = getUniquePlaceholderReplacementCandidates(candidates);
  if (uniqueCandidates.length !== 1) return null;

  const candidate = uniqueCandidates[0];
  return {
    replacement: candidate.replacement,
    sourcePath: candidate.sourcePath,
    sourceLabel: candidate.sourceLabel,
    reason: `业务字段 ${candidate.sourceLabel} 与 ${placeholderValue} 强匹配`,
  };
};
