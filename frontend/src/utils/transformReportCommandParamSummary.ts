import type { JsonValue } from '../types';

export interface TransformReportCommandParamSummary {
  commandParamCount?: number;
  commandParamKeys?: string[];
}

const DEFAULT_COMMAND_PARAM_KEY_LIMIT = 8;

export const buildTransformCommandParamSummary = (
  cmdParams: JsonValue,
  keyLimit = DEFAULT_COMMAND_PARAM_KEY_LIMIT
): TransformReportCommandParamSummary => {
  if (!cmdParams || typeof cmdParams !== 'object' || Array.isArray(cmdParams)) {
    return {};
  }

  const keys = Object.keys(cmdParams);
  return {
    commandParamCount: keys.length,
    commandParamKeys: keys.slice(0, keyLimit),
  };
};
