import type { QueryKeySegment } from './schemeStructuredQueryTypes';

export const parseStructuredQueryKey = (key: string): QueryKeySegment[] => {
  const segments: QueryKeySegment[] = [];
  let buffer = '';

  const pushBuffer = () => {
    if (buffer) {
      segments.push(buffer);
      buffer = '';
    }
  };

  for (let i = 0; i < key.length; i++) {
    const char = key[i];

    if (char === '.') {
      pushBuffer();
      continue;
    }

    if (char === '[') {
      const endIndex = key.indexOf(']', i + 1);
      if (endIndex === -1) {
        buffer += char;
        continue;
      }

      pushBuffer();
      const content = key.slice(i + 1, endIndex);
      if (content === '') {
        segments.push(null);
      } else if (/^\d+$/.test(content)) {
        segments.push(Number(content));
      } else {
        segments.push(content);
      }
      i = endIndex;
      continue;
    }

    buffer += char;
  }

  pushBuffer();
  return segments;
};
