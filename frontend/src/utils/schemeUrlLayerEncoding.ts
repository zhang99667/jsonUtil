import { replaceHashParams } from './schemeHashEncoding';
import {
  buildQueryStringFromObject,
  isPlainObject,
} from './schemeStructuredQuery';
import {
  createUrl,
  stringifyUrlForOriginalShape,
} from './schemeUrlShapes';

export interface SchemeUrlLayerEncodingOptions {
  getFragmentParamSource: (hash: string) => string | null;
}

const parseEditedQueryObject = (content: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(content);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const encodeUrlLayerContent = (
  content: string,
  originalUrl: string,
  options: SchemeUrlLayerEncodingOptions
): string => {
  const editedParams = parseEditedQueryObject(content);
  if (!editedParams) return content;

  try {
    const url = createUrl(originalUrl);
    const hasQueryParams = Boolean(url.search);
    const hashParamSource = options.getFragmentParamSource(url.hash) || '';
    const hasHashParams = Boolean(hashParamSource);

    if (hasQueryParams && hasHashParams) {
      // query 与 hash 同时存在时，解析结果用 _hash 承载 hash route 参数。
      const { _hash: hashParams, ...queryParams } = editedParams;
      url.search = buildQueryStringFromObject(queryParams, url.search);
      url.hash = replaceHashParams(
        url.hash,
        buildQueryStringFromObject(isPlainObject(hashParams) ? hashParams : {}, hashParamSource)
      );
      return stringifyUrlForOriginalShape(url, originalUrl);
    }

    if (hasHashParams) {
      url.hash = replaceHashParams(url.hash, buildQueryStringFromObject(editedParams, hashParamSource));
      return stringifyUrlForOriginalShape(url, originalUrl);
    }

    url.search = buildQueryStringFromObject(editedParams, url.search);
    return stringifyUrlForOriginalShape(url, originalUrl);
  } catch {
    return content;
  }
};
