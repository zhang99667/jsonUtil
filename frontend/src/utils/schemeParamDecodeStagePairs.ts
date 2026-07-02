import type { SchemeParamDecodeStage } from './schemeTypes';
import {
  createParamDecodeStage,
  type SchemeParamDecodeStageBuilderOptions,
} from './schemeParamDecodeStageBuilder';
import { normalizeQueryString, splitQueryPairs, stripQueryPrefix } from './schemeQuerySyntax';

export const DEFAULT_SCHEME_PARAM_STAGE_LIMIT = 24;

export interface SchemeParamDecodeStagePairsOptions extends SchemeParamDecodeStageBuilderOptions {
  decodeKey: (value: string) => string;
  decodeValue: (value: string) => string;
}

export const buildParamDecodeStagesFromPairs = (
  queryString: string,
  source: SchemeParamDecodeStage['source'],
  pathPrefix: string,
  maxDepth: number,
  options: SchemeParamDecodeStagePairsOptions
): SchemeParamDecodeStage[] => {
  const stages: SchemeParamDecodeStage[] = [];
  const normalized = normalizeQueryString(stripQueryPrefix(queryString));

  for (const pair of splitQueryPairs(normalized)) {
    if (stages.length >= DEFAULT_SCHEME_PARAM_STAGE_LIMIT) break;

    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) continue;

    const key = options.decodeKey(pair.slice(0, equalIndex));
    if (!key) continue;

    const rawValue = pair.slice(equalIndex + 1);
    stages.push(createParamDecodeStage(
      key,
      rawValue,
      options.decodeValue(rawValue),
      source,
      pathPrefix,
      maxDepth,
      options
    ));
  }

  return stages;
};
