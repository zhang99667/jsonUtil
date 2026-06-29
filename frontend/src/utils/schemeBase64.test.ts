import { describe, expect, it } from 'vitest';
import {
  base64Decode,
  base64Encode,
  decodeBase64WithMeta,
  isBase64,
  type SchemeBase64DecodeOptions,
  type SchemeBase64StructuredValue,
} from './schemeBase64';

const isJsonString = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
};

const decodeNestedParamValue = (value: string): SchemeBase64StructuredValue => {
  const source = value.trim().replace(/^[?&]+/, '');
  const result: Record<string, string> = {};

  for (const pair of source.split('&')) {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) continue;
    result[safeDecodeURIComponent(pair.slice(0, equalIndex))] = safeDecodeURIComponent(pair.slice(equalIndex + 1));
  }

  return result;
};

const looksLikeStructuredPayload = (value: string): boolean => {
  const trimmed = value.trim();
  return isJsonString(trimmed) || /^[?&]?[A-Za-z_$][\w$.[\]-]*=/.test(trimmed);
};

const decodeOptions: SchemeBase64DecodeOptions = {
  isJsonString,
  looksLikeStructuredPayload,
  decodeNestedParamValue,
};

describe('schemeBase64', () => {
  it('安全处理 UTF-8 Base64 编解码', () => {
    const source = '你好，JSON';
    const encoded = base64Encode(source);

    expect(encoded).toBe('5L2g5aW977yMSlNPTg==');
    expect(base64Decode(encoded)).toBe(source);
  });

  it('识别结构化短 Base64，避免普通短文本误判', () => {
    expect(isBase64(base64Encode('{"a":1}'), decodeOptions)).toBe(true);
    expect(isBase64(base64Encode('hello'), decodeOptions)).toBe(false);
    expect(isBase64('someKey=someValue123', decodeOptions)).toBe(false);
  });

  it('解析带内部头和后缀的 Base64 JSON 片段', () => {
    const suffix = `UxM${base64Encode('&os=2&ip=127.0.0.1')}`;
    const encoded = `AFD8f${base64Encode('{"meg_name":"AI","flag":true}')}${suffix}`;
    const result = decodeBase64WithMeta(encoded, decodeOptions);

    expect(result).toMatchObject({
      reversible: false,
    });
    expect(JSON.parse(result!.decoded)).toEqual({
      meg_name: 'AI',
      flag: true,
      _base64_prefix: 'AFD8f',
      _base64_suffix: suffix,
      _base64_suffix_decode_prefix: 'UxM',
      _base64_suffix_decoded: {
        os: '2',
        ip: '127.0.0.1',
      },
    });
  });

});
