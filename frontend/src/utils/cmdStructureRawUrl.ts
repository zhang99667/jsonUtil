import { URL_LIKE_RE } from './cmdStructureRawSourceGuards';

export interface RawCmdUrlParts {
  schema: string;
  query: string;
}

const getFallbackRawCmdUrlQuery = (source: string): string => {
  const queryIndex = source.indexOf('?');
  if (queryIndex < 0) return '';

  const hashIndex = source.indexOf('#');
  const endIndex = hashIndex >= 0 ? hashIndex : source.length;
  return source.slice(queryIndex + 1, endIndex);
};

export const parseRawCmdUrlParts = (source: string): RawCmdUrlParts | null => {
  if (!URL_LIKE_RE.test(source)) return null;

  try {
    const url = new URL(source);
    return {
      schema: `${url.protocol}//${url.host}${url.pathname}`,
      query: url.search,
    };
  } catch {
    const schema = source.split(/[?#]/)[0];
    if (!schema) return null;

    return {
      schema,
      query: getFallbackRawCmdUrlQuery(source),
    };
  }
};
