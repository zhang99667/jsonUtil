export interface TransformPlaceholderSuggestionSourceRecord {
  path: string;
  sourceLabel?: string;
  originalValue?: string;
}

export interface PlaceholderReplacementCandidate {
  replacement: string;
  sourcePath: string;
  sourceLabel: string;
}

const PLACEHOLDER_REPLACEMENT_SOURCE_LABELS: Record<string, readonly string[]> = {
  __AD_EXTRA_PARAM_ENCODE_1__: ['extraParam', 'ad_extra_param'],
  __EXT_RENDER_AFD__: ['extRenderAfd', 'ext_render_afd'],
  __REWARD_NUM__: ['rewardNum', 'reward_num'],
  __CLICK_ID__: ['clickId', 'click_id'],
  __SIGN__: ['sign'],
  __CALLBACK_URL__: ['callbackUrl', 'callback_url'],
};

export const normalizeReplacementSourceLabel = (value: string): string => (
  value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
);

export const getPlaceholderReplacementAliases = (placeholderValue: string): readonly string[] => (
  PLACEHOLDER_REPLACEMENT_SOURCE_LABELS[placeholderValue]?.map(normalizeReplacementSourceLabel) || []
);

export const isSafePlaceholderReplacement = (replacement: string, placeholderValue: string): boolean => {
  const trimmed = replacement.trim();
  return Boolean(trimmed) && trimmed !== placeholderValue && !trimmed.includes(placeholderValue);
};

export const collectPlaceholderReplacementCandidates = (
  records: readonly TransformPlaceholderSuggestionSourceRecord[],
  aliases: readonly string[],
  placeholderValue: string
): PlaceholderReplacementCandidate[] => (
  records.flatMap(record => {
    if (!record.sourceLabel || !record.originalValue) return [];

    const normalizedSourceLabel = normalizeReplacementSourceLabel(record.sourceLabel);
    if (!aliases.includes(normalizedSourceLabel) || !isSafePlaceholderReplacement(record.originalValue, placeholderValue)) {
      return [];
    }

    return [{
      replacement: record.originalValue,
      sourcePath: record.path,
      sourceLabel: record.sourceLabel,
    }];
  })
);

export const getUniquePlaceholderReplacementCandidates = (
  candidates: readonly PlaceholderReplacementCandidate[]
): PlaceholderReplacementCandidate[] => (
  Array.from(new Map(candidates.map(candidate => [candidate.replacement, candidate])).values())
);
