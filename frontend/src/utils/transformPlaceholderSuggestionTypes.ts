import type { TransformPlaceholderSuggestionSourceRecord } from './transformPlaceholderSuggestionRules';

export interface TransformPlaceholderSuggestionGroup {
  value: string;
}

export type TransformPlaceholderSuggestionRecord = TransformPlaceholderSuggestionSourceRecord;

export interface TransformPlaceholderSuggestionView {
  isRecordTruncated: boolean;
  runtimePlaceholderGroups: readonly TransformPlaceholderSuggestionGroup[];
  records: readonly TransformPlaceholderSuggestionRecord[];
}
