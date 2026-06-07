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
  encodeWithLayers,
  isQueryStringFormat,
  isDecodableQueryString,
} from './schemeUtils';
import { findSchemesInJson } from './schemeScanner';

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

describe('isDecodableQueryString', () => {
  it('检测多参数 CMD 参数串', () => {
    expect(isDecodableQueryString('url=https%3A%2F%2Fexample.com&from=test')).toBe(true);
  });

  it('检测分号分隔的 CMD 参数串', () => {
    expect(isDecodableQueryString('cmd=%7B%22a%22%3A1%7D;from=test')).toBe(true);
  });

  it('检测常见单参数 CMD 字段', () => {
    expect(isDecodableQueryString('url=https%3A%2F%2Fexample.com')).toBe(true);
  });

  it('检测 camelCase 的单参数 CMD 字段', () => {
    expect(isDecodableQueryString('actionCommand=%7B%22a%22%3A1%7D')).toBe(true);
  });

  it('普通单键值对不误判', () => {
    expect(isDecodableQueryString('name=test')).toBe(false);
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

  it('版本号不误判为 JWT', () => {
    expect(isJwt('1.2.3')).toBe(false);
    expect(detectSchemeType('1.2.3')).toBe('plain');
  });

  it('三段普通字符串不误判为 JWT', () => {
    expect(isJwt('foo.bar.baz')).toBe(false);
    expect(detectSchemeType('foo.bar.baz')).toBe('plain');
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

  it('Base64 支持中文 UTF-8 内容', () => {
    const original = '你好，世界';
    const encoded = base64Encode(original);
    expect(encoded).toBe('5L2g5aW977yM5LiW55WM');
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

  it('header 或 payload 不是 JSON 对象时返回 null', () => {
    const header = btoa(JSON.stringify(123)).replace(/=/g, '');
    const payload = btoa(JSON.stringify({ sub: '123' })).replace(/=/g, '');
    expect(decodeJwt(`${header}.${payload}.signature`)).toBeNull();
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

  it('解析 URL hash route 中的参数', () => {
    const result = parseUrl('https://example.com/app#/detail?cmd=%7B%22a%22%3A1%7D&from=hash');
    expect(result).not.toBeNull();
    expect(result!.hash).toBe('/detail?cmd=%7B%22a%22%3A1%7D&from=hash');
    expect(result!.hashParams).toEqual({ cmd: '{"a":1}', from: 'hash' });
  });

  it('查询参数中的加号按表单编码还原为空格', () => {
    const result = parseUrl('https://example.com/search?word=json+schema&redirect=https%3A%2F%2Fexample.com%2Fa%2Bb');
    expect(result).not.toBeNull();
    expect(result!.params).toEqual({
      word: 'json schema',
      redirect: 'https://example.com/a+b',
    });
  });

  it('解析 HTML 转义的查询参数分隔符', () => {
    const result = parseUrl('https://example.com/path?cmd=%7B%22a%22%3A1%7D&amp;from=html');
    expect(result).not.toBeNull();
    expect(result!.params).toEqual({
      cmd: '{"a":1}',
      from: 'html',
    });
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

  it('URL 参数中的 JSON 被递归解析为对象', () => {
    const payload = encodeURIComponent(JSON.stringify({ name: '张三', page: 1 }));
    const result = deepDecodeScheme(`baiduboxapp://v1/easybrowse/open?params=${payload}&source=test`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      params: { name: '张三', page: 1 },
      source: 'test',
    });
    expect(result.layers[0].description).toBe('URL 参数递归解析');
  });

  it('URL 参数中的二级 URL 被继续解析', () => {
    const nestedUrl = encodeURIComponent('https://m.baidu.com/s?word=%25E4%25BD%25A0%25E5%25A5%25BD');
    const result = deepDecodeScheme(`baiduboxapp://v1/browser/open?url=${nestedUrl}`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      url: {
        word: '你好',
      },
    });
  });

  it('CMD 参数和嵌套 URL 中的加号按查询参数语义解析为空格', () => {
    const nestedUrl = 'https%3A%2F%2Fexample.com%2Fsearch%3Fword%3Djson%2Bschema';
    const result = deepDecodeScheme(`title=json+schema&url=${nestedUrl}`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      title: 'json schema',
      url: {
        word: 'json schema',
      },
    });
  });

  it('CMD 参数串被解析并递归展开参数值', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
    const result = deepDecodeScheme(`cmd=${payload}&url=${encodeURIComponent('https://example.com/path?from=box')}`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      cmd: { nid: 123, title: '标题' },
      url: { from: 'box' },
    });
    expect(result.layers[0].type).toBe('query-string');
  });

  it('分号分隔的 CMD 参数串被解析', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123 }));
    const result = deepDecodeScheme(`cmd=${payload};url=${encodeURIComponent('https://example.com/path?from=box')}`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      cmd: { nid: 123 },
      url: { from: 'box' },
    });
  });

  it('HTML 转义分隔符的 CMD 参数串被解析', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123 }));
    const result = deepDecodeScheme(`cmd=${payload}&#38;from=html`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      cmd: { nid: 123 },
      from: 'html',
    });
  });

  it('常见 camelCase command 字段可作为单参数解析', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
    const result = deepDecodeScheme(`actionCommand=${payload}`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      actionCommand: { nid: 123, title: '标题' },
    });
  });

  it('参数内短 Base64 JSON 被递归解析', () => {
    const result = deepDecodeScheme(`cmd=${base64Encode('{"a":1}')}`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      cmd: { a: 1 },
    });
  });

  it('参数内 JSON 字符串字面量被递归展开', () => {
    const payload = encodeURIComponent(JSON.stringify(JSON.stringify({
      title: '标题',
      url: 'https://example.com/path?from=box',
    })));
    const result = deepDecodeScheme(`cmd=${payload}`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      cmd: {
        title: '标题',
        url: { from: 'box' },
      },
    });
  });

  it('URL hash route 参数被递归解析', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
    const result = deepDecodeScheme(`baiduboxapp://v1/browser/open#/detail?cmd=${payload}&from=hash`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      cmd: { nid: 123, title: '标题' },
      from: 'hash',
    });
  });

  it('URL query 与 hash route 参数同时保留', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123 }));
    const result = deepDecodeScheme(`https://example.com/page?url=${encodeURIComponent('https://m.baidu.com/s?word=%E4%BD%A0')}#/detail?cmd=${payload}`);
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      url: { word: '你' },
      _hash: {
        cmd: { nid: 123 },
      },
    });
  });

  it('CMD 参数串支持点号和空括号展开对象与数组', () => {
    const result = deepDecodeScheme('user.name=%E5%BC%A0%E4%B8%89&user.city=beijing&tags[]=feed&tags[]=news');
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      user: {
        name: '张三',
        city: 'beijing',
      },
      tags: ['feed', 'news'],
    });
  });

  it('CMD 参数串支持带索引数组对象', () => {
    const result = deepDecodeScheme('items[0].id=1&items[0].title=feed&items[1].id=2');
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      items: [
        { id: '1', title: 'feed' },
        { id: '2' },
      ],
    });
  });

  it('URL 参数名支持括号对象展开', () => {
    const result = deepDecodeScheme('baiduboxapp://v1/open?ext%5Bscene%5D=feed&ext%5Bsource%5D=box');
    const parsed = JSON.parse(result.decoded);
    expect(parsed).toEqual({
      ext: {
        scene: 'feed',
        source: 'box',
      },
    });
  });
});

