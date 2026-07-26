import { describe, expect, it } from 'vitest';
import {
  hasScheme,
  hasUrlEncoding as facadeHasUrlEncoding,
  isJwt as facadeIsJwt,
  isQueryStringFormat,
  isUrl as facadeIsUrl,
  urlEncode as facadeUrlEncode,
} from './schemeUtils';
import { isJwt } from './schemeJwt';
import {
  hasUrlEncoding,
  isSchemeQueryStringFormat,
} from './schemeQueryDetection';
import { urlEncode } from './schemeQueryDecoding';
import { isUrl } from './schemeUrlShapes';

describe('schemeUtils 兼容门面', () => {
  it('纯检测与编码函数直接复用专职模块', () => {
    expect(facadeIsUrl).toBe(isUrl);
    expect(isQueryStringFormat).toBe(isSchemeQueryStringFormat);
    expect(facadeHasUrlEncoding).toBe(hasUrlEncoding);
    expect(facadeIsJwt).toBe(isJwt);
    expect(facadeUrlEncode).toBe(urlEncode);
  });

  it('保留业务 Scheme 暴露入口', () => {
    expect(hasScheme('sampleapp://v1/browser/open?from=feed')).toBe(true);
    expect(hasScheme('https://example.com/docs?from=help')).toBe(false);
  });
});
