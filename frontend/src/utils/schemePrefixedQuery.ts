import { QUERY_KEY_PATTERN } from './schemeQuerySyntax';

export interface SchemePrefixedQueryString {
  prefix: string;
  queryString: string;
}

const PREFIXED_QUERY_BOUNDARY_PATTERN = '[\\s\\[\\]{}(),|:：>]';
const PREFIXED_QUERY_STRING_RE = new RegExp(`^(.*?${PREFIXED_QUERY_BOUNDARY_PATTERN})([?&]*${QUERY_KEY_PATTERN}=.+)$`);

export const findSchemePrefixedQueryString = (source: string): SchemePrefixedQueryString | null => {
  const trimmed = source.trim();
  if (/[\r\n]/.test(trimmed)) return null;

  const match = trimmed.match(PREFIXED_QUERY_STRING_RE);
  if (!match) return null;

  return {
    prefix: match[1],
    queryString: match[2],
  };
};
