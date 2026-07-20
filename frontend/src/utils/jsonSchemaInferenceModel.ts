import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { getJsonArraySampleEntries } from './jsonArraySampling';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { isRecord } from './storage';

export type JsonSchemaInferenceRequiredMode = 'strict' | 'loose';

export interface JsonSchemaInferenceOptions {
  requiredMode?: JsonSchemaInferenceRequiredMode;
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

type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';

export interface InferredSchema {
  type?: JsonSchemaType | JsonSchemaType[];
  format?: 'date-time' | 'email' | 'uri' | 'uuid';
  properties?: Record<string, InferredSchema>;
  required?: string[];
  items?: InferredSchema;
  additionalProperties?: boolean;
}

interface SchemaInferenceContext {
  samplingSummaries: JsonSchemaInferenceSamplingSummary[];
  arrayTotalItemCount: number;
  arraySampledItemCount: number;
}

const MAX_SCHEMA_INFERENCE_DEPTH = 8;
const STRING_FORMATS = ['email', 'date-time', 'uuid', 'uri'] as const;
const stringFormatValidator = addFormats(new Ajv({ strict: false }), [...STRING_FORMATS]).compile({
  type: 'object',
  minProperties: 1,
  maxProperties: 1,
  propertyNames: { enum: STRING_FORMATS },
  properties: Object.fromEntries(STRING_FORMATS.map(format => [
    format,
    { type: 'string', format },
  ])),
});

const shouldIncludeRequired = (options: JsonSchemaInferenceOptions): boolean => (
  options.requiredMode !== 'loose'
);

const getSchemaType = (
  schema: InferredSchema
): JsonSchemaType | undefined => {
  if (Array.isArray(schema.type)) return undefined;
  return schema.type;
};

const uniqueTypes = (types: JsonSchemaType[]): JsonSchemaType[] => {
  const normalized = types.includes('number')
    ? types.filter(type => type !== 'integer')
    : types;

  return [...new Set(normalized)].sort();
};

const mergeTypeOnlySchemas = (
  schemas: InferredSchema[]
): InferredSchema => {
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

const inferStringFormat = (
  value: string
): InferredSchema['format'] | undefined => {
  const text = value.trim();
  if (!text || text !== value) return undefined;

  return STRING_FORMATS.find(format => stringFormatValidator({ [format]: text }));
};

const mergeStringSchemas = (
  schemas: InferredSchema[]
): InferredSchema => {
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

  const schemaTypes = uniqueTypes(schemas
    .map(getSchemaType)
    .filter((type): type is JsonSchemaType => Boolean(type)));
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

export const inferJsonSchemaModel = (
  value: unknown,
  options: JsonSchemaInferenceOptions
) => {
  const context: SchemaInferenceContext = {
    samplingSummaries: [],
    arrayTotalItemCount: 0,
    arraySampledItemCount: 0,
  };

  return {
    schema: inferSchema(value, 0, options, '$', context),
    samplingSummaries: context.samplingSummaries,
    arrayTotalItemCount: context.arrayTotalItemCount,
    arraySampledItemCount: context.arraySampledItemCount,
  };
};
