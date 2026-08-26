import type {
  TransformContext,
  TransformRuntimePlaceholder,
  TransformUnresolvedCandidate,
  TransformWarning,
} from '../types.ts';
import type { SchemePlaceholder } from './schemeTypes.ts';

const MAX_UNRESOLVED_CANDIDATE_COUNT = 100;
const MAX_RUNTIME_PLACEHOLDER_COUNT = 100;

export const formatStringPreview = (value: string, maxLength = 120): string => (
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
);

export const joinDecodedJsonPath = (basePath: string, relativePath: string): string => (
  relativePath === '$'
    ? basePath
    : `${basePath}${relativePath.slice(1)}`
);

export interface ContextCollectorOptions {
  context: TransformContext;
}

export const createContextCollectors = ({
  context,
}: ContextCollectorOptions) => {
  const addUnresolvedCandidate = (
    path: string,
    value: string,
    detectedType: string,
    message: string,
    sourceLabel?: string
  ): void => {
    const candidates = context.unresolvedCandidates || [];
    if (candidates.length >= MAX_UNRESOLVED_CANDIDATE_COUNT) return;

    context.unresolvedCandidates = candidates;
    context.unresolvedCandidates.push({
      path,
      sourceLabel,
      originalValue: value,
      message,
      length: value.length,
      preview: formatStringPreview(value),
      detectedType,
    } satisfies TransformUnresolvedCandidate);
  };

  const addRuntimePlaceholder = (
    placeholder: Omit<TransformRuntimePlaceholder, 'path'> & { path: string }
  ): void => {
    const placeholders = context.runtimePlaceholders || [];
    if (placeholders.some(item => item.path === placeholder.path && item.value === placeholder.value)) return;
    if (placeholders.length >= MAX_RUNTIME_PLACEHOLDER_COUNT) return;

    context.runtimePlaceholders = placeholders;
    context.runtimePlaceholders.push(placeholder);
  };

  const addSchemeRuntimePlaceholders = (
    sourcePath: string,
    placeholders?: SchemePlaceholder[],
    sourceLabel?: string,
    sourceOriginalValue?: string
  ): void => {
    placeholders?.forEach(placeholder => {
      addRuntimePlaceholder({
        path: joinDecodedJsonPath(sourcePath, placeholder.path),
        sourcePath,
        sourceLabel,
        sourceOriginalValue,
        value: placeholder.value,
        description: placeholder.description,
      });
    });
  };

  const addStringDecodeWarning = (
    type: 'string_decode_skipped' | 'string_decode_budget_exceeded',
    path: string,
    value: string,
    message: string,
    limit: number,
    sourceLabel?: string
  ): void => {
    context.warnings = context.warnings || [];
    context.warnings.push({
      type,
      path,
      sourceLabel,
      originalValue: value,
      message,
      length: value.length,
      limit,
    } satisfies TransformWarning);
  };

  return {
    addUnresolvedCandidate,
    addRuntimePlaceholder,
    addSchemeRuntimePlaceholders,
    addStringDecodeWarning,
  };
};
