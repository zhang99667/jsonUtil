import type { JsonValue } from '../types';
import { getJsonArraySampleEntries } from './jsonArraySampling';

export type PrimitiveTypeName = 'string' | 'number' | 'boolean' | 'null';

type EmptyUnknownType = { kind: 'unknown'; reason: 'empty' };
type DepthUnknownType = { kind: 'unknown'; reason: 'depth' };

export type TypeModel =
  | EmptyUnknownType
  | DepthUnknownType
  | { kind: 'primitive'; name: PrimitiveTypeName }
  | { kind: 'array'; element: TypeModel }
  | { kind: 'object'; properties: Record<string, ObjectProperty>; sampleCount: number }
  | { kind: 'union'; variants: TypeModel[] };

export interface ObjectProperty {
  type: TypeModel;
  seenCount: number;
  order: number;
}

export interface TypeScriptInferenceStats {
  objectCount: number;
  optionalPropertyCount: number;
  unionCount: number;
  emptyArrayCount: number;
}

export interface TypeScriptInferenceResult {
  model: TypeModel;
  truncatedCount: number;
  sampledArrayCount: number;
  omittedArrayItemCount: number;
  rootArraySampledItemCount?: number;
}

const MAX_TYPESCRIPT_INFERENCE_DEPTH = 32;
const EMPTY_UNKNOWN_TYPE: TypeModel = { kind: 'unknown', reason: 'empty' };
const DEPTH_UNKNOWN_TYPE: TypeModel = { kind: 'unknown', reason: 'depth' };
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

export const isObjectType = (
  model: TypeModel
): model is Extract<TypeModel, { kind: 'object' }> => model.kind === 'object';

export const isArrayType = (
  model: TypeModel
): model is Extract<TypeModel, { kind: 'array' }> => model.kind === 'array';

const isDepthUnknown = (
  model: TypeModel
): model is DepthUnknownType => (
  model.kind === 'unknown' && model.reason === 'depth'
);

const cloneProperty = (property: ObjectProperty): ObjectProperty => ({
  type: property.type,
  seenCount: property.seenCount,
  order: property.order,
});

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
  if (variants.some(isDepthUnknown)) return variants;
  if (isDepthUnknown(candidate)) return [candidate];
  if (candidate.kind === 'unknown') return variants;

  const existingIndex = variants.findIndex(variant => {
    if (variant.kind !== candidate.kind) return false;
    if (variant.kind === 'primitive' && candidate.kind === 'primitive') {
      return variant.name === candidate.name;
    }
    return variant.kind === 'array' || variant.kind === 'object';
  });

  if (existingIndex === -1) return [...variants, candidate];

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

  if (normalized.length === 0) return EMPTY_UNKNOWN_TYPE;
  if (normalized.length === 1) return normalized[0] || EMPTY_UNKNOWN_TYPE;

  return {
    kind: 'union',
    variants: sortUnionVariants(normalized),
  };
};

const mergeTypes = (left: TypeModel, right: TypeModel): TypeModel => {
  if (isDepthUnknown(left)) return left;
  if (isDepthUnknown(right)) return right;
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

// 深层结构继续展开只会生成难以使用的声明，因此在固定预算后保守降级。
const inferTypeModelWithDepth = (
  value: JsonValue,
  depth: number,
  result: Omit<TypeScriptInferenceResult, 'model'>
): TypeModel => {
  if (value === null) return { kind: 'primitive', name: 'null' };
  if (typeof value === 'string') return { kind: 'primitive', name: 'string' };
  if (typeof value === 'number') return { kind: 'primitive', name: 'number' };
  if (typeof value === 'boolean') return { kind: 'primitive', name: 'boolean' };

  if (depth >= MAX_TYPESCRIPT_INFERENCE_DEPTH) {
    result.truncatedCount += 1;
    return DEPTH_UNKNOWN_TYPE;
  }

  if (Array.isArray(value)) {
    const sampleResult = getJsonArraySampleEntries(value);
    if (depth === 0) result.rootArraySampledItemCount = sampleResult.entries.length;
    if (sampleResult.entries.length < value.length) {
      result.sampledArrayCount += 1;
      result.omittedArrayItemCount += value.length - sampleResult.entries.length;
    }

    const element = sampleResult.entries.reduce<TypeModel>(
      (current, { item }) => mergeTypes(
        current,
        inferTypeModelWithDepth(item, depth + 1, result)
      ),
      EMPTY_UNKNOWN_TYPE
    );

    return { kind: 'array', element };
  }

  const properties: Record<string, ObjectProperty> = {};
  Object.entries(value).forEach(([key, item], index) => {
    properties[key] = {
      type: inferTypeModelWithDepth(item, depth + 1, result),
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

export const inferTypeModel = (value: JsonValue): TypeScriptInferenceResult => {
  const context: Omit<TypeScriptInferenceResult, 'model'> = {
    truncatedCount: 0,
    sampledArrayCount: 0,
    omittedArrayItemCount: 0,
  };

  return {
    model: inferTypeModelWithDepth(value, 0, context),
    ...context,
  };
};

export const collectInferenceStats = (model: TypeModel): TypeScriptInferenceStats => {
  const stats: TypeScriptInferenceStats = {
    objectCount: 0,
    optionalPropertyCount: 0,
    unionCount: 0,
    emptyArrayCount: 0,
  };

  const visit = (current: TypeModel): void => {
    if (current.kind === 'array') {
      if (current.element.kind === 'unknown' && current.element.reason === 'empty') {
        stats.emptyArrayCount += 1;
      }
      visit(current.element);
      return;
    }

    if (current.kind === 'union') {
      stats.unionCount += 1;
      current.variants.forEach(visit);
      return;
    }

    if (current.kind !== 'object') return;

    stats.objectCount += 1;
    Object.values(current.properties).forEach(property => {
      if (property.seenCount < current.sampleCount) {
        stats.optionalPropertyCount += 1;
      }
      visit(property.type);
    });
  };

  visit(model);
  return stats;
};
