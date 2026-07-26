import type { JsonObject, JsonValue } from '../types.ts';

export const defineJsonProperty = (
  target: JsonObject,
  key: string,
  value: JsonValue
): void => {
  // 描述符写入不会触发对象原型上的 __proto__ 设置器。
  Reflect.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
};
