import { splitQueryPairs } from './schemeQuerySyntax';
import { parseStructuredQueryKey } from './schemeStructuredQueryKeys';

export interface StructuredQueryRootStyle {
  objectStyle: 'dot' | 'bracket';
  useEmptyArray: boolean;
}

const decodeQueryComponent = (str: string): string => {
  const normalized = str.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
};

export const getStructuredQueryRootStyles = (
  queryString: string
): Map<string, StructuredQueryRootStyle> => {
  const styles = new Map<string, StructuredQueryRootStyle>();

  splitQueryPairs(queryString).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = decodeQueryComponent(pair.slice(0, equalIndex));
    if (!key.includes('.') && !key.includes('[')) return;

    const segments = parseStructuredQueryKey(key);
    const root = segments[0];
    if (typeof root !== 'string') return;

    const existing = styles.get(root);
    const hasDotStyle = key.includes('.');
    styles.set(root, {
      objectStyle: existing?.objectStyle === 'dot' || hasDotStyle ? 'dot' : 'bracket',
      useEmptyArray: Boolean(existing?.useEmptyArray || key.includes('[]')),
    });
  });

  return styles;
};
