import { formatUnknownError } from './errors';
import { getJsonArraySampleEntries } from './jsonArraySampling';
import {
  inferJsonSchemaModel,
  type InferredSchema,
  type JsonSchemaInferenceOptions,
  type JsonSchemaInferenceRequiredMode,
  type JsonSchemaInferenceSamplingSummary,
} from './jsonSchemaInferenceModel';
import { isLikelyJsonLinesInput, parseJsonLinesDetailed } from './jsonLines';

export type {
  JsonSchemaInferenceOptions,
  JsonSchemaInferenceRequiredMode,
  JsonSchemaInferenceSamplingSummary,
} from './jsonSchemaInferenceModel';

export interface JsonSchemaInferenceResult {
  schemaText?: string;
  samplingSummaries?: JsonSchemaInferenceSamplingSummary[];
  trustSummary?: JsonSchemaInferenceTrustSummary;
  sourceKind?: JsonSchemaInferenceSourceKind;
  error?: string;
}

export type JsonSchemaInferenceSourceKind = 'json' | 'json-lines';

export interface JsonSchemaInferenceTrustSummary {
  sourceKind: JsonSchemaInferenceSourceKind;
  sourceSampleCount: number;
  sourceSampleUsedCount: number;
  objectSchemaCount: number;
  propertyCount: number;
  requiredFieldCount: number;
  optionalFieldCount: number;
  unionTypeCount: number;
  formatFieldCount: number;
  arrayTotalItemCount: number;
  arraySampledItemCount: number;
  sampledArrayCount: number;
  requiredMode: JsonSchemaInferenceRequiredMode;
}

type ParsedSchemaSource = {
  value: unknown;
  sourceKind: JsonSchemaInferenceSourceKind;
};

const buildTrustSummary = (
  model: ReturnType<typeof inferJsonSchemaModel>,
  options: JsonSchemaInferenceOptions,
  rootSample: Pick<JsonSchemaInferenceTrustSummary, 'sourceKind' | 'sourceSampleCount' | 'sourceSampleUsedCount'>
): JsonSchemaInferenceTrustSummary => {
  const summary: JsonSchemaInferenceTrustSummary = {
    sourceKind: rootSample.sourceKind,
    sourceSampleCount: rootSample.sourceSampleCount,
    sourceSampleUsedCount: rootSample.sourceSampleUsedCount,
    objectSchemaCount: 0,
    propertyCount: 0,
    requiredFieldCount: 0,
    optionalFieldCount: 0,
    unionTypeCount: 0,
    formatFieldCount: 0,
    arrayTotalItemCount: model.arrayTotalItemCount,
    arraySampledItemCount: model.arraySampledItemCount,
    sampledArrayCount: model.samplingSummaries.length,
    requiredMode: options.requiredMode || 'strict',
  };

  const visit = (current: InferredSchema): void => {
    const typeList = Array.isArray(current.type)
      ? current.type
      : current.type ? [current.type] : [];
    if (typeList.length > 1) {
      summary.unionTypeCount += 1;
    }
    if (current.format) {
      summary.formatFieldCount += 1;
    }

    if (typeList.includes('object') && current.properties) {
      const propertyKeys = Object.keys(current.properties);
      const requiredKeys = new Set(current.required || []);
      summary.objectSchemaCount += 1;
      summary.propertyCount += propertyKeys.length;
      summary.requiredFieldCount += requiredKeys.size;
      summary.optionalFieldCount += propertyKeys.filter(key => !requiredKeys.has(key)).length;
      propertyKeys.forEach(key => visit(current.properties?.[key] || {}));
    }

    if (typeList.includes('array') && current.items) {
      visit(current.items);
    }
  };

  visit(model.schema);
  return summary;
};

const getRootSampleSummary = (
  value: unknown,
  sourceKind: JsonSchemaInferenceSourceKind
): Pick<JsonSchemaInferenceTrustSummary, 'sourceKind' | 'sourceSampleCount' | 'sourceSampleUsedCount'> => {
  if (!Array.isArray(value)) {
    return {
      sourceKind,
      sourceSampleCount: 1,
      sourceSampleUsedCount: 1,
    };
  }

  const sampleResult = getJsonArraySampleEntries(value);
  return {
    sourceKind,
    sourceSampleCount: value.length,
    sourceSampleUsedCount: sampleResult.entries.length,
  };
};

const parseSchemaSource = (jsonText: string): ParsedSchemaSource | { error: string } => {
  try {
    return {
      value: JSON.parse(jsonText),
      sourceKind: 'json',
    };
  } catch (error) {
    const message = formatUnknownError(error);

    if (isLikelyJsonLinesInput(jsonText)) {
      const jsonLines = parseJsonLinesDetailed(jsonText);
      if (jsonLines.records) {
        return {
          value: jsonLines.records.map(record => record.value),
          sourceKind: 'json-lines',
        };
      }

      if (jsonLines.error) {
        return { error: `SOURCE 不是合法 JSON / JSON Lines: ${message}；${jsonLines.error}` };
      }
    }

    return { error: `SOURCE 不是合法 JSON: ${message}` };
  }
};

export const inferJsonSchemaFromText = (
  jsonText: string,
  options: JsonSchemaInferenceOptions = {}
): JsonSchemaInferenceResult => {
  if (!jsonText.trim()) {
    return { error: '请先在 SOURCE 输入 JSON' };
  }

  const parsedSource = parseSchemaSource(jsonText);
  if ('error' in parsedSource) return parsedSource;

  const rootSample = getRootSampleSummary(parsedSource.value, parsedSource.sourceKind);
  const model = inferJsonSchemaModel(parsedSource.value, options);
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: parsedSource.sourceKind === 'json-lines' ? '从 SOURCE JSON Lines 生成' : '从 SOURCE 生成',
    ...model.schema,
  };

  return {
    schemaText: JSON.stringify(schema, null, 2),
    samplingSummaries: model.samplingSummaries,
    sourceKind: parsedSource.sourceKind,
    trustSummary: buildTrustSummary(model, options, rootSample),
  };
};
