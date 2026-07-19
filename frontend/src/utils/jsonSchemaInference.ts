import { formatUnknownError } from './errors';
import { getJsonArraySampleEntries } from './jsonArraySampling';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { isLikelyJsonLinesInput, parseJsonLinesDetailed } from './jsonLines';
import { isRecord } from './storage';

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

export interface JsonSchemaInferenceSamplingSummary {
  path: string;
  totalItems: number;
  sampledItems: number;
  scannedItems: number;
  sparseFieldKeys: string[];
  isScanLimited: boolean;
  requiredMode: JsonSchemaInferenceRequiredMode;
}

export type JsonSchemaInferenceRequiredMode = 'strict' | 'loose';

export interface JsonSchemaInferenceOptions {
  requiredMode?: JsonSchemaInferenceRequiredMode;
}

type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';

type InferredSchema = {
  type?: JsonSchemaType | JsonSchemaType[];
  format?: 'date-time' | 'email' | 'uri' | 'uuid';
  properties?: Record<string, InferredSchema>;
  required?: string[];
  items?: InferredSchema;
  additionalProperties?: boolean;
};

type SchemaInferenceContext = {
  samplingSummaries: JsonSchemaInferenceSamplingSummary[];
  arrayTotalItemCount: number;
  arraySampledItemCount: number;
};

type ParsedSchemaSource = {
  value: unknown;
  sourceKind: JsonSchemaInferenceSourceKind;
};

const MAX_SCHEMA_INFERENCE_DEPTH = 8;

const shouldIncludeRequired = (options: JsonSchemaInferenceOptions): boolean => (
  options.requiredMode !== 'loose'
);

const getSchemaType = (schema: InferredSchema): JsonSchemaType | undefined => {
  if (Array.isArray(schema.type)) return undefined;
  return schema.type;
};

const uniqueTypes = (types: JsonSchemaType[]): JsonSchemaType[] => {
  const normalized = types.includes('number')
    ? types.filter(type => type !== 'integer')
    : types;

  return [...new Set(normalized)].sort();
};

const mergeTypeOnlySchemas = (schemas: InferredSchema[]): InferredSchema => {
  const types = uniqueTypes(
    schemas.flatMap(schema => {
      if (!schema.type) return [];
      return Array.isArray(schema.type) ? schema.type : [schema.type];
    })
  );

  if (types.length === 0) return {};
  if (types.length === 1) return { type: types[0] };
  return { type: types };
};

const inferStringFormat = (value: string): InferredSchema['format'] | undefined => {
  const text = value.trim();
  if (!text || text !== value) return undefined;

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'email';

  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(text) &&
    !Number.isNaN(Date.parse(text))
  ) {
    return 'date-time';
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    return 'uuid';
  }

  if (/^[A-Za-z][A-Za-z0-9+.-]*:[^\s]+$/.test(text)) return 'uri';

  return undefined;
};

const mergeStringSchemas = (schemas: InferredSchema[]): InferredSchema => {
  const formats = schemas.map(schema => schema.format);
  const firstFormat = formats[0];
  if (firstFormat && formats.every(format => format === firstFormat)) {
    return { type: 'string', format: firstFormat };
  }

  return { type: 'string' };
};

const mergeObjectSchemas = (
  schemas: InferredSchema[],
  options: JsonSchemaInferenceOptions
): InferredSchema => {
  const propertyKeys = [...new Set(schemas.flatMap(schema => Object.keys(schema.properties || {})))];
  const properties: Record<string, InferredSchema> = {};

  propertyKeys.forEach(key => {
    const childSchemas = schemas
      .map(schema => schema.properties?.[key])
      .filter((schema): schema is InferredSchema => Boolean(schema));
    properties[key] = mergeInferredSchemas(childSchemas, options);
  });

  const required = shouldIncludeRequired(options)
    ? propertyKeys.filter(key => schemas.every(schema => Boolean(schema.properties?.[key])))
    : [];

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: true,
  };
};

const mergeArraySchemas = (
  schemas: InferredSchema[],
  options: JsonSchemaInferenceOptions
): InferredSchema => {
  const itemSchemas = schemas
    .map(schema => schema.items)
    .filter((schema): schema is InferredSchema => Boolean(schema));

  return {
    type: 'array',
    items: itemSchemas.length > 0 ? mergeInferredSchemas(itemSchemas, options) : {},
  };
};

