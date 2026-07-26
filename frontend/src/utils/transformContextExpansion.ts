import type { JsonObject, JsonValue } from '../types.ts';
import { defineJsonProperty } from './jsonObjectProperty.ts';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments.ts';
import { isJsonObject } from './jsonValueGuards.ts';

export interface ExpansionNodeContext {
  path: string;
  depth: number;
  sourceLabel?: string;
}

export interface ExpansionStringResult {
  value: JsonValue;
  afterChildren?: () => void;
}

interface ExpansionOptions {
  transformString: (
    value: string,
    context: ExpansionNodeContext
  ) => ExpansionStringResult;
  getArrayChildSourceLabel: (sourceLabel?: string) => string | undefined;
  getObjectChildSourceLabel: (
    parent: JsonObject,
    key: string,
    sourceLabel?: string
  ) => string | undefined;
}

type ExpansionTarget =
  | { kind: 'root' }
  | { kind: 'array'; parent: JsonValue[]; index: number }
  | { kind: 'object'; parent: JsonObject; key: string };

type ExpansionTask =
  | {
    kind: 'visit';
    value: JsonValue;
    context: ExpansionNodeContext;
    target: ExpansionTarget;
  }
  | { kind: 'finalize'; afterChildren: () => void };

export const expandJsonTree = (
  value: JsonValue,
  options: ExpansionOptions
): JsonValue => {
  let rootResult = value;
  const writeResult = (target: ExpansionTarget, result: JsonValue): void => {
    if (target.kind === 'root') {
      rootResult = result;
    } else if (target.kind === 'array') {
      target.parent[target.index] = result;
    } else {
      defineJsonProperty(target.parent, target.key, result);
    }
  };
  const pending: ExpansionTask[] = [{
    kind: 'visit',
    value,
    context: { path: '$', depth: 0 },
    target: { kind: 'root' },
  }];

  const pushChildren = (
    parent: JsonValue[] | JsonObject,
    context: ExpansionNodeContext,
    depth: number
  ): void => {
    if (Array.isArray(parent)) {
      for (let index = parent.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(parent, index)) continue;
        pending.push({
          kind: 'visit',
          value: parent[index],
          context: {
            path: appendJsonPathIndex(context.path, index),
            depth,
            sourceLabel: options.getArrayChildSourceLabel(context.sourceLabel),
          },
          target: { kind: 'array', parent, index },
        });
      }
      return;
    }

    const keys = Object.keys(parent);
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index];
      pending.push({
        kind: 'visit',
        value: parent[key],
        context: {
          path: appendJsonPathKey(context.path, key),
          depth,
          sourceLabel: options.getObjectChildSourceLabel(parent, key, context.sourceLabel),
        },
        target: { kind: 'object', parent, key },
      });
    }
  };

  while (pending.length > 0) {
    const task = pending.pop();
    if (!task) continue;
    if (task.kind === 'finalize') {
      task.afterChildren();
      continue;
    }

    if (typeof task.value === 'string') {
      const transformed = options.transformString(task.value, task.context);
      writeResult(task.target, transformed.value);
      if (transformed.afterChildren) {
        pending.push({ kind: 'finalize', afterChildren: transformed.afterChildren });
      }
      if (Array.isArray(transformed.value) || isJsonObject(transformed.value)) {
        pushChildren(transformed.value, task.context, task.context.depth + 1);
      }
      continue;
    }

    writeResult(task.target, task.value);
    if (Array.isArray(task.value) || isJsonObject(task.value)) {
      pushChildren(task.value, task.context, task.context.depth);
    }
  }

  return rootResult;
};
