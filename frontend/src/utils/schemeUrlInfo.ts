import { parseFlatQueryParams } from './schemeFlatQueryParams';
import type { SchemeRawParamOptions } from './schemeRawParams';
import {
  createUrl,
  isBareHostUrl,
  isProtocolRelativeUrl,
  normalizeJsonUrlEscapes,
} from './schemeUrlShapes';

export interface SchemeUrlInfo {
  protocol: string;
  host?: string;
  path?: string;
  hash?: string;
  params?: Record<string, string | string[]>;
  hashParams?: Record<string, string | string[]>;
}

interface ParseSchemeUrlInfoOptions {
  rawParamOptions: SchemeRawParamOptions;
  getFragmentParamSource: (hash: string) => string | null;
}

export const parseSchemeUrlInfo = (
  urlString: string,
  options: ParseSchemeUrlInfoOptions
): SchemeUrlInfo | null => {
  try {
    const normalizedUrlString = normalizeJsonUrlEscapes(urlString.trim());
    const url = createUrl(normalizedUrlString);
    const isBareUrl = isBareHostUrl(normalizedUrlString);
    const isProtocolRelative = isProtocolRelativeUrl(normalizedUrlString);
    const params = parseFlatQueryParams(url.search, options.rawParamOptions);
    const fragmentParamSource = options.getFragmentParamSource(url.hash);
    const hashParams = fragmentParamSource
      ? parseFlatQueryParams(fragmentParamSource, options.rawParamOptions)
      : undefined;

    return {
      protocol: isBareUrl ? '无协议' : isProtocolRelative ? '//' : url.protocol,
      host: url.host || undefined,
      path: url.pathname || undefined,
      hash: url.hash ? url.hash.slice(1) : undefined,
      params,
      hashParams,
    };
  } catch {
    return null;
  }
};
