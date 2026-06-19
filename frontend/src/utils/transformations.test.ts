import { describe, it, expect } from 'vitest';
import { TransformMode } from '../types';
import {
  validateJson,
  detectLanguage,
  performTransform,
  performInverseTransform,
  performTransformAsync,
  deepParseWithContext,
  inverseWithContext,
  deepMergeTemplate,
  applyTemplate,
  getStandaloneDeepFormatInputKind,
  isStandaloneDeepFormatInput,
} from './transformations';
import { base64Encode } from './schemeUtils';

// ============ validateJson 测试 ============

describe('validateJson', () => {
  it('空字符串返回有效', () => {
    expect(validateJson('')).toEqual({ isValid: true });
  });

  it('空白字符串返回有效', () => {
    expect(validateJson('   ')).toEqual({ isValid: true });
  });

  it('有效的 JSON 对象', () => {
    expect(validateJson('{"key":"value"}')).toEqual({ isValid: true });
  });

  it('有效的 JSON 数组', () => {
    expect(validateJson('[1, 2, 3]')).toEqual({ isValid: true });
  });

  it('有效的 JSON Lines', () => {
    expect(validateJson('{"a":1}\n{"b":[2]}')).toEqual({ isValid: true });
  });

  it('常见 JS 赋值包装中的 JSON 也视为有效', () => {
    expect(validateJson('const response = {"code":0,"data":{"ok":true}};')).toEqual({ isValid: true });
  });

  it('JSONP 回调包装中的 JSON 也视为有效', () => {
    expect(validateJson('callback({"code":0,"items":[1,2]});')).toEqual({ isValid: true });
  });

  it('Markdown JSON 代码块也视为有效', () => {
    expect(validateJson('```json\n{"code":0}\n```')).toEqual({ isValid: true });
  });

  it('XSSI 前缀包装中的 JSON 也视为有效', () => {
    expect(validateJson('while(1);{"code":0}')).toEqual({ isValid: true });
    expect(validateJson('for(;;);{"code":0}')).toEqual({ isValid: true });
    expect(validateJson(')]}\',\n{"code":0}')).toEqual({ isValid: true });
  });

  it('普通说明文字中夹带 JSON 片段不会被误判为有效', () => {
    const result = validateJson('response 示例: {"code":0}');

    expect(result.isValid).toBe(false);
  });

  it('无效的 JSON 返回错误信息', () => {
    const result = validateJson('{invalid}');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('无效的 JSON Lines 返回错误信息', () => {
    const result = validateJson('{"a":1}\n{invalid}');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('无效的 JSON Lines 返回行号错误信息', () => {
    const result = validateJson('{"a":1}\n{"b":}\n{"c":3}');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('JSON Lines 第 2 行解析错误');
  });

  it('JSON 基本类型也有效', () => {
    expect(validateJson('"hello"')).toEqual({ isValid: true });
    expect(validateJson('123')).toEqual({ isValid: true });
    expect(validateJson('true')).toEqual({ isValid: true });
    expect(validateJson('null')).toEqual({ isValid: true });
  });
});

// ============ detectLanguage 测试 ============

describe('detectLanguage', () => {
  it('空输入返回 plaintext', () => {
    expect(detectLanguage('')).toBe('plaintext');
    expect(detectLanguage('   ')).toBe('plaintext');
  });

  it('JSON 对象检测', () => {
    expect(detectLanguage('{"key": "value"}')).toBe('json');
  });

  it('JSON 数组检测', () => {
    expect(detectLanguage('[1, 2, 3]')).toBe('json');
  });

  it('JSON 对象带大量尾部空白时仍按前缀识别', () => {
    expect(detectLanguage(`{"key":"value"}${' '.repeat(300_000)}`)).toBe('json');
  });

  it('HTML 检测', () => {
    expect(detectLanguage('<!DOCTYPE html>')).toBe('html');
    expect(detectLanguage('<html><body></body></html>')).toBe('html');
  });

  it('XML 检测', () => {
    expect(detectLanguage('<root><item>test</item></root>')).toBe('xml');
  });

  it('SQL 检测', () => {
    expect(detectLanguage('SELECT * FROM users')).toBe('sql');
    expect(detectLanguage('INSERT INTO table VALUES (1)')).toBe('sql');
  });

  it('JSON 基本类型', () => {
    expect(detectLanguage('true')).toBe('json');
    expect(detectLanguage('false')).toBe('json');
    expect(detectLanguage('null')).toBe('json');
    expect(detectLanguage('42')).toBe('json');
    expect(detectLanguage('"hello"')).toBe('json');
  });
});

// ============ performTransform 测试 ============

describe('performTransform', () => {
  it('空输入返回空字符串', () => {
    expect(performTransform('', TransformMode.FORMAT)).toBe('');
  });

  describe('FORMAT 模式', () => {
    it('格式化紧凑 JSON', () => {
      const input = '{"name":"test","value":123}';
      const result = performTransform(input, TransformMode.FORMAT);
      expect(result).toBe(JSON.stringify({ name: 'test', value: 123 }, null, 2));
    });

    it('格式化 JS 赋值包装中的 JSON', () => {
      const input = 'const response = {"code":0,"data":{"ok":true}};';
      const result = performTransform(input, TransformMode.FORMAT);

      expect(result).toBe(JSON.stringify({
        code: 0,
        data: { ok: true },
      }, null, 2));
    });

    it('格式化 JSONP 回调包装中的 JSON', () => {
      const input = 'callback({"code":0,"items":[1,2]});';
      const result = performTransform(input, TransformMode.FORMAT);

      expect(result).toBe(JSON.stringify({
        code: 0,
        items: [1, 2],
      }, null, 2));
    });

    it('格式化 Markdown JSON 代码块', () => {
      const input = '```json\n{"code":0,"message":"ok"}\n```';
      const result = performTransform(input, TransformMode.FORMAT);

      expect(result).toBe(JSON.stringify({
        code: 0,
        message: 'ok',
      }, null, 2));
    });

    it('格式化 XSSI 前缀包装中的 JSON', () => {
      const cases = [
        'while(1);{"code":0,"message":"ok"}',
        'for(;;);{"code":0,"message":"ok"}',
        ')]}\',\n{"code":0,"message":"ok"}',
      ];

      cases.forEach(input => {
        expect(performTransform(input, TransformMode.FORMAT)).toBe(JSON.stringify({
          code: 0,
          message: 'ok',
        }, null, 2));
      });
    });

    it('格式化 JSON Lines 为可读数组', () => {
      const input = '{"level":"info","id":1}\n{"level":"error","id":2}';
      const result = performTransform(input, TransformMode.FORMAT);

      expect(result).toBe(JSON.stringify([
        { level: 'info', id: 1 },
        { level: 'error', id: 2 },
      ], null, 2));
    });

    it('非法 JSON 返回原文', () => {
      expect(performTransform('{invalid}', TransformMode.FORMAT)).toBe('{invalid}');
    });
  });

  describe('MINIFY 模式', () => {
    it('压缩格式化的 JSON', () => {
      const input = '{\n  "name": "test",\n  "value": 123\n}';
      expect(performTransform(input, TransformMode.MINIFY)).toBe('{"name":"test","value":123}');
    });

    it('压缩 export default 包装中的 JSON', () => {
      const input = 'export default {"name":"test","value":123};';
      expect(performTransform(input, TransformMode.MINIFY)).toBe('{"name":"test","value":123}');
    });

    it('逐行压缩 JSON Lines', () => {
      const input = '{"a": 1}\n\n{"b": [2, 3]}';
      expect(performTransform(input, TransformMode.MINIFY)).toBe('{"a":1}\n{"b":[2,3]}');
    });
  });

  describe('ESCAPE 模式', () => {
    it('转义普通字符串', () => {
      expect(performTransform('hello "world"', TransformMode.ESCAPE)).toBe('hello \\"world\\"');
    });

    it('转义换行符', () => {
      expect(performTransform('line1\nline2', TransformMode.ESCAPE)).toBe('line1\\nline2');
    });
  });

  describe('UNESCAPE 模式', () => {
    it('反转义带引号的字符串', () => {
      expect(performTransform('"hello \\"world\\""', TransformMode.UNESCAPE)).toBe('hello "world"');
    });

    it('反转义换行符', () => {
      expect(performTransform('line1\\nline2', TransformMode.UNESCAPE)).toBe('line1\nline2');
    });
  });

  describe('UNICODE_TO_CN 模式', () => {
    it('Unicode 转中文', () => {
      expect(performTransform('\\u4F60\\u597D', TransformMode.UNICODE_TO_CN)).toBe('你好');
    });

    it('混合内容', () => {
      expect(performTransform('hello \\u4E16\\u754C', TransformMode.UNICODE_TO_CN)).toBe('hello 世界');
    });
  });

  describe('CN_TO_UNICODE 模式', () => {
    it('中文转 Unicode', () => {
      const result = performTransform('你好', TransformMode.CN_TO_UNICODE);
      expect(result).toBe('\\u4F60\\u597D');
    });

    it('ASCII 字符保持不变', () => {
      expect(performTransform('hello', TransformMode.CN_TO_UNICODE)).toBe('hello');
    });

    it('混合内容', () => {
      const result = performTransform('hello世界', TransformMode.CN_TO_UNICODE);
      expect(result).toBe('hello\\u4E16\\u754C');
    });
  });

  describe('URL_ENCODE / URL_DECODE 模式', () => {
    it('URL 编码中文和特殊字符', () => {
      expect(performTransform('https://example.com?q=你好&x=1', TransformMode.URL_ENCODE))
        .toBe('https%3A%2F%2Fexample.com%3Fq%3D%E4%BD%A0%E5%A5%BD%26x%3D1');
    });

    it('URL 解码合法内容', () => {
      expect(performTransform('%E4%BD%A0%E5%A5%BD%20world', TransformMode.URL_DECODE))
        .toBe('你好 world');
    });

    it('URL 解码非法内容返回原文', () => {
      expect(performTransform('%E4%ZZ', TransformMode.URL_DECODE)).toBe('%E4%ZZ');
    });
  });

  describe('BASE64_ENCODE / BASE64_DECODE 模式', () => {
    it('Base64 编码 ASCII 字符串', () => {
      expect(performTransform('hello world', TransformMode.BASE64_ENCODE)).toBe('aGVsbG8gd29ybGQ=');
    });

    it('Base64 编码中文字符串', () => {
      expect(performTransform('你好，世界', TransformMode.BASE64_ENCODE)).toBe('5L2g5aW977yM5LiW55WM');
    });

    it('Base64 解码标准格式', () => {
      expect(performTransform('5L2g5aW977yM5LiW55WM', TransformMode.BASE64_DECODE)).toBe('你好，世界');
    });

    it('Base64 解码 URL-safe 格式并自动补齐 padding', () => {
      expect(performTransform('SGVsbG8td29ybGQ', TransformMode.BASE64_DECODE)).toBe('Hello-world');
    });

    it('Base64 解码非法内容返回原文', () => {
      expect(performTransform('not base64!', TransformMode.BASE64_DECODE)).toBe('not base64!');
    });
  });

  describe('SORT_KEYS 模式', () => {
    it('递归按字母序排列对象键', () => {
      const input = '{"b":2,"a":{"d":4,"c":3},"list":[{"z":1,"y":2}]}';
      const result = performTransform(input, TransformMode.SORT_KEYS);
      expect(JSON.parse(result)).toEqual({
        a: { c: 3, d: 4 },
        b: 2,
        list: [{ y: 2, z: 1 }],
      });
      expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"b"'));
    });

    it('递归排序 var 赋值包装中的 JSON', () => {
      const input = 'var payload = {"b":2,"a":1};';
      const result = performTransform(input, TransformMode.SORT_KEYS);

      expect(result).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
    });

    it('逐行排序 JSON Lines 对象键', () => {
      const input = '{"b":2,"a":1}\n{"d":4,"c":3}';
      expect(performTransform(input, TransformMode.SORT_KEYS)).toBe('{"a":1,"b":2}\n{"c":3,"d":4}');
    });
  });

  describe('JSON_TO_TYPESCRIPT 模式', () => {
    it('从 JSON 对象生成 TypeScript 声明', async () => {
      const input = JSON.stringify({
        user: {
          id: 1,
          name: 'Ada',
        },
        items: [
          { id: 1, title: 'first' },
          { id: 2, active: true },
        ],
      });
      const result = await performTransformAsync(input, TransformMode.JSON_TO_TYPESCRIPT);

      expect(result).toContain('// 生成说明: 基于单个对象样本推断');
      expect(result).toContain('// 可信提示: 2 个可选字段');
      expect(result).toContain('export interface Root {');
      expect(result).toContain('  user: RootUser;');
      expect(result).toContain('  items: RootItemsItem[];');
      expect(result).toContain('export interface RootItemsItem {');
      expect(result).toContain('  title?: string;');
      expect(result).toContain('  active?: boolean;');
    });

    it('从 JSON Lines 生成 RootItem 数组声明', async () => {
      const result = await performTransformAsync('{"id":1,"name":"Ada"}\n{"id":2,"active":true}', TransformMode.JSON_TO_TYPESCRIPT);

      expect(result).toContain('// 生成说明: 基于数组样本 2 项推断');
      expect(result).toContain('export type Root = RootItem[];');
      expect(result).toContain('  id: number;');
      expect(result).toContain('  name?: string;');
      expect(result).toContain('  active?: boolean;');
    });

    it('保留 null 这类合法 JSON 值的类型生成', async () => {
      const result = await performTransformAsync('null', TransformMode.JSON_TO_TYPESCRIPT);

      expect(result).toContain('// 生成说明: 基于 null 值推断');
      expect(result).toContain('export type Root = null;');
    });
  });

  describe('NONE 模式', () => {
    it('原样返回', () => {
      const input = '任何内容';
      expect(performTransform(input, TransformMode.NONE)).toBe(input);
    });
  });
});

// ============ performInverseTransform 测试 ============

describe('performInverseTransform', () => {
  it('空输入返回空字符串', () => {
    expect(performInverseTransform('', TransformMode.FORMAT)).toBe('');
  });

  it('FORMAT 反向 → MINIFY', () => {
    const formatted = '{\n  "a": 1\n}';
    expect(performInverseTransform(formatted, TransformMode.FORMAT)).toBe('{"a":1}');
  });

  it('FORMAT 反向在原始输入为 JSON Lines 时恢复为逐行 JSON', () => {
    const original = '{"id":1}\n{"id":2}';
    const editedOutput = JSON.stringify([{ id: 1 }, { id: 3 }, { id: 4 }], null, 2);

    expect(performInverseTransform(editedOutput, TransformMode.FORMAT, original))
      .toBe('{"id":1}\n{"id":3}\n{"id":4}');
  });

  it('FORMAT 反向在原始输入为 JS 赋值包装时保留外壳', () => {
    const original = 'const response = {"id":1};';
    const editedOutput = JSON.stringify({ id: 2, ok: true }, null, 2);

    expect(performInverseTransform(editedOutput, TransformMode.FORMAT, original))
      .toBe('const response = {"id":2,"ok":true};');
  });

  it('FORMAT 反向在原始输入为 JSONP 回调时保留回调外壳', () => {
    const original = 'callback({"id":1});';
    const editedOutput = JSON.stringify({ id: 3 }, null, 2);

    expect(performInverseTransform(editedOutput, TransformMode.FORMAT, original))
      .toBe('callback({"id":3});');
  });

  it('FORMAT 反向在原始输入为 Markdown JSON 代码块时保留代码块外壳', () => {
    const original = '```json\n{"id":1}\n```';
    const editedOutput = JSON.stringify({ id: 4 }, null, 2);

    expect(performInverseTransform(editedOutput, TransformMode.FORMAT, original))
      .toBe('```json\n{"id":4}\n```');
  });

  it('FORMAT 反向在原始输入为 XSSI 前缀包装时保留外壳', () => {
    const editedOutput = JSON.stringify({ id: 5 }, null, 2);

    expect(performInverseTransform(editedOutput, TransformMode.FORMAT, 'while(1);{"id":1}'))
      .toBe('while(1);{"id":5}');
    expect(performInverseTransform(editedOutput, TransformMode.FORMAT, ')]}\',\n{"id":1}'))
      .toBe(')]}\',\n{"id":5}');
  });

  it('ESCAPE/UNESCAPE 互逆', () => {
    const original = 'hello "world"';
    const escaped = performTransform(original, TransformMode.ESCAPE);
    const restored = performInverseTransform(escaped, TransformMode.ESCAPE);
    expect(restored).toBe(original);
  });

  it('UNICODE 互逆', () => {
    const original = '你好世界';
    const encoded = performTransform(original, TransformMode.CN_TO_UNICODE);
    const decoded = performInverseTransform(encoded, TransformMode.CN_TO_UNICODE);
    expect(decoded).toBe(original);
  });

  it('URL 编解码互逆', () => {
    const original = 'https://example.com?q=你好&x=1';
    const encoded = performTransform(original, TransformMode.URL_ENCODE);
    const decoded = performInverseTransform(encoded, TransformMode.URL_ENCODE);
    expect(decoded).toBe(original);
  });

  it('Base64 编解码互逆', () => {
    const original = 'hello 你好';
    const encoded = performTransform(original, TransformMode.BASE64_ENCODE);
    const decoded = performInverseTransform(encoded, TransformMode.BASE64_ENCODE);
    expect(decoded).toBe(original);
  });
});

// ============ deepParseWithContext + inverseWithContext 测试 ============

describe('deepParseWithContext', () => {
  it('普通 JSON 不做额外转换', () => {
    const input = '{"name":"test"}';
    const result = deepParseWithContext(input);
    expect(JSON.parse(result.output)).toEqual({ name: 'test' });
    expect(result.context.records.size).toBe(0);
  });

  it('嵌套 JSON 字符串被展开', () => {
    const inner = JSON.stringify({ nested: true });
    const input = JSON.stringify({ data: inner });
    const result = deepParseWithContext(input);
    const parsed = JSON.parse(result.output);
    expect(parsed.data).toEqual({ nested: true });
    expect(result.context.records.size).toBeGreaterThan(0);
  });

  it('包含 Unicode 的字符串被解码', () => {
    const input = JSON.stringify({ text: '\\u4F60\\u597D' });
    const result = deepParseWithContext(input);
    const parsed = JSON.parse(result.output);
    expect(parsed.text).toBe('你好');
  });

  it('自动展开 CMD 参数串', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
    const input = JSON.stringify({
      action_cmd: `cmd=${payload}&from=feed`,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed.action_cmd).toEqual({
      cmd: { nid: 123, title: '标题' },
      from: 'feed',
    });
    expect(result.context.records.get('$.action_cmd')?.steps[0].type).toBe('scheme_decode');
  });

  it('根输入为电话 Scheme 时可直接展开', () => {
    const numberUrl = `https://ada.baidu.com/phone-tracker/getNumber?query=${encodeURIComponent('种植牙')}&pageid=__TIMESTAMP__`;
    const scheme = `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${encodeURIComponent(JSON.stringify({
      phone: '400-805-8686',
      numberUrl,
      extInfo: base64Encode(JSON.stringify({
        search_id: 'a433862f59552397',
        cmatch: 222,
        rank: 2,
      })),
      type: 1,
    }))}`;

    const result = deepParseWithContext(scheme, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(result.context.sourceFormat).toBe('scheme');
    expect(result.context.records.get('$')?.steps[0]).toMatchObject({
      type: 'scheme_decode',
      originalSchemeType: 'url',
    });
    expect(result.context.records.get('$')?.steps[0].schemeParamStageSummary).toMatchObject({
      total: 1,
      repairHints: 0,
      nonReversible: 0,
      sources: [{ key: 'query', count: 1 }],
      keys: [{ key: 'params', count: 1 }],
    });
    const paramStageSummaryText = JSON.stringify(result.context.records.get('$')?.steps[0].schemeParamStageSummary);
    expect(paramStageSummaryText).not.toContain('400-805-8686');
    expect(paramStageSummaryText).not.toContain('a433862f59552397');
    expect(paramStageSummaryText).not.toContain('"raw"');
    expect(paramStageSummaryText).not.toContain('"urlDecoded"');
    expect(paramStageSummaryText).not.toContain('"parsed"');
    expect(paramStageSummaryText).not.toContain('"reencoded"');
    expect(parsed.params).toMatchObject({
      phone: '400-805-8686',
      numberUrl: {
        query: '种植牙',
        pageid: '__TIMESTAMP__',
      },
      extInfo: {
        search_id: 'a433862f59552397',
        cmatch: 222,
        rank: 2,
      },
      type: 1,
    });
    expect(result.context.runtimePlaceholders?.[0]).toMatchObject({
      value: '__TIMESTAMP__',
    });
    expect(inverseWithContext(result.output, result.context)).toBe(scheme);
  });

  it('根输入为 Scheme 时不受自动展开设置关闭影响', () => {
    const scheme = `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${encodeURIComponent(JSON.stringify({
      phone: '400-805-8686',
      extInfo: base64Encode(JSON.stringify({ cmatch: 222, rank: 2 })),
    }))}`;
    const nestedInput = JSON.stringify({ action_cmd: scheme });

    const rootResult = deepParseWithContext(scheme, { autoExpandScheme: false });
    const rootParsed = JSON.parse(rootResult.output);
    const nestedResult = deepParseWithContext(nestedInput, { autoExpandScheme: false });
    const nestedParsed = JSON.parse(nestedResult.output);

    expect(rootResult.context.sourceFormat).toBe('scheme');
    expect(rootResult.context.records.get('$')?.steps[0]).toMatchObject({
      type: 'scheme_decode',
      originalSchemeType: 'url',
    });
    expect(rootParsed.params).toMatchObject({
      phone: '400-805-8686',
      extInfo: { cmatch: 222, rank: 2 },
    });
    expect(nestedParsed.action_cmd).toBe(scheme);
    expect(nestedResult.context.records.has('$.action_cmd')).toBe(false);
  });

  it('根输入为 URL 编码 JSON 时可直接展开', () => {
    const input = encodeURIComponent(JSON.stringify({
      code: 0,
      data: {
        title: '编码 JSON',
        items: [1, 2, 3],
      },
    }));

    const result = deepParseWithContext(input, { autoExpandScheme: false });
    const parsed = JSON.parse(result.output);
    const stepTypes = result.context.records.get('$')?.steps.map(step => step.type);

    expect(isStandaloneDeepFormatInput(input)).toBe(true);
    expect(getStandaloneDeepFormatInputKind(input)).toBe('url-encoded-json');
    expect(result.context.sourceFormat).toBe('scheme');
    expect(parsed).toEqual({
      code: 0,
      data: {
        title: '编码 JSON',
        items: [1, 2, 3],
      },
    });
    expect(stepTypes).toEqual(['url_decode', 'json_parse']);
    expect(inverseWithContext(result.output, result.context)).toBe(input);
  });

  it('根输入为 URL 编码 CMD 参数串时可直接展开', () => {
    const decodedCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }))}&from=feed`;
    const input = encodeURIComponent(decodedCmd);

    const result = deepParseWithContext(input, { autoExpandScheme: false });
    const parsed = JSON.parse(result.output);
    const stepTypes = result.context.records.get('$')?.steps.map(step => step.type);

    expect(isStandaloneDeepFormatInput(input)).toBe(true);
    expect(getStandaloneDeepFormatInputKind(input)).toBe('url-encoded-scheme');
    expect(result.context.sourceFormat).toBe('scheme');
    expect(parsed).toEqual({
      cmd: { nid: 123, title: '标题' },
      from: 'feed',
    });
    expect(stepTypes).toEqual(['url_decode', 'scheme_decode']);
    expect(inverseWithContext(result.output, result.context)).toBe(input);
  });

  it('普通 URL 编码文本不会被误判为根 JSON', () => {
    const input = encodeURIComponent('你好世界');

    const result = deepParseWithContext(input);

    expect(isStandaloneDeepFormatInput(input)).toBe(false);
    expect(getStandaloneDeepFormatInputKind(input)).toBeNull();
    expect(result.output).toBe(input);
    expect(result.context.sourceFormat).toBeUndefined();
    expect(result.context.records.size).toBe(0);
  });

  it('特殊 key 的转换路径使用 JSONPath 安全写法', () => {
    const input = JSON.stringify({
      'user.name': JSON.stringify({ nested: true }),
      'dash-key': `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed['user.name']).toEqual({ nested: true });
    expect(parsed['dash-key']).toEqual({ cmd: { nid: 123 } });
    expect(result.context.records.get('$["user.name"]')?.steps[0].type).toBe('json_parse');
    expect(result.context.records.get('$["dash-key"]')?.steps[0].type).toBe('scheme_decode');
    expect(JSON.parse(inverseWithContext(result.output, result.context))).toEqual(JSON.parse(input));
  });

  it('深度格式化可提取 JS 赋值包装并继续展开 CMD 参数', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
    const input = `const response = ${JSON.stringify({
      action_cmd: `cmd=${payload}&from=feed`,
    })};`;

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed.action_cmd).toEqual({
      cmd: { nid: 123, title: '标题' },
      from: 'feed',
    });
    expect(result.context.sourceFormat).toBe('json');
    expect(result.context.records.get('$.action_cmd')?.steps[0].type).toBe('scheme_decode');
  });

  it('自动展开 JSON 字符串字面量包裹的 CMD 参数串', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
    const input = JSON.stringify({
      action_cmd: JSON.stringify(`cmd=${payload}&from=literal`),
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);
    const step = result.context.records.get('$.action_cmd')?.steps[0];

    expect(parsed.action_cmd).toEqual({
      cmd: { nid: 123, title: '标题' },
      from: 'literal',
    });
    expect(step).toMatchObject({
      type: 'scheme_decode',
      originalSchemeType: 'query-string',
      originalSchemeStringLiteral: true,
    });
  });

  it('自动展开 JSON-like CMD 参数值', () => {
    const input = JSON.stringify({
      action_cmd: `cmd=${encodeURIComponent("{nid:123,title:'标题'}")}&from=feed`,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed.action_cmd).toEqual({
      cmd: { nid: 123, title: '标题' },
      from: 'feed',
    });
  });

  it('自动展开 URL Scheme 参数', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
    const input = JSON.stringify({
      schema: `baiduboxapp://v1/browser/open?cmd=${payload}&from=feed`,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed.schema).toEqual({
      cmd: { nid: 123, title: '标题' },
      from: 'feed',
    });
    expect(result.context.records.get('$.schema')?.steps[0].originalSchemeType).toBe('url');
  });

  it('自动展开 JSON 斜杠转义的 URL Scheme 参数', () => {
    const params = encodeURIComponent(JSON.stringify({
      url: 'https://m.baidu.com/s?word=json',
      ext: '__AD_EXTRA_PARAM_ENCODE_1__',
    }));
    const input = JSON.stringify({
      schema: `baiduboxapp:\\/\\/v7\\/vendor\\/ad\\/webPanel?params=${params}`,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);
    const step = result.context.records.get('$.schema')?.steps[0];

    expect(parsed.schema).toEqual({
      params: {
        url: { word: 'json' },
        ext: '__AD_EXTRA_PARAM_ENCODE_1__',
      },
    });
    expect(step).toMatchObject({
      type: 'scheme_decode',
      originalSchemeType: 'url',
      originalSchemeEscapedSlash: true,
    });
    expect(result.context.runtimePlaceholders).toMatchObject([
      {
        path: '$.schema.params.ext',
        sourcePath: '$.schema',
        value: '__AD_EXTRA_PARAM_ENCODE_1__',
        description: '广告 extraParam 编码占位符，通常由渲染或投放链路在运行时替换',
      },
    ]);
  });

  it('自动展开 Base64 JSON 参数', () => {
    const input = JSON.stringify({
      extra: base64Encode('{"feature":"reward","enabled":true}'),
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);
    const step = result.context.records.get('$.extra')?.steps[0];

    expect(parsed.extra).toEqual({
      feature: 'reward',
      enabled: true,
    });
    expect(step).toMatchObject({
      type: 'scheme_decode',
      originalSchemeType: 'base64',
      originalSchemeReversible: true,
    });
  });

  it('自动展开带内部头的 Base64 JSON 片段并标记不可逆', () => {
    const encoded = `AFD8f${base64Encode('meg_name":"AI","flag":true}')}`;
    const input = JSON.stringify({
      extra: [{ v: encoded }],
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);
    const step = result.context.records.get('$.extra[0].v')?.steps[0];

    expect(parsed.extra[0].v).toEqual({
      meg_name: 'AI',
      flag: true,
    });
    expect(step).toMatchObject({
      type: 'scheme_decode',
      originalSchemeType: 'base64',
      originalSchemeReversible: false,
    });
  });

  it('自动展开拼接后缀的内部 Base64 JSON 片段并保留后缀可见', () => {
    const suffix = 'UxMJm9zPTImaXA9MTI3LjAuMC4x';
    const encoded = `AFD8f${base64Encode('{"meg_name":"AI","flag":true}')}${suffix}`;
    const input = JSON.stringify({
      extra: [{ k: 'extraParam', v: encoded }],
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);
    const step = result.context.records.get('$.extra[0].v')?.steps[0];

    expect(parsed.extra[0].v).toEqual({
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
    expect(step).toMatchObject({
      type: 'scheme_decode',
      originalSchemeType: 'base64',
      originalSchemeReversible: false,
    });
  });

  it('自动展开真实广告 response 中的深层跳转链路', () => {
    const landingUrl = 'https://pro.m.jd.com/mall/active/page.html?sku=101&bd_vid=abc';
    const appUrl = `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: landingUrl,
    }))}`;
    const convertCmd = `baiduboxapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
      source: 'feedna',
    }))}`;
    const rewardDialog = `nadcorevendor://vendor/ad/rewardDialog?convert_cmd=${encodeURIComponent(convertCmd)}`;
    const input = JSON.stringify({
      ad_common: {
        scheme: `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
          reward: {
            stay_cmd: rewardDialog,
          },
        }))}`,
      },
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed.ad_common.scheme.video_info.reward.stay_cmd.convert_cmd.params.appUrl.params.url).toEqual({
      sku: '101',
      bd_vid: 'abc',
    });
    expect(parsed.ad_common.scheme.video_info.reward.stay_cmd.convert_cmd.params.source).toBe('feedna');
    expect(result.context.records.get('$.ad_common.scheme')?.steps[0].type).toBe('scheme_decode');
  });

  it('记录展开结果中的运行时占位符', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
      button_cmd: '__CONVERT_CMD__',
    }))}&from=feed`;
    const input = JSON.stringify({
      action_cmd: actionCmd,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed.action_cmd.cmd.button_cmd).toBe('__CONVERT_CMD__');
    expect(result.context.runtimePlaceholders).toEqual([
      {
        path: '$.action_cmd.cmd.button_cmd',
        sourcePath: '$.action_cmd',
        sourceOriginalValue: actionCmd,
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
      },
    ]);
  });

  it('超长字符串会跳过递归展开并记录 warning', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&padding=${'x'.repeat(80)}`;
    const input = JSON.stringify({ action_cmd: actionCmd });

    const result = deepParseWithContext(input, {
      autoExpandScheme: true,
      maxStringDecodeLength: 20,
    });
    const parsed = JSON.parse(result.output);

    expect(parsed.action_cmd).toBe(actionCmd);
    expect(result.context.records.has('$.action_cmd')).toBe(false);
    expect(result.context.warnings).toEqual([
      {
        type: 'string_decode_skipped',
        path: '$.action_cmd',
        originalValue: actionCmd,
        message: '字符串过长，已跳过递归展开以保护性能',
        length: actionCmd.length,
        limit: 20,
      },
    ]);
  });

  it('累计字符串解析预算用尽后跳过后续递归展开', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&from=feed`;
    const input = JSON.stringify({
      title: 'x'.repeat(16),
      action_cmd: actionCmd,
      next_cmd: actionCmd,
    });

    const result = deepParseWithContext(input, {
      autoExpandScheme: true,
      maxTotalStringDecodeLength: 20,
    });
    const parsed = JSON.parse(result.output);

    expect(parsed.action_cmd).toBe(actionCmd);
    expect(parsed.next_cmd).toBe(actionCmd);
    expect(result.context.records.has('$.action_cmd')).toBe(false);
    expect(result.context.records.has('$.next_cmd')).toBe(false);
    expect(result.context.warnings).toEqual([
      {
        type: 'string_decode_budget_exceeded',
        path: '$.action_cmd',
        originalValue: actionCmd,
        message: '累计字符串解析预算已用尽，已跳过递归展开以保护性能',
        length: actionCmd.length,
        limit: 20,
      },
      {
        type: 'string_decode_budget_exceeded',
        path: '$.next_cmd',
        originalValue: actionCmd,
        message: '累计字符串解析预算已用尽，已跳过递归展开以保护性能',
        length: actionCmd.length,
        limit: 20,
      },
    ]);
  });

  it('累计字符串解析预算内仍会展开 CMD 参数', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&from=feed`;
    const input = JSON.stringify({
      action_cmd: actionCmd,
    });

    const result = deepParseWithContext(input, {
      autoExpandScheme: true,
      maxTotalStringDecodeLength: 200,
    });
    const parsed = JSON.parse(result.output);

    expect(parsed.action_cmd).toEqual({
      cmd: { nid: 123 },
      from: 'feed',
    });
    expect(result.context.warnings).toBeUndefined();
  });

  it('疑似可解析但未结构化展开的字符串会记录线索', () => {
    const rawValue = `raw=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`;
    const input = JSON.stringify({
      tracking: rawValue,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed.tracking).toBe('raw={"nid":123}');
    expect(result.context.records.get('$.tracking')?.steps[0].type).toBe('url_decode');
    expect(result.context.unresolvedCandidates).toEqual([
      {
        path: '$.tracking',
        originalValue: rawValue,
        message: 'URL 编码内容已解码，但未展开为结构化对象',
        length: rawValue.length,
        preview: rawValue,
        detectedType: 'url-encoded',
      },
    ]);
  });

  it('异常 URL 编码不会中断深度解析并记录线索', () => {
    const rawValue = 'raw=%E0%A4%A';
    const input = JSON.stringify({
      tracking: rawValue,
      normal: true,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed).toEqual({
      tracking: rawValue,
      normal: true,
    });
    expect(result.context.records.has('$.tracking')).toBe(false);
    expect(result.context.unresolvedCandidates).toEqual([
      {
        path: '$.tracking',
        originalValue: rawValue,
        message: 'URL 编码内容解码失败，未展开为结构化对象',
        length: rawValue.length,
        preview: rawValue,
        detectedType: 'url-encoded',
      },
    ]);
  });

  it('未启用自动展开时保留 CMD 参数串', () => {
    const input = JSON.stringify({
      action_cmd: 'cmd=%7B%22nid%22%3A123%7D&from=feed',
    });

    const result = deepParseWithContext(input);
    const parsed = JSON.parse(result.output);

    expect(parsed.action_cmd).toBe('cmd=%7B%22nid%22%3A123%7D&from=feed');
    expect(result.context.records.has('$.action_cmd')).toBe(false);
  });

  it('未启用自动展开时保留 URL Scheme', () => {
    const input = JSON.stringify({
      schema: 'baiduboxapp://v1/browser/open?cmd=%7B%22nid%22%3A123%7D&from=feed',
    });

    const result = deepParseWithContext(input);
    const parsed = JSON.parse(result.output);

    expect(parsed.schema).toBe('baiduboxapp://v1/browser/open?cmd=%7B%22nid%22%3A123%7D&from=feed');
    expect(result.context.records.has('$.schema')).toBe(false);
  });

  it('无效 JSON 返回原始输入', () => {
    const input = '{invalid json}';
    const result = deepParseWithContext(input);
    expect(result.output).toBe(input);
  });

  it('JSON Lines 中的嵌套 JSON 和 CMD 参数可展开为数组预览', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123, title: '标题' }));
    const input = [
      JSON.stringify({
        payload: JSON.stringify({ nested: true }),
        action_cmd: `cmd=${payload}&from=feed`,
      }),
      JSON.stringify({
        payload: JSON.stringify({ nested: false }),
      }),
    ].join('\n');

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(result.context.sourceFormat).toBe('jsonl');
    expect(parsed).toEqual([
      {
        payload: { nested: true },
        action_cmd: {
          cmd: { nid: 123, title: '标题' },
          from: 'feed',
        },
      },
      {
        payload: { nested: false },
      },
    ]);
    expect(result.context.records.get('$[0].payload')?.steps[0].type).toBe('json_parse');
    expect(result.context.records.get('$[0].action_cmd')?.steps[0].type).toBe('scheme_decode');
  });
});

