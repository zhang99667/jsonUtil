import { describe, expect, it } from 'vitest';
import { base64Encode } from './schemeBase64Codec';
import { parsePrefixedBase64Suffix } from './schemeBase64SuffixQuery';
import type {
  SchemeBase64DecodeOptions,
  SchemeBase64StructuredValue,
} from './schemeBase64Types';

const decodeNestedParamValue = (value: string): SchemeBase64StructuredValue => {
  const source = value.trim().replace(/^[?&]+/, '');
  const result: Record<string, string> = {};

  for (const pair of source.split('&')) {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) continue;
    result[pair.slice(0, equalIndex)] = decodeURIComponent(pair.slice(equalIndex + 1));
  }

  return result;
};

const decodeOptions: SchemeBase64DecodeOptions = {
  looksLikeStructuredPayload: value => /^[?&]?[A-Za-z_$][\w$.[\]-]*=/.test(value.trim()),
  decodeNestedParamValue,
};

describe('schemeBase64SuffixQuery', () => {
  it('跳过内部头后解析 Base64 query 后缀', () => {
    expect(parsePrefixedBase64Suffix(`UxM${base64Encode('&os=2&ip=127.0.0.1')}`, decodeOptions)).toEqual({
      prefix: 'UxM',
      value: {
        os: '2',
        ip: '127.0.0.1',
      },
    });
  });

  it('后缀混入 JSON 残片时只保留 query 参数前缀', () => {
    const suffixPayload = '&os=2&akey=NzYzNDEwMjM%3D","fmid":"1174813457063265406"';

    expect(parsePrefixedBase64Suffix(`UxM${base64Encode(suffixPayload)}`, decodeOptions)).toEqual({
      prefix: 'UxM',
      value: {
        os: '2',
        akey: 'NzYzNDEwMjM=',
      },
    });
  });
});
