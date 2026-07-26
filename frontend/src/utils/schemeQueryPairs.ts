import {
  QUERY_PAIR_START_RE,
} from './schemeQueryPatterns';
import {
  normalizeQueryString,
  stripQueryPrefix,
} from './schemeQueryNormalization';
import { findRawJsonValueEndIndex } from './schemeQueryRawJson';

const findQueryPairDelimiterIndex = (source: string, fromIndex: number): number => {
  for (let index = fromIndex; index < source.length; index++) {
    if (!['&', ';'].includes(source[index])) continue;
    if (QUERY_PAIR_START_RE.test(source.slice(index + 1))) return index;
  }

  return -1;
};

const getPairValueScanStart = (source: string, pairStartIndex: number): number => {
  const equalIndex = source.indexOf('=', pairStartIndex);
  if (equalIndex < 0) return pairStartIndex;

  const valueStartIndex = equalIndex + 1;
  const rawJsonEndIndex = findRawJsonValueEndIndex(source, valueStartIndex);
  return rawJsonEndIndex >= 0 ? rawJsonEndIndex + 1 : valueStartIndex;
};

export const splitQueryPairs = (queryString: string): string[] => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));
  const pairs: string[] = [];
  let pairStartIndex = 0;

  while (pairStartIndex < source.length) {
    const delimiterIndex = findQueryPairDelimiterIndex(
      source,
      getPairValueScanStart(source, pairStartIndex)
    );

    if (delimiterIndex < 0) {
      pairs.push(source.slice(pairStartIndex));
      break;
    }

    pairs.push(source.slice(pairStartIndex, delimiterIndex));
    pairStartIndex = delimiterIndex + 1;
  }

  return pairs.filter(Boolean);
};

export interface DecodedQueryPair {
  rawKey: string;
  key: string;
  rawValue: string;
  value: string;
}

export function* iterateDecodedQueryPairs(
  queryString: string,
  decodeKey: (value: string) => string,
  decodeValue: (value: string) => string,
  maxPairs = Number.POSITIVE_INFINITY,
): Generator<DecodedQueryPair> {
  let yieldedPairs = 0;
  for (const pair of splitQueryPairs(queryString)) {
    if (yieldedPairs >= maxPairs) return;

    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) continue;

    const rawKey = pair.slice(0, equalIndex);
    const rawValue = pair.slice(equalIndex + 1);
    const key = decodeKey(rawKey);
    if (!key) continue;

    yield {
      rawKey,
      key,
      rawValue,
      value: decodeValue(rawValue),
    };
    yieldedPairs++;
  }
}
