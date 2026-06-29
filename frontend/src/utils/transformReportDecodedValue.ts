import type { JsonValue, PathTransformRecord, TransformStep } from '../types';
import { formatJsonValuePreview } from './transformValuePreview';

export const getTransformSchemeDecodedValue = (steps: TransformStep[]): JsonValue | undefined => {
  const schemeStep = [...steps].reverse().find(step => (
    step.type === 'scheme_decode' && step.decodedSchemeValue !== undefined
  ));

  return schemeStep?.decodedSchemeValue;
};

export const getTransformSchemeDecodedPreview = (steps: TransformStep[]): string | undefined => {
  const decodedValue = getTransformSchemeDecodedValue(steps);

  return decodedValue === undefined
    ? undefined
    : formatJsonValuePreview(decodedValue);
};

export const getTransformJsonParseDecodedValue = (record: PathTransformRecord): JsonValue | undefined => {
  if (!record.steps.some(step => step.type === 'json_parse')) return undefined;

  try {
    return JSON.parse(record.originalValue) as JsonValue;
  } catch {
    return undefined;
  }
};

export const getTransformJsonParseDecodedPreview = (record: PathTransformRecord): string | undefined => {
  const decodedValue = getTransformJsonParseDecodedValue(record);

  return decodedValue === undefined
    ? undefined
    : formatJsonValuePreview(decodedValue);
};

export const getTransformDecodedPreview = (record: PathTransformRecord): string | undefined => (
  getTransformSchemeDecodedPreview(record.steps) || getTransformJsonParseDecodedPreview(record)
);

export const getTransformDecodedValue = (record: PathTransformRecord): JsonValue | undefined => {
  const schemeDecodedValue = getTransformSchemeDecodedValue(record.steps);

  return schemeDecodedValue === undefined
    ? getTransformJsonParseDecodedValue(record)
    : schemeDecodedValue;
};
