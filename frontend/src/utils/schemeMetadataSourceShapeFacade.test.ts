import { describe, expect, it } from 'vitest';
import { formatCmdHandlerCompatibleResult } from './schemeMetadata';

describe('schemeMetadata source 兼容门面', () => {
  it('按顺序对齐重复 Scheme 参数和解码数组', () => {
    const first = 'sampleapp://v1/panel?from=first';
    const second = 'sampleapp://v1/panel?from=second';
    const decoded = JSON.stringify({ panel_scheme: [{ from: 'first' }, { from: 'second' }] });
    const result = JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `panel_scheme=${encodeURIComponent(first)};panel_scheme=${encodeURIComponent(second)}`
    ));

    expect(result.result.cmdParams.panel_scheme).toEqual([
      {
        cmdSchema: 'sampleapp://v1/panel',
        cmdParams: { from: 'first' },
        source: first,
      },
      {
        cmdSchema: 'sampleapp://v1/panel',
        cmdParams: { from: 'second' },
        source: second,
      },
    ]);
  });

  it('合法解码结果配非法来源时保留参数和来源但不生成命令协议', () => {
    const source = 'sampleapp://[';
    const decodedValue = { panel_scheme: { from: 'decoded' } };

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      JSON.stringify(decodedValue),
      undefined,
      source
    ))).toEqual({ result: { cmdParams: decodedValue, source } });
  });

  it('解码严格 JSON 字符串字段名和值', () => {
    const nestedSource = 'sampleapp://v1/panel?from=json-literal';
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'json-literal',
      },
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `"panel\\u005fscheme":"${nestedSource.replace(/\//g, '\\/')}"`,
    ))).toMatchObject({
      result: {
        cmdParams: {
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              from: 'json-literal',
            },
            source: nestedSource,
          },
        },
      },
    });
  });
});