describe('inverseWithContext 精确还原', () => {
  it('嵌套 JSON 可还原', () => {
    const inner = JSON.stringify({ nested: true });
    const input = JSON.stringify({ data: inner });
    const { output, context } = deepParseWithContext(input);

    const restored = inverseWithContext(output, context);
    expect(JSON.parse(restored)).toEqual(JSON.parse(input));
  });

  it('未编辑的 CMD 参数串自动展开后可精确还原', () => {
    const nestedUrl = encodeURIComponent('https://example.com/path?from=box');
    const input = JSON.stringify({
      action_cmd: `cmd=%7B%22nid%22%3A123%7D&url=${nestedUrl}`,
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });

    const restored = inverseWithContext(output, context);
    expect(JSON.parse(restored)).toEqual(JSON.parse(input));
  });

  it('未编辑的包装 JSON 深度格式化后保留外壳并精确还原', () => {
    const input = 'const response = {"action_cmd":"cmd=%7B%22nid%22%3A123%7D&from=feed"};';
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });

    const restored = inverseWithContext(output, context);
    expect(restored).toBe(input);
  });

  it('未编辑的 JSONP 和 Markdown 包装深度格式化后保留外壳', () => {
    const innerJson = JSON.stringify({ ok: true });
    const cases = [
      `callback(${JSON.stringify({ data: innerJson })});`,
      `\`\`\`json\n${JSON.stringify({ data: innerJson })}\n\`\`\``,
      `while(1);${JSON.stringify({ data: innerJson })}`,
      `)]}',\n${JSON.stringify({ data: innerJson })}`,
    ];

    cases.forEach(input => {
      const { output, context } = deepParseWithContext(input);

      expect(inverseWithContext(output, context)).toBe(input);
    });
  });

  it('已编辑的包装 JSON 深度格式化后保留外壳并回写内部 JSON', () => {
    const input = 'const response = {"action_cmd":"cmd=%7B%22nid%22%3A123%7D&from=feed"};';
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    parsed.action_cmd.cmd.nid = 456;

    const restored = inverseWithContext(JSON.stringify(parsed, null, 2), context);
    expect(restored).toBe('const response = {"action_cmd":"cmd=%7B%22nid%22%3A456%7D&from=feed"};');
  });

  it('未编辑的 JSON 字符串字面量 CMD 自动展开后可精确还原', () => {
    const input = JSON.stringify({
      action_cmd: JSON.stringify('cmd=%7B%22nid%22%3A123%7D&from=literal'),
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });

    const restored = inverseWithContext(output, context);
    expect(JSON.parse(restored)).toEqual(JSON.parse(input));
  });

  it('已编辑的 JSON 字符串字面量 CMD 自动展开后保留外层字面量', () => {
    const input = JSON.stringify({
      action_cmd: JSON.stringify('cmd=%7B%22nid%22%3A123%7D&from=literal'),
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    parsed.action_cmd.cmd.nid = 456;

    const restored = inverseWithContext(JSON.stringify(parsed, null, 2), context);
    expect(JSON.parse(restored).action_cmd).toBe(JSON.stringify('cmd=%7B%22nid%22%3A456%7D&from=literal'));
  });

  it('未编辑的 URL Scheme 自动展开后可精确还原', () => {
    const input = JSON.stringify({
      schema: 'baiduboxapp://v1/browser/open?cmd=%7B%22nid%22%3A123%7D&from=feed',
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });

    const restored = inverseWithContext(output, context);
    expect(JSON.parse(restored)).toEqual(JSON.parse(input));
  });

  it('未编辑的 JSON 斜杠转义 URL Scheme 自动展开后可精确还原', () => {
    const params = encodeURIComponent(JSON.stringify({
      url: 'https://m.baidu.com/s?word=json',
      ext: '__AD_EXTRA_PARAM_ENCODE_1__',
    }));
    const input = JSON.stringify({
      schema: `baiduboxapp:\\/\\/v7\\/vendor\\/ad\\/webPanel?params=${params}`,
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });

    const restored = inverseWithContext(output, context);
    expect(JSON.parse(restored)).toEqual(JSON.parse(input));
  });

  it('已编辑的 JSON 斜杠转义 URL Scheme 保留斜杠转义形态', () => {
    const params = encodeURIComponent(JSON.stringify({
      url: 'https://m.baidu.com/s?word=json',
      ext: '__AD_EXTRA_PARAM_ENCODE_1__',
    }));
    const input = JSON.stringify({
      schema: `baiduboxapp:\\/\\/v7\\/vendor\\/ad\\/webPanel?params=${params}`,
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    parsed.schema.params.url.word = 'schema';

    const restored = inverseWithContext(JSON.stringify(parsed, null, 2), context);
    const restoredSchema = JSON.parse(restored).schema;

    expect(restoredSchema).toMatch(/^baiduboxapp:\\\/\\\/v7\\\/vendor\\\/ad\\\/webPanel\?/);
    expect(restoredSchema).toContain('%22word%22%3A%22schema%22');
  });

  it('未编辑的内部 Base64 JSON 片段自动展开后可精确还原', () => {
    const encoded = `AFD8f${base64Encode('meg_name":"AI","flag":true}')}`;
    const input = JSON.stringify({
      extra: [{ v: encoded }],
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });

    const restored = inverseWithContext(output, context);
    expect(JSON.parse(restored)).toEqual(JSON.parse(input));
  });

  it('未编辑的拼接后缀内部 Base64 JSON 片段自动展开后可精确还原', () => {
    const encoded = `AFD8f${base64Encode('{"meg_name":"AI","flag":true}')}UxMJm9zPTImaXA9MTI3LjAuMC4x`;
    const input = JSON.stringify({
      extra: [{ k: 'extraParam', v: encoded }],
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });

    const restored = inverseWithContext(output, context);
    expect(JSON.parse(restored)).toEqual(JSON.parse(input));
  });

  it('已编辑的可逆 Base64 JSON 参数会重新编码', () => {
    const input = JSON.stringify({
      extra: base64Encode('{"feature":"reward","enabled":true}'),
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    parsed.extra.enabled = false;

    const restored = inverseWithContext(JSON.stringify(parsed, null, 2), context);
    expect(JSON.parse(restored).extra).toBe(base64Encode('{"feature":"reward","enabled":false}'));
  });

  it('未编辑的嵌套 URL Scheme 自动展开后可精确还原父级字符串', () => {
    const nestedUrl = encodeURIComponent('https://example.com/path?from=box');
    const input = JSON.stringify({
      schema: `baiduboxapp://v1/browser/open?url=${nestedUrl}&from=feed`,
    });
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    expect(parsed.schema).toEqual({
      url: { from: 'box' },
      from: 'feed',
    });

    const restored = inverseWithContext(output, context);
    expect(JSON.parse(restored)).toEqual(JSON.parse(input));
  });

  it('JSON Lines 深度格式化后可精确还原为逐行 JSON', () => {
    const payload = encodeURIComponent(JSON.stringify({ nid: 123 }));
    const input = [
      JSON.stringify({
        payload: JSON.stringify({ nested: true }),
        action_cmd: `cmd=${payload}&from=feed`,
      }),
      JSON.stringify({
        payload: JSON.stringify({ nested: false }),
      }),
    ].join('\n');
    const { output, context } = deepParseWithContext(input, { autoExpandScheme: true });

    const restored = inverseWithContext(output, context);
    expect(restored).toBe(input);
  });
});

// ============ deepMergeTemplate 测试 ============

describe('deepMergeTemplate', () => {
  it('标量覆盖：模板的标量值覆盖目标同名字段', () => {
    const target = { name: '旧值', age: 20 };
    const template = { name: '新值' };
    const result = deepMergeTemplate(target, template);
    expect(result).toEqual({ name: '新值', age: 20 });
  });

  it('嵌套递归合并：深层对象递归合并', () => {
    const target = {
      user: {
        name: '张三',
        address: {
          city: '北京',
          zip: '100000',
        },
      },
    };
    const template = {
      user: {
        address: {
          city: '上海',
        },
      },
    };
    const result = deepMergeTemplate(target, template);
    // 深层字段被覆盖，同层级其他字段保留
    expect(result).toEqual({
      user: {
        name: '张三',
        address: {
          city: '上海',
          zip: '100000',
        },
      },
    });
  });

  it('数组整体替换：模板数组替换目标数组', () => {
    const target = { tags: [1, 2, 3] };
    const template = { tags: ['a', 'b'] };
    const result = deepMergeTemplate(target, template);
    // 数组不逐项合并，直接用模板数组覆盖
    expect(result).toEqual({ tags: ['a', 'b'] });
  });

  it('目标独有字段保留', () => {
    const target = { a: 1, b: 2, c: 3 };
    const template = { a: 10 };
    const result = deepMergeTemplate(target, template);
    // 模板未涉及的字段 b、c 保留不变
    expect(result).toEqual({ a: 10, b: 2, c: 3 });
  });

  it('模板独有字段添加', () => {
    const target = { a: 1 };
    const template = { b: 2, c: 3 };
    const result = deepMergeTemplate(target, template);
    // 模板中独有的 b、c 被添加到结果中
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });
});

// ============ applyTemplate 测试 ============

describe('applyTemplate', () => {
  it('正常流程：合并后返回格式化 JSON', () => {
    const input = JSON.stringify({ name: '旧值', keep: true });
    const template = JSON.stringify({ name: '新值', extra: 42 });
    const result = applyTemplate(input, template);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ name: '新值', keep: true, extra: 42 });
    // 输出应为格式化的 JSON（包含换行缩进）
    expect(result).toContain('\n');
  });

  it('支持占位符回填模板替换当前 JSON 字符串内容', () => {
    const input = JSON.stringify({
      button_cmd: '__CONVERT_CMD__',
      nested: {
        panel_cmd: 'prefix-__WEBPANEL_CMD__-suffix',
        keep: '__EMPTY__',
      },
      list: ['__CONVERT_CMD__'],
    });
    const template = JSON.stringify({
      schemaVersion: 1,
      kind: 'json-helper-runtime-placeholder-fill-template',
      placeholders: {
        __CONVERT_CMD__: 'baiduboxapp://v1/easybrowse/open?url=https://example.com?a="b"',
        __WEBPANEL_CMD__: 'nadcorevendor://vendor/ad/rewardWebPanel',
        __EMPTY__: '',
      },
      placeholderDetails: [],
    });
    const result = applyTemplate(input, template);
    const parsed = JSON.parse(result);

    expect(parsed).toEqual({
      button_cmd: 'baiduboxapp://v1/easybrowse/open?url=https://example.com?a="b"',
      nested: {
        panel_cmd: 'prefix-nadcorevendor://vendor/ad/rewardWebPanel-suffix',
        keep: '__EMPTY__',
      },
      list: ['baiduboxapp://v1/easybrowse/open?url=https://example.com?a="b"'],
    });
  });

  it('占位符回填模板没有填写 replacement 时抛错', () => {
    const template = JSON.stringify({
      schemaVersion: 1,
      kind: 'json-helper-runtime-placeholder-fill-template',
      placeholders: {
        __CONVERT_CMD__: '',
      },
      placeholderDetails: [],
    });

    expect(() => applyTemplate('{"button_cmd":"__CONVERT_CMD__"}', template)).toThrow(
      '占位符回填模板缺少 replacement'
    );
  });

  it('空输入抛错', () => {
    expect(() => applyTemplate('   ', '{"a":1}')).toThrow('当前编辑器内容为空');
  });

  it('空模板抛错', () => {
    expect(() => applyTemplate('{"a":1}', '   ')).toThrow('模板内容为空');
  });

  it('非法 JSON 输入抛错', () => {
    expect(() => applyTemplate('{invalid}', '{"a":1}')).toThrow('当前编辑器内容不是合法的 JSON');
  });

  it('非法 JSON 模板抛错', () => {
    expect(() => applyTemplate('{"a":1}', '{invalid}')).toThrow('模板内容不是合法的 JSON');
  });
});
