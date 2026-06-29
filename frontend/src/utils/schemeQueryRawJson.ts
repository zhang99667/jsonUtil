export const findRawJsonValueEndIndex = (source: string, valueStartIndex: number): number => {
  let index = valueStartIndex;
  while (index < source.length && /\s/.test(source[index])) index++;
  if (!['{', '['].includes(source[index])) return -1;

  const stack: string[] = [];
  let stringQuote: '"' | "'" | null = null;
  let escaped = false;

  for (; index < source.length; index++) {
    const char = source[index];

    if (stringQuote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === stringQuote) {
        stringQuote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      stringQuote = char;
      continue;
    }

    if (char === '{') {
      stack.push('}');
      continue;
    }

    if (char === '[') {
      stack.push(']');
      continue;
    }

    if (stack.length > 0 && char === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return index;
    }
  }

  return -1;
};
