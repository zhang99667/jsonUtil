import { describe, expect, it } from 'vitest';
import {
  unwrapLogFieldKey,
  unwrapLogFieldValue,
} from './schemeLogFieldQuotes';

describe('schemeLogFieldQuotes', () => {
  it('解包 JSON 双引号字段值和 key', () => {
    expect(unwrapLogFieldValue('"baiduboxapp://v1/open?title=\\"hi\\""')).toEqual({
      value: 'baiduboxapp://v1/open?title="hi"',
      quote: '"',
    });
    expect(unwrapLogFieldKey('"action_cmd"', value => decodeURIComponent(value))).toBe('action_cmd');
  });

  it('解包单引号字段并处理转义单引号', () => {
    expect(unwrapLogFieldValue("'a\\'b'")).toEqual({
      value: "a'b",
      quote: "'",
    });
    expect(unwrapLogFieldKey("'action\\'cmd'", value => decodeURIComponent(value))).toBe("action'cmd");
  });

  it('在坏 JSON 双引号值上保留内部原文兜底', () => {
    expect(unwrapLogFieldValue('"bad\\x"')).toEqual({
      value: 'bad\\x',
      quote: '"',
    });
    expect(unwrapLogFieldKey('%E4%B8%AD', value => decodeURIComponent(value))).toBe('中');
  });
});
