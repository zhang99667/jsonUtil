import { describe, it, expect } from 'vitest';
import { TransformMode } from '../types';
import {
  validateJson,
  detectLanguage,
  performTransform,
  performInverseTransform,
  deepParseWithContext,
  inverseWithContext,
  deepMergeTemplate,
  applyTemplate,
} from './transformations';

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

  it('无效的 JSON 返回错误信息', () => {
    const result = validateJson('{invalid}');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
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

    it('非法 JSON 返回原文', () => {
      expect(performTransform('{invalid}', TransformMode.FORMAT)).toBe('{invalid}');
    });
  });

  describe('MINIFY 模式', () => {
    it('压缩格式化的 JSON', () => {
      const input = '{\n  "name": "test",\n  "value": 123\n}';
      expect(performTransform(input, TransformMode.MINIFY)).toBe('{"name":"test","value":123}');
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

  it('无效 JSON 返回原始输入', () => {
    const input = '{invalid json}';
    const result = deepParseWithContext(input);
    expect(result.output).toBe(input);
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
