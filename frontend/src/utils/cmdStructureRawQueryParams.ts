import type { JsonValue } from '../types';

interface JsonObject {
  [key: string]: JsonValue;
}

export type CmdStructureRawQueryValueParser = (value: string, key: string, depth: number) => JsonValue;

const appendRawQueryParamValue = (result: JsonObject, key: string, value: JsonValue) => {
  const existing = result[key];
  if (existing === undefined) {
    result[key] = value;
    return;
  }

  result[key] = Array.isArray(existing)
    ? [...existing, value]
    : [existing, value];
};

export const parseCmdStructureRawQueryParams = (
  queryString: string,
  depth: number,
  parseValue: CmdStructureRawQueryValueParser
): JsonObject => {
  const params = new URLSearchParams(queryString.replace(/^\?/, ''));
  const result: JsonObject = {};

  params.forEach((value, key) => {
    appendRawQueryParamValue(result, key, parseValue(value, key, depth + 1));
  });

  return result;
};
