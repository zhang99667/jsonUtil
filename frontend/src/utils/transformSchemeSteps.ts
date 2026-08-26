import type { JsonValue, TransformStep } from '../types.ts';
import type {
  SchemeParamDecodeStage,
  SchemeDecodeResult,
  SchemeType,
} from './schemeTypes.ts';
import { parseJsonValue } from './jsonValueGuards.ts';
import {
  deepDecodeScheme,
  detectSchemeType,
} from './schemeUtils.ts';

const SCHEME_PARAM_STAGE_SUMMARY_LIMIT = 8;
const SCHEME_PARAM_STAGE_LABEL_LIMIT = 80;

export interface SchemeStepResult {
  step: TransformStep;
  value: JsonValue;
}

const normalizeParamStageLabel = (value: string, fallback: string): string => {
  const label = value.trim() || fallback;
  return label.length > SCHEME_PARAM_STAGE_LABEL_LIMIT
    ? `${label.slice(0, SCHEME_PARAM_STAGE_LABEL_LIMIT)}...`
    : label;
};

const buildParamStageBuckets = (
  stages: SchemeParamDecodeStage[],
  getKey: (stage: SchemeParamDecodeStage) => string | undefined
): NonNullable<TransformStep['schemeParamStageSummary']>['keys'] => {
  const bucketMap = new Map<string, number>();

  stages.forEach(stage => {
    const key = getKey(stage);
    if (!key) return;
    bucketMap.set(key, (bucketMap.get(key) || 0) + 1);
  });

  return Array.from(bucketMap.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, SCHEME_PARAM_STAGE_SUMMARY_LIMIT);
};

export const buildSchemeParamStageSummary = (
  stages?: SchemeParamDecodeStage[]
): TransformStep['schemeParamStageSummary'] => {
  if (!stages?.length) return undefined;

  return {
    total: stages.length,
    repairHints: stages.filter(stage => Boolean(stage.repairHint)).length,
    nonReversible: stages.filter(stage => !stage.reversible).length,
    sources: buildParamStageBuckets(stages, stage => stage.source),
    keys: buildParamStageBuckets(stages, stage => normalizeParamStageLabel(stage.key, '(empty key)')),
    repairHintLabels: buildParamStageBuckets(
      stages,
      stage => stage.repairHint
        ? normalizeParamStageLabel(stage.repairHint, '参数分层需要人工复核')
        : undefined
    ),
    samples: stages.slice(0, SCHEME_PARAM_STAGE_SUMMARY_LIMIT).map(stage => ({
      path: stage.path,
      key: normalizeParamStageLabel(stage.key, '(empty key)'),
      source: stage.source,
      lengths: {
        encodedInput: stage.raw.length,
        decodedInput: stage.urlDecoded.length,
        expandedOutput: stage.parsed.length,
        encodedOutput: stage.reencoded.length,
      },
      reversible: stage.reversible,
      hasRepairHint: Boolean(stage.repairHint),
      ...(stage.repairHint
        ? { repairHint: normalizeParamStageLabel(stage.repairHint, '参数分层需要人工复核') }
        : {}),
    })),
  };
};

export const decodeSchemeJsonStep = (
  scheme: string,
  maxDepth?: number
): SchemeStepResult | null => {
  const decodedScheme = maxDepth === undefined ? deepDecodeScheme(scheme) : deepDecodeScheme(scheme, maxDepth);
  return decodeSchemeJsonStepFromDecoded(decodedScheme, scheme);
};

export const decodeSchemeJsonStepFromDecoded = (
  decodedScheme: SchemeDecodeResult,
  scheme: string
): SchemeStepResult | null => {
  if (!decodedScheme.isJson) return null;

  try {
    const parsed = parseJsonValue(decodedScheme.decoded);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const isReversible = decodedScheme.layers.every((layer) => layer.reversible !== false);
    const rootDisplayHeader = decodedScheme.displayHeaders?.find(
      (header) => header.path === ''
    );
    const schemeParamStageSummary = buildSchemeParamStageSummary(decodedScheme.paramStages);
    return {
      value: parsed,
      step: {
        type: 'scheme_decode',
        originalScheme: scheme,
        originalSchemeType: detectSchemeType(scheme) as Extract<SchemeType, 'query-string' | 'url' | 'base64'>,
        originalSchemeReversible: isReversible,
        originalSchemeStringLiteral: decodedScheme.layers.some(layer => layer.type === 'json'),
        originalSchemeEscapedSlash: decodedScheme.layers.some(layer => layer.type === 'json-escaped-slash'),
        decodedSchemeValue: parsed,
        ...(rootDisplayHeader
          ? { schemeHeaderDisplayKey: rootDisplayHeader.headerKey }
          : {}),
        ...(decodedScheme.displayHeaders ? { schemeDisplayHeaders: decodedScheme.displayHeaders } : {}),
        ...(schemeParamStageSummary
          ? { schemeParamStageSummary }
          : {}),
      },
    };
  } catch {
    return null;
  }
};
