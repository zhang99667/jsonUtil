import type { JsonValue } from '../types';
import {
  collectInferenceStats,
  inferTypeModel,
  isArrayType,
  isObjectType,
  type TypeModel,
  type TypeScriptInferenceResult,
} from './jsonToTypeScriptInference';
import { isJsonObject } from './jsonValueGuards';

export interface JsonToTypeScriptOptions {
  rootName?: string;
  includeSummary?: boolean;
}

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

const buildChildTypeName = (parentName: string, key: string, suffix = ''): string => (
  sanitizeTypeName(`${parentName}${toPascalCase(key)}${suffix}`)
);

const getInferenceSourceText = (
  value: JsonValue,
  rootArraySampledItemCount: number | undefined
): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) return '基于空数组推断，元素类型未知';
    if (
      rootArraySampledItemCount !== undefined
      && rootArraySampledItemCount < value.length
    ) {
      return `基于数组 ${value.length} 项中的 ${rootArraySampledItemCount} 项抽样推断`;
    }
    return `基于数组样本 ${value.length} 项推断`;
  }

  if (isJsonObject(value)) return '基于单个对象样本推断';
  if (value === null) return '基于 null 值推断';

  return `基于 ${typeof value} 值推断`;
};

const buildTypeScriptInferenceSummaryLines = (
  value: JsonValue,
  inference: TypeScriptInferenceResult
): string[] => {
  const stats = collectInferenceStats(inference.model);
  const explainParts = [
    getInferenceSourceText(value, inference.rootArraySampledItemCount),
    stats.objectCount > 0 ? `生成 ${stats.objectCount} 个对象类型` : '',
  ].filter(Boolean);
  const riskParts = [
    stats.optionalPropertyCount > 0 ? `${stats.optionalPropertyCount} 个可选字段` : '',
    stats.unionCount > 0 ? `${stats.unionCount} 处混合类型` : '',
    stats.emptyArrayCount > 0 ? `${stats.emptyArrayCount} 个空数组为 unknown[]` : '',
    inference.truncatedCount > 0
      ? `${inference.truncatedCount} 处超深结构降级为 unknown`
      : '',
    inference.sampledArrayCount > 0
      ? `${inference.sampledArrayCount} 个长数组按预算抽样，共跳过 ${inference.omittedArrayItemCount} 个元素`
      : '',
  ].filter(Boolean);

  if (riskParts.length === 0 && isJsonObject(value)) {
    riskParts.push('单样本无法判断字段是否必填');
  }

  return [
    `生成说明: ${explainParts.join('，')}`,
    riskParts.length > 0
      ? `可信提示: ${riskParts.join('，')}，建议结合更多 response 样本复核 required 与 union 类型`
      : '可信提示: 当前样本未发现可选字段或混合类型，仍建议结合更多 response 样本复核',
  ];
};

const formatTypeScriptInferenceSummary = (
  value: JsonValue,
  inference: TypeScriptInferenceResult
): string => (
  buildTypeScriptInferenceSummaryLines(value, inference)
    .map(line => `// ${line}`)
    .join('\n')
);

export const jsonValueToTypeScriptDeclaration = (
  value: JsonValue,
  options: JsonToTypeScriptOptions = {}
): string => {
  const rootName = sanitizeTypeName(options.rootName);
  const inference = inferTypeModel(value);
  const rootModel = inference.model;
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

  const declaration = definitions
    .sort((left, right) => (left.name === rootName ? -1 : right.name === rootName ? 1 : 0))
    .map(definition => definition.block)
    .join('\n\n');

  return options.includeSummary
    ? `${formatTypeScriptInferenceSummary(value, inference)}\n\n${declaration}`
    : declaration;
};
