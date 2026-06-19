export interface JsonSchemaInferenceResult {
  schemaText?: string;
  samplingSummaries?: JsonSchemaInferenceSamplingSummary[];
  error?: string;
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

type ArraySampleEntry = {
  index: number;
  item: unknown;
};

type ArraySampleResult = {
  entries: ArraySampleEntry[];
  scannedItems: number;
  sparseFieldKeys: string[];
};

type SchemaInferenceContext = {
  samplingSummaries: JsonSchemaInferenceSamplingSummary[];
};

const MAX_SCHEMA_INFERENCE_DEPTH = 8;
const MAX_ARRAY_SAMPLE_ITEMS = 32;
const ARRAY_SAMPLE_FRONT_ITEMS = 12;
const ARRAY_SAMPLE_TAIL_ITEMS = 8;
const ARRAY_SAMPLE_MIDDLE_ITEMS = 4;
const MAX_ARRAY_SPARSE_FIELD_SCAN_ITEMS = 200;

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

const appendJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const appendJsonPathIndex = (path: string, index: number): string => `${path}[${index}]`;

const addArraySampleIndex = (
  indices: Set<number>,
  index: number,
  arrayLength: number
): void => {
  if (index < 0 || index >= arrayLength || indices.has(index) || indices.size >= MAX_ARRAY_SAMPLE_ITEMS) return;

  indices.add(index);
};

const collectRecordKeys = (value: unknown): string[] => (
  isRecord(value) ? Object.keys(value) : []
);

const getArraySampleEntries = (value: unknown[]): ArraySampleResult => {
  if (value.length <= MAX_ARRAY_SAMPLE_ITEMS) {
    return {
      entries: value.map((item, index) => ({ index, item })),
      scannedItems: value.length,
      sparseFieldKeys: [],
    };
  }

  const indices = new Set<number>();
  const sparseFieldKeys = new Set<string>();

  for (let index = 0; index < ARRAY_SAMPLE_FRONT_ITEMS; index += 1) {
    addArraySampleIndex(indices, index, value.length);
  }

  const tailStart = Math.max(value.length - ARRAY_SAMPLE_TAIL_ITEMS, 0);
  for (let index = tailStart; index < value.length; index += 1) {
    addArraySampleIndex(indices, index, value.length);
  }

  const middleStart = ARRAY_SAMPLE_FRONT_ITEMS;
  const middleEnd = Math.max(middleStart, tailStart - 1);
  const middleSpan = middleEnd - middleStart + 1;
  for (let order = 1; order <= ARRAY_SAMPLE_MIDDLE_ITEMS && middleSpan > 0; order += 1) {
    const index = middleStart + Math.floor((middleSpan * order) / (ARRAY_SAMPLE_MIDDLE_ITEMS + 1));
    addArraySampleIndex(indices, index, value.length);
  }

  const seenKeys = new Set<string>();
  indices.forEach(index => {
    collectRecordKeys(value[index]).forEach(key => seenKeys.add(key));
  });

  // 长数组里稀疏字段常出现在后段样本，扫描代表行可避免生成 Schema 漏字段。
  const scanLimit = Math.min(value.length, MAX_ARRAY_SPARSE_FIELD_SCAN_ITEMS);
  for (let index = 0; index < scanLimit && indices.size < MAX_ARRAY_SAMPLE_ITEMS; index += 1) {
    const keys = collectRecordKeys(value[index]);
    const newKeys = keys.filter(key => !seenKeys.has(key));
    if (newKeys.length === 0) continue;

    addArraySampleIndex(indices, index, value.length);
    newKeys.forEach(key => sparseFieldKeys.add(key));
    keys.forEach(key => seenKeys.add(key));
  }

  return {
    entries: [...indices]
      .sort((left, right) => left - right)
      .map(index => ({ index, item: value[index] })),
    scannedItems: scanLimit,
    sparseFieldKeys: [...sparseFieldKeys].sort(),
  };
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

    const sampleResult = getArraySampleEntries(value);
    if (value.length > MAX_ARRAY_SAMPLE_ITEMS) {
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

  const context: SchemaInferenceContext = { samplingSummaries: [] };
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: '从 SOURCE 生成',
    ...inferSchema(parsed, 0, options, '$', context),
  };

  return {
    schemaText: JSON.stringify(schema, null, 2),
    samplingSummaries: context.samplingSummaries,
  };
};
