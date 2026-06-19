import type { JsonObject, JsonValue } from '../types';

export interface JsonToTypeScriptOptions {
  rootName?: string;
}

type PrimitiveTypeName = 'string' | 'number' | 'boolean' | 'null';

type TypeModel =
  | { kind: 'unknown' }
  | { kind: 'primitive'; name: PrimitiveTypeName }
  | { kind: 'array'; element: TypeModel }
  | { kind: 'object'; properties: Record<string, ObjectProperty>; sampleCount: number }
  | { kind: 'union'; variants: TypeModel[] };

interface ObjectProperty {
  type: TypeModel;
  seenCount: number;
  order: number;
}

const UNKNOWN_TYPE: TypeModel = { kind: 'unknown' };
const TS_RESERVED_TYPE_NAMES = new Set([
  'Any',
  'Boolean',
  'Number',
  'String',
  'Object',
  'Array',
  'Promise',
  'Date',
  'Map',
  'Set',
]);

const TYPE_KIND_ORDER: Record<TypeModel['kind'], number> = {
  primitive: 0,
  object: 1,
  array: 2,
  union: 3,
  unknown: 4,
};

const PRIMITIVE_ORDER: Record<PrimitiveTypeName, number> = {
  string: 0,
  number: 1,
  boolean: 2,
  null: 3,
};

const isJsonObject = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const toWords = (value: string): string[] => {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map(word => word.trim())
    .filter(Boolean);

  return words.length > 0 ? words : ['Value'];
};

const toPascalCase = (value: string): string => (
  toWords(value)
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join('')
);

const sanitizeTypeName = (value: string | undefined): string => {
  const name = toPascalCase(value || 'Root').replace(/^[^A-Za-z_]+/, '') || 'Root';
  return TS_RESERVED_TYPE_NAMES.has(name) ? `${name}Model` : name;
};

const isValidTypeScriptIdentifier = (value: string): boolean => (
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)
);

const formatPropertyName = (key: string): string => (
  isValidTypeScriptIdentifier(key) ? key : JSON.stringify(key)
);

const isObjectType = (
  model: TypeModel
): model is Extract<TypeModel, { kind: 'object' }> => model.kind === 'object';

const isArrayType = (
  model: TypeModel
): model is Extract<TypeModel, { kind: 'array' }> => model.kind === 'array';

const cloneProperty = (property: ObjectProperty): ObjectProperty => ({
  type: property.type,
  seenCount: property.seenCount,
  order: property.order,
});

// 先把 JSON 样本归并成类型模型，再统一渲染 interface，避免数组样本重复生成碎片类型。
const inferTypeModel = (value: JsonValue): TypeModel => {
  if (value === null) return { kind: 'primitive', name: 'null' };
  if (typeof value === 'string') return { kind: 'primitive', name: 'string' };
  if (typeof value === 'number') return { kind: 'primitive', name: 'number' };
  if (typeof value === 'boolean') return { kind: 'primitive', name: 'boolean' };

  if (Array.isArray(value)) {
    const element = value.reduce<TypeModel>(
      (current, item) => mergeTypes(current, inferTypeModel(item)),
      UNKNOWN_TYPE
    );

    return { kind: 'array', element };
  }

  const properties: Record<string, ObjectProperty> = {};
  Object.entries(value).forEach(([key, item], index) => {
    properties[key] = {
      type: inferTypeModel(item),
      seenCount: 1,
      order: index,
    };
  });

  return {
    kind: 'object',
    properties,
    sampleCount: 1,
  };
};

const getTypeSignature = (model: TypeModel): string => {
  if (model.kind === 'unknown') return 'unknown';
  if (model.kind === 'primitive') return model.name;
  if (model.kind === 'array') return `array<${getTypeSignature(model.element)}>`;
  if (model.kind === 'union') {
    return `union<${model.variants.map(getTypeSignature).sort().join('|')}>`;
  }

  const propertySignature = Object.entries(model.properties)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, property]) => (
      `${key}${property.seenCount < model.sampleCount ? '?' : ''}:${getTypeSignature(property.type)}`
    ))
    .join(',');

  return `object{${propertySignature}}`;
};

const sortUnionVariants = (variants: TypeModel[]): TypeModel[] => (
  [...variants].sort((left, right) => {
    if (left.kind === 'primitive' && right.kind === 'primitive') {
      return PRIMITIVE_ORDER[left.name] - PRIMITIVE_ORDER[right.name];
    }

    return TYPE_KIND_ORDER[left.kind] - TYPE_KIND_ORDER[right.kind];
  })
);

const mergeObjectTypes = (
  left: Extract<TypeModel, { kind: 'object' }>,
  right: Extract<TypeModel, { kind: 'object' }>
): TypeModel => {
  const properties: Record<string, ObjectProperty> = Object.fromEntries(
    Object.entries(left.properties).map(([key, property]) => [key, cloneProperty(property)])
  );

  Object.entries(right.properties).forEach(([key, property]) => {
    const existing = properties[key];
    properties[key] = existing
      ? {
          type: mergeTypes(existing.type, property.type),
          seenCount: existing.seenCount + property.seenCount,
          order: Math.min(existing.order, property.order),
        }
      : cloneProperty(property);
  });

  return {
    kind: 'object',
    properties,
    sampleCount: left.sampleCount + right.sampleCount,
  };
};