const mergeInferredSchemas = (
  schemas: InferredSchema[],
  options: JsonSchemaInferenceOptions
): InferredSchema => {
  if (schemas.length === 0) return {};

  const schemaTypes = uniqueTypes(schemas.map(getSchemaType).filter((type): type is JsonSchemaType => Boolean(type)));
  if (schemaTypes.length !== 1) return mergeTypeOnlySchemas(schemas);

  if (schemaTypes[0] === 'object') return mergeObjectSchemas(schemas, options);
  if (schemaTypes[0] === 'array') return mergeArraySchemas(schemas, options);
  if (schemaTypes[0] === 'string') return mergeStringSchemas(schemas);

  return { type: schemaTypes[0] };
};

const inferSchema = (
  value: unknown,
  depth: number,
  options: JsonSchemaInferenceOptions,
  path: string,
  context: SchemaInferenceContext
): InferredSchema => {
  if (value === null) return { type: 'null' };

  if (typeof value === 'string') {
    const format = inferStringFormat(value);
    return { type: 'string', ...(format ? { format } : {}) };
  }
  if (typeof value === 'boolean') return { type: 'boolean' };
  if (typeof value === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' };

  if (Array.isArray(value)) {
    if (depth >= MAX_SCHEMA_INFERENCE_DEPTH) {
      return { type: 'array', items: {} };
    }

    const sampleResult = getJsonArraySampleEntries(value);
    context.arrayTotalItemCount += value.length;
    context.arraySampledItemCount += sampleResult.entries.length;
    if (sampleResult.entries.length < value.length) {
      context.samplingSummaries.push({
        path,
        totalItems: value.length,
        sampledItems: sampleResult.entries.length,
        scannedItems: sampleResult.scannedItems,
        sparseFieldKeys: sampleResult.sparseFieldKeys,
        isScanLimited: sampleResult.scannedItems < value.length,
        requiredMode: options.requiredMode || 'strict',
      });
    }

    const sampledItems = sampleResult.entries.map(({ index, item }) => (
      inferSchema(item, depth + 1, options, appendJsonPathIndex(path, index), context)
    ));
    return {
      type: 'array',
      items: sampledItems.length > 0 ? mergeInferredSchemas(sampledItems, options) : {},
    };
  }

  if (isRecord(value)) {
    if (depth >= MAX_SCHEMA_INFERENCE_DEPTH) {
      return { type: 'object', additionalProperties: true };
    }

    const properties = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        inferSchema(child, depth + 1, options, appendJsonPathKey(path, key), context),
      ])
    );
    const required = shouldIncludeRequired(options) ? Object.keys(properties) : [];

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: true,
    };
  }

  return {};
};

const getSchemaTypeList = (schema: InferredSchema): JsonSchemaType[] => (
  Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
);

const buildTrustSummary = (
  schema: InferredSchema,
  samplingSummaries: JsonSchemaInferenceSamplingSummary[],
  options: JsonSchemaInferenceOptions,
  context: SchemaInferenceContext,
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
    arrayTotalItemCount: context.arrayTotalItemCount,
    arraySampledItemCount: context.arraySampledItemCount,
    sampledArrayCount: samplingSummaries.length,
    requiredMode: options.requiredMode || 'strict',
  };

  const visit = (current: InferredSchema): void => {
    const typeList = getSchemaTypeList(current);
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

  visit(schema);
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

  const context: SchemaInferenceContext = {
    samplingSummaries: [],
    arrayTotalItemCount: 0,
    arraySampledItemCount: 0,
  };
  const rootSample = getRootSampleSummary(parsedSource.value, parsedSource.sourceKind);
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: parsedSource.sourceKind === 'json-lines' ? '从 SOURCE JSON Lines 生成' : '从 SOURCE 生成',
    ...inferSchema(parsedSource.value, 0, options, '$', context),
  };

  return {
    schemaText: JSON.stringify(schema, null, 2),
    samplingSummaries: context.samplingSummaries,
    sourceKind: parsedSource.sourceKind,
    trustSummary: buildTrustSummary(schema, context.samplingSummaries, options, context, rootSample),
  };
};
