export interface JsonSchemaInferenceResult {
  schemaText?: string;
  error?: string;
}

export type JsonSchemaInferenceRequiredMode = 'strict' | 'loose';

export interface JsonSchemaInferenceOptions {
  requiredMode?: JsonSchemaInferenceRequiredMode;
}

type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';

type InferredSchema = {
  type?: JsonSchemaType | JsonSchemaType[];
  properties?: Record<string, InferredSchema>;
  required?: string[];
  items?: InferredSchema;
  additionalProperties?: boolean;
};

const MAX_SCHEMA_INFERENCE_DEPTH = 8;
const MAX_ARRAY_SAMPLE_ITEMS = 20;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

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

  return { type: schemaTypes[0] };
};

const inferSchema = (
  value: unknown,
  depth: number,
  options: JsonSchemaInferenceOptions
): InferredSchema => {
  if (value === null) return { type: 'null' };

  if (typeof value === 'string') return { type: 'string' };
  if (typeof value === 'boolean') return { type: 'boolean' };
  if (typeof value === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' };

  if (Array.isArray(value)) {
    if (depth >= MAX_SCHEMA_INFERENCE_DEPTH) {
      return { type: 'array', items: {} };
    }

    const sampledItems = value.slice(0, MAX_ARRAY_SAMPLE_ITEMS).map(item => inferSchema(item, depth + 1, options));
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
      Object.entries(value).map(([key, child]) => [key, inferSchema(child, depth + 1, options)])
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

export const inferJsonSchemaFromText = (
  jsonText: string,
  options: JsonSchemaInferenceOptions = {}
): JsonSchemaInferenceResult => {
  if (!jsonText.trim()) {
    return { error: '请先在 SOURCE 输入 JSON' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `SOURCE 不是合法 JSON: ${message}` };
  }

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: '从 SOURCE 生成',
    ...inferSchema(parsed, 0, options),
  };

  return {
    schemaText: JSON.stringify(schema, null, 2),
  };
};