const mergeUnionVariant = (variants: TypeModel[], candidate: TypeModel): TypeModel[] => {
  if (candidate.kind === 'unknown') return variants;

  const existingIndex = variants.findIndex(variant => {
    if (variant.kind !== candidate.kind) return false;
    if (variant.kind === 'primitive' && candidate.kind === 'primitive') {
      return variant.name === candidate.name;
    }
    return variant.kind === 'array' || variant.kind === 'object';
  });

  if (existingIndex === -1) {
    return [...variants, candidate];
  }

  return variants.map((variant, index) => (
    index === existingIndex ? mergeTypes(variant, candidate) : variant
  ));
};

const normalizeUnion = (variants: TypeModel[]): TypeModel => {
  const normalized = variants.reduce<TypeModel[]>((current, variant) => {
    if (variant.kind === 'union') {
      return variant.variants.reduce(mergeUnionVariant, current);
    }
    return mergeUnionVariant(current, variant);
  }, []);

  const deduped = Array.from(
    new Map(normalized.map(variant => [getTypeSignature(variant), variant])).values()
  );

  if (deduped.length === 0) return UNKNOWN_TYPE;
  if (deduped.length === 1) return deduped[0] || UNKNOWN_TYPE;

  return {
    kind: 'union',
    variants: sortUnionVariants(deduped),
  };
};

const mergeTypes = (left: TypeModel, right: TypeModel): TypeModel => {
  if (left.kind === 'unknown') return right;
  if (right.kind === 'unknown') return left;

  if (left.kind === 'union' || right.kind === 'union') {
    return normalizeUnion([left, right]);
  }

  if (left.kind === 'primitive' && right.kind === 'primitive') {
    return left.name === right.name ? left : normalizeUnion([left, right]);
  }

  if (isArrayType(left) && isArrayType(right)) {
    return {
      kind: 'array',
      element: mergeTypes(left.element, right.element),
    };
  }

  if (isObjectType(left) && isObjectType(right)) {
    return mergeObjectTypes(left, right);
  }

  return normalizeUnion([left, right]);
};

const buildChildTypeName = (parentName: string, key: string, suffix = ''): string => (
  sanitizeTypeName(`${parentName}${toPascalCase(key)}${suffix}`)
);

export const jsonValueToTypeScriptDeclaration = (
  value: JsonValue,
  options: JsonToTypeScriptOptions = {}
): string => {
  const rootName = sanitizeTypeName(options.rootName);
  const rootModel = inferTypeModel(value);
  const usedTypeNames = new Map<string, number>();
  const objectTypeNames = new WeakMap<Extract<TypeModel, { kind: 'object' }>, string>();
  const definitions: Array<{ name: string; block: string }> = [];

  const getUniqueTypeName = (preferredName: string): string => {
    const baseName = sanitizeTypeName(preferredName);
    const count = usedTypeNames.get(baseName) || 0;
    usedTypeNames.set(baseName, count + 1);
    return count === 0 ? baseName : `${baseName}${count + 1}`;
  };

  const renderType = (model: TypeModel, preferredName: string): string => {
    if (model.kind === 'unknown') return 'unknown';
    if (model.kind === 'primitive') return model.name;
    if (model.kind === 'array') {
      const itemTypeName = isObjectType(model.element)
        ? preferredName
        : buildChildTypeName(preferredName, 'item');
      const itemType = renderType(model.element, itemTypeName);
      return model.element.kind === 'union' ? `(${itemType})[]` : `${itemType}[]`;
    }
    if (model.kind === 'union') {
      return model.variants.map(variant => renderType(variant, preferredName)).join(' | ');
    }

    const existingName = objectTypeNames.get(model);
    if (existingName) return existingName;

    const typeName = getUniqueTypeName(preferredName);
    objectTypeNames.set(model, typeName);

    const propertyLines = Object.entries(model.properties)
      .sort(([, left], [, right]) => left.order - right.order)
      .map(([key, property]) => {
        const optionalMark = property.seenCount < model.sampleCount ? '?' : '';
        const propertyTypeName = isArrayType(property.type) && isObjectType(property.type.element)
          ? buildChildTypeName(typeName, key, 'Item')
          : buildChildTypeName(typeName, key);
        const propertyType = renderType(property.type, propertyTypeName);

        return `  ${formatPropertyName(key)}${optionalMark}: ${propertyType};`;
      });

    definitions.push({
      name: typeName,
      block: [
        `export interface ${typeName} {`,
        ...(propertyLines.length > 0 ? propertyLines : ['  [key: string]: never;']),
        '}',
      ].join('\n'),
    });

    return typeName;
  };

  const rootTypeName = isArrayType(rootModel) && isObjectType(rootModel.element)
    ? buildChildTypeName(rootName, 'item')
    : rootName;
  const rootType = renderType(rootModel, rootTypeName);
  if (rootModel.kind !== 'object') {
    definitions.unshift({
      name: rootName,
      block: `export type ${rootName} = ${rootType};`,
    });
  }

  return definitions
    .sort((left, right) => (left.name === rootName ? -1 : right.name === rootName ? 1 : 0))
    .map(definition => definition.block)
    .join('\n\n');
};
