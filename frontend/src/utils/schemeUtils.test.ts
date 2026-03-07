import { describe, it, expect } from 'vitest';
import {
  isUrl,
  hasUrlEncoding,
  isBase64,
  isJwt,
  isJsonString,
  detectSchemeType,
  urlDecode,
  urlEncode,
  base64Decode,
  base64Encode,
  decodeJwt,
  parseUrl,
  deepDecodeScheme,
  findSchemesInJson,
  isQueryStringFormat,
} from './schemeUtils';

// ============ 检测函数测试 ============

describe('isUrl', () => {
  it('检测标准 URL', () => {
    expect(isUrl('https://example.com')).toBe(true);
    expect(isUrl('http://localhost:3000/api')).toBe(true);
  });

  it('检测自定义 scheme URL', () => {
    expect(isUrl('myapp://path/to/page')).toBe(true);
  });

  it('非 URL 返回 false', () => {
    expect(isUrl('just a string')).toBe(false);
    expect(isUrl('')).toBe(false);
    expect(isUrl('key=value')).toBe(false);
  });
});

describe('hasUrlEncoding', () => {
  it('检测 URL 编码', () => {
    expect(hasUrlEncoding('%E4%BD%A0%E5%A5%BD')).toBe(true);
    expect(hasUrlEncoding('hello%20world')).toBe(true);
  });

  it('无编码返回 false', () => {
    expect(hasUrlEncoding('hello world')).toBe(false);
  });

  it('查询参数格式返回 false', () => {
    expect(hasUrlEncoding('key=%E4%BD%A0&name=test')).toBe(false);
  });
});

describe('isQueryStringFormat', () => {
  it('检测查询参数格式', () => {
    expect(isQueryStringFormat('key=value&name=test')).toBe(true);
  });

  it('单个键值对无 & 不是查询参数格式', () => {
    expect(isQueryStringFormat('key=value')).toBe(false);
  });

  it('URL 不是查询参数格式', () => {
    expect(isQueryStringFormat('https://example.com')).toBe(false);
  });
});

describe('isBase64', () => {
  it('有效的 Base64 字符串', () => {
    // btoa('{"key":"value"}') = 'eyJrZXkiOiJ2YWx1ZSJ9'
    const encoded = btoa('{"key":"value"}');
    expect(isBase64(encoded)).toBe(true);
  });

  it('太短的字符串返回 false', () => {
    expect(isBase64('abc')).toBe(false);
  });

  it('key=value 格式返回 false', () => {
    expect(isBase64('someKey=someValue123')).toBe(false);
  });
});

describe('isJwt', () => {
  it('检测 JWT 格式', () => {
    // 构造一个简单的 JWT 结构
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({ sub: '1234567890' })).replace(/=/g, '');
    const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const jwt = `${header}.${payload}.${signature}`;
    expect(isJwt(jwt)).toBe(true);
  });

  it('非三段结构返回 false', () => {
    expect(isJwt('not.a.jwt.token')).toBe(false);
    expect(isJwt('hello')).toBe(false);
  });
});

describe('isJsonString', () => {
  it('有效的 JSON 对象', () => {
    expect(isJsonString('{"key":"value"}')).toBe(true);
  });

  it('有效的 JSON 数组', () => {
    expect(isJsonString('[1,2,3]')).toBe(true);
  });

  it('非 JSON 返回 false', () => {
    expect(isJsonString('hello')).toBe(false);
    expect(isJsonString('{invalid}')).toBe(false);
  });
});

describe('detectSchemeType', () => {
  it('检测 JWT', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({ sub: '123' })).replace(/=/g, '');
    expect(detectSchemeType(`${header}.${payload}.signature`)).toBe('jwt');
  });

  it('检测 URL', () => {
    expect(detectSchemeType('https://example.com')).toBe('url');
  });

  it('检测 URL 编码', () => {
    expect(detectSchemeType('%E4%BD%A0%E5%A5%BD')).toBe('url-encoded');
  });

  it('普通字符串返回 plain', () => {
    expect(detectSchemeType('hello world')).toBe('plain');
  });

  it('空值返回 plain', () => {
    expect(detectSchemeType('')).toBe('plain');
  });
});

// ============ 编解码函数测试 ============

describe('urlDecode / urlEncode', () => {
  it('URL 编解码互逆', () => {
    const original = '你好世界';
    const encoded = urlEncode(original);
    expect(encoded).toBe('%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C');
    expect(urlDecode(encoded)).toBe(original);
  });

  it('无效编码返回原始值', () => {
    expect(urlDecode('%GG')).toBe('%GG');
  });
});

describe('base64Decode / base64Encode', () => {
  it('Base64 编解码互逆', () => {
    const original = 'hello world';
    const encoded = base64Encode(original);
    expect(encoded).toBe('aGVsbG8gd29ybGQ=');
    expect(base64Decode(encoded)).toBe(original);
  });
});

describe('decodeJwt', () => {
  it('解析有效的 JWT', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: '123', name: 'Test' }));
    const jwt = `${header}.${payload}.fake-signature`;

    const result = decodeJwt(jwt);
    expect(result).not.toBeNull();
    expect(result!.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(result!.payload).toEqual({ sub: '123', name: 'Test' });
    expect(result!.signature).toBe('fake-signature');
  });

  it('无效 JWT 返回 null', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull();
  });
});

describe('parseUrl', () => {
  it('解析标准 URL', () => {
    const result = parseUrl('https://example.com/path?key=value&name=test');
    expect(result).not.toBeNull();
    expect(result!.protocol).toBe('https:');
    expect(result!.host).toBe('example.com');
    expect(result!.path).toBe('/path');
    expect(result!.params).toEqual({ key: 'value', name: 'test' });
  });

  it('无参数的 URL', () => {
    const result = parseUrl('https://example.com/path');
    expect(result).not.toBeNull();
    expect(result!.params).toBeUndefined();
  });

  it('无效 URL 返回 null', () => {
    expect(parseUrl('not a url')).toBeNull();
  });
});

// ============ deepDecodeScheme 测试 ============

describe('deepDecodeScheme', () => {
  it('URL 编码内容被解码', () => {
    const encoded = encodeURIComponent('{"key":"value"}');
    const result = deepDecodeScheme(encoded);
    expect(result.isJson).toBe(true);
    expect(result.layers.length).toBeGreaterThan(0);
    expect(result.layers[0].type).toBe('url-encoded');
  });

  it('普通字符串不做解码', () => {
    const result = deepDecodeScheme('hello world');
    expect(result.decoded).toBe('hello world');
    expect(result.layers.length).toBe(0);
  });

  it('URL 被解析', () => {
    const result = deepDecodeScheme('https://example.com/path?key=value');
    expect(result.schemeInfo).toBeDefined();
    expect(result.schemeInfo!.protocol).toBe('https:');
  });
});

// ============ findSchemesInJson 测试 ============

describe('findSchemesInJson', () => {
  it('找到 JSON 中的 URL', () => {
    const json = JSON.stringify({ link: 'https://example.com', name: 'test' }, null, 2);
    const results = findSchemesInJson(json);
    expect(results.length).toBe(1);
    expect(results[0].schemeType).toBe('url');
    expect(results[0].path).toBe('$.link');
  });

  it('无 scheme 返回空数组', () => {
    const json = JSON.stringify({ name: 'test', value: 123 }, null, 2);
    expect(findSchemesInJson(json)).toEqual([]);
  });

  it('非法 JSON 返回空数组', () => {
    expect(findSchemesInJson('{invalid}')).toEqual([]);
  });
});
