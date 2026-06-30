import type { SchemeParamDecodeStage } from './schemeTypes';
import type { JsonParseMeta, SchemeJsonPayloadValue } from './schemeJsonPayloads';

const DEFAULT_SCHEME_PARAM_STAGE_VALUE_LIMIT = 100_000;

export interface SchemeParamDecodeStageBuilderOptions {
  decodeNestedValue: (value: string, maxDepth: number) => SchemeJsonPayloadValue;
  tryParseJsonWithMeta: (value: string) => JsonParseMeta | null;
  urlEncode: (value: string) => string;
}

export const formatPlaceholderPathSegment = (key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`
);

const formatStageStructuredValue = (value: SchemeJsonPayloadValue): string => (
  typeof value === 'string' ? value : JSON.stringify(value, null, 2)
);

const getJsonRepairHint = (meta: JsonParseMeta | null): string | undefined => {
  if (!meta || meta.strategy === 'strict') return undefined;
  if (meta.strategy === 'html-quote') return 'HTML 引号实体已还原为 JSON 引号';
  if (meta.strategy === 'escaped-quote') return '反斜杠引号已还原为 JSON 引号';
  return 'Loose JSON 已补齐字段引号/单引号/尾逗号';
};

export const createParamDecodeStage = (
  key: string,
  rawValue: string,
  urlDecodedValue: string,
  source: SchemeParamDecodeStage['source'],
  pathPrefix: string,
  maxDepth: number,
  options: SchemeParamDecodeStageBuilderOptions
): SchemeParamDecodeStage => {
  const shouldParse = urlDecodedValue.length <= DEFAULT_SCHEME_PARAM_STAGE_VALUE_LIMIT;
  const parsedValue = shouldParse
    ? options.decodeNestedValue(urlDecodedValue, maxDepth - 1)
    : urlDecodedValue;
  const parsedText = formatStageStructuredValue(parsedValue);
  const jsonMeta = shouldParse ? options.tryParseJsonWithMeta(urlDecodedValue) : null;
  const repairHint = getJsonRepairHint(jsonMeta);
  const stageHint = shouldParse ? repairHint : '参数过长，已跳过分层 JSON 解析预览';

  return {
    path: `${pathPrefix}${formatPlaceholderPathSegment(key)}`,
    key,
    source,
    raw: rawValue,
    urlDecoded: urlDecodedValue,
    parsed: parsedText,
    repairHint: stageHint,
    reencoded: options.urlEncode(
      typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue)
    ),
    reversible: !stageHint,
  };
};
