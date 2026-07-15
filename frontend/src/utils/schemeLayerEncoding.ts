import { base64Encode } from './schemeBase64';
import type { SchemeLogFieldParam } from './schemeLogFields';
import type { SchemeRawParamOptions } from './schemeRawParams';
import {
  encodeQueryStringLayerContent,
  type PrefixedQueryLookup,
} from './schemeQueryLayerEncoding';
import { encodeUrlLayerContent } from './schemeUrlLayerEncoding';
import type { DecodeLayer } from './schemeTypes';

export interface SchemeLayerEncodingOptions {
  createRawParamOptions: () => SchemeRawParamOptions;
  decodeLayersForValue: (value: string) => DecodeLayer[];
  getFragmentParamSource: (hash: string) => string | null;
  parseLogFieldParamString: (source: string) => SchemeLogFieldParam | null;
  urlEncode: (value: string) => string;
}

export type SchemeLayerEncoder = (
  content: string,
  layers: DecodeLayer[],
  getPrefixedQueryString: PrefixedQueryLookup,
  options: SchemeLayerEncodingOptions
) => string;

export const encodeWithSchemeLayers: SchemeLayerEncoder = (
  content: string,
  layers: DecodeLayer[],
  getPrefixedQueryString: PrefixedQueryLookup,
  options: SchemeLayerEncodingOptions
): string => {
  let result = content;

  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];

    if (layer.reversible === false) {
      return layer.before;
    }

    switch (layer.type) {
      case 'url-encoded':
        result = options.urlEncode(result);
        break;
      case 'base64':
        result = base64Encode(result);
        break;
      case 'jwt':
        // JWT 不支持重新编码，因为需要签名；这里只保留修改后的载荷。
        break;
      case 'url':
        result = layer.before ? encodeUrlLayerContent(result, layer.before, options) : result;
        break;
      case 'query-string':
        result = encodeQueryStringLayerContent(
          result,
          layer.before,
          getPrefixedQueryString,
          options,
          encodeWithSchemeLayers
        ) || result;
        break;
      case 'json':
        result = JSON.stringify(result);
        break;
      case 'json-escaped-slash':
        result = result.replace(/\//g, '\\/');
        break;
    }
  }

  return result;
};
