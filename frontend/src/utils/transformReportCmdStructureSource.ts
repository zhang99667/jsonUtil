import type { JsonValue, PathTransformRecord } from '../types';
import { getSchemeCommandSchemaFromUrl } from './schemeMetadata';
import { getTransformSchemeDecodedValue } from './transformReportDecodedValue';
export {
  buildTransformCommandParamSummary,
  type TransformReportCommandParamSummary,
} from './transformReportCommandParamSummary';
export {
  createTransformRecordCmdStructureCopyTextGetter,
} from './transformReportCmdStructureCopyText';

export interface TransformReportCmdStructureSource {
  decodedValue: JsonValue;
  commandSchema?: string;
  source: string;
}

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
