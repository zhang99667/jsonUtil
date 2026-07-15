import { describe, expect, it } from 'vitest';
import {
  formatSchemeLogFieldSeparator,
  isDecodableSchemeLogFieldParamString,
  parseSchemeLogFieldParamString,
  wrapSchemeLogFieldValue,
  type SchemeLogFieldParseOptions,
} from './schemeLogFields';

const parseOptions: SchemeLogFieldParseOptions = {
  decodeKey: value => decodeURIComponent(value),
  isDecodableValue: value => (
    value.startsWith('sampleapp://') ||
    value.startsWith('{') ||
    value.startsWith('%7B') ||
    value === '__CONVERT_CMD__'
  ),
};

describe('schemeLogFields', () => {
  it('解析直接日志字段和中文冒号', () => {
    expect(parseSchemeLogFieldParamString('scheme：sampleapp://v1/open?from=log', parseOptions))
      .toMatchObject({
        rawKey: 'scheme',
        key: 'scheme',
        delimiter: '：',
        value: 'sampleapp://v1/open?from=log',
      });
  });

  it('解析带日志前缀和箭头分隔符的字段', () => {
    expect(parseSchemeLogFieldParamString('I/SampleRender: cmd -> %7B%22a%22%3A1%7D', parseOptions))
      .toMatchObject({
        prefix: 'I/SampleRender: ',
        rawKey: 'cmd',
        key: 'cmd',
        delimiter: '->',
        value: '%7B%22a%22%3A1%7D',
      });
  });

  it('解析 JSON 属性片段中的引号、转义和尾逗号', () => {
    expect(parseSchemeLogFieldParamString('"action_cmd": "sampleapp://v1/open?title=\\\"hi\\\"",', parseOptions))
      .toMatchObject({
        rawKey: '"action_cmd"',
        key: 'action_cmd',
        quote: '"',
        trailingComma: true,
        value: 'sampleapp://v1/open?title="hi"',
      });
  });

  it('过滤多行文本、未知字段和不可解码值', () => {
    expect(parseSchemeLogFieldParamString('scheme: sampleapp://v1/open\nnext line', parseOptions)).toBeNull();
    expect(parseSchemeLogFieldParamString('plain: sampleapp://v1/open', parseOptions)).toBeNull();
    expect(parseSchemeLogFieldParamString('scheme: ordinary text', parseOptions)).toBeNull();
    expect(isDecodableSchemeLogFieldParamString('cmd: __CONVERT_CMD__', parseOptions)).toBe(true);
  });

  it('格式化回写分隔符和值引号', () => {
    expect(formatSchemeLogFieldSeparator(':')).toBe(': ');
    expect(formatSchemeLogFieldSeparator('=>')).toBe(' => ');
    expect(wrapSchemeLogFieldValue('plain')).toBe('plain');
    expect(wrapSchemeLogFieldValue('a"b', '"')).toBe('"a\\"b"');
    expect(wrapSchemeLogFieldValue("a'b", "'")).toBe("'a\\'b'");
  });
});
