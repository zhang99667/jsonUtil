import type {
  JsonObject,
  JsonValue,
  PathTransformRecord,
  TransformStep,
} from '../types.ts';
import { defineJsonProperty } from './jsonObjectProperty.ts';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments.ts';
import { isJsonObject } from './jsonValueGuards.ts';

interface RestoreOptions {
  records: ReadonlyMap<string, PathTransformRecord>;
  areValuesEqual: (left: JsonValue, right: JsonValue) => boolean;
  applyStep: (value: JsonValue, step: TransformStep) => JsonValue;
}

type RestoreTarget =
  | { kind: 'root' }
  | { kind: 'array'; parent: JsonValue[]; index: number }
  | { kind: 'object'; parent: JsonObject; key: string };

type RestoreTask =
  | { kind: 'visit'; value: JsonValue; path: string; target: RestoreTarget }
  | {
    kind: 'finalize';
    value: JsonValue;
    record?: PathTransformRecord;
    target: RestoreTarget;
  };

const applyRecordSteps = (
  value: JsonValue,
  record: PathTransformRecord | undefined,
  applyStep: RestoreOptions['applyStep']
): JsonValue => {
  let result = value;
  if (!record) return result;

  for (let index = record.steps.length - 1; index >= 0; index -= 1) {
    result = applyStep(result, record.steps[index]);
  }
  return result;
};

export const restoreJsonWithRecords = (
  value: JsonValue,
  options: RestoreOptions
): JsonValue => {
  let rootResult = value;
  const writeResult = (target: RestoreTarget, result: JsonValue): void => {
    if (target.kind === 'root') {
      rootResult = result;
    } else if (target.kind === 'array') {
      target.parent[target.index] = result;
    } else {
      defineJsonProperty(target.parent, target.key, result);
    }
  };
  const pending: RestoreTask[] = [{
    kind: 'visit',
    value,
    path: '$',
    target: { kind: 'root' },
  }];

  while (pending.length > 0) {
    const task = pending.pop();
    if (!task) continue;

    if (task.kind === 'finalize') {
      writeResult(task.target, applyRecordSteps(task.value, task.record, options.applyStep));
      continue;
    }

    const record = options.records.get(task.path);
    const schemeStep = record?.steps.find(step => step.type === 'scheme_decode');
    if (
      schemeStep?.decodedSchemeValue !== undefined
      && options.areValuesEqual(task.value, schemeStep.decodedSchemeValue)
    ) {
      writeResult(task.target, record.originalValue);
      continue;
    }

    if (Array.isArray(task.value)) {
      const result = new Array<JsonValue>(task.value.length);
      pending.push({ kind: 'finalize', value: result, record, target: task.target });
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(task.value, index)) continue;
        pending.push({
          kind: 'visit',
          value: task.value[index],
          path: appendJsonPathIndex(task.path, index),
          target: { kind: 'array', parent: result, index },
        });
      }
      continue;
    }

    if (isJsonObject(task.value)) {
      const result: JsonObject = {};
      const keys = Object.keys(task.value);
      pending.push({ kind: 'finalize', value: result, record, target: task.target });
      for (let index = keys.length - 1; index >= 0; index -= 1) {
        const key = keys[index];
        pending.push({
          kind: 'visit',
          value: task.value[key],
          path: appendJsonPathKey(task.path, key),
          target: { kind: 'object', parent: result, key },
        });
      }
      continue;
    }

    writeResult(task.target, applyRecordSteps(task.value, record, options.applyStep));
  }

  return rootResult;
};
