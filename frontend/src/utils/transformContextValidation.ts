import {
  TransformMode,
  type PathTransformRecord,
  type TransformContext,
  type TransformRuntimePlaceholder,
  type TransformSchemeParamStageSummary,
  type TransformSchemeParamStageSummaryBucket,
  type TransformSchemeParamStageSummarySample,
  type TransformStep,
  type TransformStepType,
  type TransformUnresolvedCandidate,
  type TransformWarning,
} from '../types';
import { isJsonValue } from './jsonValueGuards';
import { isFiniteNumber, isRecord as isUnknownRecord } from './storage';

const isNonNegativeInteger = (value: unknown): value is number => (
  isFiniteNumber(value) && Number.isInteger(value) && value >= 0
);

const isOptionalString = (value: unknown): value is string | undefined => (
  value === undefined || typeof value === 'string'
);

const isOptionalBoolean = (value: unknown): value is boolean | undefined => (
  value === undefined || typeof value === 'boolean'
);

const isArrayOf = <T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] => {
  if (!Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index) || !predicate(value[index])) {
      return false;
    }
  }
  return true;
};

const TRANSFORM_STEP_TYPES = {
  json_parse: true,
  json_stringify: true,
  scheme_decode: true,
  unicode_decode: true,
  unicode_encode: true,
  url_decode: true,
  url_encode: true,
  base64_decode: true,
  base64_encode: true,
  unescape: true,
  escape: true,
} satisfies Record<TransformStepType, true>;

const isTransformStepType = (value: unknown): value is TransformStepType => (
  typeof value === 'string'
  && Object.hasOwn(TRANSFORM_STEP_TYPES, value)
);

const isSummaryBucket = (value: unknown): value is TransformSchemeParamStageSummaryBucket => (
  isUnknownRecord(value)
  && typeof value.key === 'string'
  && isNonNegativeInteger(value.count)
);

const isSummarySample = (value: unknown): value is TransformSchemeParamStageSummarySample => {
  if (!isUnknownRecord(value) || !isUnknownRecord(value.lengths)) return false;
  return typeof value.path === 'string'
    && typeof value.key === 'string'
    && typeof value.source === 'string'
    && isNonNegativeInteger(value.lengths.encodedInput)
    && isNonNegativeInteger(value.lengths.decodedInput)
    && isNonNegativeInteger(value.lengths.expandedOutput)
    && isNonNegativeInteger(value.lengths.encodedOutput)
    && typeof value.reversible === 'boolean'
    && typeof value.hasRepairHint === 'boolean'
    && isOptionalString(value.repairHint);
};

const isSummary = (value: unknown): value is TransformSchemeParamStageSummary => (
  isUnknownRecord(value)
  && isNonNegativeInteger(value.total)
  && isNonNegativeInteger(value.repairHints)
  && isNonNegativeInteger(value.nonReversible)
  && isArrayOf(value.sources, isSummaryBucket)
  && isArrayOf(value.keys, isSummaryBucket)
  && isArrayOf(value.repairHintLabels, isSummaryBucket)
  && isArrayOf(value.samples, isSummarySample)
);

const isTransformStep = (value: unknown): value is TransformStep => (
  isUnknownRecord(value)
  && isTransformStepType(value.type)
  && isOptionalString(value.originalEncoding)
  && isOptionalBoolean(value.originalPadding)
  && isOptionalString(value.originalScheme)
  && (
    value.originalSchemeType === undefined
    || value.originalSchemeType === 'query-string'
    || value.originalSchemeType === 'url'
    || value.originalSchemeType === 'base64'
  )
  && isOptionalBoolean(value.originalSchemeReversible)
  && isOptionalBoolean(value.originalSchemeStringLiteral)
  && isOptionalBoolean(value.originalSchemeEscapedSlash)
  && isOptionalString(value.schemeHeaderDisplayKey)
  && (value.decodedSchemeValue === undefined || isJsonValue(value.decodedSchemeValue))
  && (value.schemeParamStageSummary === undefined || isSummary(value.schemeParamStageSummary))
);

const isPathTransformRecord = (
  value: unknown,
  expectedPath: string,
): value is PathTransformRecord => (
  isUnknownRecord(value)
  && value.path === expectedPath
  && typeof value.originalValue === 'string'
  && isOptionalString(value.sourceLabel)
  && isArrayOf(value.steps, isTransformStep)
);

const isTransformWarning = (value: unknown): value is TransformWarning => (
  isUnknownRecord(value)
  && (value.type === 'string_decode_skipped' || value.type === 'string_decode_budget_exceeded')
  && typeof value.path === 'string'
  && isOptionalString(value.sourceLabel)
  && typeof value.originalValue === 'string'
  && typeof value.message === 'string'
  && isNonNegativeInteger(value.length)
  && isNonNegativeInteger(value.limit)
);

const isUnresolvedCandidate = (value: unknown): value is TransformUnresolvedCandidate => (
  isUnknownRecord(value)
  && typeof value.path === 'string'
  && isOptionalString(value.sourceLabel)
  && typeof value.originalValue === 'string'
  && typeof value.message === 'string'
  && isNonNegativeInteger(value.length)
  && typeof value.preview === 'string'
  && isOptionalString(value.detectedType)
);

const isRuntimePlaceholder = (value: unknown): value is TransformRuntimePlaceholder => (
  isUnknownRecord(value)
  && typeof value.path === 'string'
  && typeof value.sourcePath === 'string'
  && isOptionalString(value.sourceLabel)
  && isOptionalString(value.sourceOriginalValue)
  && typeof value.value === 'string'
  && typeof value.description === 'string'
);

const isOptionalArrayOf = <T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] | undefined => (
  value === undefined || isArrayOf(value, predicate)
);

export const isTransformContext = (value: unknown): value is TransformContext => {
  if (
    !isUnknownRecord(value)
    || value.mode !== TransformMode.DEEP_FORMAT
    || !(value.records instanceof Map)
    || !isNonNegativeInteger(value.timestamp)
    || !(
      typeof value.originalIndentation === 'string'
      || isFiniteNumber(value.originalIndentation)
    )
    || (
      value.sourceFormat !== undefined
      && value.sourceFormat !== 'json'
      && value.sourceFormat !== 'jsonl'
      && value.sourceFormat !== 'scheme'
    )
  ) {
    return false;
  }

  if (value.sourceWrapper !== undefined && (
    !isUnknownRecord(value.sourceWrapper)
    || typeof value.sourceWrapper.prefix !== 'string'
    || typeof value.sourceWrapper.suffix !== 'string'
  )) {
    return false;
  }

  for (const [path, record] of value.records) {
    if (typeof path !== 'string' || !isPathTransformRecord(record, path)) return false;
  }

  return isOptionalArrayOf(value.warnings, isTransformWarning)
    && isOptionalArrayOf(value.unresolvedCandidates, isUnresolvedCandidate)
    && isOptionalArrayOf(value.runtimePlaceholders, isRuntimePlaceholder);
};
