import type { JsonValue, PathTransformRecord } from '../types';
import { buildFocusedJsonValue } from './jsonPathFocus';
import {
  formatCmdHandlerCompatibleResult,
  getSchemeCommandSchemaFromUrl,
} from './schemeMetadata';
import { getTransformSchemeDecodedValue } from './transformReportDecodedValue';

export interface TransformReportCmdStructureSource {
  decodedValue: JsonValue;
  commandSchema?: string;
  source: string;
}

export interface TransformReportCommandParamSummary {
  commandParamCount?: number;
  commandParamKeys?: string[];
}

const DEFAULT_COMMAND_PARAM_KEY_LIMIT = 8;

export const getTransformRecordCommandSchema = (
  record: PathTransformRecord
): string | undefined => {
  const schemeStep = [...record.steps].reverse().find(step => (
    step.type === 'scheme_decode' && step.originalSchemeType === 'url' && step.originalScheme
  ));

  return schemeStep?.originalScheme ? getSchemeCommandSchemaFromUrl(schemeStep.originalScheme) : undefined;
};

export const getTransformRecordCmdStructureSource = (
  record: PathTransformRecord
): TransformReportCmdStructureSource | null => {
  const schemeStep = [...record.steps].reverse().find(step => (
    step.type === 'scheme_decode' &&
    (step.originalSchemeType === 'url' || step.originalSchemeType === 'query-string')
  ));
  if (!schemeStep) return null;

  const decodedValue = getTransformSchemeDecodedValue(record.steps);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return null;
  }

  const commandSchema = getTransformRecordCommandSchema(record);

  return {
    decodedValue,
    ...(commandSchema ? { commandSchema } : {}),
    source: record.originalValue,
  };
};

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

export const createTransformRecordCmdStructureCopyTextGetter = (
  source: TransformReportCmdStructureSource,
  basePath: string
): ((focusedFieldPaths?: string[]) => string) => (focusedFieldPaths) => {
  const focusedValue = focusedFieldPaths?.length
    ? buildFocusedJsonValue(source.decodedValue, basePath, focusedFieldPaths)
    : null;

  return formatCmdHandlerCompatibleResult(
    JSON.stringify(focusedValue || source.decodedValue),
    source.commandSchema,
    source.source
  );
};
