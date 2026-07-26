import type { SchemeParamDecodeStage } from './schemeTypes';
import {
  createParamDecodeStage,
  type SchemeParamDecodeStageBuilderOptions,
} from './schemeParamDecodeStageBuilder';
import { iterateDecodedQueryPairs } from './schemeQuerySyntax';

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

  for (const { key, rawValue, value } of iterateDecodedQueryPairs(
    queryString,
    options.decodeKey,
    options.decodeValue,
    DEFAULT_SCHEME_PARAM_STAGE_LIMIT,
  )) {
    stages.push(createParamDecodeStage(
      key,
      rawValue,
      value,
      source,
      pathPrefix,
      maxDepth,
      options
    ));
  }

  return stages;
};
