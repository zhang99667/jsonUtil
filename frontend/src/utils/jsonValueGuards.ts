import type { JsonObject, JsonValue } from '../types';

/** 判断已经通过 JSON 类型约束的值是否为对象节点。 */
export const isJsonObject = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

/** 迭代校验未知输入是否为无循环的 JSON 值，避免深层结构压溃调用栈。 */
export const isJsonValue = (value: unknown): value is JsonValue => {
  const pending: Array<[unknown, boolean]> = [[value, false]];
  const ancestors = new WeakSet<object>();

  while (pending.length > 0) {
    const [current, leaving] = pending.pop()!;
    if (leaving) {
      ancestors.delete(current as object);
      continue;
    }
    if (
      current === null
      || typeof current === 'string'
      || typeof current === 'boolean'
      || (typeof current === 'number' && Number.isFinite(current))
    ) {
      continue;
    }
    if (typeof current !== 'object' || ancestors.has(current)) return false;

    try {
      const prototype = Object.getPrototypeOf(current);
      if (!Array.isArray(current) && prototype !== Object.prototype && prototype !== null) return false;

      ancestors.add(current);
      pending.push([current, true]);
      if (Array.isArray(current)) {
        for (let index = current.length - 1; index >= 0; index -= 1) {
          if (!Object.hasOwn(current, index)) return false;
          pending.push([current[index], false]);
        }
      } else {
        for (const item of Object.values(current)) pending.push([item, false]);
      }
    } catch {
      return false;
    }
  }

  return true;
};
