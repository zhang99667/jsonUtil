import type { JsonObject, JsonValue } from '../types';
import { defineJsonProperty } from './jsonObjectProperty';
import { isJsonObject } from './jsonValueGuards';
import { isCommandInsightField } from './schemeMetadataFieldRules';
import {
  getSchemeCommandSourceInfo,
  getSchemeMetadataSourceObjectChild,
  parseSchemeMetadataSourceShape,
  type SchemeMetadataSourceShape,
} from './schemeMetadataSourceShape';

type CmdHandlerWrapTarget =
  | { kind: 'root' }
  | { kind: 'array'; parent: JsonValue[]; index: number }
  | { kind: 'object'; parent: JsonObject; key: string };

type CmdHandlerWrapTask =
  | {
    kind: 'visit';
    value: JsonValue;
    sourceShape: SchemeMetadataSourceShape | null;
    commandSource?: SchemeMetadataSourceShape;
    target: CmdHandlerWrapTarget;
  }
  | {
    kind: 'finalize';
    value: JsonValue;
    commandSource?: SchemeMetadataSourceShape;
    target: CmdHandlerWrapTarget;
  };

const wrapCommandObject = (
  value: JsonValue,
  commandSource?: SchemeMetadataSourceShape,
): JsonValue => {
  if (!isJsonObject(value)) return value;
  const sourceInfo = getSchemeCommandSourceInfo(commandSource);
  return sourceInfo
    ? {
        ...(sourceInfo.cmdSchema ? { cmdSchema: sourceInfo.cmdSchema } : {}),
        cmdParams: value,
        source: sourceInfo.source,
      }
    : value;
};

export const wrapNestedCmdHandlerParams = (
  value: JsonValue,
  sourceShape: SchemeMetadataSourceShape | null,
): JsonValue => {
  let rootResult = value;
  const writeResult = (target: CmdHandlerWrapTarget, result: JsonValue): void => {
    if (target.kind === 'root') rootResult = result;
    else if (target.kind === 'array') target.parent[target.index] = result;
    else defineJsonProperty(target.parent, target.key, result);
  };
  const pending: CmdHandlerWrapTask[] = [{
    kind: 'visit', value, sourceShape, target: { kind: 'root' },
  }];

  while (pending.length > 0) {
    const task = pending.pop()!;
    if (task.kind === 'finalize') {
      writeResult(task.target, wrapCommandObject(task.value, task.commandSource));
      continue;
    }
    if (Array.isArray(task.value)) {
      const result = new Array<JsonValue>(task.value.length);
      const sourceItems = Array.isArray(task.sourceShape) ? task.sourceShape : [];
      const commandSources = Array.isArray(task.commandSource) ? task.commandSource : [];
      pending.push({
        kind: 'finalize', value: result, commandSource: task.commandSource, target: task.target,
      });
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(task.value, index)) continue;
        const sourceItem = sourceItems[index];
        pending.push({
          kind: 'visit',
          value: task.value[index],
          sourceShape: typeof sourceItem === 'string'
            ? parseSchemeMetadataSourceShape(sourceItem)
            : sourceItem ?? null,
          commandSource: commandSources[index],
          target: { kind: 'array', parent: result, index },
        });
      }
      continue;
    }
    if (isJsonObject(task.value)) {
      const result: JsonObject = {};
      const keys = Object.keys(task.value);
      pending.push({
        kind: 'finalize', value: result, commandSource: task.commandSource, target: task.target,
      });
      for (let index = keys.length - 1; index >= 0; index -= 1) {
        const key = keys[index];
        const childSource = getSchemeMetadataSourceObjectChild(task.sourceShape, key);
        pending.push({
          kind: 'visit',
          value: task.value[key],
          sourceShape: typeof childSource === 'string'
            ? parseSchemeMetadataSourceShape(childSource)
            : childSource ?? null,
          ...(isCommandInsightField(key) ? { commandSource: childSource } : {}),
          target: { kind: 'object', parent: result, key },
        });
      }
      continue;
    }
    writeResult(task.target, task.value);
  }

  return rootResult;
};
