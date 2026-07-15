import { describe, expect, it } from 'vitest';
import {
  isActionableSchemeUrlWithOptions,
  shouldExposeSchemeValueWithOptions,
  type SchemeExposureOptions,
  type SchemeExposureType,
} from './schemeExposure';
import { decodeQueryComponent, urlDecode } from './schemeQueryDecoding';
import { isBareHostUrl, isProtocolRelativeUrl } from './schemeUrlShapes';

const isUrlValue = (value: string): boolean => {
  const trimmed = value.trim();
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/.test(trimmed) ||
    isProtocolRelativeUrl(trimmed) ||
    isBareHostUrl(trimmed);
};

const detectSchemeType = (value: string): SchemeExposureType => {
  const trimmed = value.trim();
  if (isUrlValue(trimmed)) return 'url';
  if (/^[?#]?[A-Za-z_$][\w$.-]*(?:\[[^\]]*\])?=/.test(trimmed)) return 'query-string';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) return 'url-encoded';
  return 'plain';
};

const isJsonString = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const tryParseJsonStringPayload = (value: string): string | null => {
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return null;
  }
};

const createOptions = (): SchemeExposureOptions => ({
  base64Decode: value => value,
  decodeQueryKey: decodeQueryComponent,
  decodeQueryValue: decodeQueryComponent,
  detectSchemeType,
  getFragmentParamSource: hash => {
    const fragment = hash.replace(/^#/, '');
    const queryIndex = fragment.indexOf('?');
    if (queryIndex >= 0) return fragment.slice(queryIndex + 1);
    return fragment.includes('=') ? fragment : null;
  },
  hasUrlEncoding: value => /%[0-9A-Fa-f]{2}/.test(value),
  isBase64: () => false,
  isDecodableFragmentParamString: value => value.startsWith('#') && value.includes('='),
  isDecodablePrefixedQueryString: value => value.includes(': cmd='),
  isDecodableQueryString: value => /^[?#]?(cmd|params|panel_cmd)=/.test(value),
  isJsonString,
  isJwt: () => false,
  isRuntimePlaceholder: value => /^__.+__$/.test(value),
  isUrl: isUrlValue,
  looksLikeStructuredPayload: value => (
    isUrlValue(value) ||
    /^[?#]?[A-Za-z_$][\w$.-]*(?:\[[^\]]*\])?=/.test(value) ||
    value.trim().startsWith('{')
  ),
  tryParseJsonStringPayload,
  urlDecode,
});

describe('schemeExposure', () => {
  it('普通 HTTP(S) URL 不作为业务 Scheme 暴露', () => {
    const options = createOptions();

    expect(isActionableSchemeUrlWithOptions('https://example.com/docs?a=1&b=2', options)).toBe(false);
    expect(shouldExposeSchemeValueWithOptions('https://example.com/docs?a=1&b=2', options)).toBe(false);
  });

  it('非 HTTP(S) URL 仍作为业务 Scheme 暴露', () => {
    expect(isActionableSchemeUrlWithOptions(
      'sampleapp://v1/open?url=https%3A%2F%2Fexample.com',
      createOptions()
    )).toBe(true);
  });

  it('HTTP(S) URL 内的已知 CMD 参数会作为嵌套 Scheme 暴露', () => {
    const nestedPayload = encodeURIComponent(JSON.stringify({ nid: 123 }));
    const source = `https://example.com/landing?cmd=${nestedPayload}&from=feed`;

    expect(isActionableSchemeUrlWithOptions(source, createOptions())).toBe(true);
    expect(shouldExposeSchemeValueWithOptions(source, createOptions())).toBe(true);
  });

  it('HTTP(S) hash route 内的已知 CMD 参数会作为嵌套 Scheme 暴露', () => {
    const nestedPayload = encodeURIComponent(JSON.stringify({ nid: 123 }));

    expect(isActionableSchemeUrlWithOptions(
      `https://example.com/page#/detail?panel_cmd=${nestedPayload}`,
      createOptions()
    )).toBe(true);
  });

  it('未知参数即使包含 JSON 也不触发嵌套 Scheme 暴露', () => {
    const nestedPayload = encodeURIComponent(JSON.stringify({ nid: 123 }));

    expect(isActionableSchemeUrlWithOptions(
      `https://example.com/landing?foo=${nestedPayload}`,
      createOptions()
    )).toBe(false);
  });
});
