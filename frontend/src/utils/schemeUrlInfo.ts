import { parseFlatQueryParams } from './schemeFlatQueryParams';
import type { SchemeRawParamOptions } from './schemeRawParams';
import {
  createSchemeUrlContext,
  type SchemeUrlContext,
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

export const parseSchemeUrlInfoFromContext = (
  context: SchemeUrlContext,
  options: ParseSchemeUrlInfoOptions,
): SchemeUrlInfo => {
  const params = parseFlatQueryParams(context.url.search, options.rawParamOptions);
  const fragmentParamSource = options.getFragmentParamSource(context.url.hash);
  const hashParams = fragmentParamSource
    ? parseFlatQueryParams(fragmentParamSource, options.rawParamOptions)
    : undefined;

  return {
    protocol: context.isBareHost
      ? '无协议'
      : context.isProtocolRelative
        ? '//'
        : context.url.protocol,
    host: context.url.host || undefined,
    path: context.url.pathname || undefined,
    hash: context.url.hash ? context.url.hash.slice(1) : undefined,
    params,
    hashParams,
  };
};

export const parseSchemeUrlInfo = (
  urlString: string,
  options: ParseSchemeUrlInfoOptions,
): SchemeUrlInfo | null => {
  try {
    return parseSchemeUrlInfoFromContext(createSchemeUrlContext(urlString), options);
  } catch {
    return null;
  }
};
