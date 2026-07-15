import { describe, expect, it } from 'vitest';
import {
  isStructuredActionableParamValue,
  type SchemeStructuredActionableParamValueOptions,
} from './schemeStructuredActionableParamValue';

const createOptions = (
  overrides: Partial<SchemeStructuredActionableParamValueOptions> = {}
): SchemeStructuredActionableParamValueOptions => ({
  base64Decode: value => value,
  hasUrlEncoding: value => /%[0-9A-Fa-f]{2}/.test(value),
  isActionableUrl: value => value.startsWith('sampleapp://'),
  isBase64: () => false,
  isDecodableFragmentParamString: value => value.startsWith('#') && value.includes('cmd='),
  isDecodablePrefixedQueryString: value => value.includes(': cmd='),
  isDecodableQueryString: value => /^(cmd|params|panel_cmd)=/.test(value),
  isJsonString: value => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  isJwt: () => false,
  isRuntimePlaceholder: value => /^__.+__$/.test(value),
  isUrl: value => /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/.test(value),
  looksLikeStructuredPayload: value => (
    value.startsWith('sampleapp://') ||
    value.startsWith('cmd=') ||
    value.startsWith('{')
  ),
  maxDepth: 5,
  shouldExposeNormalizedValue: value => (
    value.startsWith('sampleapp://') ||
    value.startsWith('cmd=')
  ),
  tryParseJsonStringPayload: value => {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : null;
    } catch {
      return null;
    }
  },
  urlDecode: value => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  },
  ...overrides,
});

describe('schemeStructuredActionableParamValue', () => {
  it('识别 JSON 字符串包裹的可展开 Scheme', () => {
    expect(isStructuredActionableParamValue(
      JSON.stringify('sampleapp://v1/open?cmd=%7B%7D'),
      0,
      createOptions()
    )).toBe(true);
  });

  it('识别 URL 编码后的可展开 query 参数', () => {
    expect(isStructuredActionableParamValue(
      encodeURIComponent('cmd=%7B%22nid%22%3A123%7D'),
      0,
      createOptions()
    )).toBe(true);
  });

  it('普通文本和超出深度的值不触发暴露', () => {
    const options = createOptions();

    expect(isStructuredActionableParamValue('plain text', 0, options)).toBe(false);
    expect(isStructuredActionableParamValue('cmd=%7B%7D', 6, options)).toBe(false);
  });
});
