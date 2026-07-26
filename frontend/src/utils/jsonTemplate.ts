import type { JsonObject, JsonValue } from '../types.ts';
import { defineJsonProperty } from './jsonObjectProperty.ts';
import { isJsonObject, parseJsonValue } from './jsonValueGuards.ts';
import { PLACEHOLDER_FILL_TEMPLATE_KIND } from './placeholderFillTemplateContract.ts';

type PlaceholderFillTemplate = JsonObject & {
  placeholders: Record<string, JsonValue>;
};

interface DeepMergeFrame {
  result: JsonObject;
  target: JsonObject;
  template: JsonObject;
}

type PlaceholderReplacementFrame =
  | { kind: 'array'; source: JsonValue[]; result: JsonValue[] }
  | { kind: 'object'; source: JsonObject; result: JsonObject };

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
      entry[0].trim().length > 0 && typeof entry[1] === 'string' && entry[1].length > 0
    ))
  )
);

const replaceRuntimePlaceholders = (
  value: JsonValue,
  replacements: Record<string, string>
): JsonValue => {
  const replacementEntries = Object.entries(replacements);
  const pending: PlaceholderReplacementFrame[] = [];
  const cloneValue = (item: JsonValue): JsonValue => {
    if (typeof item === 'string') {
      return replacementEntries.reduce(
        (current, [placeholder, replacement]) => current.split(placeholder).join(replacement),
        item
      );
    }
    if (Array.isArray(item)) {
      const result = new Array<JsonValue>(item.length);
      pending.push({ kind: 'array', source: item, result });
      return result;
    }
    if (isJsonObject(item)) {
      const result: JsonObject = {};
      pending.push({ kind: 'object', source: item, result });
      return result;
    }
    return item;
  };

  const result = cloneValue(value);
  while (pending.length > 0) {
    const frame = pending.pop();
    if (!frame) continue;

    if (frame.kind === 'array') {
      for (let index = 0; index < frame.source.length; index += 1) {
        frame.result[index] = cloneValue(frame.source[index]);
      }
      continue;
    }

    for (const [key, item] of Object.entries(frame.source)) {
      defineJsonProperty(frame.result, key, cloneValue(item));
    }
  }
  return result;
};

export const applyPlaceholderFillTemplate = (
  target: JsonValue,
  template: PlaceholderFillTemplate
): JsonValue => {
  const replacements = buildPlaceholderReplacementMap(template);
  if (Object.keys(replacements).length === 0) {
    throw new Error('占位符回填模板缺少有效替换项');
  }

  return replaceRuntimePlaceholders(target, replacements);
};

export const deepMergeTemplate = (target: JsonValue, template: JsonValue): JsonValue => {
  if (!isJsonObject(template)) return template;
  if (!isJsonObject(target)) return template;

  const result: JsonObject = { ...target };
  const pending: DeepMergeFrame[] = [{ result, target, template }];
  while (pending.length > 0) {
    const frame = pending.pop();
    if (!frame) continue;

    for (const [key, templateValue] of Object.entries(frame.template)) {
      const targetValue = frame.target[key];
      if (Object.hasOwn(frame.target, key) && isJsonObject(targetValue) && isJsonObject(templateValue)) {
        const childResult: JsonObject = { ...targetValue };
        defineJsonProperty(frame.result, key, childResult);
        pending.push({ result: childResult, target: targetValue, template: templateValue });
      } else {
        defineJsonProperty(frame.result, key, templateValue);
      }
    }
  }
  return result;
};

export const applyTemplate = (inputJson: string, templateJson: string): string => {
  if (!inputJson.trim()) throw new Error('当前编辑器内容为空');
  if (!templateJson.trim()) throw new Error('模板内容为空');

  let target: JsonValue;
  try {
    target = parseJsonValue(inputJson);
  } catch {
    throw new Error('当前编辑器内容不是合法的 JSON');
  }

  let template: JsonValue;
  try {
    template = parseJsonValue(templateJson);
  } catch {
    throw new Error('模板内容不是合法的 JSON');
  }

  const merged = isPlaceholderFillTemplate(template)
    ? applyPlaceholderFillTemplate(target, template)
    : deepMergeTemplate(target, template);
  return JSON.stringify(merged, null, 2);
};
