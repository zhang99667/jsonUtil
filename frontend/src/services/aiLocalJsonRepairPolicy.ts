import { AI_REMOTE_REPAIR_MAX_INPUT_LENGTH } from '../utils/aiRepairRequestPolicy';

const SUPPORTED_JSON_FENCE_PATTERN = /^```(?:json)?[ \t]*\r?\n/i;

export const canRepairJsonLocally = (source: string): boolean => {
  if (source.length > AI_REMOTE_REPAIR_MAX_INPUT_LENGTH) return false;

  const tokenIndex = skipJsonTrivia(source, 0);
  const remaining = source.slice(tokenIndex);
  if (!remaining.startsWith('{')
    && !remaining.startsWith('[')
    && !SUPPORTED_JSON_FENCE_PATTERN.test(remaining)) {
    return false;
  }

  return !hasAmbiguousMissingValue(source);
};

const hasAmbiguousMissingValue = (source: string): boolean => {
  let quote = '';
  let escaped = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === '\'') {
      quote = char;
      continue;
    }

    const nextTokenIndex = skipJsonTrivia(source, index);
    if (nextTokenIndex !== index) {
      index = nextTokenIndex - 1;
      continue;
    }

    if (char === ':' && isMissingPropertyValue(source, index + 1)) return true;
    if ((char === '[' || char === ',') && source[skipJsonTrivia(source, index + 1)] === ',') {
      return true;
    }
  }

  return false;
};

const isMissingPropertyValue = (source: string, startIndex: number): boolean => {
  const valueIndex = skipJsonTrivia(source, startIndex);
  const valueStart = source[valueIndex];
  // 通用修复器可能为缺失值臆造 null 或吞并下一属性，这类输入继续交给既有安全策略。
  return !valueStart
    || ',}]'.includes(valueStart)
    || looksLikePropertyEntry(source, valueIndex);
};

const looksLikePropertyEntry = (source: string, startIndex: number): boolean => {
  const keyEnd = readPotentialPropertyKeyEnd(source, startIndex);
  return keyEnd > startIndex && source[skipJsonTrivia(source, keyEnd)] === ':';
};

const readPotentialPropertyKeyEnd = (source: string, startIndex: number): number => {
  const quote = source[startIndex];
  if (quote === '"' || quote === '\'') {
    let escaped = false;
    for (let index = startIndex + 1; index < source.length; index++) {
      const char = source[index];
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        return index + 1;
      }
    }
    return startIndex;
  }

  return startIndex + (source.slice(startIndex).match(/^[A-Za-z_$][\w$]*/)?.[0].length ?? 0);
};

const skipJsonTrivia = (source: string, startIndex: number): number => {
  let index = startIndex;
  while (index < source.length) {
    if (/\s/.test(source[index])) {
      index += 1;
    } else if (source.startsWith('//', index)) {
      const lineEnd = source.indexOf('\n', index + 2);
      index = lineEnd < 0 ? source.length : lineEnd + 1;
    } else if (source.startsWith('/*', index)) {
      const commentEnd = source.indexOf('*/', index + 2);
      index = commentEnd < 0 ? source.length : commentEnd + 2;
    } else {
      break;
    }
  }
  return index;
};
