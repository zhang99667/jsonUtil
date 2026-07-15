import type { JsonObject, JsonValue } from '../types.ts';
import { isJsonObject } from './jsonValueGuards.ts';
import { PLACEHOLDER_FILL_TEMPLATE_KIND } from './placeholderFillTemplateContract.ts';

type PlaceholderFillTemplate = JsonObject & {
  placeholders: Record<string, JsonValue>;
};

const isPlaceholderFillTemplate = (
  template: JsonValue
): template is PlaceholderFillTemplate => (
  isJsonObject(template) &&
  template.kind === PLACEHOLDER_FILL_TEMPLATE_KIND &&
  isJsonObject(template.placeholders)
);

const buildPlaceholderReplacementMap = (
  template: PlaceholderFillTemplate
): Record<string, string> => (
  Object.fromEntries(
    Object.entries(template.placeholders).filter((entry): entry is [string, string] => (
      typeof entry[1] === 'string' && entry[1].length > 0
    ))
  )
);

const replaceRuntimePlaceholders = (
  value: JsonValue,
  replacements: Record<string, string>
): JsonValue => {
  if (typeof value === 'string') {
    return Object.entries(replacements).reduce(
      (current, [placeholder, replacement]) => current.split(placeholder).join(replacement),
      value
    );
  }

  if (Array.isArray(value)) {
    return value.map(item => replaceRuntimePlaceholders(item, replacements));
  }

  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceRuntimePlaceholders(item, replacements),
      ])
    );
  }

  return value;
};

export const applyPlaceholderFillTemplate = (
  target: JsonValue,
  template: PlaceholderFillTemplate
): JsonValue => {
  const replacements = buildPlaceholderReplacementMap(template);
  if (Object.keys(replacements).length === 0) {
    throw new Error('占位符回填模板缺少 replacement');
  }

  return replaceRuntimePlaceholders(target, replacements);
};

/**
 * 将模板深度合并到目标 JSON 值。
 * 普通对象递归合并，标量和数组直接使用模板值。
 */
export const deepMergeTemplate = (target: JsonValue, template: JsonValue): JsonValue => {
  if (!isJsonObject(template)) return template;
  if (!isJsonObject(target)) return template;

  const result: JsonObject = { ...target };
  Object.entries(template).forEach(([key, value]) => {
    result[key] = Object.hasOwn(result, key)
      ? deepMergeTemplate(result[key], value)
      : value;
  });
  return result;
};

/** 解析当前内容和模板，执行合并或占位符回填。 */
export const applyTemplate = (inputJson: string, templateJson: string): string => {
  if (!inputJson.trim()) throw new Error('当前编辑器内容为空');
  if (!templateJson.trim()) throw new Error('模板内容为空');

  let target: JsonValue;
  try {
    target = JSON.parse(inputJson) as JsonValue;
  } catch {
    throw new Error('当前编辑器内容不是合法的 JSON');
  }

  let template: JsonValue;
  try {
    template = JSON.parse(templateJson) as JsonValue;
  } catch {
    throw new Error('模板内容不是合法的 JSON');
  }

  const merged = isPlaceholderFillTemplate(template)
    ? applyPlaceholderFillTemplate(target, template)
    : deepMergeTemplate(target, template);
  return JSON.stringify(merged, null, 2);
};
