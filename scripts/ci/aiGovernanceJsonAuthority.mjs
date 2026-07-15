import { TextDecoder } from 'node:util';

const strictUtf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

const hasDuplicateJsonKeys = (source) => {
  const stack = [];
  for (let index = 0; index < source.length;) {
    const char = source[index];
    if (char === '"') {
      let end = index + 1;
      while (end < source.length && source[end] !== '"') {
        if (source[end] === '\\') end += 1;
        end += 1;
      }
      const context = stack.at(-1);
      if (context?.type === 'object' && context.expectKey) {
        const key = JSON.parse(source.slice(index, end + 1));
        if (context.keys.has(key)) return true;
        context.keys.add(key);
        context.expectKey = false;
      }
      index = end + 1;
      continue;
    }
    if (char === '{') stack.push({ type: 'object', expectKey: true, keys: new Set() });
    else if (char === '[') stack.push({ type: 'array' });
    else if (char === '}' || char === ']') stack.pop();
    else if (char === ',' && stack.at(-1)?.type === 'object') stack.at(-1).expectKey = true;
    index += 1;
  }
  return false;
};

export const parseUniqueJsonAuthority = (source) => {
  const content = Buffer.isBuffer(source) ? strictUtf8.decode(source) : source;
  if (typeof content !== 'string') throw new TypeError('JSON source 必须是 UTF-8 文本');
  const value = JSON.parse(content);
  if (hasDuplicateJsonKeys(content)) throw new TypeError('JSON source 不允许重复 authority');
  return value;
};