// ============ encodeWithLayers 测试 ============

describe('encodeWithLayers', () => {
  it('完整 URL Scheme 编辑后重建 query 参数', () => {
    const original = 'baiduboxapp://v1/browser/open?cmd=%7B%22a%22%3A1%7D&from=feed';
    const decoded = deepDecodeScheme(original);
    const edited = JSON.stringify({
      cmd: { a: 2 },
      from: 'card',
    }, null, 2);

    expect(encodeWithLayers(edited, decoded.layers))
      .toBe('baiduboxapp://v1/browser/open?cmd=%7B%22a%22%3A2%7D&from=card');
  });

  it('hash route 参数编辑后保留 route 前缀', () => {
    const original = 'https://example.com/app#/detail?cmd=%7B%22a%22%3A1%7D&from=hash';
    const decoded = deepDecodeScheme(original);
    const edited = JSON.stringify({
      cmd: { a: 3 },
      from: 'panel',
    }, null, 2);

    expect(encodeWithLayers(edited, decoded.layers))
      .toBe('https://example.com/app#/detail?cmd=%7B%22a%22%3A3%7D&from=panel');
  });

  it('URL query 与 hash route 同时存在时按 _hash 分区重建', () => {
    const original = 'https://example.com/page?from=feed#/detail?cmd=%7B%22a%22%3A1%7D&tab=old';
    const decoded = deepDecodeScheme(original);
    const edited = JSON.stringify({
      from: 'card',
      _hash: {
        cmd: { a: 4 },
        tab: 'new',
      },
    }, null, 2);

    expect(encodeWithLayers(edited, decoded.layers))
      .toBe('https://example.com/page?from=card#/detail?cmd=%7B%22a%22%3A4%7D&tab=new');
  });

  it('独立 CMD 参数串编辑后支持数组恢复为重复参数', () => {
    const decoded = deepDecodeScheme('tag=feed&tag=news');
    const edited = JSON.stringify({
      tag: ['feed', 'sports'],
    }, null, 2);

    expect(encodeWithLayers(edited, decoded.layers)).toBe('tag=feed&tag=sports');
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

  it('找到 JSON 中的 CMD 参数串', () => {
    const json = JSON.stringify({
      action_cmd: `cmd=${encodeURIComponent(JSON.stringify({ a: 1 }))}&from=test`,
    }, null, 2);
    const results = findSchemesInJson(json);
    expect(results.length).toBe(1);
    expect(results[0].schemeType).toBe('query-string');
    expect(results[0].path).toBe('$.action_cmd');
  });

  it('数组中的 Scheme 使用真实值行号定位', () => {
    const json = JSON.stringify({
      items: [
        { name: 'first' },
        { url: 'https://example.com/path?from=list' },
      ],
    }, null, 2);

    const results = findSchemesInJson(json);
    expect(results.length).toBe(1);
    expect(results[0].path).toBe('$.items[1].url');
    expect(results[0].line).toBe(7);
  });

  it('包含斜杠的 key 也能通过 JSON Pointer 定位', () => {
    const json = JSON.stringify({
      'a/b': {
        schema: 'baiduboxapp://v1/browser/open?from=key',
      },
    }, null, 2);

    const results = findSchemesInJson(json);
    expect(results.length).toBe(1);
    expect(results[0].path).toBe('$.a/b.schema');
    expect(results[0].line).toBe(3);
  });

  it('非法 JSON 返回空数组', () => {
    expect(findSchemesInJson('{invalid}')).toEqual([]);
  });
});
